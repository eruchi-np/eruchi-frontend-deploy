import React from "react";
import { getNextStreakBonus, streakBonusCopy } from "../../utils/streakBonus";
import "./homepage.css";

export default function HomeStreakBonus({ streak = 0, credits = 0 }) {
  const next = getNextStreakBonus(streak);
  const percent = Math.max(0, Math.min(100, next.progress * 100));
  const copy = streakBonusCopy(next, { includeAmount: true });

  return (
    <div className="home-streak-bonus">
      <p className="home-streak-bonus-credits">
        {(Number(credits) || 0).toLocaleString()} credits
      </p>
      <p className="home-streak-bonus-copy">{copy}</p>
      <div
        className="home-streak-bonus-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={copy}
      >
        <span className="home-streak-bonus-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
