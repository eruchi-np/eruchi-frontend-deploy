import { readAcquisition } from "./acquisition";
import { ensureVisitorId } from "./healthEvents";

const ATTEMPT_KEY = "eruchi_google_oauth_attempt";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const GOOGLE_OAUTH_BLOCKER_HINT =
  "Google sign-in didn't finish. Try Continue with Google again, or continue with email.";

export const getGoogleRedirectUrl = () => {
  const base = String(API_BASE_URL || "").replace(/\/$/, "");
  return `${base}/auth/google`;
};

/** Full-page Google OAuth redirect (primary sign-in path). */
export const startGoogleRedirectOAuth = () => {
  markGoogleOAuthAttempt();
  const params = new URLSearchParams();
  const visitorId = ensureVisitorId();
  const acquisition = readAcquisition();
  if (visitorId) params.set("visitorId", visitorId);
  if (acquisition?.source) params.set("utm_source", acquisition.source);
  if (acquisition?.medium) params.set("utm_medium", acquisition.medium);
  if (acquisition?.campaign) params.set("utm_campaign", acquisition.campaign);
  if (acquisition?.content) params.set("utm_content", acquisition.content);
  if (acquisition?.term) params.set("utm_term", acquisition.term);
  const qs = params.toString();
  window.location.assign(`${getGoogleRedirectUrl()}${qs ? `?${qs}` : ""}`);
};

export const markGoogleOAuthAttempt = () => {
  try {
    sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
  } catch {
    /* ignore quota / private mode */
  }
};

export const clearGoogleOAuthAttempt = () => {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* ignore */
  }
};

/** True if they started Google sign-in and came back without finishing. */
export const consumeIncompleteGoogleOAuthAttempt = () => {
  try {
    const started = sessionStorage.getItem(ATTEMPT_KEY);
    if (!started) return false;
    sessionStorage.removeItem(ATTEMPT_KEY);
    return true;
  } catch {
    return false;
  }
};
