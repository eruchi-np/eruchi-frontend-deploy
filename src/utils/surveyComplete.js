const STORAGE_KEY = "eruchi_survey_complete";
const MAX_AGE_MS = 30 * 60 * 1000;

export function goToSurveyComplete(navigate, { creditsEarned, previousStreak }) {
  const payload = {
    creditsEarned: Number(creditsEarned) || 0,
    previousStreak: Number(previousStreak) || 0,
    completedAt: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures; navigation state is the primary payload.
  }

  navigate("/survey-complete", { replace: true, state: payload });
}

export function readSurveyCompleteState(locationState) {
  if (locationState && typeof locationState.creditsEarned === "number") {
    return locationState;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - (parsed.completedAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
