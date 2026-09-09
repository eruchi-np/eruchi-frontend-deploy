const BILL_AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** Digits with optional 2 decimal places; must be greater than 0. */
export function parseBillAmount(value) {
  const trimmed = String(value ?? '').trim();
  if (!BILL_AMOUNT_RE.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Preview discount from the full bill (before discount).
 * Percentage and flat/Rs off reduce the bill; other types leave it unchanged.
 */
export function applyVoucherDiscount(billAmount, discountType, discountValue) {
  const bill = Number(billAmount) || 0;
  const value = Number(discountValue) || 0;
  let discount = 0;

  if (discountType === 'percentage') {
    discount = (bill * value) / 100;
  } else if (discountType !== 'free_item' && discountType !== 'value_combo') {
    discount = value;
  }

  discount = roundMoney(Math.min(Math.max(discount, 0), bill));
  const payable = roundMoney(Math.max(bill - discount, 0));

  return { bill: roundMoney(bill), discount, payable };
}
