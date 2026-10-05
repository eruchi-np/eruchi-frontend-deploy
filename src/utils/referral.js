const STORAGE_KEY = "eruchi_referral_code";

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

export function readStoredReferralCode() {
  try {
    const code = digitsOnly(sessionStorage.getItem(STORAGE_KEY));
    return code.length === 6 ? code : "";
  } catch {
    return "";
  }
}

export function storeReferralCode(value) {
  const code = digitsOnly(value);
  try {
    if (code.length === 6) sessionStorage.setItem(STORAGE_KEY, code);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  return code;
}

export function clearStoredReferralCode() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
