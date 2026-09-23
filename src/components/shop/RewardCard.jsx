import React, { useMemo, useState } from "react";
import { getOfferStock } from "../../utils/pickSurveyOffers";

export const CARD_COLORS = ["#003049", "#FF006E", "#F77F00", "#007F5F", "#E39B0E", "#7251B5"];

function daysLeftLabel(offer) {
  if (offer.validUntil) {
    const days = Math.ceil((new Date(offer.validUntil) - Date.now()) / 86400000);
    if (days <= 0) return "Ended";
    if (days === 1) return "Only 1 day left";
    return `Only ${days} days left`;
  }
  if (offer.expiryDays) {
    return `Valid ${offer.expiryDays} days once claimed`;
  }
  return "";
}

function discountLabel(offer) {
  if (offer.discountType === "percentage") return `${offer.discountValue}% off`;
  if (offer.discountType === "free_item") {
    return offer.discountValue ? `Free ${offer.discountValue}` : "Free";
  }
  if (offer.discountType === "value_combo") return "Value combo";
  if (offer.discountValue != null && offer.discountValue !== "") {
    return `Rs. ${offer.discountValue} off`;
  }
  return "";
}

function offerBlurb(offer) {
  const desc = String(offer.description || "").trim();
  if (desc) return desc;
  const bits = [offer.title, discountLabel(offer)].filter(Boolean);
  return bits.join(" · ");
}

function canHoverReveal() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

export default function RewardCard({ offer, index = 0, onRedeem, onViewStore }) {
  const [flipped, setFlipped] = useState(false);
  const stockInfo = useMemo(() => getOfferStock(offer), [offer]);
  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const brandName = offer.business?.brandName || offer.business?.name || "Partner";
  const brandLogo = offer.business?.logo || offer.business?.logoUrl || null;
  const businessId = offer.business?._id;
  const color = CARD_COLORS[Math.abs(index) % CARD_COLORS.length];
  const meta = daysLeftLabel(offer);
  const deal = discountLabel(offer);
  const blurb = offerBlurb(offer);

  const openStore = (event) => {
    event.stopPropagation();
    if (businessId) onViewStore?.(businessId);
  };

  const redeem = (event) => {
    event.stopPropagation();
    if (!isOut) onRedeem?.(offer, index);
  };

  const toggleFlip = (event) => {
    if (isOut) return;
    if (event.target.closest("[data-card-action]")) return;
    if (canHoverReveal()) return;
    setFlipped((open) => !open);
  };

  return (
    <article
      className={`shop-card ${isOut ? "is-out" : ""} ${flipped ? "is-flipped" : ""}`}
      style={{ "--card": color }}
      onClick={toggleFlip}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className="shop-card-shell">
        <button
          type="button"
          className="shop-card-arch"
          data-card-action="store"
          onClick={openStore}
          disabled={!businessId}
          aria-label={businessId ? `View ${brandName} store` : brandName}
        >
          {brandLogo ? (
            <img className="shop-card-logo" src={brandLogo} alt="" />
          ) : (
            <span className="shop-card-initial">{brandName.charAt(0).toUpperCase()}</span>
          )}
          <span className="shop-card-brand">{brandName}</span>
        </button>

        <div className="shop-card-body">
          <div className="shop-card-panel shop-card-front">
            <span className="shop-card-credits">{offer.creditsRequired || 0} CREDITS</span>
            <span className="shop-card-title">{offer.title}</span>
            {meta ? <span className="shop-card-meta">{meta}</span> : null}
          </div>

          <div className="shop-card-panel shop-card-back">
            <p className="shop-card-back-title">{offer.title}</p>
            <p className="shop-card-back-desc">{blurb}</p>
            {deal ? <p className="shop-card-back-deal">{deal}</p> : null}
            <div className="shop-card-back-actions">
              <button
                type="button"
                className="shop-card-redeem"
                data-card-action="redeem"
                onClick={redeem}
                disabled={isOut}
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOut && <span className="shop-card-sold">Sold Out</span>}
    </article>
  );
}
