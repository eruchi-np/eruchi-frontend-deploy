const INSTAGRAM_HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;

/**
 * Canonical Instagram profile URL: https://www.instagram.com/<username>/
 * Accepts a handle (@mamba), a path (instagram.com/mamba), or a full URL.
 */
export function instagramUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const handle = (urlMatch ? urlMatch[1] : trimmed.replace(/^@/, '')).replace(/\/+$/, '');

  if (!INSTAGRAM_HANDLE_RE.test(handle)) return null;
  return `https://www.instagram.com/${handle}/`;
}

export function instagramLabel(value) {
  const url = instagramUrl(value);
  if (!url) return null;
  const handle = url.replace('https://www.instagram.com/', '').replace(/\/$/, '');
  return `@${handle}`;
}

export function websiteUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
