import { gsap } from "gsap";

export function initOnboardingCinema(root) {
  if (!root?.querySelector(".onboard-card")) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const ctx = gsap.context(() => {
    const sky = root.querySelector(".onboard-sky .home-hero-sky");
    const sheet = root.querySelector(".onboard-sheet");
    const card = root.querySelector(".onboard-card");
    const kicker = root.querySelector(".onboard-kicker");
    const title = root.querySelector(".onboard-title");
    const copy = root.querySelector(".onboard-copy");
    const fields = root.querySelectorAll(".onboard-field, .onboard-step");
    const actions = root.querySelectorAll(".onboard-actions .home-pill, .onboard-actions button");

    if (sky) gsap.fromTo(sky, { scale: 1 }, { scale: 1.08, duration: 14, ease: "none" });
    if (sheet) gsap.from(sheet, { y: 40, duration: 0.9, ease: "power3.out" });

    const intro = [kicker, title, copy].filter(Boolean);
    if (card) gsap.from(card, { y: 28, opacity: 0, duration: 0.75, ease: "power3.out", delay: 0.08 });
    if (intro.length) {
      gsap.from(intro, { y: 18, opacity: 0, duration: 0.55, stagger: 0.08, ease: "power3.out", delay: 0.16 });
    }
    if (fields.length) {
      gsap.from(fields, { y: 16, opacity: 0, duration: 0.45, stagger: 0.05, ease: "power3.out", delay: 0.28 });
    }
    if (actions.length) {
      gsap.from(actions, { y: 12, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power3.out", delay: 0.4 });
    }
  }, root);

  return () => ctx.revert();
}
