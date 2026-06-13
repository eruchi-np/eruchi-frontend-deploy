import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { ArrowLeft, Maximize2, Download } from "lucide-react";
import { voucherAPI } from "../services/api";

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
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const QR_SIZE = 180;
    const CARD_W = 400;
    const CARD_H = 600;
    const CX = CARD_W / 2;
    const snap = voucher.offerSnapshot || {};
    const discountLabel =
      snap.discountType === "percentage"
        ? `${snap.discountValue}% off`
        : `Rs. ${snap.discountValue} off`;

    // 1. Fetch logo for the canvas
    const logoImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); 
      img.src = '/logo.png';
    });

    // 2. Serialize QR SVG → Image
    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(svgUrl); resolve(img); };
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    // Background (Very light blue instead of pure white for branding)
    ctx.fillStyle = '#f8fafc'; 
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.textAlign = 'center';

    // Draw Logo
    let currentY = 30;
    if (logoImg) {
      const logoHeight = 36;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      ctx.drawImage(logoImg, CX - (logoWidth / 2), currentY, logoWidth, logoHeight);
      currentY += 50;
    } else {
      currentY += 20; // fallback spacing if logo fails to load
    }

    // Business name (using the exact brand hex, slightly transparent look)
    ctx.fillStyle = '#3399FF'; 
    ctx.globalAlpha = 0.8;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText((snap.businessName || '').toUpperCase(), CX, currentY);
    ctx.globalAlpha = 1.0;
    currentY += 32;

    // Title (with overflow truncation)
    ctx.fillStyle = '#0f172a'; // dark slate for contrast
    ctx.font = 'bold 22px system-ui, sans-serif';
    let title = snap.title || '';
    const maxW = CARD_W - 64;
    if (ctx.measureText(title).width > maxW) {
      while (ctx.measureText(title + '\u2026').width > maxW) title = title.slice(0, -1);
      title += '\u2026';
    }
    ctx.fillText(title, CX, currentY);
    currentY += 28;

    // Discount (Exact brand hex)
    ctx.fillStyle = '#3399FF'; 
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText(discountLabel, CX, currentY);
    currentY += 24;

    // Divider
    ctx.strokeStyle = '#e2e8f0'; // slate border
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, currentY);
    ctx.lineTo(CARD_W - 32, currentY);
    ctx.stroke();
    currentY += 24;

    // QR code
    const qrX = (CARD_W - QR_SIZE) / 2;
    ctx.drawImage(qrImg, qrX, currentY, QR_SIZE, QR_SIZE);

    // Hint text
    ctx.fillStyle = '#64748b'; // slate gray
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Show this to store staff to redeem', CX, currentY + QR_SIZE + 28);

    // Expiry
    ctx.fillStyle = '#0f172a'; // dark slate
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(
      `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
      CX,
      currentY + QR_SIZE + 54
    );

    // Voucher ID
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`ID: ${voucher._id}`, CX, CARD_H - 28);

    // Branding
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('eruchi', CX, CARD_H - 12);

    const a = document.createElement('a');
    a.download = `voucher-${voucher._id}.png`;
    a.href = canvas.toDataURL('image/png');
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
          {/* Header */}
          <div className="p-6 border-b border-blue-50 text-center bg-gradient-to-b from-blue-50/50 to-white">
            <img 
              src="/logo.png" 
              alt="Brand Logo" 
              className="h-12 w-auto mx-auto mb-4 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <p className="text-xs text-[#3399FF] opacity-80 uppercase tracking-wider mb-1 font-semibold">
              {snap.businessName}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{snap.title}</h1>
            <p className="text-[#3399FF] font-bold text-lg mt-1">{discountLabel}</p>
          </div>

          {/* QR area */}
          <div className="p-6 flex flex-col items-center">
            {isActive && (
              <>
                <div className="relative">
                  <div ref={qrRef} className="p-4 bg-white rounded-2xl border-2 border-blue-50 shadow-inner">
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