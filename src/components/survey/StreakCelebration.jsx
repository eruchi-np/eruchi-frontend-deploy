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
  const start = Math.max(0, Number(from) || 0);
  const target = Math.max(0, Number(to) || 0);
  const increased = target > start;
  const [display, setDisplay] = useState(increased ? start : target);
  const [phase, setPhase] = useState(increased ? "idle" : "settled");

  useEffect(() => {
    if (!increased) {
      setDisplay(target);
      setPhase("settled");
      return undefined;
    }

    setDisplay(start);
    setPhase("idle");
    let frame;
    const startTimer = setTimeout(() => {
      setPhase("ticking");
      const startedAt = performance.now();
      const duration = Math.min(1400, 550 + Math.abs(target - start) * 380);
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - (1 - progress) ** 3;
        const next = start + (target - start) * eased;
        setDisplay(progress >= 1 ? target : Math.floor(next));
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setPhase("popped");
        }
      };
      frame = requestAnimationFrame(tick);
    }, 700);

    return () => {
      clearTimeout(startTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [start, target, increased]);

  const active = display > 0;
  const days = Array.from({ length: 7 }, (_, i) => i < Math.min(display, 7));
  const popping = phase === "popped";
  const animating = increased && phase !== "settled";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative inline-flex items-center gap-3 rounded-full border pl-4 pr-5 py-3 shadow-sm ${
          animating
            ? "border-orange-300 bg-orange-50"
            : "border-orange-200 bg-orange-50/80"
        }`}
        style={{
          animation: popping ? "streak-pop 520ms ease-out" : undefined,
          boxShadow: popping
            ? "0 10px 28px rgba(249, 115, 22, 0.28)"
            : undefined,
        }}
        aria-label={`${display} day streak`}
      >
        {popping && (
          <span
            className="absolute -top-3 right-6 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
            style={{ animation: "streak-plus 1100ms ease-out forwards" }}
          >
            +{target - start}
          </span>
        )}
        <SolidFlame
          className={
            active || animating ? "text-orange-500" : "text-gray-300"
          }
          style={{
            width: 28,
            height: 28,
            animation: animating ? "flame-burst 700ms ease-in-out" : undefined,
            transformOrigin: "bottom center",
          }}
        />
        <span className="flex items-baseline gap-1.5 min-w-[4.5rem]">
          <span
            className="text-[28px] font-bold leading-none tabular-nums"
            style={{ color: active || animating ? "#134074" : "#9CA3AF" }}
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
