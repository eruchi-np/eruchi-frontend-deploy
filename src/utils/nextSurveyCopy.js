const MS_PER_HOUR = 60 * 60 * 1000;

/** Hours-only countdown copy for a scheduled next survey. */
export function formatNextSurveyAvailableCopy(nextAvailableAt, now = new Date()) {
  if (!nextAvailableAt) return null;
  const target = new Date(nextAvailableAt);
  if (Number.isNaN(target.getTime())) return null;

  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return null;

  const totalHours = Math.floor(ms / MS_PER_HOUR);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0 && hours > 0) {
    return `Next survey available in ${days} ${days === 1 ? "day" : "days"} and ${hours} ${hours === 1 ? "hour" : "hours"}.`;
  }
  if (days > 0) {
    return `Next survey available in ${days} ${days === 1 ? "day" : "days"}.`;
  }
  if (hours > 0) {
    return `Next survey available in ${hours} ${hours === 1 ? "hour" : "hours"}.`;
  }
  return "Next survey available in less than an hour.";
}

export const SURVEYS_EMPTY_FALLBACK_COPY =
  "No surveys right now. New ones will show up here when they’re available.";
