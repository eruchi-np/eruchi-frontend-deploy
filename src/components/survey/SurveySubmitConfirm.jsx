import React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SurveySubmitConfirm({
  open,
  submitting = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(12, 21, 32, 0.45)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
        style={{ fontFamily: "Inter, Helvetica Neue, Helvetica, sans-serif" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-submit-title"
      >
        <h2
          id="survey-submit-title"
          className="text-2xl font-semibold tracking-tight text-[#0c1520]"
        >
          Are you sure you’re done?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5b6168]">
          Once you submit, you can’t go back and change your answers. Take a
          second look if you need to.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-11 rounded-full border border-[#d8dde3] px-5 text-sm font-semibold text-[#0c1520] disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0c1520] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Yes, submit"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
