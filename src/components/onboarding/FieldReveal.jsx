import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./fieldReveal.css";

const scrollRevealIntoView = (node) => {
  if (!node || !window.matchMedia("(max-width: 720px)").matches) return;
  const rect = node.getBoundingClientRect();
  const viewport = window.visualViewport;
  const offset = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? window.innerHeight;
  const top = rect.top - offset;
  const bottom = rect.bottom - offset;
  if (bottom > height - 16 || top < 16) {
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FieldReveal({ open, children, scroll = true }) {
  const nodeRef = useRef(null);
  const innerRef = useRef(null);
  const wasOpen = useRef(open);
  const skipMotion = useRef(true);
  const [settled, setSettled] = useState(open);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    const inner = innerRef.current;
    if (!node || !inner) return;
    if (open) node.removeAttribute("inert");
    else node.setAttribute("inert", "");

    const instant = skipMotion.current || prefersReducedMotion();

    if (!open) {
      setSettled(false);
      if (instant) {
        node.style.transition = "none";
        node.style.height = "0px";
        node.offsetHeight;
        node.style.transition = "";
        return undefined;
      }
      if (node.style.height === "auto" || node.style.height === "") {
        node.style.transition = "none";
        node.style.height = `${inner.scrollHeight}px`;
        node.offsetHeight;
        node.style.transition = "";
      }
      const frame = requestAnimationFrame(() => {
        node.style.height = "0px";
      });
      return () => cancelAnimationFrame(frame);
    }

    if (instant) {
      node.style.transition = "none";
      node.style.height = "auto";
      node.offsetHeight;
      node.style.transition = "";
      setSettled(true);
      return;
    }

    setSettled(false);
    node.style.height = `${inner.scrollHeight}px`;
  }, [open]);

  useEffect(() => {
    skipMotion.current = false;
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    const inner = innerRef.current;
    if (!node || !inner || !open || settled) return undefined;
    const observer = new ResizeObserver(() => {
      if (node.style.height === "auto") return;
      const next = `${inner.scrollHeight}px`;
      if (node.style.height !== next) node.style.height = next;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, [open, settled]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !open || settled) return undefined;
    const finish = (event) => {
      if (event.target !== node || event.propertyName !== "height") return;
      node.style.height = "auto";
      setSettled(true);
    };
    node.addEventListener("transitionend", finish);
    const fallback = window.setTimeout(() => {
      if (node.style.height !== "auto") node.style.height = "auto";
      setSettled(true);
    }, 700);
    return () => {
      node.removeEventListener("transitionend", finish);
      window.clearTimeout(fallback);
    };
  }, [open, settled]);

  useEffect(() => {
    if (!scroll || !open || wasOpen.current) {
      wasOpen.current = open;
      return undefined;
    }
    wasOpen.current = open;
    const node = nodeRef.current;
    if (!node) return undefined;
    if (prefersReducedMotion()) {
      scrollRevealIntoView(node);
      return undefined;
    }
    const timer = window.setTimeout(() => scrollRevealIntoView(node), 480);
    return () => window.clearTimeout(timer);
  }, [open, scroll]);

  const className = [
    "onboard-reveal",
    open ? "is-open" : "",
    open && settled ? "is-settled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={nodeRef}
      className={className}
      aria-hidden={open ? undefined : true}
      {...(!open ? { inert: "" } : {})}
    >
      <div className="onboard-reveal-inner" ref={innerRef}>
        <div className="onboard-reveal-stack">{children}</div>
      </div>
    </div>
  );
}
