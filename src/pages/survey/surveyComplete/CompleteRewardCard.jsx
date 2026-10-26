import React from "react";
import { CARD_COLORS } from "../../../components/shop/RewardCard";

function discountLabel(offer) {
  if (offer.discountType === "percentage") return `${offer.discountValue}% off`;
  if (offer.discountType === "free_item") {
    return offer.discountValue ? `Free ${offer.discountValue}` : "Free";
  }
  if (offer.discountType === "value_combo") return "Value combo";
  if (offer.discountValue != null && offer.discountValue !== "") {
    return `Rs. ${offer.discountValue} off`;
  }
  return offer.title || "";
}

export default function CompleteRewardCard({ offer, index, userCredits, onRedeem }) {
  const color = CARD_COLORS[Math.abs(index) % CARD_COLORS.length];
  const inkOnDark =
    color === "#003049" || color === "#007F5F" || color === "#7251B5";
  const azureBtn = inkOnDark;
  const brandName = offer.business?.brandName || offer.business?.name || "Partner";
  const brandLogo = offer.business?.logo || offer.business?.logoUrl || null;
  const cost = offer.creditsRequired || 0;
  const shortfall = Math.max(0, cost - (userCredits || 0));
  const locked = shortfall > 0;
  const progress = locked ? Math.min(1, (userCredits || 0) / Math.max(cost, 1)) : 1;

  return (
    <article
      className="rc"
      style={{ "--c": color, "--ink": inkOnDark ? "#fff" : "#0c1520" }}
    >
      <div className="rc-top">
        <span className="rc-logo">
          {brandLogo ? (
            <img src={brandLogo} alt="" />
          ) : (
            brandName.charAt(0).toUpperCase()
          )}
        </span>
        <span className="rc-cost">
          <b>{cost}</b>
          <small>Ruchi Credits</small>
        </span>
      </div>
      <div className="rc-b">
        <h3>{offer.title}</h3>
        <p>{discountLabel(offer)}</p>
        {locked ? (
          <div className="rc-prog">
            <div className="t">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
            <p>{shortfall} more Ruchi Credits</p>
          </div>
        ) : (
          <button
            type="button"
            className="btn"
            style={
              azureBtn
                ? { background: "var(--azure)", color: "var(--navy)" }
                : undefined
            }
            onClick={() => onRedeem(offer)}
          >
            Redeem
          </button>
        )}
      </div>
    </article>
  );
}
