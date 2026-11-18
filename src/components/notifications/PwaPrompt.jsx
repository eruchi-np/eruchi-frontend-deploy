import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isStaffAdmin } from '../../utils/adminRoles';
import { isAndroidDevice, isIosDevice, isStandaloneDisplay } from '../../utils/oneSignal';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import './pushPrompt.css';

const DISMISS_KEY = 'eruchi_pwa_prompt_dismissed_at';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
const SURVEY_COMPLETE_PATH = '/survey-complete';

let deferredInstall = null;
const listeners = new Set();

const publishInstall = (event) => {
  deferredInstall = event;
  listeners.forEach((fn) => fn(event));
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    publishInstall(event);
  });
  window.addEventListener('appinstalled', () => {
    publishInstall(null);
  });
}

const wasDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
};

const rememberDismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
};

const platform = () => {
  if (isAndroidDevice()) return 'android';
  if (isIosDevice()) return 'ios';
  return 'desktop';
};

const trackPwa = (event) => {
  const sessionId = healthSessionId();
  trackHealthEvent(event, {
    eventId: `${event}:${sessionId}`,
    detail: { sessionId, platform: platform() },
  });
};

/**
 * Install card for browsers that offer Add to Home Screen.
 * Shown to signed-in customers. Android survey-complete keeps the notification card.
 */
export default function PwaPrompt() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [promptEvent, setPromptEvent] = useState(deferredInstall);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [trackedShow, setTrackedShow] = useState(false);

  useEffect(() => {
    const onChange = (event) => setPromptEvent(event);
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, []);

  const pushOwnsThisScreen = pathname === SURVEY_COMPLETE_PATH && isAndroidDevice();
  const visible = Boolean(
    !hidden
    && !loading
    && user
    && !isStaffAdmin(user.role)
    && !isStandaloneDisplay()
    && promptEvent
    && !wasDismissed()
    && !pushOwnsThisScreen
  );

  useEffect(() => {
    if (!visible || trackedShow) return;
    setTrackedShow(true);
    trackPwa('pwa_prompt_shown');
  }, [visible, trackedShow]);

  if (!visible) return null;

  const close = () => {
    rememberDismiss();
    setHidden(true);
    trackPwa('pwa_prompt_dismissed');
  };

  const onInstall = async () => {
    if (!promptEvent) return;
    setBusy(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      publishInstall(null);
      if (choice?.outcome === 'accepted') trackPwa('pwa_prompt_accepted');
      setHidden(true);
    } catch {
      setHidden(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-prompt" role="dialog" aria-labelledby="pwa-prompt-title">
      <button
        type="button"
        className="push-prompt-close"
        onClick={close}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="push-prompt-icon" aria-hidden="true">
        <Download size={22} />
      </div>
      <h2 id="pwa-prompt-title">Add eRuchi to your home screen</h2>
      <p>Open surveys and rewards from an app icon. You can remove it any time.</p>
      <div className="push-prompt-actions">
        <button
          type="button"
          className="push-prompt-secondary"
          onClick={close}
          disabled={busy}
        >
          Not now
        </button>
        <button
          type="button"
          className="push-prompt-primary"
          onClick={onInstall}
          disabled={busy}
        >
          {busy ? 'Working…' : 'Install'}
        </button>
      </div>
    </div>
  );
}
