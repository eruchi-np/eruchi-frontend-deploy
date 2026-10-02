import { parseAcquisition } from './acquisition.js';

const SEND_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const usable = (click) => {
  if (!click || typeof click.sendId !== 'string' || !SEND_ID.test(click.sendId.trim())) return null;
  return {
    sendId: click.sendId.trim().toLowerCase(),
    source: click.source || null,
    medium: click.medium || null,
  };
};

/** A lifecycle link puts the send id in utm_content. Anything else is ignored. */
export function mailClickFromSearch(search = '') {
  const params = new URLSearchParams(search);
  const tag = parseAcquisition({
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  });
  return usable({
    sendId: params.get('utm_content') || '',
    source: tag?.source || null,
    medium: tag?.medium || null,
  });
}

/**
 * The first session in this tab carries the saved click.
 * A later mail link in a tab that already started records one more arrival.
 */
export function planSessionArrival({ search = '', saved = null, sessionPosted = false, postedSendIds = [] } = {}) {
  const click = mailClickFromSearch(search) || usable(saved);
  if (!sessionPosted) return { kind: 'session', click };
  const claimed = new Set(postedSendIds);
  if (click?.sendId && !claimed.has(click.sendId)) return { kind: 'mail', click };
  return { kind: 'none', click: null };
}
