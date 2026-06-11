import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ChevronRight, Loader2 } from "lucide-react";
import { voucherAPI } from "../../services/api";

const TABS = ["active", "used", "expired"];

const statusColors = {
  active: "bg-green-100 text-green-700",
  used: "bg-gray-100 text-gray-500",
  expired: "bg-red-100 text-red-500",
};

export default function VouchersCard() {
  const [activeTab, setActiveTab] = useState("active");
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVouchers = async () => {
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
    fetchVouchers();
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">My Vouchers</p>
          <p className="text-xs text-gray-400 mt-0.5">Your redeemed vouchers</p>
        </div>
        <button
          onClick={() => navigate('/vouchers')}
          className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          View all
        </button>
      </div>
      <div className="flex gap-2 px-5 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="text-gray-400 animate-spin" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-8 px-5">
          <Ticket size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No {activeTab} vouchers</p>
          {activeTab === "active" && (
            <button
              onClick={() => navigate("/shop")}
              className="mt-3 px-5 py-2 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              Browse Shop
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {vouchers.slice(0, 5).map((v) => {
            const snap = v.offerSnapshot || {};
            const discountLabel =
              snap.discountType === "percentage"
                ? `${snap.discountValue}% off`
                : `Rs. ${snap.discountValue} off`;
            return (
              <button
                key={v._id}
                onClick={() => navigate(`/vouchers/${v._id}`)}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Ticket size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {snap.title || "Voucher"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{discountLabel}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[v.status]}`}
                >
                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}