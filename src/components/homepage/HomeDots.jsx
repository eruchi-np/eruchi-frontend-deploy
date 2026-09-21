import React, { useEffect, useRef } from "react";

const MAP = [
  1, 0, 1, 0, 1,
  0, 1, 0, 1, 0,
  1, 0, 1, 0, 1,
  0, 1, 0, 1, 0,
  1, 0, 1, 0, 1,
];

const DOTS = MAP.map((on, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const dx = col - 2;
  const dy = row - 2;
  const dist = Math.hypot(dx, dy);
  return { i, on, col, row, dx, dy, dist };
});

const LINES = [];
DOTS.forEach((a) => {
  if (!a.on) return;
  DOTS.forEach((b) => {
    if (!b.on || b.i <= a.i) return;
    const dc = Math.abs(a.col - b.col);
    const dr = Math.abs(a.row - b.row);
    if (dc <= 1 && dr <= 1 && dc + dr > 0) {
      LINES.push({ a: a.i, b: b.i });
    }
  });
});

export default function HomeDots() {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const cellsRef = useRef([]);
  const motion = useRef({
    rx: 0,
    ry: 0,
    trx: 0,
    try: 0,
    hovering: false,
    raf: 0,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cells = cellsRef.current.filter(Boolean);

    const resetCells = () => {
      cells.forEach((el) => {
        el.style.transform = "translate3d(0, 0, 0)";
      });
    };

    const applyTilt = () => {
      const m = motion.current;
      stage.style.transform = `rotateX(${m.rx}deg) rotateY(${m.ry}deg)`;
    };

    const tick = () => {
      const m = motion.current;
      const k = reduce ? 1 : m.hovering ? 0.12 : 0.08;
      m.rx += (m.trx - m.rx) * k;
      m.ry += (m.try - m.ry) * k;
      applyTilt();

      const settled =
        Math.abs(m.trx - m.rx) < 0.06 && Math.abs(m.try - m.ry) < 0.06;
      if (settled && !m.hovering) {
        m.rx = m.trx;
        m.ry = m.try;
        applyTilt();
        m.raf = 0;
        return;
      }
      m.raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!motion.current.raf) motion.current.raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (reduce) return;
      const rect = wrap.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      motion.current.hovering = true;
      motion.current.try = nx * 16;
      motion.current.trx = -ny * 12;

      cells.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const falloff = Math.max(0, 1 - dist / 220);
        const force = falloff * falloff * 36;
        el.style.transform = `translate3d(${(dx / dist) * force}px, ${(dy / dist) * force}px, 0)`;
      });
      kick();
    };

    const onLeave = () => {
      motion.current.hovering = false;
      motion.current.trx = 0;
      motion.current.try = 0;
      resetCells();
      kick();
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(motion.current.raf);
    };
  }, []);

  return (
    <div className="home-dots-wrap" ref={wrapRef}>
      <span className="home-dots-ring" aria-hidden="true" />
      <span className="home-dots-ring home-dots-ring-b" aria-hidden="true" />
      <div className="home-dots-stage" ref={stageRef}>
        <div className="home-dots-art">
          <svg className="home-dots-lines" viewBox="0 0 5 5" aria-hidden="true">
            {LINES.map((line) => {
              const a = DOTS[line.a];
              const b = DOTS[line.b];
              return (
                <line
                  key={`${line.a}-${line.b}`}
                  x1={a.col + 0.5}
                  y1={a.row + 0.5}
                  x2={b.col + 0.5}
                  y2={b.row + 0.5}
                />
              );
            })}
          </svg>
          {DOTS.map((dot) => {
            if (!dot.on) return <span key={dot.i} className="home-dot-slot" />;
            return (
              <span
                key={dot.i}
                className="home-dot-cell"
                ref={(el) => {
                  cellsRef.current[dot.i] = el;
                }}
                style={{
                  "--ox": `${(dot.dx || 0.65) * 18}px`,
                  "--oy": `${(dot.dy || -0.7) * 18}px`,
                  "--delay": `${dot.dist * 0.18}s`,
                  "--dur": `${5.8 + dot.dist * 1.6}s`,
                  "--pulse": `${2.1 + dot.dist * 0.28}s`,
                }}
              >
                <span className="home-dot" />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
