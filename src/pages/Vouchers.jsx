import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ChevronRight, ArrowLeft } from "lucide-react";
import { voucherAPI } from "../services/api";

const TABS = ["active", "used", "expired"];

const statusColors = {
  active: "bg-green-100 text-green-700",
  used: "bg-gray-100 text-gray-500",
  expired: "bg-red-100 text-red-500",
};

function getRelativeExpiry(expiresAt) {
  const now = new Date();
  const diff = new Date(expiresAt) - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

function VoucherListItem({ voucher, onClick }) {
  const snap = voucher.offerSnapshot || {};
  const discountLabel =
    snap.discountType === "percentage"
      ? `${snap.discountValue}% off`
      : `Rs. ${snap.discountValue} off`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <Ticket size={20} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate text-sm">
          {snap.title || "Voucher"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{discountLabel}</p>
        {voucher.status === "active" && (
          <p className="text-xs text-green-600 mt-1">
            {getRelativeExpiry(voucher.expiresAt)}
          </p>
        )}
        {voucher.status === "used" && voucher.usedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Used on {new Date(voucher.usedAt).toLocaleDateString()}
          </p>
        )}
        {voucher.status === "expired" && (
          <p className="text-xs text-red-400 mt-1">
            Expired on {new Date(voucher.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState("active");
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await voucherAPI.getMyVouchers({ status: activeTab });
        setVouchers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch vouchers", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeTab]);

  return (
    <div
      className="min-h-screen bg-gray-50 pb-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1
          className="text-gray-900 mb-6"
          style={{ fontSize: "clamp(28px,5vw,36px)", fontWeight: 300, letterSpacing: "-0.02em" }}
        >
          My Vouchers
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <Ticket size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No {activeTab} vouchers yet.
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => navigate("/shop")}
                className="mt-4 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Browse Vouchers
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {vouchers.map((v) => (
              <VoucherListItem
                key={v._id}
                voucher={v}
                onClick={() => navigate(`/vouchers/${v._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}