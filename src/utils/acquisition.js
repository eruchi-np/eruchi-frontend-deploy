const STORAGE_KEY = 'eruchi_first_touch';
const TOKEN = /^[A-Za-z0-9._~-]{1,80}$/;
const RESERVED = new Set(['(none)', '(direct)']);

const cleanPart = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!TOKEN.test(text) || RESERVED.has(text.toLowerCase())) return null;
  return text;
};

export function parseAcquisition(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const source = cleanPart(input.source);
  const medium = cleanPart(input.medium);
  const campaign = cleanPart(input.campaign);
  if (!source && !medium && !campaign) return null;
  return {
    source: source || null,
    medium: medium || null,
    campaign: campaign || null,
  };
}

export function readAcquisition() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseAcquisition(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Keep the first real campaign tag. A later link does not replace it. */
export function rememberAcquisition(search = '') {
  const params = new URLSearchParams(search);
  const incoming = parseAcquisition({
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  });
  const existing = readAcquisition();
  if (!incoming || existing) return existing;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
  } catch {
    return incoming;
  }
  return incoming;
}
