const ATTEMPT_KEY = "eruchi_google_oauth_attempt";

export const GOOGLE_OAUTH_BLOCKER_HINT =
  "Google sign-in didn't finish. If you use an ad blocker, pause it for this site and try again — or continue with email.";

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
