import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Loader2, X } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background: "rgba(8, 18, 32, 0.45)",
};

const modalStyle = {
  position: "relative",
  width: "min(420px, 100%)",
  padding: "28px 24px 24px",
  borderRadius: "24px",
  background: "#fff",
  boxShadow: "0 24px 60px rgba(12, 21, 32, 0.18)",
  fontFamily: "inherit",
};

const closeStyle = {
  position: "absolute",
  top: "16px",
  right: "16px",
  width: "34px",
  height: "34px",
  border: "none",
  borderRadius: "999px",
  background: "#f3f5f7",
  color: "#5b6470",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleStyle = {
  margin: "0 0 10px",
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#16365c",
  lineHeight: 1.25,
  paddingRight: "36px",
};

const copyStyle = {
  margin: "0 0 20px",
  color: "#5b6470",
  fontSize: "15px",
  lineHeight: 1.55,
};

const primaryBtnStyle = {
  width: "100%",
  minHeight: "48px",
  border: "none",
  borderRadius: "999px",
  background: "#16365c",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const secondaryBtnStyle = {
  ...primaryBtnStyle,
  marginTop: "10px",
  background: "#f3f5f7",
  color: "#16365c",
};

/**
 * Under-16 login / profile gate.
 * Step 1: age message + Remind me
 * Step 2: confirmation after scheduling the 16th-birthday email
 */
export default function AgeGateModal({ reminderToken, onClose }) {
  const [step, setStep] = useState("gate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleRemind = async () => {
    if (!reminderToken || busy) return;
    setBusy(true);
    setError("");
    try {
      await axios.post(`${API_BASE_URL}/auth/sixteen-birthday-reminder`, {
        reminderToken,
      });
      setStep("scheduled");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not schedule the reminder. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      onClick={onClose}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          style={closeStyle}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === "gate" ? (
          <>
            <h2 id="age-gate-title" style={titleStyle}>
              You have to be 16 years or older to use eRuchi.
            </h2>
            <p style={copyStyle}>
              Your account is still here. Your Ruchi Credits are still here. We’d
              love to have you back once you’re 16 years old!
            </p>
            {error && (
              <p style={{ ...copyStyle, color: "#be123c", marginBottom: "12px" }}>
                {error}
              </p>
            )}
            <button
              type="button"
              style={{
                ...primaryBtnStyle,
                opacity: busy || !reminderToken ? 0.65 : 1,
                cursor: busy || !reminderToken ? "default" : "pointer",
              }}
              disabled={busy || !reminderToken}
              onClick={handleRemind}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Remind me"
              )}
            </button>
          </>
        ) : (
          <>
            <h2 id="age-gate-title" style={titleStyle}>
              Alright, we’ll send you an email once you turn 16. Looking forward
              to seeing you soon!
            </h2>
            <button type="button" style={secondaryBtnStyle} onClick={onClose}>
              Got it
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
