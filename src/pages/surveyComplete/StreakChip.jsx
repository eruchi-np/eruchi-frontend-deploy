import React from "react";

export default function StreakChip({ from, to }) {
  const start = Math.max(0, Number(from) || 0);
  const target = Math.max(0, Number(to) || 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    if (i < Math.min(start, 7)) return "r";
    if (i === start && target > start) return "n";
    return "";
  });

  return (
    <div className="strk" role="status">
      <span className="strk-f">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      </span>
      <span className="strk-t">
        Streak {start} → {target}
      </span>
      <span className="sr">
        Your streak went from {start} days to {target} days.
      </span>
      <span className="strk-d" aria-hidden="true">
        {days.map((cls, i) => (
          <i key={i} className={cls || undefined} />
        ))}
      </span>
    </div>
  );
}
