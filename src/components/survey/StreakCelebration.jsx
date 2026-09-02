import React, { useEffect, useState } from "react";

function SolidFlame({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      <path
        fill="currentColor"
        d="M12 1.5c.6 2.6 2.2 4.2 3.9 5.8 2 1.9 4.1 4 4.1 7.4 0 4.3-3.6 7.8-8 7.8s-8-3.5-8-7.8c0-2.2 1-4 2.1-5.4.3-.4 1-.3 1.1.2.3 1.3 1 2.2 1.9 2.4-.4-3.6.9-7.4 2.9-10.4z"
      />
    </svg>
  );
}

export default function StreakCelebration({ from = 0, to = 0 }) {
  const target = Math.max(Number(to) || 0, Number(from) || 0);
  const start = Number(from) || 0;
  const increased = target > start;
  const [display, setDisplay] = useState(increased ? start : target);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (!increased) {
      setDisplay(target);
      return undefined;
    }

    let frame;
    const startTimer = setTimeout(() => {
      const startedAt = performance.now();
      const duration = 900;
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - (1 - progress) ** 3;
        const next = Math.round(start + (target - start) * eased);
        setDisplay(next);
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setPopping(true);
        }
      };
      frame = requestAnimationFrame(tick);
    }, 350);

    return () => {
      clearTimeout(startTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [start, target, increased]);

  const active = display > 0;
  const days = Array.from({ length: 7 }, (_, i) => i < Math.min(display, 7));

  return (
    <div className="flex flex-col items-center">
      <div
        className={`inline-flex items-center gap-3 rounded-full border border-orange-200 bg-orange-50/80 pl-4 pr-5 py-3 shadow-sm transition-transform duration-300 ${
          popping ? "scale-105" : "scale-100"
        }`}
        aria-label={`${display} day streak`}
      >
        <SolidFlame
          className={`transition-transform duration-500 ${
            popping || increased ? "text-orange-500 scale-110" : active ? "text-orange-500" : "text-gray-300"
          }`}
          style={{ width: 28, height: 28 }}
        />
        <span className="flex items-baseline gap-1.5">
          <span
            className="text-[28px] font-bold leading-none tabular-nums transition-all"
            style={{ color: active ? "#134074" : "#9CA3AF" }}
          >
            {display}
          </span>
          <span className="text-sm font-medium text-gray-500 leading-none">
            day streak
          </span>
        </span>
        <span className="flex items-center gap-1 pl-2 border-l border-orange-200 ml-1">
          {days.map((filled, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                filled ? "bg-orange-400 scale-110" : "bg-gray-200"
              }`}
            />
          ))}
        </span>
      </div>
      {increased && (
        <p className="mt-3 text-sm font-medium text-orange-600">
          Streak {start} → {target}
        </p>
      )}
    </div>
  );
}
