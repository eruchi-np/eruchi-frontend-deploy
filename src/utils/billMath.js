const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** Digits with optional 2 decimal places; must be greater than 0. */
export function parseBillAmount(value) {
  const trimmed = String(value ?? '').trim();
  if (!AMOUNT_RE.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function formatRs(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `Rs. ${text}`;
}

/** Display copy only — never use this to compute money. */
export function discountLabel(offer = {}) {
  const type = offer.discountType || offer.type;
  const value = offer.discountValue ?? offer.value;
  if (type === 'percentage') return `${value}% off`;
  if (type === 'free_item') return value ? `Free ${value}` : 'Free item';
  if (type === 'value_combo') return 'Value combo';
  if (value == null || value === '') return '';
  return `Rs. ${value} off`;
}
