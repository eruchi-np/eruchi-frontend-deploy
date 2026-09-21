import React from "react";
import streakFlame from "../../assets/home/streak/Vector.svg";
import streakTwelve from "../../assets/home/streak/12.svg";
import { getStreakBadgeTier } from "../../utils/streakBonus";
import "./homepage.css";

function StreakBadgeArt({ count }) {
  const showTwelveArt = count === 12;
  const digits = String(count).length;

  return (
    <>
      <span className="home-streak-glow" aria-hidden="true" />
      <span className="home-streak-inner">
        <img src={streakFlame} alt="" className="home-streak-flame" draggable="false" />
        {showTwelveArt ? (
          <img src={streakTwelve} alt="" className="home-streak-twelve" draggable="false" />
        ) : (
          <span className="home-streak-count" data-digits={digits}>
            {count}
          </span>
        )}
      </span>
    </>
  );
}

export default function StreakBadge({
  streak = 0,
  size = "md",
  onClick,
  className = "",
}) {
  const count = Math.max(0, Math.floor(Number(streak) || 0));
  const tier = getStreakBadgeTier(count);
  if (!tier) return null;

  const classes = ["streak-badge", `streak-badge--${tier}`, `streak-badge--${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={`${count} day streak`}
        onClick={onClick}
      >
        <StreakBadgeArt count={count} />
      </button>
    );
  }

  return (
    <span className={classes} aria-label={`${count} day streak`} role="img">
      <StreakBadgeArt count={count} />
    </span>
  );
}

export { StreakBadgeArt };
