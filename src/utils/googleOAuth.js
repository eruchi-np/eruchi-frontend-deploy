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
  window.location.assign(getGoogleRedirectUrl());
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
