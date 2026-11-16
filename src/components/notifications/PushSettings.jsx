import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Share } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clearPushPromptDismiss,
  getPushPermission,
  isAndroidDevice,
  isOneSignalConfigured,
  isPushOptedIn,
  isWebPushSupported,
  needsIosHomeScreenInstall,
  optInPush,
  optOutPush,
  requestPushSubscription,
} from '../../utils/oneSignal';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import './pushPrompt.css';

export default function PushSettings() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [permission, setPermission] = useState('default');
  const [busy, setBusy] = useState(false);
  const iosInstall = needsIosHomeScreenInstall();

  const refresh = useCallback(async () => {
    if (!isOneSignalConfigured()) {
      setReady(true);
      setSupported(false);
      return;
    }
    if (iosInstall) {
      setSupported(true);
      setOptedIn(false);
      setPermission('default');
      setReady(true);
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
  }, [iosInstall]);

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

  if (!isOneSignalConfigured() || !ready) return null;
  if (!supported && !iosInstall) return null;

  const onToggle = async () => {
    if (!supported && !iosInstall) {
      toast.error('Push notifications are not supported in this browser');
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
      const result = iosInstall
        ? { ok: false, reason: 'ios_needs_homescreen' }
        : permission === 'granted'
          ? await optInPush()
          : await requestPushSubscription();

      if (result.reason === 'ios_needs_homescreen') {
        toast('Add eRuchi to your Home Screen first, then open that icon');
        return;
      }
      if (result.ok) {
        trackHealthEvent('push_prompt_accepted', {
          detail: {
            sessionId: healthSessionId(),
            platform: isAndroidDevice() ? 'android' : 'web',
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
            <p>
              {iosInstall
                ? 'Install eRuchi to your Home Screen to enable alerts on iPhone.'
                : optedIn
                  ? 'You will get reminders for surveys and rewards.'
                  : permission === 'denied'
                    ? 'Blocked in browser settings — re-enable there to use push.'
                    : 'Get reminders for surveys and rewards.'}
            </p>
          </div>
        </div>
      </div>

      {iosInstall ? (
        <div className="push-settings-ios">
          <p>
            <Share size={14} aria-hidden="true" /> Safari → Share →{' '}
            <strong>Add to Home Screen</strong>, then open the icon and come back here.
          </p>
        </div>
      ) : (
        <div className="profile-section-cta">
          <button
            type="button"
            className={`home-pill home-pill-lg ${optedIn ? 'home-pill-blue' : 'home-pill-navy'}`}
            onClick={onToggle}
            disabled={busy || permission === 'denied'}
          >
            {busy ? 'Working…' : optedIn ? 'Turn off notifications' : 'Enable notifications'}
          </button>
        </div>
      )}
    </section>
  );
}
