import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./surveyFlow.css";

export default function SurveySubmitConfirm({
  open,
  submitting = false,
  answeredCount = 0,
  totalCount = 0,
  credits = 0,
  onCancel,
  onConfirm,
}) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="sf-confirm-root">
      <div
        className="scrim sf-confirm-scrim"
        onClick={() => !submitting && onCancel?.()}
        aria-hidden="true"
      />
      <div className="dlg-wrap">
        <div
          className={`dlg sf-confirm-dlg${isNarrow ? " sh is-sheet" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-submit-title"
          aria-busy={submitting || undefined}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id="survey-submit-title">Are you sure you’re done?</h2>
          <p>
            Once you submit, you can’t go back and change your answers. Take a
            second look if you need to.
          </p>
          <div className="dlg-sum">
            <span>
              {answeredCount} of {totalCount} answered
            </span>
            <b className="tn">+{credits} Ruchi Credits</b>
          </div>
          <div className="dlg-a">
            <button
              type="button"
              className="btn ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Go back
            </button>
            <button
              type="button"
              className={`btn ${submitting ? "busy" : "pri"}`}
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? <span className="spin" aria-hidden="true" /> : null}
              {submitting ? "Submitting…" : "Yes, submit"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
