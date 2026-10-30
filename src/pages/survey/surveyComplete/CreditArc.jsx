import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const RING_R = 96;
const RING_C = 2 * Math.PI * RING_R;
const RING_GAP = RING_C * 0.24;
const RING_TRACK = RING_C - RING_GAP;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CreditArc({ amount }) {
  const end = Math.max(0, Number(amount) || 0);
  const arcRef = useRef(null);
  const valueRef = useRef(null);

  useEffect(() => {
    const arc = arcRef.current;
    const label = valueRef.current;
    if (!arc || !label) return undefined;

    const apply = (t) => {
      const eased = Math.max(0, Math.min(1, t));
      const filled = RING_TRACK * eased;
      arc.setAttribute("stroke-dasharray", `${filled} ${RING_C}`);
      label.textContent = `+${Math.round(end * eased)}`;
    };

    if (prefersReducedMotion()) {
      apply(1);
      return undefined;
    }

    apply(0);
    const state = { t: 0 };
    const tween = gsap.to(state, {
      t: 1,
      duration: 1.5,
      delay: 0.35,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => apply(state.t),
      onComplete: () => apply(1),
    });

    return () => {
      tween.kill();
    };
  }, [end]);

  return (
    <div className="shop-ring" aria-label={`${end} Ruchi Credits earned`}>
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
        <p className="shop-ring-label">Credits earned</p>
        <p className="shop-ring-value" ref={valueRef}>
          +0
        </p>
        <p className="shop-ring-unit">Ruchi Credits</p>
      </div>
    </div>
  );
}
