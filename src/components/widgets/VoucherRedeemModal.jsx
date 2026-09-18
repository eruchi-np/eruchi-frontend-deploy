import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { voucherAPI } from "../../services/api";
import { VOUCHER_TERMS } from "../../constants/voucherTerms";
import { CARD_COLORS } from "../shop/RewardCard";
import { playClaimBody, playClaimOpen } from "../shop/shopCinema";
import { getOfferStock } from "../../utils/pickSurveyOffers";
import "../shop/shop.css";

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

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getBrandPalette = (brandName = "") => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

function claimColor(index, offer) {
  if (Number.isFinite(index)) {
    return CARD_COLORS[Math.abs(index) % CARD_COLORS.length];
  }
  const key = String(offer?._id || offer?.business?.brandName || offer?.business?.name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

function prettyCategory(value) {
  if (!value) return "Partner reward";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function discountHeadline(offer) {
  if (offer.discountType === "percentage") return `${offer.discountValue}% OFF`;
  if (offer.discountType === "free_item") {
    return offer.discountValue ? `FREE ${String(offer.discountValue).toUpperCase()}` : "FREE";
  }
  if (offer.discountType === "value_combo") return "VALUE COMBO";
  if (offer.discountValue != null && offer.discountValue !== "") {
    return `Rs. ${offer.discountValue} OFF`;
  }
  return "REWARD";
}

function formatAvailable(days) {
  if (!Array.isArray(days) || days.length === 0) return "See partner for hours";
  const indexes = WEEKDAYS.map((day, i) => (days.includes(day) ? i : -1)).filter((i) => i >= 0);
  if (indexes.length === 0) return days.join(", ");
  const min = Math.min(...indexes);
  const max = Math.max(...indexes);
  if (indexes.length === max - min + 1) {
    if (min === 0 && max === 6) return "Every day";
    if (min === 0 && max === 4) return "Monday – Friday";
    return `${WEEKDAYS[min]} – ${WEEKDAYS[max]}`;
  }
  return days.join(", ");
}

export default function VoucherRedeemModal({
  offer,
  userCredits,
  onClose,
  onSuccess,
  onRedeemed,
  index,
}) {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const qrRef = useRef(null);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const brandName = offer.business?.brandName || offer.business?.name || "Partner";
  const category = prettyCategory(offer.business?.category);
  const description =
    String(offer.description || offer.business?.description || "").trim() ||
    "Turn your earned credits into a little more of what you love.";
  const location = String(offer.business?.address || "").trim() || "Kathmandu, Nepal";
  const validity =
    offer.expiryDays != null
      ? `${offer.expiryDays} day${offer.expiryDays === 1 ? "" : "s"} after claiming`
      : "See partner for details";
  const available = formatAvailable(offer.business?.operatingDays);
  const accent = claimColor(index, offer);
  const stockInfo = useMemo(() => getOfferStock(offer), [offer]);
  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const notEnoughCredits = userCredits < offer.creditsRequired;
  const canRedeem = !notEnoughCredits && !isOut;

  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}% off`
      : `Rs. ${offer.discountValue} off`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useLayoutEffect(() => playClaimOpen(backdropRef.current, cardRef.current), [offer?._id]);

  useLayoutEffect(() => playClaimBody(cardRef.current, step), [step]);

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await voucherAPI.redeem(offer._id);
      setVoucher(res.data.voucher);
      setStep("success");
      onRedeemed?.(res.data.voucher);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to redeem voucher");
    } finally {
      setLoading(false);
    }
  };

  const goSurveys = () => {
    onClose?.();
    navigate("/standalone-surveys");
  };

  const downloadVoucher = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const CARD_W = 400;
    const CX = CARD_W / 2;
    const RADIUS = 28;
    const QR_SIZE = 220;

    const brandLogoUrl =
      offer.business?.brandLogo || offer.business?.logo || offer.business?.businessLogo || null;
    const palette = getBrandPalette(brandName);

    const wrapText = (ctx, text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const HEADER_TOP_PAD = 30;
    const LOGO_SIZE = 68;
    const HEADER_BOTTOM_PAD = 26;
    const TITLE_LINE_H = 28;

    const measureCtx = document.createElement("canvas").getContext("2d");
    measureCtx.font = "bold 24px system-ui, sans-serif";
    const titleLines = wrapText(measureCtx, offer.title || "", CARD_W - 64);

    const HEADER_H =
      HEADER_TOP_PAD +
      LOGO_SIZE +
      16 +
      18 +
      4 +
      titleLines.length * TITLE_LINE_H +
      10 +
      22 +
      HEADER_BOTTOM_PAD;

    const BOX_X = 32;
    const BOX_W = CARD_W - 64;
    const BOX_PAD_X = 16;
    const BOX_PAD_Y = 12;
    const DESC_LINE_H = 18;
    const descInnerW = BOX_W - BOX_PAD_X * 2;

    let descLines = [];
    if (offer.description) {
      measureCtx.font = "13px system-ui, sans-serif";
      descLines = wrapText(measureCtx, offer.description, descInnerW);
    }
    const descBoxH =
      descLines.length > 0 ? descLines.length * DESC_LINE_H + BOX_PAD_Y * 2 : 0;

    const BODY_PAD_TOP = 28;
    const DIVIDER_GAP = 24;
    const HINT_H = 40;
    const EXPIRY_H = 24;
    const BODY_BOTTOM_PAD = 30;

    const CARD_H =
      HEADER_H +
      BODY_PAD_TOP +
      (descBoxH > 0 ? descBoxH + 20 : 0) +
      DIVIDER_GAP +
      QR_SIZE +
      HINT_H +
      EXPIRY_H +
      BODY_BOTTOM_PAD;

    const logoImg = brandLogoUrl
      ? await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = brandLogoUrl;
        })
      : null;

    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(
      new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    );
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(svgUrl);
        resolve(img);
      };
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, CARD_W, CARD_H, RADIUS);
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, CARD_W, HEADER_H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CARD_W, HEADER_H);
    ctx.clip();
    const rayCX = CX;
    const rayCY = HEADER_H * 0.15;
    const rayR = CARD_W * 0.7;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = palette.accent;
    const segDeg = 12;
    for (let deg = 0; deg < 360; deg += segDeg * 2) {
      const start = (deg * Math.PI) / 180;
      const end = ((deg + segDeg) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(rayCX, rayCY);
      ctx.arc(rayCX, rayCY, rayR, start, end);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    let y = HEADER_TOP_PAD;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(CX, y + LOGO_SIZE / 2, LOGO_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    if (logoImg) {
      const scale = Math.min(
        (LOGO_SIZE * 0.7) / logoImg.width,
        (LOGO_SIZE * 0.7) / logoImg.height
      );
      const lw = logoImg.width * scale;
      const lh = logoImg.height * scale;
      ctx.drawImage(logoImg, CX - lw / 2, y + LOGO_SIZE / 2 - lh / 2, lw, lh);
    } else {
      ctx.fillStyle = palette.bg;
      ctx.font = "600 26px system-ui, sans-serif";
      ctx.fillText(brandName.charAt(0).toUpperCase(), CX, y + LOGO_SIZE / 2 + 9);
    }
    y += LOGO_SIZE + 16;

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(brandName.toUpperCase(), CX, y);
    ctx.globalAlpha = 1;
    y += 22;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, sans-serif";
    for (const line of titleLines) {
      ctx.fillText(line, CX, y);
      y += TITLE_LINE_H;
    }
    y += 6;

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 17px system-ui, sans-serif";
    ctx.fillText(discountLabel, CX, y);
    ctx.globalAlpha = 1;

    y = HEADER_H + BODY_PAD_TOP;

    if (descLines.length > 0) {
      ctx.fillStyle = "#EFF6FF";
      ctx.beginPath();
      ctx.roundRect(BOX_X, y, BOX_W, descBoxH, 10);
      ctx.fill();

      ctx.fillStyle = "#4B5563";
      ctx.font = "13px system-ui, sans-serif";
      let ty = y + BOX_PAD_Y + 14;
      for (const line of descLines) {
        ctx.fillText(line, CX, ty);
        ty += DESC_LINE_H;
      }
      y += descBoxH + 20;
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(CARD_W - 32, y);
    ctx.stroke();
    y += DIVIDER_GAP;

    const qrX = (CARD_W - QR_SIZE) / 2;
    ctx.drawImage(qrImg, qrX, y, QR_SIZE, QR_SIZE);
    y += QR_SIZE;

    ctx.fillStyle = "#3399FF";
    ctx.globalAlpha = 0.8;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText("Show this QR to store staff to redeem", CX, y + 26);
    ctx.globalAlpha = 1;

    if (voucher.expiresAt) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(
        `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
        CX,
        y + 50
      );
    }

    ctx.restore();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, RADIUS);
    ctx.stroke();

    const a = document.createElement("a");
    a.download = `voucher-${voucher._id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return createPortal(
    <div className="reward-claim-backdrop" onClick={onClose}>
      <div ref={backdropRef} className="reward-claim-dim" aria-hidden="true" />
      <div
        className="reward-claim-motion"
        onClick={(event) => event.stopPropagation()}
      >
        <article ref={cardRef} className="reward-claim" style={{ "--claim": accent }}>
        <aside className="reward-claim-brand">
          <p className="reward-claim-kicker">Eruchi exclusive</p>
          <div className="reward-claim-arch">
            <span>{brandName}</span>
          </div>
          <p className="reward-claim-tagline">
            A little reward.
            <br />
            A great experience.
          </p>
          <p className="reward-claim-mark">Claim it. Enjoy it.</p>
        </aside>

        <div className="reward-claim-body">
          <button
            type="button"
            className="reward-claim-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {step === "confirm" && (
            <>
              <p className="reward-claim-category">{category}</p>
              <h2 className="reward-claim-title">{brandName}</h2>
              <p className="reward-claim-copy">{description}</p>

              <div className="reward-claim-deal">
                <strong>{discountHeadline(offer)}</strong>
                <span>{offer.title}</span>
              </div>

              <dl className="reward-claim-meta">
                <div>
                  <dt>Validity</dt>
                  <dd>{validity}</dd>
                </div>
                <div>
                  <dt>Available</dt>
                  <dd>{available}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{location}</dd>
                </div>
              </dl>

              {canRedeem && (
                <div className="reward-claim-legal">
                  <label className="reward-claim-agree">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                    />
                    I have read and agree to the
                  </label>
                  <details className="reward-claim-terms">
                    <summary>Terms &amp; Conditions</summary>
                    <ul>
                      {VOUCHER_TERMS.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}

              {error ? <p className="reward-claim-error">{error}</p> : null}
              {notEnoughCredits && !isOut ? (
                <p className="reward-claim-error">Not enough credits</p>
              ) : null}

              <div className="reward-claim-foot">
                <div>
                  <p className="reward-claim-credits">{offer.creditsRequired || 0} Credits</p>
                  <p className="reward-claim-balance">Your balance: {userCredits} credits</p>
                </div>
                {isOut ? (
                  <button type="button" className="reward-claim-cta" disabled>
                    Sold out
                  </button>
                ) : notEnoughCredits ? (
                  <button type="button" className="reward-claim-cta" onClick={goSurveys}>
                    Surveys
                  </button>
                ) : (
                  <button
                    type="button"
                    className="reward-claim-cta"
                    onClick={handleRedeem}
                    disabled={loading || !agreed}
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    Redeem
                  </button>
                )}
              </div>

              <p className="reward-claim-note">
                Present your voucher at the venue. Terms and conditions apply.
              </p>
            </>
          )}

          {step === "success" && voucher && (
            <div className="reward-claim-success">
              <div className="reward-claim-success-head">
                <CheckCircle2 size={22} />
                <h2>Voucher redeemed</h2>
              </div>
              <div ref={qrRef} className="reward-claim-qr">
                <QRCode
                  value={JSON.stringify({ v: voucher._id, t: voucher.redemptionToken })}
                  size={168}
                />
              </div>
              <p className="reward-claim-copy">Show this QR to store staff to redeem.</p>
              <div className="reward-claim-success-actions">
                <button type="button" className="reward-claim-secondary" onClick={downloadVoucher}>
                  Download voucher
                </button>
                <button
                  type="button"
                  className="reward-claim-cta"
                  onClick={() => {
                    onSuccess?.();
                    navigate("/vouchers");
                  }}
                >
                  View my vouchers
                </button>
              </div>
            </div>
          )}
        </div>
        </article>
      </div>
    </div>,
    document.body
  );
}
