export function formatRs(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "Rs. 0";
  return `Rs. ${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function discountLabel(snapshot = {}) {
  const type = snapshot.discountType;
  const value = snapshot.discountValue;
  if (type === "percentage") return `${Number(value) || 0}% off`;
  if (type === "flat") return `Rs. ${Number(value) || 0} off`;
  if (type === "free_item") return value ? `Free ${value}` : "Free item";
  if (type === "value_combo") return "Value combo";
  return "Discount";
}
