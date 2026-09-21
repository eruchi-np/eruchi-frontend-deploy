import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { getStreakBadgeTier } from "../../utils/streakBonus";
import { StreakBadgeArt } from "./StreakBadge";
import "./homepage.css";

export default function HomeStreakBadge({ streak = 0, onClick }) {
  const badgeRef = useRef(null);
  const count = Math.max(0, Math.floor(Number(streak) || 0));
  const tier = getStreakBadgeTier(count);
  if (!tier) return null;

  const badge = (
    <button
      ref={badgeRef}
      type="button"
      className={`home-streak-badge home-streak-badge--${tier}`}
      aria-label={`${count} day streak`}
      onClick={onClick}
    >
      <StreakBadgeArt count={count} />
    </button>
  );

  return (
    <>
      <span className="home-streak-anchor" aria-hidden="true" />
      {createPortal(badge, document.body)}
    </>
  );
}
