import { CARD_COLORS } from "../shop/RewardCard";

export const TICKET_PALETTES = [
  { bg: "#00704A", accent: "#005C3C", text: "#FFFFFF" },
  { bg: "#E50914", accent: "#B8070F", text: "#FFFFFF" },
  { bg: "#1E88E5", accent: "#1565C0", text: "#FFFFFF" },
  { bg: "#FB8C00", accent: "#EF6C00", text: "#FFFFFF" },
  { bg: "#212121", accent: "#000000", text: "#FFFFFF" },
  { bg: "#EC407A", accent: "#D81B60", text: "#FFFFFF" },
  { bg: "#6A1B9A", accent: "#4A148C", text: "#FFFFFF" },
  { bg: "#00897B", accent: "#00695C", text: "#FFFFFF" },
  { bg: "#3949AB", accent: "#283593", text: "#FFFFFF" },
  { bg: "#C62828", accent: "#8E0000", text: "#FFFFFF" },
];

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const getBrandPalette = (brandName = "") => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

export function claimColor(index, offer) {
  if (Number.isFinite(index)) {
    return CARD_COLORS[Math.abs(index) % CARD_COLORS.length];
  }
  const key = String(offer?._id || offer?.business?.brandName || offer?.business?.name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export function prettyCategory(value) {
  if (!value) return "Partner reward";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function discountHeadline(offer) {
  if (offer.discountType === "percentage") return `${offer.discountValue}% OFF`;
  if (offer.discountType === "free_item") {
    return offer.discountValue ? `FREE ${String(offer.discountValue).toUpperCase()}` : "FREE";
  }
  if (offer.discountType === "value_combo") return "VALUE COMBO";
  if (offer.discountValue != null && offer.discountValue !== "") {
    return `Rs. ${offer.discountValue} OFF`;
  }
  return "REWARD";
}

export function formatAvailableDays(days) {
  if (!Array.isArray(days) || days.length === 0) return null;
  const indexes = WEEKDAYS.map((day, i) => (days.includes(day) ? i : -1)).filter((i) => i >= 0);
  if (indexes.length === 0) return days.join(", ");
  const min = Math.min(...indexes);
  const max = Math.max(...indexes);
  if (indexes.length === max - min + 1) {
    if (min === 0 && max === 6) return "Every day";
    if (min === 0 && max === 4) return "Monday – Friday";
    return `${WEEKDAYS[min]} – ${WEEKDAYS[max]}`;
  }
  return days.join(", ");
}

export function formatAvailableHours(hours) {
  if (!hours?.open && !hours?.close) return null;
  return [hours.open, hours.close].filter(Boolean).join(" – ");
}

export function formatAvailable(offer) {
  const days = formatAvailableDays(offer?.availableDays);
  const hours = formatAvailableHours(offer?.availableHours);
  if (days && hours) return `${days} · ${hours}`;
  if (days) return days;
  if (hours) return hours;
  return "See partner for hours";
}
