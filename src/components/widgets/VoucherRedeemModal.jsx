import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { voucherAPI } from "../../services/api";
import AnimatedContent from "../animations/AnimatedContent";
import { VOUCHER_TERMS } from "../../constants/voucherTerms";

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

export default function VoucherRedeemModal({ offer, userCredits, onClose, onSuccess }) {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const qrRef = useRef(null);
  const navigate = useNavigate();

  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}% off`
      : `Rs. ${offer.discountValue} off`;

  const notEnoughCredits = userCredits < offer.creditsRequired;

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await voucherAPI.redeem(offer._id);
      setVoucher(res.data.voucher);
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to redeem voucher");
    } finally {
      setLoading(false);
    }
  };

  const downloadVoucher = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const CARD_W = 400;
    const CX = CARD_W / 2;
    const RADIUS = 28;
    const QR_SIZE = 220;

    const brandName = offer.business?.brandName || offer.business?.name || "Official Brand";
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

    // ---- Header layout (branded colored header) ----
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
      16 + // logo -> brand gap
      18 + // brand name line
      4 + // brand -> title gap
      titleLines.length * TITLE_LINE_H +
      10 + // title -> discount gap
      22 + // discount line
      HEADER_BOTTOM_PAD;

    // ---- Description box ----
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

    // ---- Body layout ----
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

    // Fetch brand logo
    const logoImg = brandLogoUrl
      ? await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = brandLogoUrl;
        })
      : null;

    // Serialize QR SVG → Image
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(
      new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    );
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(svgUrl); resolve(img); };
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

    // White body background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Colored header
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, CARD_W, HEADER_H);

    // Radial ray decoration (mirrors the on-screen sunburst)
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

    // Logo circle
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

    // Brand name
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(brandName.toUpperCase(), CX, y);
    ctx.globalAlpha = 1;
    y += 22;

    // Title (wraps if long)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, sans-serif";
    for (const line of titleLines) {
      ctx.fillText(line, CX, y);
      y += TITLE_LINE_H;
    }
    y += 6;

    // Discount
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 17px system-ui, sans-serif";
    ctx.fillText(discountLabel, CX, y);
    ctx.globalAlpha = 1;

    // ---- Body content ----
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

    // Divider
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(CARD_W - 32, y);
    ctx.stroke();
    y += DIVIDER_GAP;

    // QR code
    const qrX = (CARD_W - QR_SIZE) / 2;
    ctx.drawImage(qrImg, qrX, y, QR_SIZE, QR_SIZE);
    y += QR_SIZE;

    // Hint
    ctx.fillStyle = "#3399FF";
    ctx.globalAlpha = 0.8;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText("Show this QR to store staff to redeem", CX, y + 26);
    ctx.globalAlpha = 1;

    // Expiry
    if (voucher.expiresAt) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(
        `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, {
          day: "numeric", month: "short", year: "numeric",
        })}`,
        CX, y + 50
      );
    }

    ctx.restore();

    // Card border
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
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] cursor-pointer"
    >
      <AnimatedContent
        direction="vertical"
        distance={35}
        duration={0.4}
        className="bg-white max-w-sm w-full rounded-3xl p-5 sm:p-7 mx-4 shadow-xl pointer-events-auto cursor-default max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div key={step}>
          {/* ── Confirm step ── */}
          {step === "confirm" && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  {offer.business?.name && (
                    <p className="text-[9px] font-bold tracking-widest uppercase text-[#3399FF] mb-1">
                      {offer.business?.brandName || offer.business?.name}
                    </p>
                  )}
                  <h2 className="text-lg font-bold text-gray-900">{offer.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 ml-4 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-[#3399FF] font-semibold mb-3">{discountLabel}</p>

              {/* Description — context before confirming */}
              {offer.description && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl px-4 py-3 mb-5">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {offer.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mb-4">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="text-sm font-semibold text-gray-900">
                  {offer.creditsRequired} credits
                </span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-gray-400">Balance</span>
                <span className="text-sm text-gray-500">{userCredits} credits</span>
              </div>

              <details className="text-xs text-gray-500 border border-gray-100 rounded-2xl px-4 py-3 mb-4">
                <summary className="cursor-pointer font-medium text-gray-600">Terms & Conditions</summary>
                <ul className="mt-2 list-disc pl-4 space-y-1">
                  {VOUCHER_TERMS.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </details>
              <label className="flex items-start gap-2 mb-4 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                I have read and agree to the Terms & Conditions
              </label>

              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

              <button
                onClick={handleRedeem}
                disabled={notEnoughCredits || loading || !agreed}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#3399FF" }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Redeem
              </button>

              {notEnoughCredits && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  Not enough credits
                </p>
              )}
            </>
          )}

          {/* ── Success step ── */}
          {step === "success" && voucher && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                  <h2 className="text-lg font-bold text-gray-900">Voucher Redeemed!</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 ml-4 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex justify-center mb-5">
                <div
                  ref={qrRef}
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                >
                  <QRCode
                    value={JSON.stringify({ v: voucher._id, t: voucher.redemptionToken })}
                    size={180}
                  />
                </div>
              </div>

              <button
                onClick={downloadVoucher}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors mb-2"
              >
                Download Voucher
              </button>
              <button
                onClick={() => { onSuccess(); navigate("/vouchers"); }}
                className="w-full py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#3399FF" }}
              >
                View My Vouchers
              </button>
            </>
          )}
        </div>
      </AnimatedContent>
    </div>,
    document.body
  );
}