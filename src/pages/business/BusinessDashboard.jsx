import React, { useEffect, useState } from "react";
import { businessAPI } from "../../services/api";
import { Wallet, Users, Receipt } from "lucide-react";
import { discountLabel, formatRs } from "../../utils/billMath";
import { emptyMerchantMetrics, formatPercent, GrowthLine } from "../../components/business/MerchantMetrics";

const cardShadow = "shadow-[0_12px_30px_rgba(37,99,235,0.08)]";

export default function BusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(() => emptyMerchantMetrics());
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await businessAPI.getDashboard();
        setMetrics({ ...emptyMerchantMetrics(), ...data.data });
        setRecentScans(data.data.recentScans || []);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500 py-16 text-center">Loading dashboard...</p>;
  }

  const customers = metrics.customers || emptyMerchantMetrics().customers;
  const repeat = metrics.repeatVisits || emptyMerchantMetrics().repeatVisits;
  const showRepeat = metrics.showRepeatVisits !== false;
  const growth = metrics.growth || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-2">Monitor your business performance in real time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`rounded-3xl p-6 text-white bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] shadow-[0_16px_40px_rgba(37,99,235,0.28)]`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white/80">Total sales</p>
            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet size={18} />
            </span>
          </div>
          <p className="text-3xl font-bold mt-4">{formatRs(metrics.totalSales)}</p>
          <GrowthLine value={growth.sales} light />
          <p className="text-xs text-white/70 mt-2">Bill amount before discount</p>
        </div>

        <div className={`rounded-3xl bg-white p-6 ${cardShadow}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">Total visits</p>
            <span className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
              <Users size={18} />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">{metrics.totalVisits ?? 0}</p>
          <GrowthLine value={growth.visits} />
          <p className="text-xs text-gray-400 mt-2">Approved redemptions</p>
        </div>

        <div className={`rounded-3xl bg-white p-6 ${cardShadow}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">Average order value</p>
            <span className="w-10 h-10 rounded-full bg-[#2f6fed] text-white flex items-center justify-center">
              <Receipt size={18} />
            </span>
          </div>
          <p className="text-3xl font-bold text-[#2f6fed] mt-4">
            {metrics.averageOrderValue == null ? "—" : formatRs(metrics.averageOrderValue)}
          </p>
          <GrowthLine value={growth.averageOrderValue} />
          <p className="text-xs text-gray-400 mt-2">Sales before discount ÷ visits</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showRepeat ? "lg:grid-cols-2" : ""} gap-5 mt-5`}>
        <div className={`rounded-3xl bg-white p-6 ${cardShadow}`}>
          <p className="text-lg font-bold text-gray-900">Your eRuchi customers</p>
          <p className="text-3xl font-bold text-[#2f6fed] mt-3">{metrics.totalVisits ?? 0} visits</p>
          <div className="mt-4 space-y-1.5 text-sm text-gray-800">
            <p><span className="font-semibold">Students:</span> {customers.student?.percent ?? 0}%</p>
            <p><span className="font-semibold">Working professional:</span> {customers.workingProfessional?.percent ?? 0}%</p>
            <p><span className="font-semibold">Others:</span> {customers.others?.percent ?? 0}%</p>
          </div>
        </div>

        {showRepeat ? (
          <div className={`rounded-3xl bg-white p-6 ${cardShadow}`}>
            <p className="text-lg font-bold text-gray-900">Returning customers</p>
            <div className="mt-4 space-y-2 text-sm text-gray-800">
              <p><span className="font-semibold">First time visit:</span> {repeat.once ?? 0}</p>
              <p><span className="font-semibold">Second time visit:</span> {repeat.twice ?? 0}</p>
              <p><span className="font-semibold">More than 2 visits:</span> {repeat.moreThanTwice ?? 0}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">+{repeat.returnVisits ?? 0} return visits</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
        <MiniStat label="Gross revenue" value={formatRs(metrics.totalGrossRevenue)} hint="After discount" />
        <MiniStat label="Discounts" value={formatRs(metrics.totalDiscounts)} hint="Sales minus gross revenue" />
        <MiniStat
          label="Effective discount rate"
          value={formatPercent(metrics.effectiveDiscountRate)}
          hint="Discounts ÷ sales before discount"
        />
        <MiniStat label="Total scans" value={metrics.totalScans ?? 0} hint="All scan attempts" />
      </div>

      <div className={`mt-6 rounded-3xl bg-white ${cardShadow} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent scans</h2>
        </div>
        {recentScans.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No scan activity yet.</p>
        ) : (
          recentScans.map((scan, index) => (
            <div
              key={`${scan.voucherId || "scan"}-${index}`}
              className="px-6 py-4 border-b last:border-b-0 border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium text-gray-900">{scan.outcome || "Unknown"}</p>
                <p className="text-sm text-gray-500">
                  {scan.attemptedAt ? new Date(scan.attemptedAt).toLocaleString() : "—"}
                </p>
                {scan.outcome === "success" && scan.billAmountAfterDiscount != null && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {scan.billAmountTotal != null
                      ? `${formatRs(scan.billAmountTotal)} → ${formatRs(scan.billAmountAfterDiscount)}`
                      : formatRs(scan.billAmountAfterDiscount)}
                    {scan.offerSnapshot ? ` · ${discountLabel(scan.offerSnapshot)}` : ""}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                  scan.outcome === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {scan.outcome}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className={`rounded-3xl bg-white p-5 ${cardShadow}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );
}
