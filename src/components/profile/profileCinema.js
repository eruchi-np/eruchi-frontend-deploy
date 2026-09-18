import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function reveal(elements, vars, trigger) {
  const els = gsap.utils.toArray(elements).filter(Boolean);
  if (!els.length) return;
  gsap.set(els, { opacity: 0, y: vars.y || 24 });
  const play = () =>
    gsap.to(els, {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: vars.duration || 0.65,
      stagger: vars.stagger || 0,
      ease: "power3.out",
      overwrite: "auto",
    });
  if (!trigger) {
    play();
    return;
  }
  ScrollTrigger.create({
    trigger,
    start: "top 92%",
    once: true,
    onEnter: play,
  });
}

export function initProfileCinema(root) {
  if (!root?.querySelector(".profile-hero")) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const ctx = gsap.context(() => {
    const sky = root.querySelector(".profile-sky .home-hero-sky");
    const sheet = root.querySelector(".profile-sheet");
    const title = root.querySelector(".profile-hero h1");
    const copy = root.querySelector(".profile-hero-copy");
    const buttons = root.querySelectorAll(".profile-hero-actions .profile-btn");
    const stats = root.querySelectorAll(".profile-stat");
    const weekDays = root.querySelectorAll(".profile-week-day");
    const weekOn = root.querySelectorAll(".profile-week-dot.is-on");

    if (sky) gsap.fromTo(sky, { scale: 1 }, { scale: 1.1, duration: 12, ease: "none" });
    if (sheet) gsap.from(sheet, { y: 36, duration: 0.9, ease: "power3.out" });

    const introEls = [title, copy, ...buttons, ...stats].filter(Boolean);
    gsap.set(introEls, { opacity: 0, y: 32 });
    const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.05 });
    if (title) intro.to(title, { opacity: 1, y: 0, duration: 0.75 });
    if (copy) intro.to(copy, { opacity: 1, y: 0, duration: 0.55 }, "-=0.45");
    if (buttons.length) intro.to(buttons, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, "-=0.3");
    if (stats.length) intro.to(stats, { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 }, "-=0.28");

    if (weekDays.length) {
      gsap.from(weekDays, {
        y: 12,
        opacity: 0,
        scale: 0.65,
        duration: 0.4,
        stagger: 0.055,
        ease: "back.out(1.7)",
        delay: 0.6,
      });
    }
    if (weekOn.length) {
      gsap.from(weekOn, {
        scale: 0.35,
        duration: 0.5,
        stagger: 0.07,
        ease: "back.out(2.2)",
        delay: 0.9,
      });
    }

    reveal(root.querySelectorAll(".profile-onboard"), { y: 24, stagger: 0.1 }, root.querySelector(".profile-onboard"));
    root.querySelectorAll(".profile-section").forEach((section) => {
      reveal(section.querySelector(".profile-section-head"), { y: 18, duration: 0.6 }, section);
    });
    reveal(root.querySelectorAll(".profile-voucher"), { y: 32, stagger: 0.09, duration: 0.7 }, root.querySelector(".profile-voucher-row"));
    reveal(root.querySelectorAll(".profile-survey"), { y: 22, stagger: 0.09 }, root.querySelector(".profile-surveys"));
    reveal(root.querySelectorAll(".profile-empty"), { y: 14, duration: 0.5 }, root.querySelector(".profile-empty"));
  }, root);

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => ctx.revert();
}
