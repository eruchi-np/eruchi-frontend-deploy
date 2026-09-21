import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Ticket, QrCode, Download, X } from "lucide-react";
import QRCode from "react-qr-code";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";

import Pagination from "../../../components/ui/Pagination";

const VoucherManagement = ({
  vouchers,
  voucherLoading,
  voucherStatusFilter,
  handleVoucherStatusFilter,
  pagination,
  onPageChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  statusCounts,
  redeemedInRange,
  NAVY,
}) => {
  const [qrModal, setQrModal] = useState(null);
  const qrModalRef = useRef(null);
  const [localFrom, setLocalFrom] = useState(dateFrom || "");
  const [localTo, setLocalTo] = useState(dateTo || "");

  useEffect(() => {
    setLocalFrom(dateFrom || "");
    setLocalTo(dateTo || "");
  }, [dateFrom, dateTo]);

  const handleOpenQR = async (voucherId, title) => {
    try {
      const res = await adminAPI.getVoucherWithToken(voucherId, { skipErrorToast: true });
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

  const applyDateRange = () => {
    if (localFrom && localTo && localFrom > localTo) {
      toast.error("Start date must be on or before end date");
      return;
    }
    onDateRangeChange?.({ from: localFrom, to: localTo });
  };

  const clearDateRange = () => {
    setLocalFrom("");
    setLocalTo("");
    onDateRangeChange?.({ from: "", to: "" });
  };

  const counts = statusCounts || { active: 0, used: 0, expired: 0 };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="border-b border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Vouchers</h2>
            <p className="text-sm text-gray-500">
              Date range applies to Active (issued), Used (redeemed), and Expired (expiry date)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["active", "used", "expired"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleVoucherStatusFilter(s)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize"
                style={
                  voucherStatusFilter === s
                    ? { backgroundColor: NAVY, color: "white" }
                    : { backgroundColor: "#f3f4f6", color: "#374151" }
                }
              >
                {s}
                <span
                  className="ml-2 inline-flex min-w-[1.5rem] justify-center rounded-lg px-1.5 py-0.5 text-xs font-semibold"
                  style={
                    voucherStatusFilter === s
                      ? { backgroundColor: "rgba(255,255,255,0.2)" }
                      : { backgroundColor: "#e5e7eb", color: "#111827" }
                  }
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyDateRange}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: NAVY }}
            >
              Apply range
            </button>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={clearDateRange}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="lg:ml-auto rounded-xl bg-white border border-gray-200 px-4 py-2.5 min-w-[10rem]">
            <p className="text-xs text-gray-500">Redeemed in range</p>
            <p className="text-2xl font-bold text-gray-900">
              {dateFrom || dateTo
                ? redeemedInRange ?? "—"
                : "—"}
            </p>
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
          <p className="text-gray-500 text-sm">
            {dateFrom || dateTo
              ? `No ${voucherStatusFilter} vouchers in this date range`
              : `No ${voucherStatusFilter} vouchers exist yet`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {vouchers.map((voucher) => {
            const snap = voucher.offerSnapshot || {};
            const discountLabel =
              snap.discountType === "percentage"
                ? `${snap.discountValue}% off`
                : `Rs. ${snap.discountValue} off`;
            return (
              <div key={voucher._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${NAVY}15` }}
                    >
                      <Ticket className="h-5 w-5" style={{ color: NAVY }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{snap.title || "Voucher"}</p>
                      <p className="text-sm text-gray-500">
                        {voucher.user?.firstName} {voucher.user?.lastName}
                        {voucher.business?.name ? ` · ${voucher.business.name}` : ""} · {discountLabel}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {voucher.status === "used" && voucher.usedAt
                          ? `Redeemed ${new Date(voucher.usedAt).toLocaleString()}`
                          : voucher.status === "expired"
                            ? `Expired ${new Date(voucher.expiresAt).toLocaleDateString()}`
                            : `Issued ${new Date(voucher.issuedAt || voucher.createdAt).toLocaleDateString()} · Expires ${new Date(voucher.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        voucher.status === "active"
                          ? "bg-green-100 text-green-700"
                          : voucher.status === "used"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-red-100 text-red-500"
                      }`}
                    >
                      {voucher.status}
                    </span>
                    {voucher.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleOpenQR(voucher._id, snap.title)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: NAVY }}
                      >
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

      <div className="px-6 pb-4">
        <Pagination
          page={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          total={pagination?.total}
          pageSize={20}
          onChange={onPageChange}
          label="vouchers"
        />
      </div>

      {qrModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200"
            onClick={() => setQrModal(null)}
          >
            <div
              className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="font-bold text-gray-900 truncate flex-1 mr-4">
                  {qrModal.title || "Voucher QR"}
                </h3>
                <button
                  type="button"
                  onClick={() => setQrModal(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div ref={qrModalRef} className="p-4 bg-white border border-gray-100 rounded-2xl">
                <QRCode value={qrModal.qrValue} size={200} />
              </div>
              <p className="text-xs text-gray-400 text-center">
                This QR encodes the voucher ID and redemption token
              </p>
              <button
                type="button"
                onClick={downloadModalQR}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-colors w-full justify-center"
                style={{ backgroundColor: NAVY }}
              >
                <Download className="h-4 w-4" /> Download PNG
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default VoucherManagement;
