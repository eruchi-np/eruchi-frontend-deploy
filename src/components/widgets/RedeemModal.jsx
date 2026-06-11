import React, { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { userAPI } from "../../services/api";

export default function RedeemModal({ tier, onClose, onSuccess }) {
  const [step, setStep] = useState("form");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mobileValid = /^9[678]\d{8}$/.test(mobile);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await userAPI.redeem({ mobile, credits: tier.credits, value: tier.value });
      setStep("success");
      onSuccess?.(tier.credits);
    } catch (err) {
      setError(
        err.response?.data?.message || "Redemption failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && step !== "success") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(2,20,60,0.55)" }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {step !== "success" && (
          <div className="flex items-center gap-2 px-8 pt-8 pb-0">
            {["form", "confirm"].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === s
                        ? "bg-gray-900 text-white"
                        : step === "confirm" && s === "form"
                        ? "bg-gray-200 text-gray-500"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step === "confirm" && s === "form" ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      step === s ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {s === "form" ? "Details" : "Confirm"}
                  </span>
                </div>
                {i === 0 && (
                  <div
                    className={`flex-1 h-px ${
                      step === "confirm" ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-8">
          {step === "form" && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Redeem Credits
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Enter your mobile number to receive your reward.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Credits</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {tier.credits.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">You receive</span>
                  <span className="text-sm font-semibold text-blue-600">
                    Rs. {tier.value}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Mobile Top-up
                  </span>
                </div>
              </div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 font-mono tracking-widest"
              />
              {mobile.length > 0 && !mobileValid && (
                <p className="mt-2 text-xs text-red-500 font-medium">
                  Enter a valid 10-digit Nepal mobile number
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={!mobileValid}
                  onClick={() => setStep("confirm")}
                  className="flex-1 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 active:scale-95 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E8472A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="#E8472A" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                Are you sure?
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                {tier.credits.toLocaleString()} credits will be deducted from
                your account.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sending to</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">
                    {mobile}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Mobile Top-up
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Credits used</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {tier.credits.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-sm text-gray-500">You receive</span>
                  <span className="text-sm font-bold text-blue-600">
                    Rs. {tier.value}
                  </span>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  disabled={loading}
                  className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Confirm Redemption"
                  )}
                </button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Submitted!
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Your redemption request is being processed.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5 space-y-2.5 text-left">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sent to</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">
                    {mobile}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Credits used</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {tier.credits.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-blue-600">
                    Rs. {tier.value}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Processing</span>
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Within 2 hours
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-orange-50 rounded-xl px-4 py-3 mb-6 text-left">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-0.5 shrink-0"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="#E8472A"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7.25"
                    y="4"
                    width="1.5"
                    height="5"
                    rx=".5"
                    fill="#E8472A"
                  />
                  <circle cx="8" cy="11.5" r=".9" fill="#E8472A" />
                </svg>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Processed during business hours (9am–6pm). You'll receive
                  your top-up within 2 hours.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}