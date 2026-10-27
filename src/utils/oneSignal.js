import OneSignal from 'react-onesignal';

const APP_ID = String(import.meta.env.VITE_ONESIGNAL_APP_ID || '').trim();
const DISMISS_KEY = 'eruchi_push_prompt_dismissed_at';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

let initPromise = null;

export function isOneSignalConfigured() {
  return Boolean(APP_ID);
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIosDevice() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

/** iOS Safari tab: push only after Add to Home Screen. */
export function needsIosHomeScreenInstall() {
  return isIosDevice() && !isStandaloneDisplay();
}

export function wasPushPromptDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissPushPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearPushPromptDismiss() {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Init once per page load. No-ops when VITE_ONESIGNAL_APP_ID is missing.
 * Guarded against React StrictMode double-mount.
 */
export function initOneSignal() {
  if (!APP_ID || typeof window === 'undefined') {
    return Promise.resolve(false);
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },
      notifyButton: { enable: false },
      welcomeNotification: {
        disable: true,
      },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: 'push',
              autoPrompt: false,
              text: {
                actionMessage: 'Get reminders when new surveys and rewards are ready.',
                acceptButton: 'Allow',
                cancelButton: 'Not now',
              },
            },
          ],
        },
      },
    });
    return true;
  })().catch((err) => {
    console.warn('[OneSignal] init failed', err);
    initPromise = null;
    return false;
  });

  return initPromise;
}

export async function loginOneSignalUser(externalId) {
  if (!externalId) return;
  const ok = await initOneSignal();
  if (!ok) return;
  try {
    await OneSignal.login(String(externalId));
  } catch (err) {
    console.warn('[OneSignal] login failed', err);
  }
}

export async function logoutOneSignalUser() {
  if (!initPromise) return;
  try {
    await OneSignal.logout();
  } catch (err) {
    console.warn('[OneSignal] logout failed', err);
  }
}

export async function getPushPermission() {
  const ok = await initOneSignal();
  if (!ok) return 'default';
  try {
    return OneSignal.Notifications.permissionNative || 'default';
  } catch {
    return 'default';
  }
}

export async function isPushOptedIn() {
  const ok = await initOneSignal();
  if (!ok) return false;
  try {
    return Boolean(OneSignal.User.PushSubscription.optedIn);
  } catch {
    return false;
  }
}

export async function isWebPushSupported() {
  const ok = await initOneSignal();
  if (!ok) return false;
  try {
    return Boolean(OneSignal.Notifications.isPushSupported());
  } catch {
    return false;
  }
}

/** Soft then native prompt. On iOS Safari tab, callers should show A2HS first. */
export async function requestPushSubscription() {
  const ok = await initOneSignal();
  if (!ok) return { ok: false, reason: 'not_configured' };

  if (needsIosHomeScreenInstall()) {
    return { ok: false, reason: 'ios_needs_homescreen' };
  }

  try {
    if (!OneSignal.Notifications.isPushSupported()) {
      return { ok: false, reason: 'unsupported' };
    }
  } catch {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    await OneSignal.Slidedown.promptPush();
  } catch {
    try {
      await OneSignal.Notifications.requestPermission();
    } catch (err) {
      console.warn('[OneSignal] permission request failed', err);
      return { ok: false, reason: 'error' };
    }
  }

  const optedIn = await isPushOptedIn();
  return { ok: optedIn, reason: optedIn ? 'subscribed' : 'declined' };
}

export async function optOutPush() {
  const ok = await initOneSignal();
  if (!ok) return false;
  try {
    await OneSignal.User.PushSubscription.optOut();
    return true;
  } catch (err) {
    console.warn('[OneSignal] optOut failed', err);
    return false;
  }
}

export async function optInPush() {
  if (needsIosHomeScreenInstall()) {
    return { ok: false, reason: 'ios_needs_homescreen' };
  }
  const ok = await initOneSignal();
  if (!ok) return { ok: false, reason: 'not_configured' };
  try {
    await OneSignal.User.PushSubscription.optIn();
    const optedIn = await isPushOptedIn();
    return { ok: optedIn, reason: optedIn ? 'subscribed' : 'declined' };
  } catch (err) {
    console.warn('[OneSignal] optIn failed', err);
    return { ok: false, reason: 'error' };
  }
}

export { OneSignal };
