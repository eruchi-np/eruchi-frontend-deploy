import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { gsap } from "gsap";
import { getNextStreakBonus } from "../../utils/streakBonus";

function creditGoal(credits) {
  const caps = [50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 5000];
  return caps.find((cap) => credits <= cap) || Math.max(credits, 1);
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target, { duration = 1600, delay = 480 } = {}) {
  const end = Math.max(0, Number(target) || 0);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAmount(end);
      return undefined;
    }

    setAmount(0);
    let raf = 0;
    let start = null;
    const timeout = window.setTimeout(() => {
      const tick = (now) => {
        if (start == null) start = now;
        const t = Math.min(1, (now - start) / duration);
        setAmount(end * easeOutCubic(t));
        if (t < 1) raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf);
    };
  }, [end, duration, delay]);

  return amount;
}

export default function CreditArc({ credits }) {
  const value = Math.max(0, Number(credits) || 0);
  const amount = useCountUp(value);
  const max = creditGoal(value);
  const r = 96;
  const c = 2 * Math.PI * r;
  const gap = c * 0.24;
  const track = c - gap;
  const pct = Math.min(1, amount / max);
  const filled = track * pct;

  return (
    <div className="shop-ring" aria-label={`${value} available credits`}>
      <svg viewBox="0 0 240 240" fill="none">
        <circle
          cx="120"
          cy="120"
          r={r}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${track} ${gap}`}
          transform="rotate(133 120 120)"
        />
        <circle
          className="shop-ring-arc"
          cx="120"
          cy="120"
          r={r}
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          transform="rotate(133 120 120)"
        />
      </svg>
      <div className="shop-ring-inner">
        <p className="shop-ring-label">Available Credits</p>
        <p className="shop-ring-value">{Math.round(amount).toLocaleString()}</p>
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
  const amount = useCountUp(daysInARow);
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const fillProgress = useCountUp(pct, { duration: 1400, delay: 520 });
  const r = 96;
  const c = 2 * Math.PI * r;
  const gap = c * 0.24;
  const track = c - gap;
  const filled = track * Math.min(1, fillProgress);
  const steps = streakWindow(current, target);
  const unit = remaining === 1 ? "day" : "days";
  const meterRef = useRef(null);

  useEffect(() => {
    const root = meterRef.current;
    if (!root) return undefined;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

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
            r={r}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${track} ${gap}`}
            transform="rotate(133 120 120)"
          />
          <circle
            className="shop-ring-arc"
            cx="120"
            cy="120"
            r={r}
            stroke="#fff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
            transform="rotate(133 120 120)"
          />
        </svg>
        <div className="shop-ring-inner">
          <p className="shop-ring-label">Daily Streak</p>
          <p className="shop-ring-value">{Math.round(amount).toLocaleString()}</p>
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
