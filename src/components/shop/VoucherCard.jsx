import React, { useMemo } from "react";
import { Calendar, Hourglass } from "lucide-react";
import { getOfferStock } from "../../utils/pickSurveyOffers";

const TICKET_PALETTES = [
  { bg: "#00704A", accent: "#005C3C", text: "#FFFFFF" },
  { bg: "#E50914", accent: "#B8070F", text: "#FFFFFF" },
  { bg: "#1E88E5", accent: "#1565C0", text: "#FFFFFF" },
  { bg: "#FB8C00", accent: "#EF6C00", text: "#FFFFFF" },
  { bg: "#212121", accent: "#000000", text: "#FFFFFF" },
  { bg: "#EC407A", accent: "#D81B60", text: "#FFFFFF" },
  { bg: "#6A1B9A", accent: "#4A148C", text: "#FFFFFF" },
  { bg: "#00897B", accent: "#00695C", text: "#FFFFFF" },
  { bg: "#3949AB", accent: "#283593", text: "#FFFFFF" },
  { bg: "#C62828", accent: "#8E0000", text: "#FFFFFF" },
];

const getBrandPalette = (brandName = "") => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

export default function VoucherCard({ offer, onRedeem, onViewStore }) {
  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}%`
      : offer.discountType === "free_item"
      ? (offer.discountValue ? `Free ${offer.discountValue}` : "Free")
      : offer.discountType === "value_combo"
      ? "Value Combo"
      : `Rs. ${offer.discountValue}`;

  const showOffSuffix = offer.discountType === "percentage" || offer.discountType === "flat";

  const stockInfo = useMemo(() => getOfferStock(offer), [offer]);

  const formattedDeadline = useMemo(() => {
    if (!offer.validUntil) return null;
    return new Date(offer.validUntil).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [offer.validUntil]);

  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const isLowStock = stockInfo !== null && !isOut && stockInfo.remaining <= 10;
  const brandName =
    offer.business?.brandName || offer.business?.name || "Official Brand";
  const brandLogo = offer.business?.logo || offer.business?.logoUrl || null;
  const palette = useMemo(() => getBrandPalette(brandName), [brandName]);
  const businessId = offer.business?._id;
  const openStore = (e) => {
    e.stopPropagation();
    if (businessId) onViewStore?.(businessId);
  };

  return (
    <div
      onClick={() => !isOut && onRedeem(offer)}
      role="button"
      tabIndex={isOut ? -1 : 0}
      aria-disabled={isOut}
      onKeyDown={(e) => {
        if (!isOut && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onRedeem(offer);
        }
      }}
      className={`w-full h-full bg-white flex flex-col group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl ${
        isOut ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <div
        className="relative w-full aspect-square rounded-2xl flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
        style={{ backgroundColor: palette.bg }}
      >
        <div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-3/4 aspect-square rounded-full opacity-20 pointer-events-none"
          style={{
            background: `repeating-conic-gradient(${palette.accent} 0deg 12deg, transparent 12deg 24deg)`,
          }}
        />

        <div className="flex-[13] relative flex flex-col items-center justify-center gap-2 px-4">
          <button
            type="button"
            onClick={openStore}
            disabled={!businessId}
            className="text-[8px] xs:text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase line-clamp-1 max-w-full underline-offset-2 hover:underline disabled:no-underline disabled:cursor-default"
            style={{ color: palette.text, opacity: 0.9 }}
          >
            {brandName}
          </button>
          <button
            type="button"
            onClick={openStore}
            disabled={!businessId}
            className="w-[45%] max-w-24 aspect-square rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 disabled:cursor-default"
            aria-label={`View ${brandName} store`}
          >
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={`${brandName} logo`}
                loading="lazy"
                decoding="async"
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
          </button>
        </div>

        <div className="relative flex items-center h-0 z-10">
          <span className="absolute -left-2.5 w-5 h-5 bg-white rounded-full -translate-x-1/2" />
          <span className="absolute -right-2.5 w-5 h-5 bg-white rounded-full translate-x-1/2" />
          <div className="w-full mx-3 border-t-2 border-dashed border-white/40" />
        </div>

        <div className="flex-[9] relative flex flex-col items-center justify-center gap-2 px-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-bold leading-none text-lg xs:text-xl sm:text-3xl"
              style={{ color: palette.text }}
            >
              {discountLabel}
            </span>
            {showOffSuffix && (
              <span
                className="text-[10px] xs:text-xs sm:text-sm tracking-widest font-medium"
                style={{ color: palette.text, opacity: 0.8 }}
              >
                OFF
              </span>
            )}
          </div>
          <span
            className="bg-white text-[10px] xs:text-xs sm:text-sm font-semibold px-3 xs:px-4 sm:px-6 py-1 sm:py-1.5 rounded-full shadow-sm max-w-full transition-transform duration-300 group-hover:scale-105"
            style={{ color: palette.accent }}
          >
            Redeem
          </span>
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}

        {!isOut && stockInfo !== null && isLowStock && (
          <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white text-red-500 text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm z-10">
            {stockInfo.remaining} left
          </span>
        )}
      </div>

      <div className="pt-3 sm:pt-4 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={openStore}
          disabled={!businessId}
          className="text-gray-400 text-[9px] sm:text-[11px] font-medium tracking-wide uppercase line-clamp-1 text-left hover:text-gray-700 disabled:hover:text-gray-400"
        >
          {brandName}
        </button>

        <h2 className="text-gray-900 line-clamp-1 text-sm sm:text-base font-medium leading-snug">
          {offer.title}
        </h2>

        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          {offer.creditsRequired} credits{" "}
          <span className="text-gray-400">· {discountLabel}{showOffSuffix ? " off" : ""}</span>
        </p>
        {offer.approxValue != null && (
          <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5">
            Estimated savings Rs. {offer.approxValue}
          </p>
        )}

        <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-[11px] mt-1.5">
          <Hourglass size={10} />
          <span>Valid {offer.expiryDays} days once claimed</span>
        </div>

        {formattedDeadline && (
          <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-[11px]">
            <Calendar size={10} />
            <span>Ends {formattedDeadline}</span>
          </div>
        )}

        {offer.business?._id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewStore?.(offer.business._id);
            }}
            className="mt-2 text-[11px] sm:text-xs font-medium text-blue-600 hover:text-blue-800 text-left"
          >
            View store
          </button>
        )}
      </div>
    </div>
  );
}
