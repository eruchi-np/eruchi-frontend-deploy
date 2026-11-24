/**
 * Push client facade: native VAPID when VITE_VAPID_PUBLIC_KEY is set, else OneSignal.
 * Preserves existing prompt / settings call sites.
 */
import {
  isOneSignalConfigured,
  initOneSignal,
  loginOneSignalUser,
  logoutOneSignalUser,
  requestPushSubscription as requestOneSignalSubscription,
  optOutPush as oneSignalOptOut,
  optInPush as oneSignalOptIn,
  getPushPermission as getOneSignalPermission,
  isPushOptedIn as isOneSignalOptedIn,
  isWebPushSupported as isOneSignalWebPushSupported,
  canOpenSurveys,
  isPushPilotEligible,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  wasPushPromptDismissed,
  dismissPushPrompt,
  clearPushPromptDismiss,
  bindPushLifecycleListeners,
  iosPushPromptAvailable,
} from './oneSignal';
import {
  isVapidConfigured,
  subscribeWebPush,
  unsubscribeWebPush,
  getNativePushPermission,
  isNativePushSupported,
  ensurePushServiceWorker,
  getExistingPushSubscription,
} from './webPush';

export {
  canOpenSurveys,
  isPushPilotEligible,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  wasPushPromptDismissed,
  dismissPushPrompt,
  clearPushPromptDismiss,
  iosPushPromptAvailable,
};

export const isPushConfigured = () => isVapidConfigured() || isOneSignalConfigured();

export const usesNativeWebPush = () => isVapidConfigured();

export async function initPush() {
  if (isVapidConfigured()) {
    await ensurePushServiceWorker();
    return true;
  }
  return initOneSignal();
}

export async function loginPushUser(externalId) {
  if (isVapidConfigured()) {
    await ensurePushServiceWorker();
    // Re-sync browser subscription if permission already granted.
    const permission = getNativePushPermission();
    if (permission === 'granted') {
      const sub = await getExistingPushSubscription();
      if (sub) {
        try {
          await subscribeWebPush();
        } catch {
          // ignore sync errors at boot
        }
      }
    }
    return true;
  }
  return loginOneSignalUser(externalId);
}

export async function logoutPushUser() {
  if (isVapidConfigured()) return;
  return logoutOneSignalUser();
}

export async function requestPushSubscription() {
  if (isVapidConfigured()) {
    const result = await subscribeWebPush();
    if (!result.ok) {
      return false;
    }
    return true;
  }
  return requestOneSignalSubscription();
}

export async function optOutPush() {
  if (isVapidConfigured()) {
    const result = await unsubscribeWebPush();
    return result.ok !== false;
  }
  return oneSignalOptOut();
}

export async function optInPush() {
  if (isVapidConfigured()) {
    const result = await subscribeWebPush();
    return Boolean(result.ok);
  }
  return oneSignalOptIn();
}

export async function getPushPermission() {
  if (isVapidConfigured()) return getNativePushPermission();
  return getOneSignalPermission();
}

export async function isPushOptedIn() {
  if (isVapidConfigured()) {
    if (getNativePushPermission() !== 'granted') return false;
    const sub = await getExistingPushSubscription();
    return Boolean(sub);
  }
  return isOneSignalOptedIn();
}

export async function isWebPushSupported() {
  if (isVapidConfigured()) return isNativePushSupported();
  return isOneSignalWebPushSupported();
}

export function bindPushLifecycleListenersSafe() {
  if (isVapidConfigured()) {
    // Native SW reports received/clicked/closed directly.
    return;
  }
  bindPushLifecycleListeners();
}

/** Alias used by older call sites. */
export const isOneSignalConfiguredAlias = isPushConfigured;
