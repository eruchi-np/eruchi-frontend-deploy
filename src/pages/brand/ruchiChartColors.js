/**
 * Chart colour bridge — mirrors ruchiTokens.css hexes.
 * Keep in sync when updating :root in ruchiTokens.css (same placeholder values).
 */
export const TOKEN_HEX = {
  primary: '#3399ff',
  secondary: '#3399ff',
  tertiary: '#3399ff',
  client: '#6f3aa8',
  c1: '#1f9e89',
  c2: '#e0674a',
  c3: '#5464c8',
  c4: '#c2589a',
  c5: '#5f8f2a',
  c6: '#d99a00',
  cat: '#8a94a6',
  other: '#b4bcc8',
  won: '#3b82d6',
  lost: '#e06b5c',
  seq: '#2a78d6',
  good: '#067647',
  bad: '#b42318',
  low: '#4d7c0f',
  ink: '#0f1b2d',
  grid: '#ebeff4',
  axis: '#c3ccd8',
};

/** Focus / “you” series */
export const YOU = TOKEN_HEX.primary;
/** Category average */
export const ALL = TOKEN_HEX.cat;
/** Low-base / directional mark */
export const LOW = TOKEN_HEX.low;

export const COMPARE_COLORS = [
  TOKEN_HEX.c1,
  TOKEN_HEX.c2,
  TOKEN_HEX.c3,
  TOKEN_HEX.c4,
  TOKEN_HEX.c5,
  TOKEN_HEX.c6,
];

export const BRAND_COLORS = [
  TOKEN_HEX.primary,
  ...COMPARE_COLORS,
  TOKEN_HEX.other,
];

export const PIE_COLORS = COMPARE_COLORS;
export const BAR_PALETTE = [...COMPARE_COLORS, TOKEN_HEX.other, TOKEN_HEX.seq];

export function colorForBrand(index) {
  return BRAND_COLORS[index % BRAND_COLORS.length];
}

/** Read a live CSS var when available (browser); else fall back to TOKEN_HEX. */
export function cssToken(name, fallbackKey = null) {
  if (typeof window === 'undefined' || !window.getComputedStyle) {
    return TOKEN_HEX[fallbackKey || name.replace(/^--/, '')] || TOKEN_HEX.primary;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || TOKEN_HEX[fallbackKey || name.replace(/^--/, '')] || TOKEN_HEX.primary;
}
