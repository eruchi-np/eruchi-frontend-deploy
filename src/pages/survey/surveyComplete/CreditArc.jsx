import React, { useEffect, useState } from "react";

const ARC_R = 96;
const ARC_C = 2 * Math.PI * ARC_R;
const ARC_VISIBLE = ARC_C * 0.76;

export default function CreditArc({ amount }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const offset = ready ? ARC_C - ARC_VISIBLE : ARC_C;

  return (
    <div className="arcw" aria-hidden="true">
      <svg viewBox="0 0 220 220">
        <g transform="rotate(133 110 110)">
          <circle
            cx="110"
            cy="110"
            r={ARC_R}
            fill="none"
            stroke="rgba(255,255,255,.28)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${ARC_VISIBLE} ${ARC_C}`}
          />
          <circle
            className="arc-ring"
            cx="110"
            cy="110"
            r={ARC_R}
            fill="none"
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${ARC_C} ${ARC_C}`}
            strokeDashoffset={offset}
          />
        </g>
      </svg>
      <div className="arc-c">
        <div className="arc-n">+{amount}</div>
        <div className="arc-l">
          Ruchi Credits
          <br />
          earned
        </div>
      </div>
    </div>
  );
}
