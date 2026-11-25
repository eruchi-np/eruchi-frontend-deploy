import { userAPI } from '../services/api';

const PUBLIC_KEY = String(import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
const SW_PATH = '/sw.js';

export const isVapidConfigured = () => Boolean(PUBLIC_KEY);

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

const nudgeWaitingWorker = (worker) => {
  try {
    worker?.postMessage({ type: 'SKIP_WAITING' });
  } catch {
    // ignore
  }
};

export async function ensurePushServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
  nudgeWaitingWorker(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') nudgeWaitingWorker(reg.waiting || worker);
    });
  });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function getExistingPushSubscription() {
  const reg = await ensurePushServiceWorker();
  if (!reg?.pushManager) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribeWebPush() {
  if (!isVapidConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied', permission };
  }

  const reg = await ensurePushServiceWorker();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  await userAPI.savePushSubscription({
    endpoint: json.endpoint,
    expirationTime: json.expirationTime || null,
    keys: {
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
  });

  return { ok: true, subscription: sub, permission: 'granted' };
}

export async function unsubscribeWebPush() {
  const sub = await getExistingPushSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    try {
      await sub.unsubscribe();
    } catch {
      // still tell backend
    }
    try {
      await userAPI.deletePushSubscription(endpoint);
    } catch {
      return { ok: false, reason: 'backend_failed', endpoint };
    }
  }
  return { ok: true };
}

export function getNativePushPermission() {
  if (!('Notification' in window)) return 'default';
  return Notification.permission || 'default';
}

export async function isNativePushSupported() {
  return (
    typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
  );
}
