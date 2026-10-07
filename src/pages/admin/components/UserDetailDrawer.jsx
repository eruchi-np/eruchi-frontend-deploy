import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Award, Flame, Mail, Phone, Shield, Ticket, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { canAdjustCredits as userCanAdjustCredits } from "../../../utils/adminRoles";

const LIFECYCLE_LABELS = {
  onboarding: "Onboarding",
  stalled: "Stalled",
  active: "Active",
  atRisk: "At risk",
  dormant: "Dormant",
};

const REASON_LABELS = {
  campaign_completion: "Campaign",
  sep_survey_completion: "Survey",
  voucher_redemption: "Voucher",
  admin_adjustment: "Admin adjustment",
  signup_bonus: "Signup bonus",
  referral_reward: "Referral reward",
  referral_bonus: "Referral bonus",
  profile_completion: "Profile",
  streak_bonus: "Streak bonus",
  streak_guard: "Streak Guard",
  survey_timeout: "Survey timeout",
  other: "Other",
};

const formatWhen = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function UserDetailDrawer({ userId, onClose, NAVY, onCreditsChanged }) {
  const { user: authUser } = useAuth();
  const canAdjustCredits = userCanAdjustCredits(authUser);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [grantGuard, setGrantGuard] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerId, setOfferId] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [gifting, setGifting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUser(userId, { skipErrorToast: true });
      setDetail(res.data.data);
      setGrantGuard(false);
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
    if (!canAdjustCredits) return undefined;
    let cancelled = false;
    const loadOffers = async () => {
      setOffersLoading(true);
      try {
        const collected = [];
        let page = 1;
        let totalPages = 1;
        do {
          const res = await adminAPI.getVoucherOffers({
            page,
            limit: 100,
            skipErrorToast: true,
          });
          collected.push(...(res.data?.data || []));
          totalPages = res.data?.pagination?.totalPages || 1;
          page += 1;
        } while (page <= totalPages && page <= 20);
        if (cancelled) return;
        const now = Date.now();
        const giftable = collected.filter((offer) => {
          if (offer.status && offer.status !== "active") return false;
          if (offer.validUntil && new Date(offer.validUntil).getTime() < now) return false;
          if (offer.totalStock != null && offer.totalRedeemed >= offer.totalStock) return false;
          return true;
        });
        giftable.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
        setOffers(giftable);
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    };
    loadOffers();
    return () => {
      cancelled = true;
    };
  }, [canAdjustCredits, userId]);

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

  const handleGift = async (e) => {
    e.preventDefault();
    if (!offerId) {
      toast.error("Choose a voucher");
      return;
    }
    if (!giftMessage.trim() || giftMessage.trim().length < 3) {
      toast.error("Add a short message");
      return;
    }
    setGifting(true);
    try {
      await adminAPI.giftUserVoucher(
        userId,
        { offerId, message: giftMessage.trim() },
        { skipErrorToast: true }
      );
      toast.success("Voucher gifted");
      setOfferId("");
      setGiftMessage("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to gift voucher");
    } finally {
      setGifting(false);
    }
  };

  const handleRestoreStreak = async (e) => {
    e.preventDefault();
    const saved = detail?.user?.lastBrokenStreakCount || 0;
    if ((detail?.user?.streakCount || 0) > 0 || saved < 1) return;

    setRestoring(true);
    try {
      const res = await adminAPI.restoreUserStreak(
        userId,
        { grantStreakGuard: grantGuard },
        { skipErrorToast: true }
      );
      toast.success(res.data?.message || "Streak restored");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore streak");
    } finally {
      setRestoring(false);
    }
  };

  const user = detail?.user;
  const campaign = user?.activeCampaign?.campaign;
  const currentStreak = user?.streakCount || 0;
  const latestStreak = user?.lastBrokenStreakCount || 0;
  const highestStreak = Math.max(user?.highestStreak || 0, currentStreak, latestStreak);
  const hasActiveStreak = currentStreak > 0;

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
                <p className="text-xs text-gray-500 mb-1">Current streak</p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" /> {currentStreak}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
                  <div>
                    <p className="text-[11px] text-gray-500">Highest</p>
                    <p className="text-base font-semibold text-gray-900">{highestStreak}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Latest</p>
                    <p className="text-base font-semibold text-gray-900">{latestStreak}</p>
                  </div>
                </div>
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
              <p>Attention flags: {user.attentionFlagCount || 0}</p>
              {(user.attentionFlags || []).length > 0 && (
                <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
                  {[...user.attentionFlags].slice(-5).reverse().map((flag) => (
                    <li key={flag.response || flag.at}>{formatWhen(flag.at)}</li>
                  ))}
                </ul>
              )}
              <p>
                Lifecycle: {LIFECYCLE_LABELS[user.lifecycleState] || "Not tagged yet"}
                {user.lifecycleStateAt ? ` · ${formatWhen(user.lifecycleStateAt)}` : ""}
              </p>
              <p>Last online: {formatWhen(user.lastActiveAt)}</p>
              <p>Last survey filled: {formatWhen(user.lastSurveyCompletedAt)}</p>
              <p>
                Campaign:{" "}
                {user.activeCampaign?.status
                  ? `${campaign?.title || "Active"} · ${user.activeCampaign.status}`
                  : "None"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">NCCS grade</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Class</p>
                  <p className="font-semibold text-gray-900">
                    {user.nccs_grade?.class || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sub-class</p>
                  <p className="font-semibold text-gray-900">
                    {user.nccs_grade?.subClass ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {canAdjustCredits && (
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
            )}

            {canAdjustCredits && (
            <form onSubmit={handleGift} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Gift voucher</p>
              <select
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                disabled={offersLoading || offers.length === 0}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">
                  {offersLoading ? "Loading vouchers…" : offers.length === 0 ? "No active vouchers" : "Choose a voucher"}
                </option>
                {offers.map((offer) => (
                  <option key={offer._id} value={offer._id}>
                    {offer.title}
                    {offer.business?.name ? ` · ${offer.business.name}` : ""}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Message (required)"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={gifting || offersLoading || offers.length === 0}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {gifting ? "Gifting…" : "Gift voucher"}
              </button>
            </form>
            )}

            {canAdjustCredits && !hasActiveStreak && latestStreak > 0 && (
            <form onSubmit={handleRestoreStreak} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Restore streak</p>
              <p className="text-xs text-gray-500">
                Sets the current streak to {latestStreak}, their latest lost streak.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={grantGuard}
                  onChange={(e) => setGrantGuard(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Also give 1-day Streak Guard
              </label>
              <button
                type="submit"
                disabled={restoring}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {restoring ? "Restoring…" : "Restore streak"}
              </button>
            </form>
            )}

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
                      <p>
                        {v.offerSnapshot?.title || "Voucher"}
                        {v.giftedBy ? " · Gift" : ""} · {v.status}
                      </p>
                      {v.giftMessage ? <p className="text-xs text-gray-500 mt-0.5">{v.giftMessage}</p> : null}
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
