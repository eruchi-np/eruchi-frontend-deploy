import React, { useEffect, useState } from 'react';
import { Bell, Share, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  dismissPushPrompt,
  getPushPermission,
  isOneSignalConfigured,
  isPushOptedIn,
  isWebPushSupported,
  needsIosHomeScreenInstall,
  requestPushSubscription,
  wasPushPromptDismissed,
} from '../../utils/oneSignal';
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

export default function PushPrompt() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('enable'); // enable | ios_install
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOneSignalConfigured() || loading || !user) {
      setVisible(false);
      return;
    }
    if (isQuietPath(pathname) || wasPushPromptDismissed()) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (needsIosHomeScreenInstall()) {
        if (!cancelled) {
          setMode('ios_install');
          setVisible(true);
        }
        return;
      }

      const supported = await isWebPushSupported();
      if (!supported || cancelled) return;

      const permission = await getPushPermission();
      if (permission === 'denied' || cancelled) return;

      const optedIn = await isPushOptedIn();
      if (optedIn || cancelled) return;

      setMode('enable');
      setVisible(true);
    }, 4500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, loading, pathname]);

  if (!visible) return null;

  const close = () => {
    dismissPushPrompt();
    setVisible(false);
  };

  const onEnable = async () => {
    setBusy(true);
    try {
      const result = await requestPushSubscription();
      if (result.reason === 'ios_needs_homescreen') {
        setMode('ios_install');
        return;
      }
      if (result.ok) {
        toast.success('Notifications enabled');
        setVisible(false);
        return;
      }
      if (result.reason === 'declined') {
        dismissPushPrompt();
        setVisible(false);
        return;
      }
      if (result.reason === 'unsupported') {
        toast.error('Push notifications are not supported in this browser');
        close();
        return;
      }
      toast.error('Could not enable notifications');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-prompt" role="dialog" aria-labelledby="push-prompt-title">
      <button type="button" className="push-prompt-close" onClick={close} aria-label="Dismiss">
        <X size={16} />
      </button>

      {mode === 'ios_install' ? (
        <>
          <div className="push-prompt-icon" aria-hidden="true">
            <Share size={22} />
          </div>
          <h2 id="push-prompt-title">Add eRuchi to your Home Screen</h2>
          <p>
            On iPhone, notifications only work after you install eRuchi like an app.
            Tap Share, then <strong>Add to Home Screen</strong>. Open that icon and
            enable notifications from Profile.
          </p>
          <div className="push-prompt-actions">
            <button type="button" className="push-prompt-secondary" onClick={close}>
              Got it
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="push-prompt-icon" aria-hidden="true">
            <Bell size={22} />
          </div>
          <h2 id="push-prompt-title">Stay in the loop</h2>
          <p>
            Get a nudge when new surveys drop or your streak needs you — even if
            you&apos;re not on the site.
          </p>
          <div className="push-prompt-actions">
            <button type="button" className="push-prompt-secondary" onClick={close} disabled={busy}>
              Not now
            </button>
            <button type="button" className="push-prompt-primary" onClick={onEnable} disabled={busy}>
              {busy ? 'Working…' : 'Enable'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
