import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Award, Flame, Mail, Phone, Shield, Ticket, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../../services/api";

const REASON_LABELS = {
  campaign_completion: "Campaign",
  sep_survey_completion: "Survey",
  voucher_redemption: "Voucher",
  admin_adjustment: "Admin adjustment",
  signup_bonus: "Signup bonus",
  profile_completion: "Profile",
  streak_bonus: "Streak bonus",
  streak_guard: "Streak Guard",
  survey_timeout: "Survey timeout",
  other: "Other",
};

const formatWhen = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function UserDetailDrawer({ userId, onClose, NAVY, onCreditsChanged }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUser(userId, { skipErrorToast: true });
      setDetail(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load user");
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

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

  const handleAdjust = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Enter a non-zero amount (negative to deduct)");
      return;
    }
    if (!note.trim() || note.trim().length < 3) {
      toast.error("Add a short reason");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.adjustUserCredits(userId, { amount: n, note: note.trim() }, { skipErrorToast: true });
      toast.success(n > 0 ? "Credits granted" : "Credits deducted");
      setAmount("");
      setNote("");
      await load();
      onCreditsChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to adjust credits");
    } finally {
      setSaving(false);
    }
  };

  const user = detail?.user;
  const campaign = user?.activeCampaign?.campaign;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {loading ? "Loading…" : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
            </h2>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: NAVY }} />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Credits</p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" /> {detail.credits?.balance ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Streak</p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" /> {user.streakCount || 0}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" /> {user.email}
              </p>
              {user.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" /> {user.phone}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                Streak Guard: {user.streakGuardDays || 0} day{(user.streakGuardDays || 0) === 1 ? "" : "s"}
              </p>
              <p>
                Surveys completed: {detail.surveysCompleted ?? 0} · Campaigns completed: {detail.campaignsCompleted ?? 0}
              </p>
              <p>Last survey filled: {formatWhen(user.lastSurveyCompletedAt)}</p>
              <p>
                Campaign:{" "}
                {user.activeCampaign?.status
                  ? `${campaign?.title || "Active"} · ${user.activeCampaign.status}`
                  : "None"}
              </p>
            </div>

            <form onSubmit={handleAdjust} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Adjust credits</p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason (required)"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {saving ? "Saving…" : "Apply"}
              </button>
            </form>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Credit history</h3>
              {(detail.credits?.logs || []).length === 0 ? (
                <p className="text-sm text-gray-500">No credit activity yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {detail.credits.logs.map((log) => (
                    <li key={log._id} className="px-3 py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {REASON_LABELS[log.reason] || log.reason}
                        </p>
                        {log.note && <p className="text-xs text-gray-500 truncate">{log.note}</p>}
                        <p className="text-xs text-gray-400">{formatWhen(log.createdAt)}</p>
                      </div>
                      <p className={`text-sm font-semibold shrink-0 ${log.type === "earned" ? "text-emerald-600" : "text-red-600"}`}>
                        {log.type === "earned" ? "+" : "−"}{log.amount}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(detail.vouchers?.recent || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Ticket className="h-4 w-4" /> Vouchers
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Active {detail.vouchers.byStatus.active} · Used {detail.vouchers.byStatus.used} · Expired {detail.vouchers.byStatus.expired}
                </p>
                <ul className="space-y-2">
                  {detail.vouchers.recent.map((v) => (
                    <li key={v._id} className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2">
                      {v.offerSnapshot?.title || "Voucher"} · {v.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
