import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrubWillChange(el, props) {
  if (!el) return {};
  const set = (on) => {
    el.style.willChange = on ? props : "auto";
  };
  set(true);
  return {
    onToggle: (self) => set(self.isActive),
    onRefresh: (self) => set(self.isActive),
  };
}

function catalogKey(el) {
  return el.dataset.offerId || el.dataset.surveyId;
}

export function flipShopCatalog(grid, rectsRef) {
  if (!rectsRef) return;

  if (!grid) {
    rectsRef.current = new Map();
    return;
  }

  const cards = gsap.utils.toArray(
    grid.querySelectorAll("[data-offer-id], [data-survey-id]")
  );
  const prev = rectsRef.current;
  const next = new Map();

  cards.forEach((el) => {
    next.set(catalogKey(el), el.getBoundingClientRect());
  });

  if (prefersReducedMotion()) {
    rectsRef.current = next;
    return;
  }

  const firstPaint = prev.size === 0;

  cards.forEach((el, i) => {
    const key = catalogKey(el);
    const last = next.get(key);
    const first = prev.get(key);

    if (firstPaint) {
      gsap.fromTo(
        el,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: i * 0.07,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform",
        }
      );
      return;
    }

    if (first && last) {
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        gsap.fromTo(
          el,
          { x: dx, y: dy },
          {
            x: 0,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
            overwrite: true,
            clearProps: "transform",
          }
        );
      }
      return;
    }

    gsap.fromTo(
      el,
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
        clearProps: "transform",
      }
    );
  });

  rectsRef.current = next;
}

export function scrollShopToCatalog(root, { behavior = "auto" } = {}) {
  const target = root?.querySelector(".shop-sheet");
  if (!target) return;
  const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function initShopCinema(root) {
  if (!root) return () => {};
  if (prefersReducedMotion()) return () => {};

  const ctx = gsap.context(() => {
    const stage = root.querySelector(".home-stage");
    const sky = root.querySelector(".shop-hero .home-hero-sky");
    const motion = root.querySelector(".shop-hero-motion");
    const lines = root.querySelectorAll(".shop-hero-line");
    const copy = root.querySelector(".shop-hero-copy p");
    const cta = root.querySelector(".shop-hero-copy .home-pill");
    const meter = root.querySelector(".surveys-hero-meter");
    const dots = root.querySelectorAll(".shop-dots i");
    const head = root.querySelector(".shop-title-row h2");
    const sub = root.querySelector(".shop-head-copy");
    const search = root.querySelector(".shop-search");
    const toolbar = root.querySelector(".shop-toolbar");

    const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.04 });
    if (lines.length) intro.from(lines, { y: "100%", duration: 0.9, stagger: 0.12 });
    if (copy) intro.from(copy, { y: 22, opacity: 0, duration: 0.55 }, "-=0.48");
    if (cta) intro.from(cta, { y: 16, opacity: 0, duration: 0.45 }, "-=0.32");
    if (meter) intro.from(meter, { y: 18, opacity: 0, duration: 0.7 }, "-=0.38");

    if (stage && motion) {
      gsap.to(motion, {
        opacity: 0,
        y: -56,
        scale: 0.94,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=70%",
          scrub: 0.5,
          ...scrubWillChange(motion, "transform, opacity"),
          onUpdate: (self) => {
            motion.style.pointerEvents = self.progress > 0.7 ? "none" : "auto";
          },
        },
      });
    }

    if (sky) {
      gsap.fromTo(
        sky,
        { scale: 1 },
        {
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=85%",
            scrub: 0.45,
            ...scrubWillChange(sky, "transform"),
          },
        }
      );
    }

    if (dots.length) {
      gsap.from(dots, {
        scale: 0.15,
        opacity: 0,
        duration: 0.45,
        stagger: { each: 0.03, from: "center" },
        ease: "back.out(1.8)",
        delay: 0.45,
      });
    }

    const catalogIntro = [head, sub, search, toolbar].filter(Boolean);
    if (catalogIntro.length) {
      gsap.from(catalogIntro, {
        y: 22,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.4,
      });
    }
  }, root);

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  const later = window.setTimeout(refresh, 480);

  return () => {
    window.removeEventListener("load", refresh);
    window.clearTimeout(later);
    root.querySelectorAll(".shop-hero-motion, .home-hero-sky").forEach((el) => {
      el.style.willChange = "auto";
    });
    ctx.revert();
  };
}

export function playClaimOpen(backdrop, card) {
  if (!backdrop || !card || prefersReducedMotion()) return () => {};

  const brand = card.querySelector(".reward-claim-brand");
  const arch = card.querySelector(".reward-claim-arch");
  const brandBits = card.querySelectorAll(
    ".reward-claim-kicker, .reward-claim-tagline, .reward-claim-mark"
  );

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.32 }, 0);
  tl.fromTo(
    card,
    { y: 28, scale: 0.97, opacity: 0 },
    { y: 0, scale: 1, opacity: 1, duration: 0.55, clearProps: "transform" },
    0.04
  );
  if (brand) {
    tl.fromTo(brand, { x: -22 }, { x: 0, duration: 0.55, clearProps: "transform" }, 0.08);
  }
  if (arch) {
    tl.fromTo(
      arch,
      { y: 18, scale: 0.84, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.62, ease: "back.out(1.5)" },
      0.18
    );
  }
  if (brandBits.length) {
    tl.fromTo(
      brandBits,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, stagger: 0.08 },
      0.28
    );
  }

  return () => tl.kill();
}

export function playClaimBody(card, step) {
  if (!card || prefersReducedMotion()) return () => {};

  const bits =
    step === "success"
      ? card.querySelectorAll(
          ".reward-claim-success-head, .reward-claim-success .reward-claim-copy, .reward-claim-success-actions"
        )
      : card.querySelectorAll(
          ".reward-claim-category, .reward-claim-title, .reward-claim-copy, .reward-claim-deal, .reward-claim-meta, .reward-claim-legal, .reward-claim-error, .reward-claim-foot, .reward-claim-note"
        );
  if (!bits.length && step !== "success") return () => {};

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (bits.length) {
    tl.fromTo(
      bits,
      { y: 16, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.48,
        stagger: 0.055,
      },
      step === "success" ? 0.04 : 0.2
    );
  }

  const qr = step === "success" ? card.querySelector(".reward-claim-qr") : null;
  if (qr) {
    tl.fromTo(
      qr,
      { y: 16, opacity: 0, scale: 0.88 },
      { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.4)", clearProps: "transform" },
      0.16
    );
  }

  return () => tl.kill();
}
