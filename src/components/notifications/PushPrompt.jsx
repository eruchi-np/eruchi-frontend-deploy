import React, { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  dismissPushPrompt,
  getPushPermission,
  isOneSignalConfigured,
  isPushOptedIn,
  isPushPilotEligible,
  isWebPushSupported,
  requestPushSubscription,
  wasPushPromptDismissed,
} from '../../utils/oneSignal';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import './pushPrompt.css';

const QUIET_PATHS = [
  '/login',
  '/signup',
  '/email-verification',
  '/complete-basic-info',
  '/complete-profile',
  '/additional-profile',
  '/refresh-profile',
  '/refresh-additional-profile',
  '/business',
  '/brand',
  '/admin',
];

function isQuietPath(pathname) {
  return QUIET_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function trackPush(event, detail = {}) {
  trackHealthEvent(event, {
    detail: {
      sessionId: healthSessionId(),
      platform: 'android',
      ...detail,
    },
  });
}

/**
 * Android pilot soft prompt. iOS A2HS + desktop are deferred.
 */
export default function PushPrompt() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!isOneSignalConfigured() || loading || !user) {
      setVisible(false);
      return;
    }
    if (!isPushPilotEligible()) {
      setVisible(false);
      return;
    }
    if (isQuietPath(pathname) || wasPushPromptDismissed()) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const supported = await isWebPushSupported();
      if (!supported || cancelled) return;

      const permission = await getPushPermission();
      if (permission === 'denied' || cancelled) return;

      const optedIn = await isPushOptedIn();
      if (optedIn || cancelled) return;

      setVisible(true);
      if (!shownRef.current) {
        shownRef.current = true;
        trackPush('push_prompt_shown');
      }
    }, 4500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, loading, pathname]);

  if (!visible) return null;

  const close = (reason = 'dismissed') => {
    dismissPushPrompt();
    setVisible(false);
    trackPush('push_prompt_dismissed', { reason });
  };

  const onEnable = async () => {
    setBusy(true);
    try {
      const result = await requestPushSubscription();
      if (result.ok) {
        trackPush('push_prompt_accepted');
        toast.success('Notifications enabled');
        setVisible(false);
        return;
      }
      if (result.reason === 'denied') {
        trackPush('push_prompt_denied');
        dismissPushPrompt();
        setVisible(false);
        toast.error('Notifications blocked in browser settings');
        return;
      }
      if (result.reason === 'declined') {
        trackPush('push_prompt_declined');
        dismissPushPrompt();
        setVisible(false);
        return;
      }
      if (result.reason === 'unsupported') {
        toast.error('Push notifications are not supported here');
        close('unsupported');
        return;
      }
      toast.error('Could not enable notifications');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-prompt" role="dialog" aria-labelledby="push-prompt-title">
      <button
        type="button"
        className="push-prompt-close"
        onClick={() => close('close')}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="push-prompt-icon" aria-hidden="true">
        <Bell size={22} />
      </div>
      <h2 id="push-prompt-title">Stay in the loop</h2>
      <p>
        Get a nudge when new surveys drop or your streak needs you — even if
        you&apos;re not on the site.
      </p>
      <div className="push-prompt-actions">
        <button
          type="button"
          className="push-prompt-secondary"
          onClick={() => close('not_now')}
          disabled={busy}
        >
          Not now
        </button>
        <button
          type="button"
          className="push-prompt-primary"
          onClick={onEnable}
          disabled={busy}
        >
          {busy ? 'Working…' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
