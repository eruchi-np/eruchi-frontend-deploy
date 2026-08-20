import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ArrowLeft } from "lucide-react";
import { voucherAPI } from "../services/api";

const TABS = ["active", "used", "expired"];

// Vibrant ticket palettes — bg, darker accent, and soft ray color
const TICKET_PALETTES = [
  { bg: "#00704A", accent: "#005C3C", text: "#FFFFFF" }, // green
  { bg: "#E50914", accent: "#B8070F", text: "#FFFFFF" }, // red
  { bg: "#1E88E5", accent: "#1565C0", text: "#FFFFFF" }, // blue
  { bg: "#FB8C00", accent: "#EF6C00", text: "#FFFFFF" }, // orange
  { bg: "#212121", accent: "#000000", text: "#FFFFFF" }, // black
  { bg: "#EC407A", accent: "#D81B60", text: "#FFFFFF" }, // pink
  { bg: "#6A1B9A", accent: "#4A148C", text: "#FFFFFF" }, // purple
  { bg: "#00897B", accent: "#00695C", text: "#FFFFFF" }, // teal
  { bg: "#3949AB", accent: "#283593", text: "#FFFFFF" }, // indigo
  { bg: "#C62828", accent: "#8E0000", text: "#FFFFFF" }, // maroon
];

// Deterministic: same brand name → same color, always
const getBrandPalette = (brandName = "") => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

function getRelativeExpiry(expiresAt) {
  const now = new Date();
  const diff = new Date(expiresAt) - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

function VoucherTicketCard({ voucher, onClick }) {
  const snap = voucher.offerSnapshot || {};
  const discountLabel =
    snap.discountType === "percentage"
      ? `${snap.discountValue}%`
      : snap.discountType === "free_item"
      ? (snap.discountValue ? `Free ${snap.discountValue}` : "Free")
      : snap.discountType === "value_combo"
      ? "Value Combo"
      : `Rs. ${snap.discountValue}`;
  const showOffSuffix = snap.discountType === "percentage" || snap.discountType === "flat";
  const brandName = snap.brandName || snap.businessName || "Official Brand";
  const brandLogo = snap.imageUrl || snap.brandLogo || null;
  const palette = getBrandPalette(brandName);
  const isUsed = voucher.status === "used";
  const isExpired = voucher.status === "expired";
  const isInactive = isUsed || isExpired;

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col text-left group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className={`relative w-full aspect-square rounded-2xl flex flex-col transition-all duration-300 ${
          isInactive
            ? "grayscale opacity-70"
            : "group-hover:shadow-lg group-hover:-translate-y-1"
        }`}
        style={{ backgroundColor: palette.bg }}
      >
        <div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-3/4 aspect-square rounded-full opacity-20 pointer-events-none"
          style={{
            background: `repeating-conic-gradient(${palette.accent} 0deg 12deg, transparent 12deg 24deg)`,
          }}
        />

        <div className="flex-[13] relative flex flex-col items-center justify-center gap-2 px-4 min-w-0">
          <span
            className="w-full text-center truncate text-[8px] xs:text-[10px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase"
            style={{ color: palette.text, opacity: 0.9 }}
          >
            {brandName}
          </span>
          <div className="w-[45%] max-w-24 aspect-square rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={`${brandName} logo`}
                className="max-w-[80%] max-h-[80%] object-contain"
              />
            ) : (
              <span
                className="font-semibold text-3xl sm:text-4xl tracking-tight select-none"
                style={{ color: palette.bg }}
              >
                {brandName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center h-0 z-10">
          <span className="absolute -left-2.5 w-5 h-5 bg-white rounded-full -translate-x-1/2" />
          <span className="absolute -right-2.5 w-5 h-5 bg-white rounded-full translate-x-1/2" />
          <div className="w-full mx-3 border-t-2 border-dashed border-white/40" />
        </div>

        <div className="flex-[9] relative flex flex-col items-center justify-center gap-2 px-4 min-w-0">
          <div className="flex items-baseline gap-1.5 max-w-full">
            <span
              className="font-bold leading-none text-base xs:text-lg sm:text-2xl truncate"
              style={{ color: palette.text }}
            >
              {discountLabel}
            </span>
            {showOffSuffix && (
              <span
                className="text-[10px] xs:text-xs sm:text-sm tracking-widest font-medium shrink-0"
                style={{ color: palette.text, opacity: 0.8 }}
              >
                OFF
              </span>
            )}
          </div>
          {!isInactive && (
            <span
              className="bg-white text-[10px] xs:text-xs sm:text-sm font-semibold px-3 xs:px-4 sm:px-6 py-1 sm:py-1.5 rounded-full shadow-sm max-w-full transition-transform duration-300 group-hover:scale-105"
              style={{ color: palette.accent }}
            >
              View QR
            </span>
          )}
        </div>

        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 z-20">
            <span className="bg-white/95 text-gray-700 text-[10px] sm:text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
              {isUsed ? "Redeemed" : "Expired"}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 flex flex-col gap-0.5 min-w-0">
        <p className="text-gray-400 text-[9px] sm:text-[11px] font-medium tracking-wide uppercase truncate">
          {brandName}
        </p>
        <h2 className="text-gray-900 truncate text-sm sm:text-base font-medium leading-snug">
          {snap.title || "Voucher"}
        </h2>
        {snap.approxValue != null && (
          <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5">
            Estimated savings Rs. {snap.approxValue}
          </p>
        )}
        {voucher.status === "active" && (
          <p className="text-xs text-green-600 mt-1">
            {getRelativeExpiry(voucher.expiresAt)}
          </p>
        )}
        {isUsed && voucher.usedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Used on {new Date(voucher.usedAt).toLocaleDateString()}
          </p>
        )}
        {isExpired && (
          <p className="text-xs text-red-400 mt-1">
            Expired on {new Date(voucher.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </button>
  );
}

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState("active");
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await voucherAPI.getMyVouchers({ status: activeTab });
        setVouchers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch vouchers", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeTab]);

  return (
    <div
      className="min-h-screen bg-gray-50 pb-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1
          className="text-gray-900 mb-6"
          style={{ fontSize: "clamp(28px,5vw,36px)", fontWeight: 300, letterSpacing: "-0.02em" }}
        >
          My Vouchers
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No {activeTab} vouchers yet.
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => navigate("/shop")}
                className="mt-4 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Browse Vouchers
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 items-stretch">
            {vouchers.map((v) => (
              <div key={v._id} className="w-full">
                <VoucherTicketCard
                  voucher={v}
                  onClick={() => navigate(`/vouchers/${v._id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}