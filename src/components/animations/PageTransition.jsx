import { useRef, useEffect, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { AnimationContext } from './AnimationContext';

function PageTransitionInner() {
  const wrapperRef = useRef(null);
  const { configRef } = useContext(AnimationContext);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const cfg = configRef.current;

    if (cfg.skip) return;

    const axis = cfg.direction === 'horizontal' ? 'x' : 'y';
    const offset = cfg.reverse ? -cfg.distance : cfg.distance;

    gsap.set(el, { [axis]: offset, opacity: 0 });
    gsap.to(el, { [axis]: 0, opacity: 1, duration: cfg.duration, ease: cfg.ease, delay: cfg.delay });

    return () => gsap.killTweensOf(el);
  }, []);

  return (
    <div ref={wrapperRef}>
      <Outlet />
    </div>
  );
}

export default function PageTransition() {
  const location = useLocation();
  return <PageTransitionInner key={location.key} />;
}