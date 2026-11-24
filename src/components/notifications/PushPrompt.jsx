import React, { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  dismissPushPrompt,
  getPushPermission,
  canOpenSurveys,
  isPushConfigured,
  isPushOptedIn,
  isPushPilotEligible,
  isWebPushSupported,
  requestPushSubscription,
  wasPushPromptDismissed,
} from '../../utils/pushClient';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import { reportPushOptIn } from '../../utils/pushOptIn';
import './pushPrompt.css';

const SURVEY_COMPLETE_PATH = '/survey-complete';

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
 * Android pilot soft prompt — survey complete, accounts that can open Surveys.
 * iOS A2HS + desktop are deferred.
 */
export default function PushPrompt() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (pathname !== SURVEY_COMPLETE_PATH) {
      setVisible(false);
      return;
    }
    if (!isPushConfigured() || loading || !canOpenSurveys(user)) {
      setVisible(false);
      return;
    }
    if (!isPushPilotEligible() || wasPushPromptDismissed()) {
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
    }, 1200);

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
        reportPushOptIn(true);
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
        Don&apos;t miss out on your streak! Enable notifications to be reminded
        when new surveys are available.
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
          {busy ? 'Working…' : 'Remind Me'}
        </button>
      </div>
    </div>
  );
}
