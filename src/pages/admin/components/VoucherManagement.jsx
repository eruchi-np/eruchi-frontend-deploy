import React, { useState, useRef } from "react";
import { Ticket, QrCode, Download, X } from "lucide-react";
import QRCode from "react-qr-code";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";

const VoucherManagement = ({ vouchers, voucherLoading, voucherStatusFilter, handleVoucherStatusFilter, NAVY }) => {
  const [qrModal, setQrModal] = useState(null); // { qrValue, voucherId, title }
  const qrModalRef = useRef(null);

  const handleOpenQR = async (voucherId, title) => {
    try {
      const res = await adminAPI.getVoucherWithToken(voucherId);
      const v = res.data.data;
      const qrValue = JSON.stringify({ v: v._id, t: v.redemptionToken });
      setQrModal({ qrValue, voucherId, title });
    } catch (err) {
      toast.error("Failed to load QR data");
    }
  };

  const downloadModalQR = () => {
    const svg = qrModalRef.current?.querySelector("svg");
    if (!svg) return;

    const width = parseInt(svg.getAttribute("width")) || 200;
    const height = parseInt(svg.getAttribute("height")) || 200;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = `voucher-${qrModal.voucherId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Vouchers</h2>
            <p className="text-sm text-gray-500">View vouchers and download QR codes for testing</p>
          </div>
          <div className="flex gap-2">
            {["active", "used", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => handleVoucherStatusFilter(s)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize"
                style={voucherStatusFilter === s ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "#f3f4f6", color: "#374151" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {voucherLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: NAVY }} />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">No vouchers found</p>
          <p className="text-gray-500 text-sm">No {voucherStatusFilter} vouchers exist yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {vouchers.map((voucher) => {
            const snap = voucher.offerSnapshot || {};
            const discountLabel = snap.discountType === "percentage" ? `${snap.discountValue}% off` : `Rs. ${snap.discountValue} off`;
            return (
              <div key={voucher._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${NAVY}15` }}>
                      <Ticket className="h-5 w-5" style={{ color: NAVY }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{snap.title || "Voucher"}</p>
                      <p className="text-sm text-gray-500">{voucher.user?.firstName} {voucher.user?.lastName} · {discountLabel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Expires {new Date(voucher.expiresAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${voucher.status === "active" ? "bg-green-100 text-green-700" : voucher.status === "used" ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-500"}`}>
                      {voucher.status}
                    </span>
                    {voucher.status === "active" && (
                      <button onClick={() => handleOpenQR(voucher._id, snap.title)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: NAVY }}>
                        <QrCode className="h-4 w-4" /> QR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <h3 className="font-bold text-gray-900 truncate flex-1 mr-4">{qrModal.title || "Voucher QR"}</h3>
              <button onClick={() => setQrModal(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div ref={qrModalRef} className="p-4 bg-white border border-gray-100 rounded-2xl">
              <QRCode value={qrModal.qrValue} size={200} />
            </div>
            <p className="text-xs text-gray-400 text-center">This QR encodes the voucher ID and redemption token</p>
            <button onClick={downloadModalQR} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-colors w-full justify-center" style={{ backgroundColor: NAVY }}>
              <Download className="h-4 w-4" /> Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;