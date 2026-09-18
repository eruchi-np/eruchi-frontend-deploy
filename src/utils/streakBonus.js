export const STREAK_REWARD_CYCLE = 30;

export const STREAK_BONUSES = [
  { day: 7, credits: 35 },
  { day: 15, credits: 50 },
  { day: 30, credits: 110 },
];

export function getRewardCounter(streakCount) {
  const streak = Math.max(0, Math.floor(Number(streakCount) || 0));
  if (streak === 0) return 0;
  return ((streak - 1) % STREAK_REWARD_CYCLE) + 1;
}

/** Visual badge tier from the live streak (not the 30-day reward cycle). */
export function getStreakBadgeTier(streakCount) {
  const streak = Math.max(0, Math.floor(Number(streakCount) || 0));
  if (streak < 1) return null;
  if (streak <= 6) return "spark";
  if (streak <= 14) return "flare";
  if (streak <= 29) return "blaze";
  if (streak <= 99) return "inferno";
  return "ultimate";
}

export function getNextStreakBonus(streakCount) {
  const rewardCounter = getRewardCounter(streakCount);

  if (rewardCounter <= 6) {
    return {
      rewardCounter,
      remaining: 7 - rewardCounter,
      bonusCredits: 35,
      progress: rewardCounter / 7,
    };
  }

  if (rewardCounter <= 14) {
    return {
      rewardCounter,
      remaining: 15 - rewardCounter,
      bonusCredits: 50,
      progress: rewardCounter / 15,
    };
  }

  if (rewardCounter < 30) {
    return {
      rewardCounter,
      remaining: 30 - rewardCounter,
      bonusCredits: 110,
      progress: rewardCounter / 30,
    };
  }

  return {
    rewardCounter: 30,
    remaining: 7,
    bonusCredits: 35,
    progress: 1,
  };
}

export function streakBonusCopy(next, { includeAmount = true } = {}) {
  if (!next) return "";
  const unit = next.remaining === 1 ? "Streak" : "Streaks";
  if (includeAmount) {
    return `${next.remaining} more ${unit} to next bonus of ${next.bonusCredits} Ruchi Credits`;
  }
  return `${next.remaining} more ${unit} to next bonus`;
}
