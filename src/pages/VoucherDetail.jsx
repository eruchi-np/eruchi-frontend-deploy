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
    const CARD_H = 560;
    const CX = CARD_W / 2;
    const snap = voucher.offerSnapshot || {};
    const discountLabel =
      snap.discountType === "percentage"
        ? `${snap.discountValue}% off`
        : `Rs. ${snap.discountValue} off`;

    // Serialize QR SVG → Image
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

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.textAlign = 'center';

    // Business name
    ctx.fillStyle = '#9ca3af';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText((snap.businessName || '').toUpperCase(), CX, 44);

    // Title (with overflow truncation)
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px system-ui, sans-serif';
    let title = snap.title || '';
    const maxW = CARD_W - 64;
    if (ctx.measureText(title).width > maxW) {
      while (ctx.measureText(title + '\u2026').width > maxW) title = title.slice(0, -1);
      title += '\u2026';
    }
    ctx.fillText(title, CX, 76);

    // Discount
    ctx.fillStyle = '#16a34a';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(discountLabel, CX, 104);

    // Divider
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 122);
    ctx.lineTo(CARD_W - 32, 122);
    ctx.stroke();

    // QR code
    const qrX = (CARD_W - QR_SIZE) / 2;
    const qrY = 144;
    ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

    // Hint text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Show this to store staff to redeem', CX, qrY + QR_SIZE + 28);

    // Expiry
    ctx.fillStyle = '#374151';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(
      `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
      CX,
      qrY + QR_SIZE + 54
    );

    // Voucher ID
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`ID: ${voucher._id}`, CX, CARD_H - 28);

    // Branding
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('eruchi', CX, CARD_H - 12);

    const a = document.createElement('a');
    a.download = `voucher-${voucher._id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Voucher not found"}</p>
          <button
            onClick={() => navigate("/vouchers")}
            className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm"
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
      className="min-h-screen bg-gray-50 pb-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Back */}
        <button
          onClick={() => navigate("/vouchers")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          My Vouchers
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              {snap.businessName}
            </p>
            <h1 className="text-xl font-bold text-gray-900">{snap.title}</h1>
            <p className="text-green-600 font-semibold mt-1">{discountLabel}</p>
          </div>

          {/* QR area */}
          <div className="p-6 flex flex-col items-center">
            {isActive && (
              <>
                <div className="relative">
                  <div ref={qrRef} className="p-4 bg-white rounded-2xl border border-gray-100">
                    <QRCode value={qrValue} size={220} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Show this QR to store staff to redeem
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  Expires{" "}
                  {new Date(voucher.expiresAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={handleFullscreen}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <Maximize2 size={14} />
                  Show to staff
                </button>
                <button
                  onClick={downloadVoucher}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Download size={14} />
                  Download Voucher
                </button>
              </>
            )}

            {(isUsed || isExpired) && (
              <div className="relative">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 opacity-30 grayscale">
                  <QRCode value={qrValue} size={220} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`px-5 py-2 rounded-full text-sm font-bold rotate-[-15deg] border-2 ${
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
              <p className="text-sm text-gray-400 mt-3">
                Used on{" "}
                {new Date(voucher.usedAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            {isExpired && (
              <p className="text-sm text-red-400 mt-3">
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