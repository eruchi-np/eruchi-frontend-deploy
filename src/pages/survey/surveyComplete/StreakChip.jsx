import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const CHECK = (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className="h-[14px] w-[14px] fill-none stroke-current stroke-[3] [stroke-linecap:round] [stroke-linejoin:round]"
  >
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function StreakChip({ from, to }) {
  const start = Math.max(0, Number(from) || 0);
  const target = Math.max(start, Number(to) || 0);
  const bumped = target > start;
  const rootRef = useRef(null);
  const valueRef = useRef(null);

  // When the streak just went up, mark the new day. Otherwise celebrate the
  // current streak (same-day follow-up surveys) with the latest day highlighted.
  const days = Array.from({ length: 7 }, (_, i) => {
    if (bumped) {
      if (i < Math.min(start, 7)) return "r";
      if (i === start && i < 7) return "n";
      return "";
    }
    const filled = Math.min(target, 7);
    if (i < filled - 1) return "r";
    if (filled > 0 && i === filled - 1) return "n";
    return "";
  });

  useEffect(() => {
    const root = rootRef.current;
    const label = valueRef.current;
    if (!root || !label) return undefined;

    const setLabel = (n) => {
      label.textContent = String(Math.round(n));
    };

    if (prefersReducedMotion()) {
      setLabel(target);
      return undefined;
    }

    const labelFrom = bumped ? start : Math.max(0, target - 1);
    setLabel(labelFrom);
    const labelState = { n: labelFrom };
    const labelTween = gsap.to(labelState, {
      n: target,
      duration: bumped ? 0.7 : 0.55,
      delay: bumped ? 0.55 : 0.4,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => setLabel(labelState.n),
      onComplete: () => setLabel(target),
    });

    const allDays = root.querySelectorAll("[data-streak-day]");
    const filled = root.querySelectorAll("[data-streak-day='r']");
    const next = root.querySelector("[data-streak-day='n']");
    const empty = root.querySelectorAll("[data-streak-day='']");

    gsap.set(allDays, { scale: 0.55, opacity: 0 });

    const filledTween = filled.length
      ? gsap.to(filled, {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          stagger: 0.06,
          delay: 0.25,
          ease: "back.out(1.6)",
          overwrite: true,
        })
      : null;

    const emptyTween = empty.length
      ? gsap.to(empty, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: 0.04,
          delay: 0.35,
          ease: "power2.out",
          overwrite: true,
        })
      : null;

    const nextDelay = bumped
      ? 0.55 + Math.min(start, 7) * 0.06
      : 0.4 + Math.max(0, Math.min(target, 7) - 1) * 0.06;

    const nextTween = next
      ? gsap.fromTo(
          next,
          { scale: 0.2, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.55,
            delay: nextDelay,
            ease: "back.out(2)",
            overwrite: true,
          }
        )
      : null;

    return () => {
      labelTween.kill();
      filledTween?.kill();
      emptyTween?.kill();
      nextTween?.kill();
    };
  }, [start, target, bumped]);

  return (
    <div
      ref={rootRef}
      className="flex flex-wrap items-center gap-x-[22px] gap-y-3 text-white max-md:gap-x-4"
      role="status"
    >
      <span className="inline-flex items-center gap-2.5">
        <span className="grid h-6 w-6 place-items-center" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            className="block h-6 w-6 fill-[rgba(255,255,255,.22)] stroke-white stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </span>
        <span className="whitespace-nowrap text-lg font-bold tabular-nums leading-none tracking-[-0.01em]">
          Streak <span ref={valueRef}>{target}</span>
        </span>
      </span>
      <span className="sr-only">
        {bumped
          ? start === 0
            ? `Your streak started at ${target} day${target === 1 ? "" : "s"}.`
            : `Your streak went from ${start} days to ${target} days.`
          : `Your streak is ${target} day${target === 1 ? "" : "s"}.`}
      </span>
      <span
        className="flex items-center gap-2 max-md:gap-1.5"
        aria-hidden="true"
      >
        {days.map((cls, i) => (
          <i
            key={i}
            data-streak-day={cls}
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold not-italic tabular-nums leading-none ${
              cls
                ? "bg-[#2efdd4] text-[#0c1520]"
                : "bg-[rgba(255,255,255,.88)] text-[#3d4650]"
            } ${cls === "n" ? "shadow-[0_0_0_4px_rgba(46,253,212,.32)]" : ""}`}
          >
            {cls ? CHECK : i + 1}
          </i>
        ))}
      </span>
    </div>
  );
}
