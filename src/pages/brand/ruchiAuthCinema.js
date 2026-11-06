import { gsap } from 'gsap';

/** Left-panel chart bars for brand auth — intro rise + soft idle pulse. */
export function initRuchiAuthCinema(root) {
  if (!root) return () => {};
  const bars = root.querySelectorAll('.ri-auth-bar');
  if (!bars.length) return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(bars, { scaleY: 1, opacity: 1, transformOrigin: 'bottom center' });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.set(bars, { scaleY: 0, opacity: 0.35, transformOrigin: 'bottom center' });

    gsap.to(bars, {
      scaleY: 1,
      opacity: 1,
      duration: 0.9,
      stagger: 0.09,
      delay: 0.28,
      ease: 'power3.out',
      onComplete: () => {
        bars.forEach((bar, index) => {
          gsap.to(bar, {
            scaleY: gsap.utils.random(0.86, 0.95),
            opacity: gsap.utils.random(0.68, 0.9),
            duration: gsap.utils.random(1.5, 2.5),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: index * 0.1,
          });
        });
      },
    });
  }, root);

  return () => ctx.revert();
}
