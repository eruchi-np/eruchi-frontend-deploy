const LOCAL_MAX = 10;

export function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatNepalPhone(value) {
  const raw = String(value || '');
  let digits = phoneDigits(raw);

  if (digits.startsWith('977')) {
    const rest = digits.slice(3, 3 + LOCAL_MAX);
    if (!rest) return '+977';
    return rest.length > 2 ? `+977 ${rest.slice(0, 2)} ${rest.slice(2)}` : `+977 ${rest}`;
  }

  digits = digits.slice(0, LOCAL_MAX);
  if (digits.length > 2) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return digits;
}

export function localPhoneDigits(value) {
  const digits = phoneDigits(value);
  return digits.startsWith('977') ? digits.slice(3) : digits;
}

export function phoneFormatError(value) {
  const local = localPhoneDigits(value);
  if (!local) return 'Phone number is required';
  if (local.length !== LOCAL_MAX) return 'Enter a 10-digit Nepal mobile number';
  if (!/^9[78]/.test(local)) return 'Enter a valid Nepal mobile number starting with 97 or 98';
  return '';
}
