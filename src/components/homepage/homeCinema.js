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

function streakTargets(badge, anchor) {
  const bw = badge.offsetWidth;
  const bh = badge.offsetHeight;
  const rect = anchor.getBoundingClientRect();
  const mobile = window.innerWidth < 768;
  const pad = mobile ? 16 : 24;
  return {
    startX: rect.right - bw,
    startY: rect.top,
    endX: window.innerWidth - bw - pad,
    endY: window.innerHeight - bh - (mobile ? 102 : 28),
  };
}

export function initHomeCinema(root) {
  if (!root) return () => {};

  const stage = root.querySelector(".home-stage");
  const sky = root.querySelector(".home-hero-sky");
  const motion = root.querySelector(".home-hero-motion");
  const dotsWrap = root.querySelector(".home-dots-wrap");
  const badge = document.querySelector(".home-streak-badge");
  const anchor = root.querySelector(".home-streak-anchor");

  if (prefersReducedMotion()) {
    dotsWrap?.classList.add("is-live");
    if (badge) badge.style.opacity = "1";
    return () => {};
  }

  const ctx = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".home-line", { y: 52, opacity: 0, duration: 0.95, stagger: 0.13 })
      .from(".home-hero-sub", { y: 24, opacity: 0, duration: 0.7 }, "-=0.55")
      .from(".home-hero-ctas .home-pill", { y: 18, opacity: 0, duration: 0.55, stagger: 0.08 }, "-=0.42");

    if (root.querySelector(".home-streak-bonus")) {
      intro.from(".home-streak-bonus", { y: 16, opacity: 0, duration: 0.5 }, "-=0.32");
    }

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

    if (badge && anchor) {
      const apply = (progress) => {
        const t = streakTargets(badge, anchor);
        const p = progress;
        gsap.set(badge, {
          x: t.startX + (t.endX - t.startX) * p,
          y: t.startY + (t.endY - t.startY) * p,
          scale: 1 - 0.1 * p,
          rotation: 8 * p,
          force3D: true,
        });
      };

      gsap.set(badge, { opacity: 0, rotation: 0, scale: 1 });
      apply(0);
      intro.to(badge, { opacity: 1, duration: 0.55, ease: "power2.out" }, "-=0.25");

      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 0.95, 1)}`,
        scrub: 0.65,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });
    }

    gsap.from(".home-icons svg", {
      y: 18,
      opacity: 0,
      duration: 0.55,
      stagger: 0.045,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-icons", start: "top 88%", once: true },
    });

    const dots = root.querySelectorAll(".home-dot");
    if (dots.length && dotsWrap) {
      gsap.from(dots, {
        scale: 0.15,
        opacity: 0,
        x: (_i, el) => parseFloat(getComputedStyle(el.parentElement).getPropertyValue("--ox")) * 2.6 || 0,
        y: (_i, el) => parseFloat(getComputedStyle(el.parentElement).getPropertyValue("--oy")) * 2.6 || 0,
        duration: 1.05,
        stagger: { each: 0.045, from: "center" },
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: ".home-meet",
          start: "top 74%",
          once: true,
        },
        onComplete: () => {
          gsap.set(dots, { clearProps: "transform,opacity" });
          dotsWrap.classList.add("is-live");
        },
      });
    }

    gsap.from(".home-meet-copy p, .home-meet-copy h2", {
      y: 36,
      opacity: 0,
      duration: 0.85,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-meet-copy", start: "top 80%", once: true },
    });

    gsap.from(".home-feature", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-features", start: "top 76%", once: true },
    });

    gsap.from(".home-orb-wrap", {
      scale: 0.78,
      opacity: 0,
      duration: 1.05,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-features", start: "top 76%", once: true },
    });

    gsap.from(".home-discover-head > *", {
      y: 28,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-discover-head", start: "top 82%", once: true },
    });

    gsap.from(".home-card", {
      y: 52,
      rotate: 2.4,
      opacity: 0,
      duration: 0.85,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".home-carousel", start: "top 82%", once: true },
      onComplete: () => {
        gsap.set(".home-card", { clearProps: "transform,opacity" });
      },
    });
  }, root);

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refresh, 140);
  };
  window.addEventListener("resize", onResize);
  const later = window.setTimeout(refresh, 480);

  return () => {
    window.removeEventListener("load", refresh);
    window.removeEventListener("resize", onResize);
    window.clearTimeout(later);
    window.clearTimeout(resizeTimer);
    if (motion) motion.style.willChange = "auto";
    if (sky) sky.style.willChange = "auto";
    ctx.revert();
  };
}
