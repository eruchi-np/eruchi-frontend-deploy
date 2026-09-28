const STORAGE_KEY = "eruchi_survey_complete";
const MAX_AGE_MS = 30 * 60 * 1000;

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function completionFromSubmitResponse(res, fallback = {}) {
  const data = res?.data?.data || {};
  return {
    creditsEarned: toNumber(
      data.creditsEarned ?? fallback.creditsEarned,
      0
    ),
    previousStreak: toNumber(
      data.previousStreak ?? fallback.previousStreak,
      0
    ),
    streakCount:
      data.streakCount != null || fallback.streakCount != null
        ? toNumber(data.streakCount ?? fallback.streakCount)
        : undefined,
    credits:
      data.credits != null || fallback.credits != null
        ? toNumber(data.credits ?? fallback.credits)
        : undefined,
    streakBonus: toNumber(data.streakBonus ?? fallback.streakBonus, 0),
    kind: data.kind || fallback.kind || "normal",
  };
}

export function goToSurveyComplete(
  navigate,
  { creditsEarned, previousStreak, streakCount, credits, streakBonus, kind }
) {
  const payload = {
    creditsEarned: toNumber(creditsEarned, 0),
    previousStreak: toNumber(previousStreak, 0),
    streakBonus: toNumber(streakBonus, 0),
    kind: kind === "daily" ? "daily" : "normal",
    completedAt: Date.now(),
  };

  if (streakCount != null) payload.streakCount = toNumber(streakCount, 0);
  if (credits != null) payload.credits = toNumber(credits, 0);

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
