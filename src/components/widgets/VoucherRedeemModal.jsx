import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { voucherAPI } from "../../services/api";
import AnimatedContent from "../animations/AnimatedContent";

export default function VoucherRedeemModal({ offer, userCredits, onClose, onSuccess }) {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState(null);
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
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const PAD = 24;
    const CARD_W = 400;
    const CARD_H = 560;
    const CANVAS_W = CARD_W + PAD * 2;
    const CANVAS_H = CARD_H + PAD * 2;
    const RADIUS = 28;
    const CX = PAD + CARD_W / 2;
    const QR_SIZE = 190;

    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(svgUrl); resolve(img); };
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(PAD + RADIUS, PAD);
    ctx.lineTo(PAD + CARD_W - RADIUS, PAD);
    ctx.arcTo(PAD + CARD_W, PAD, PAD + CARD_W, PAD + RADIUS, RADIUS);
    ctx.lineTo(PAD + CARD_W, PAD + CARD_H - RADIUS);
    ctx.arcTo(PAD + CARD_W, PAD + CARD_H, PAD + CARD_W - RADIUS, PAD + CARD_H, RADIUS);
    ctx.lineTo(PAD + RADIUS, PAD + CARD_H);
    ctx.arcTo(PAD, PAD + CARD_H, PAD, PAD + CARD_H - RADIUS, RADIUS);
    ctx.lineTo(PAD, PAD + RADIUS);
    ctx.arcTo(PAD, PAD + RADIUS, PAD + RADIUS, PAD, RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';

    ctx.fillStyle = '#9ca3af';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText((offer.business?.name || '').toUpperCase(), CX, PAD + 44);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px system-ui, sans-serif';
    let title = offer.title || '';
    const maxW = CARD_W - 64;
    if (ctx.measureText(title).width > maxW) {
      while (ctx.measureText(title + '\u2026').width > maxW) title = title.slice(0, -1);
      title += '\u2026';
    }
    ctx.fillText(title, CX, PAD + 76);

    ctx.fillStyle = '#16a34a';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(discountLabel, CX, PAD + 106);

    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD + 126);
    ctx.lineTo(PAD + CARD_W, PAD + 126);
    ctx.stroke();

    const qrX = PAD + (CARD_W - QR_SIZE) / 2;
    const qrY = PAD + 148;
    ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Show this QR to store staff to redeem', CX, qrY + QR_SIZE + 28);

    if (voucher.expiresAt) {
      ctx.fillStyle = '#374151';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.fillText(
        `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
        CX,
        qrY + QR_SIZE + 54
      );
    }

    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`ID: ${voucher._id}`, CX, PAD + CARD_H - 20);

    const a = document.createElement('a');
    a.download = `voucher-${voucher._id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return createPortal(
    /* Added onClick to backdrop so clicking outside closes the modal safely */
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] cursor-pointer"
    >
      <AnimatedContent
        direction="vertical"
        distance={35}
        duration={0.4}
        className="bg-white max-w-sm w-full rounded-3xl p-7 mx-4 shadow-xl pointer-events-auto cursor-default"
        onClick={(e) => e.stopPropagation()} /* Prevents modal body clicks from firing onClose */
      >
        <div key={step}>
          {step === "confirm" && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{offer.title}</h2>
                  {offer.business?.name && (
                    <p className="text-sm text-gray-400 mt-0.5">{offer.business.name}</p>
                  )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-green-600 font-semibold mb-5">{discountLabel}</p>
              <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mb-4">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="text-sm font-semibold text-gray-900">{offer.creditsRequired} credits</span>
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-gray-400">Balance</span>
                <span className="text-sm text-gray-500">{userCredits} credits</span>
              </div>
              {error && (
                <p className="text-sm text-red-500 mb-3">{error}</p>
              )}
              <button
                onClick={handleRedeem}
                disabled={notEnoughCredits || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gray-900 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Redeem
              </button>
              {notEnoughCredits && (
                <p className="text-sm text-red-500 mt-2 text-center">Not enough credits</p>
              )}
            </>
          )}

          {step === "success" && voucher && (
            <>
              {/* Added standard top-bar with a working close button for the success screen */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                  <h2 className="text-lg font-bold text-gray-900">Voucher Redeemed!</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex justify-center mb-5">
                <div ref={qrRef} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <QRCode value={JSON.stringify({ v: voucher._id, t: voucher.redemptionToken })} size={180} />
                </div>
              </div>
              <button
                onClick={downloadVoucher}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors mb-2"
              >
                Download Voucher
              </button>
              <button
                onClick={() => { onSuccess(); navigate('/vouchers'); }}
                className="w-full py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
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