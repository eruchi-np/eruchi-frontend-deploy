import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function FirstSurveyNudge({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(12, 21, 32, 0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
        style={{ fontFamily: "Inter, Helvetica Neue, Helvetica, sans-serif" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-survey-nudge-title"
      >
        <h2
          id="first-survey-nudge-title"
          className="text-2xl font-semibold tracking-tight text-[#0c1520]"
        >
          You’re almost at your first reward!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5b6168]">
          Complete your first survey and earn Ruchi Credits. Then you can use
          your Ruchi Credits to purchase Vouchers from our Rewards page.
        </p>
        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0c1520] px-5 text-sm font-semibold text-white"
          >
            View Surveys
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
