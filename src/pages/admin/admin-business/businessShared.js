// Shared business form values: categories, empty forms, dates, and ward checks.

import { getMaxWards } from '../../../utils/municipalityData';

export const NAVY = "#1B2A4A";
export const MAX_POSTERS = 5;

export const nepalYmd = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const last7NepalDaysRange = () => {
  const to = nepalYmd();
  const fromDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  return { from: nepalYmd(fromDate), to };
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CATEGORIES = [
  'Cafe, coffee shop, chiya pasal or bakery',
  'Cinema',
  'eCommerce',
  'Food from a social media seller',
  'Gym, fitness',
  'Handmade goods from a social media seller',
  'Restaurants',
  'Salon, barber or spa',
  'Sports entertainment',
  'Other',
];

export const TRIGGER_OPTIONS = [
  { value: 'every_redemption', label: 'Every redemption of this voucher' },
  { value: 'days_after_redemption', label: 'X days after redeeming this voucher' },
];

export const EMPTY_FEEDBACK_SURVEY_ROW = {
  survey: '',
  trigger: 'every_redemption',
  triggerValue: '',
  active: true,
};

export const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─── Empty form states ────────────────────────────────────────────────────────

export const EMPTY_VOUCHER_FORM = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  creditsRequired: '',
  approxValue: '',
  expiryDays: '',
  perUserMonthlyLimit: '5',
  totalStock: '',
  validUntil: '',
  imageUrl: '',
  feedbackSurveys: [],
  publicSurveys: [],
};

export const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return nepalYmd(date);
};

export const idOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || '');
  return String(value);
};

export const formFromOffer = (offer) => ({
  title: offer.title || '',
  description: offer.description || '',
  discountType: offer.discountType || 'percentage',
  discountValue: offer.discountValue ?? '',
  creditsRequired: offer.creditsRequired ?? '',
  approxValue: offer.approxValue ?? '',
  expiryDays: offer.expiryDays ?? '',
  perUserMonthlyLimit: offer.perUserMonthlyLimit ?? '',
  totalStock: offer.totalStock ?? '',
  validUntil: toDateInput(offer.validUntil),
  imageUrl: offer.imageUrl || '',
  feedbackSurveys: (offer.feedbackSurveys || []).map((row) => ({
    survey: idOf(row.survey),
    trigger: row.trigger || 'every_redemption',
    triggerValue: row.triggerValue ?? '',
    active: row.active !== false,
  })),
  publicSurveys: (offer.publicSurveys || []).map(idOf),
});

export const EMPTY_BUSINESS_FORM = {
  name: '',
  brandName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  category: '',
  categories: [],
  description: '',
  contactName: '',
  contactDesignation: '',
  contactPhone: '',
  operatingDays: [],
  openingTime: '',
  closingTime: '',
  instagram: '',
  website: '',
  googleMapsUrl: '',
  municipality: '',
  wardNumber: '',
  isVerified: false,
  searchKeywords: [],
};

export const placeError = (municipality, wardNumber) => {
  const name = String(municipality || '').trim();
  if (!name) return 'Municipality is required';
  const maxWards = getMaxWards(name);
  if (!maxWards) return 'Choose a municipality from the list';
  const ward = Number(wardNumber);
  if (!Number.isInteger(ward) || ward < 1) return 'Ward number is required';
  if (ward > maxWards) return `This municipality only has ${maxWards} wards`;
  return '';
};

export const VOUCHER_STATUSES = ['active', 'used', 'expired', 'cancelled'];

export const BUSINESS_PAGE_SIZE = 20;
