import { Flame } from "lucide-react";
import "./activityMarks.css";

function Triangle({ up }) {
  return (
    <svg className="activity-delta-mark" viewBox="0 0 10 8" aria-hidden="true">
      {up ? <polygon points="5,0 10,8 0,8" /> : <polygon points="0,0 10,0 5,8" />}
    </svg>
  );
}

export function CreditDelta({ amount, placeholder = true }) {
  const value = amount == null ? null : Number(amount);
  if (value == null || Number.isNaN(value) || value === 0) {
    return placeholder ? <span className="activity-dash">—</span> : null;
  }

  const up = value > 0;
  const credits = Math.abs(value);
  return (
    <span className={up ? "activity-delta activity-delta-up" : "activity-delta activity-delta-down"}>
      <Triangle up={up} />
      {credits} credits
    </span>
  );
}

export function SurveyStreakMark({ type, streakAfter, placeholder = true }) {
  if (type === "survey_completed" && streakAfter != null) {
    return (
      <span className="activity-streak" title={`Streak ${streakAfter}`}>
        <Flame size={13} aria-hidden="true" />
        {streakAfter}
      </span>
    );
  }

  if (type === "streak_lost") {
    return <span className="activity-streak-lost">Streak lost</span>;
  }

  if (type === "streak_reward" && streakAfter != null) {
    return <span className="activity-streak">Streak {streakAfter}</span>;
  }

  return placeholder ? <span className="activity-dash">—</span> : null;
}
