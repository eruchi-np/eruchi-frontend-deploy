import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Shield, X } from "lucide-react";
import toast from "react-hot-toast";
import { userAPI } from "../../services/api";
import { STREAK_GUARD_OPTIONS } from "../../utils/streakGuard";

export default function StreakGuardModal({
  credits = 0,
  streakGuardDays = 0,
  canPurchase = true,
  cooldownDays = 0,
  onClose,
  onPurchased,
}) {
  const [buying, setBuying] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (pending && buying == null) {
        setPending(null);
        return;
      }
      onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending, buying]);

  const handleBuy = async (days) => {
    setBuying(days);
    try {
      const res = await userAPI.purchaseStreakGuard(days, { skipErrorToast: true });
      toast.success(res.data?.message || "Streak Guard purchased");
      onPurchased?.(res.data?.data || {});
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not buy Streak Guard");
      setPending(null);
    } finally {
      setBuying(null);
    }
  };

  return createPortal(
    <div
      className="profile-guard-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-guard-title"
      onClick={onClose}
    >
      <div className="profile-guard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-guard-head">
          <div className="profile-guard-icon">
            <Shield size={22} />
          </div>
          <button type="button" className="profile-guard-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {pending ? (
          <>
            <h2 id="streak-guard-title">Are you sure?</h2>
            <p>
              Buy {pending.label} for {pending.credits} Ruchi Credits? You can only buy one Guard
              every 15 days.
            </p>
            <div className="profile-guard-confirm-actions">
              <button
                type="button"
                className="profile-guard-confirm-cancel"
                disabled={buying != null}
                onClick={() => setPending(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-guard-confirm-buy"
                disabled={buying != null}
                onClick={() => handleBuy(pending.days)}
              >
                {buying === pending.days ? "Buying..." : `Buy · ${pending.credits} Credits`}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="streak-guard-title">Streak Guard</h2>
            <p>
              Miss a day and your streak stays intact. A 1 day guard covers one missed day; a 2 day
              guard covers two. You can buy one Guard every 15 days.
            </p>
            {streakGuardDays > 0 && (
              <p className="profile-guard-active">
                You have {streakGuardDays} day{streakGuardDays === 1 ? "" : "s"} of Guard Active.
              </p>
            )}
            {!canPurchase && (
              <p className="profile-guard-wait">
                Available in {cooldownDays} day{cooldownDays === 1 ? "" : "s"}.
              </p>
            )}
            <div className="profile-guard-options">
              {STREAK_GUARD_OPTIONS.map((option) => {
                const tooPoor = credits < option.credits;
                const disabled = !canPurchase || tooPoor || buying != null;
                return (
                  <button
                    key={option.days}
                    type="button"
                    className="profile-guard-option"
                    disabled={disabled}
                    onClick={() => setPending(option)}
                  >
                    <span className="profile-guard-option-copy">
                      <strong>{option.label}</strong>
                      <span>{option.credits} Ruchi Credits</span>
                    </span>
                    <span className="profile-guard-option-cta">
                      {tooPoor ? "Need credits" : `${option.credits} Credits`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
