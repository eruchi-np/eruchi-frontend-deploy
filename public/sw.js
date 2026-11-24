/* eRuchi native Web Push service worker (VAPID). */
/* eslint-disable no-restricted-globals */

const API_PUSH = '/api/signals/push';

const safeJson = async (event) => {
  try {
    if (!event.data) return {};
    return event.data.json();
  } catch {
    try {
      const text = await event.data.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
};

const reportEvent = (payload, event, action) => {
  const sendId = payload?.data?.send_id || payload?.send_id;
  const eventToken = payload?.data?.event_token;
  if (!sendId && !eventToken) return Promise.resolve();
  const body = {
    send_id: sendId,
    event,
    action: action || null,
    event_token: eventToken || undefined,
  };
  return fetch(API_PUSH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  }).catch(() => {});
};

const sanitizeUrl = (raw) => {
  try {
    const base = self.location.origin;
    const u = new URL(String(raw || '/standalone-surveys'), base);
    if (u.origin !== self.location.origin) return `${base}/standalone-surveys`;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return '/standalone-surveys';
  }
};

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const payload = await safeJson(event);
    const title = String(payload.title || 'eRuchi').slice(0, 80);
    const body = String(payload.body || '').slice(0, 180);
    const icon = payload.icon || '/icon.png';
    const badge = payload.badge || icon;
    const data = payload.data || {};
    const url = sanitizeUrl(payload.url || data.url || '/standalone-surveys');
    const actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [];

    await reportEvent(payload, 'received');

    await self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: payload.tag || data.send_id || undefined,
      data: { ...data, url },
      actions,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  const note = event.notification;
  const data = note?.data || {};
  const action = event.action || 'open';
  note.close();

  const target = sanitizeUrl(data.url || '/standalone-surveys');

  event.waitUntil((async () => {
    await reportEvent({ data }, 'clicked', action);

    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) {
          try {
            await client.navigate(target);
            return;
          } catch {
            // fall through
          }
        }
        client.postMessage({ type: 'PUSH_NAVIGATE', url: target });
        return;
      }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(target);
    }
  })());
});

self.addEventListener('notificationclose', (event) => {
  const data = event.notification?.data || {};
  event.waitUntil(reportEvent({ data }, 'closed'));
});
