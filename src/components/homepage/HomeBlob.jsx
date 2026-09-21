import React, { useEffect, useRef } from "react";
import blobArt from "../../assets/home/blob.png";

export default function HomeBlob() {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const motion = useRef({
    rx: 0,
    ry: 0,
    tx: 0,
    ty: 0,
    s: 1,
    mx: 50,
    my: 50,
    trx: 0,
    try: 0,
    ttx: 0,
    tty: 0,
    ts: 1,
    tmx: 50,
    tmy: 50,
    hovering: false,
    raf: 0,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = () => {
      const m = motion.current;
      stage.style.transform = `rotateX(${m.rx}deg) rotateY(${m.ry}deg) translate3d(${m.tx}px, ${m.ty}px, 0) scale(${m.s})`;
      wrap.style.setProperty("--mx", `${m.mx}%`);
      wrap.style.setProperty("--my", `${m.my}%`);
    };

    const tick = () => {
      const m = motion.current;
      const k = reduce ? 1 : m.hovering ? 0.14 : 0.1;
      m.rx += (m.trx - m.rx) * k;
      m.ry += (m.try - m.ry) * k;
      m.tx += (m.ttx - m.tx) * k;
      m.ty += (m.tty - m.ty) * k;
      m.s += (m.ts - m.s) * k;
      m.mx += (m.tmx - m.mx) * k;
      m.my += (m.tmy - m.my) * k;
      apply();

      const close =
        Math.abs(m.trx - m.rx) < 0.08 &&
        Math.abs(m.try - m.ry) < 0.08 &&
        Math.abs(m.ts - m.s) < 0.002 &&
        Math.abs(m.tmx - m.mx) < 0.15;

      if (close && !m.hovering) {
        m.rx = m.trx;
        m.ry = m.try;
        m.tx = m.ttx;
        m.ty = m.tty;
        m.s = m.ts;
        apply();
        m.raf = 0;
        return;
      }
      m.raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!motion.current.raf) motion.current.raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const nx = Math.max(-1, Math.min(1, px * 2 - 1));
      const ny = Math.max(-1, Math.min(1, py * 2 - 1));
      const m = motion.current;
      m.hovering = true;
      m.try = nx * 20;
      m.trx = -ny * 16;
      m.ttx = nx * 10;
      m.tty = ny * 8;
      m.ts = 1.05;
      m.tmx = px * 100;
      m.tmy = py * 100;
      kick();
    };

    const onLeave = () => {
      const m = motion.current;
      m.hovering = false;
      m.trx = 0;
      m.try = 0;
      m.ttx = 0;
      m.tty = 0;
      m.ts = 1;
      m.tmx = 50;
      m.tmy = 50;
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
    <div
      ref={wrapRef}
      className="home-orb-wrap"
      style={{ "--blob-mask": `url("${blobArt}")` }}
    >
      <div ref={stageRef} className="home-orb-stage">
        <div className="home-orb">
          <img src={blobArt} alt="" className="home-orb-img" />
          <img src={blobArt} alt="" className="home-orb-shift" />
          <span className="home-orb-flow" />
          <span className="home-orb-glow" />
          <span className="home-orb-sheen" />
          <span className="home-orb-pointer" />
        </div>
      </div>
    </div>
  );
}
