import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { gsap } from "gsap";
import { getNextStreakBonus } from "../../utils/streakBonus";

const RING_R = 96;
const RING_C = 2 * Math.PI * RING_R;
const RING_GAP = RING_C * 0.24;
const RING_TRACK = RING_C - RING_GAP;

function creditGoal(credits) {
  const caps = [50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 5000];
  return caps.find((cap) => credits <= cap) || Math.max(credits, 1);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** GSAP-driven ring fill + number — no React re-renders per frame. */
function useGsapRing({
  valueEnd,
  fillRatio,
  duration = 1.6,
  delay = 0.48,
}) {
  const arcRef = useRef(null);
  const valueRef = useRef(null);
  const end = Math.max(0, Number(valueEnd) || 0);
  const fill = RING_TRACK * Math.min(1, Math.max(0, Number(fillRatio) || 0));

  useEffect(() => {
    const arc = arcRef.current;
    const label = valueRef.current;
    if (!arc || !label) return undefined;

    const apply = (t) => {
      const eased = Math.max(0, Math.min(1, t));
      arc.setAttribute("stroke-dasharray", `${fill * eased} ${RING_C}`);
      label.textContent = Math.round(end * eased).toLocaleString();
    };

    if (prefersReducedMotion()) {
      apply(1);
      return undefined;
    }

    apply(0);
    const state = { t: 0 };
    const tween = gsap.to(state, {
      t: 1,
      duration,
      delay,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => apply(state.t),
      onComplete: () => apply(1),
    });

    return () => {
      tween.kill();
    };
  }, [end, fill, duration, delay]);

  return { arcRef, valueRef };
}

export default function CreditArc({ credits }) {
  const value = Math.max(0, Number(credits) || 0);
  const max = creditGoal(value);
  const { arcRef, valueRef } = useGsapRing({
    valueEnd: value,
    fillRatio: value / max,
  });

  return (
    <div className="shop-ring" aria-label={`${value} available credits`}>
      <svg viewBox="0 0 240 240" fill="none">
        <circle
          cx="120"
          cy="120"
          r={RING_R}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${RING_TRACK} ${RING_GAP}`}
          transform="rotate(133 120 120)"
        />
        <circle
          ref={arcRef}
          className="shop-ring-arc"
          cx="120"
          cy="120"
          r={RING_R}
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`0 ${RING_C}`}
          transform="rotate(133 120 120)"
        />
      </svg>
      <div className="shop-ring-inner">
        <p className="shop-ring-label">Available Credits</p>
        <p className="shop-ring-value" ref={valueRef}>
          0
        </p>
        <p className="shop-ring-unit">Credits</p>
      </div>
    </div>
  );
}

function streakWindow(current, target, size = 7) {
  const remaining = Math.max(0, target - current);
  let start;
  if (current <= 0) start = 1;
  else if (remaining > 0 && remaining < size) start = Math.max(1, target - size + 1);
  else start = Math.max(1, current - Math.floor((size - 1) / 2));

  return Array.from({ length: size }, (_, i) => {
    const day = start + i;
    return { day, done: day > 0 && day <= current };
  });
}

export function StreakArc({ streak = 0 }) {
  const daysInARow = Math.max(0, Math.floor(Number(streak) || 0));
  const next = getNextStreakBonus(daysInARow);
  const current = next.rewardCounter;
  const target = current === 30 ? 7 : current + next.remaining;
  const remaining = next.remaining;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const { arcRef, valueRef } = useGsapRing({
    valueEnd: daysInARow,
    fillRatio: pct,
    duration: 1.4,
    delay: 0.52,
  });
  const steps = streakWindow(current, target);
  const unit = remaining === 1 ? "day" : "days";
  const meterRef = useRef(null);

  useEffect(() => {
    const root = meterRef.current;
    if (!root) return undefined;
    if (prefersReducedMotion()) return undefined;

    const dots = root.querySelectorAll(".surveys-streak-step");
    const extras = root.querySelectorAll(".surveys-streak-scale, .surveys-streak-copy");
    const tween = gsap.fromTo(
      dots,
      { scale: 0.45, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.42,
        stagger: 0.07,
        delay: 0.95,
        ease: "back.out(1.7)",
        overwrite: true,
      }
    );
    const copyTween = gsap.fromTo(
      extras,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.72, ease: "power3.out", overwrite: true }
    );

    return () => {
      tween.kill();
      copyTween.kill();
    };
  }, [daysInARow, current, target]);

  return (
    <div
      ref={meterRef}
      className="surveys-hero-meter"
      aria-label={`${daysInARow} day streak, ${current} of ${target} days to next reward`}
    >
      <div className="shop-ring">
        <svg viewBox="0 0 240 240" fill="none">
          <circle
            cx="120"
            cy="120"
            r={RING_R}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${RING_TRACK} ${RING_GAP}`}
            transform="rotate(133 120 120)"
          />
          <circle
            ref={arcRef}
            className="shop-ring-arc"
            cx="120"
            cy="120"
            r={RING_R}
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`0 ${RING_C}`}
            transform="rotate(133 120 120)"
          />
        </svg>
        <div className="shop-ring-inner">
          <p className="shop-ring-label">Daily Streak</p>
          <p className="shop-ring-value" ref={valueRef}>
            0
          </p>
          <p className="shop-ring-unit">Days in a row</p>
        </div>
      </div>

      <div className="surveys-streak-scale">
        <span>
          {current}/{target} days
        </span>
        <span>Next big reward</span>
      </div>

      <div className="surveys-streak-dots">
        {steps.map((step) => (
          <span
            key={step.day}
            className={`surveys-streak-step ${step.done ? "is-done" : "is-next"}`}
          >
            {step.done ? <Check size={14} strokeWidth={3} /> : step.day}
          </span>
        ))}
      </div>

      <p className="surveys-streak-copy">
        {daysInARow === 0
          ? "Start a survey to begin your streak!"
          : `${remaining} more ${unit}. Keep your streak going!`}
      </p>
    </div>
  );
}

export function pageWindow(current, total) {
  const count = Math.min(5, total);
  return Array.from({ length: count }, (_, idx) => {
    if (total <= 5) return idx + 1;
    if (current <= 3) return idx + 1;
    if (current >= total - 2) return total - 4 + idx;
    return current - 2 + idx;
  });
}
