import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { ArrowLeft, Maximize2, Download } from "lucide-react";
import { voucherAPI } from "../services/api";
import { VOUCHER_TERMS } from "../constants/voucherTerms";

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

export default function VoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await voucherAPI.getVoucherById(id);
        setVoucher(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load voucher");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
  };

  const downloadVoucher = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const CARD_W = 400;
    const CX = CARD_W / 2;
    const RADIUS = 28;
    const QR_SIZE = 220;
    const snap = voucher.offerSnapshot || {};

    const brandName = snap.brandName || snap.businessName || "Official Brand";
    const brandLogoUrl = snap.brandLogo || snap.businessLogo || snap.logo || null;
    const palette = getBrandPalette(brandName);

    const discountLabel =
      snap.discountType === "percentage"
        ? `${snap.discountValue}% off`
        : `Rs. ${snap.discountValue} off`;

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
    const titleLines = wrapText(measureCtx, snap.title || "", CARD_W - 64);

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
    if (snap.description) {
      measureCtx.font = "13px system-ui, sans-serif";
      descLines = wrapText(measureCtx, snap.description, descInnerW);
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
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(
      `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, {
        day: "numeric", month: "short", year: "numeric",
      })}`,
      CX, y + 50
    );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-[#3399FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Voucher not found"}</p>
          <button
            onClick={() => navigate("/vouchers")}
            className="px-6 py-2.5 rounded-full bg-[#3399FF] text-white text-sm hover:opacity-90 transition-opacity"
          >
            Back to Vouchers
          </button>
        </div>
      </div>
    );
  }

  const snap = voucher.offerSnapshot || {};
  const discountLabel =
    snap.discountType === "percentage"
      ? `${snap.discountValue}% off`
      : `Rs. ${snap.discountValue} off`;
  const brandName = snap.brandName || snap.businessName || "Official Brand";
  const brandLogo = snap.brandLogo || snap.businessLogo || snap.logo || null;
  const palette = getBrandPalette(brandName);

  const qrValue = JSON.stringify({ v: voucher._id, t: voucher.redemptionToken });

  const isActive = voucher.status === "active";
  const isUsed = voucher.status === "used";
  const isExpired = voucher.status === "expired";

  return (
    <div
      className="min-h-screen bg-blue-50 pb-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Back */}
        <button
          onClick={() => navigate("/vouchers")}
          className="flex items-center gap-2 text-sm text-[#3399FF] hover:opacity-75 transition-opacity mb-6 font-medium"
        >
          <ArrowLeft size={16} />
          My Vouchers
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-blue-100 overflow-hidden shadow-lg shadow-[#3399FF]/5">
          {/* Branded header */}
          <div
            className="relative px-6 pt-7 pb-6 text-center overflow-hidden"
            style={{ backgroundColor: palette.bg }}
          >
            <div
              className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-3/4 aspect-square rounded-full opacity-20 pointer-events-none"
              style={{
                background: `repeating-conic-gradient(${palette.accent} 0deg 12deg, transparent 12deg 24deg)`,
              }}
            />
            <div className="relative w-16 h-16 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt={`${brandName} logo`}
                  className="max-w-[70%] max-h-[70%] object-contain"
                />
              ) : (
                <span
                  className="font-semibold text-2xl tracking-tight select-none"
                  style={{ color: palette.bg }}
                >
                  {brandName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p
              className="relative text-xs uppercase tracking-widest mb-1 font-bold"
              style={{ color: palette.text, opacity: 0.9 }}
            >
              {brandName}
            </p>
            <h1 className="relative text-2xl font-bold" style={{ color: palette.text }}>
              {snap.title}
            </h1>
            <p
              className="relative font-bold text-lg mt-1"
              style={{ color: palette.text, opacity: 0.9 }}
            >
              {discountLabel}
            </p>
          </div>

          <div className="p-6 border-b border-blue-50 text-center bg-white">
            {/* Description */}
            {snap.description && (
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {snap.description}
              </p>
            )}

            <details className="text-xs text-gray-500 border-t border-blue-50 mt-3 pt-3 text-left max-w-xs mx-auto">
              <summary className="cursor-pointer font-medium text-gray-600 text-center">Terms & Conditions</summary>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {VOUCHER_TERMS.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </details>
          </div>

          {/* QR area */}
          <div className="p-6 flex flex-col items-center">
            {isActive && (
              <>
                <div className="relative">
                  <div
                    ref={qrRef}
                    className="p-4 bg-white rounded-2xl border-2 border-blue-50 shadow-inner"
                  >
                    <QRCode value={qrValue} size={220} fgColor="#000000" />
                  </div>
                </div>
                <p className="text-xs text-[#3399FF] opacity-70 mt-4 text-center font-medium">
                  Show this QR to store staff to redeem
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  Expires{" "}
                  {new Date(voucher.expiresAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={handleFullscreen}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3399FF] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-[#3399FF]/20"
                >
                  <Maximize2 size={16} />
                  Show to staff
                </button>
                <button
                  onClick={downloadVoucher}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#3399FF]/30 text-[#3399FF] text-sm font-semibold hover:bg-[#3399FF]/5 transition-colors"
                >
                  <Download size={16} />
                  Download Voucher
                </button>
              </>
            )}

            {(isUsed || isExpired) && (
              <div className="relative">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 opacity-40 grayscale">
                  <QRCode value={qrValue} size={220} fgColor="#000000" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`px-5 py-2 rounded-full text-sm font-bold rotate-[-15deg] border-2 shadow-lg bg-white/90 backdrop-blur-sm ${
                      isUsed
                        ? "border-gray-400 text-gray-500"
                        : "border-red-400 text-red-500"
                    }`}
                  >
                    {isUsed ? "USED" : "EXPIRED"}
                  </div>
                </div>
              </div>
            )}

            {isUsed && voucher.usedAt && (
              <p className="text-sm text-gray-500 mt-4 font-medium">
                Used on{" "}
                {new Date(voucher.usedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            {isExpired && (
              <p className="text-sm text-red-500 mt-4 font-medium">
                Expired on{" "}
                {new Date(voucher.expiresAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}