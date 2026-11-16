import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clearPushPromptDismiss,
  getPushPermission,
  isOneSignalConfigured,
  isPushOptedIn,
  isPushPilotEligible,
  isWebPushSupported,
  optInPush,
  optOutPush,
  requestPushSubscription,
} from '../../utils/oneSignal';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import './pushPrompt.css';

/**
 * Phase-1 Profile toggle — Android only. Always visible on Android when App ID
 * is set so a failed OneSignal init never blank-hides the section.
 */
export default function PushSettings() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [permission, setPermission] = useState('default');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isOneSignalConfigured() || !isPushPilotEligible()) {
      setReady(true);
      setSupported(false);
      return;
    }
    const [sup, opt, perm] = await Promise.all([
      isWebPushSupported(),
      isPushOptedIn(),
      getPushPermission(),
    ]);
    setSupported(sup);
    setOptedIn(opt);
    setPermission(perm);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#push-notifications') return;
    const el = document.getElementById('push-notifications');
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [ready]);

  if (!isOneSignalConfigured() || !isPushPilotEligible() || !ready) return null;

  const unavailable = !supported;
  const blocked = permission === 'denied';

  const onToggle = async () => {
    if (unavailable) {
      toast.error('Push is unavailable in this browser right now');
      return;
    }
    setBusy(true);
    try {
      if (optedIn) {
        const ok = await optOutPush();
        if (ok) {
          setOptedIn(false);
          toast.success('Notifications turned off');
        } else {
          toast.error('Could not turn off notifications');
        }
        return;
      }

      clearPushPromptDismiss();
      const result =
        permission === 'granted'
          ? await optInPush()
          : await requestPushSubscription();

      if (result.ok) {
        trackHealthEvent('push_prompt_accepted', {
          detail: {
            sessionId: healthSessionId(),
            platform: 'android',
            source: 'profile',
          },
        });
        setOptedIn(true);
        setPermission('granted');
        toast.success('Notifications enabled');
        return;
      }
      if (result.reason === 'denied' || result.reason === 'declined') {
        setPermission(await getPushPermission());
        toast.error('Permission was not granted');
        return;
      }
      toast.error('Could not enable notifications');
    } finally {
      setBusy(false);
      refresh();
    }
  };

  let help =
    'Get reminders for surveys and rewards.';
  if (unavailable) {
    help = 'Push isn’t available in this browser yet. Open eRuchi in Chrome on Android.';
  } else if (optedIn) {
    help = 'You will get reminders for surveys and rewards.';
  } else if (blocked) {
    help = 'Blocked in browser settings — re-enable there to use push.';
  }

  return (
    <section
      id="push-notifications"
      className="profile-section push-settings"
      aria-labelledby="push-notifications-title"
    >
      <div className="profile-section-head">
        <div className="profile-section-title">
          <div className="push-settings-glyph" aria-hidden="true">
            {optedIn ? <Bell size={18} /> : <BellOff size={18} />}
          </div>
          <div>
            <h2 id="push-notifications-title">Push notifications</h2>
            <p>{help}</p>
          </div>
        </div>
      </div>

      <div className="profile-section-cta">
        <button
          type="button"
          className={`home-pill home-pill-lg ${optedIn ? 'home-pill-blue' : 'home-pill-navy'}`}
          onClick={onToggle}
          disabled={busy || unavailable || blocked}
        >
          {busy
            ? 'Working…'
            : unavailable
              ? 'Unavailable here'
              : optedIn
                ? 'Turn off notifications'
                : 'Enable notifications'}
        </button>
      </div>
    </section>
  );
}
