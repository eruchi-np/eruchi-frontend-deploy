const SEED_KEY = 'eruchi.shop.shuffleSeed';

/** Mulberry32 — tiny deterministic PRNG for stable session shuffle. */
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let h = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** One random seed per browser tab/session. */
export function getShopShuffleSeed() {
  try {
    const existing = sessionStorage.getItem(SEED_KEY);
    if (existing) return existing;
    const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SEED_KEY, next);
    return next;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

/** Stable Fisher–Yates shuffle for a session seed (same order while browsing). */
export function shuffleOffersForSession(offers, seed = getShopShuffleSeed()) {
  const list = [...(offers || [])];
  const rand = mulberry32(hashString(seed));
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
