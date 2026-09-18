import React from "react";
import Pagination from "../../../components/ui/Pagination";

const OUTCOMES = ["", "success", "already_used", "expired", "wrong_business", "invalid_token"];

const outcomeClass = (outcome) => {
  if (outcome === "success") return "bg-emerald-50 text-emerald-700";
  if (outcome === "expired" || outcome === "already_used") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
};

const ScanLogView = ({
  logs,
  loading,
  outcomeFilter,
  onOutcomeFilter,
  pagination,
  onPageChange,
  NAVY,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Scan log</h2>
            <p className="text-sm text-gray-500">Redemption attempts across all businesses</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((s) => (
              <button
                key={s || "all"}
                type="button"
                onClick={() => onOutcomeFilter(s)}
                className="px-3 py-2 rounded-xl text-sm font-medium capitalize"
                style={
                  outcomeFilter === s
                    ? { backgroundColor: NAVY, color: "white" }
                    : { backgroundColor: "#f3f4f6", color: "#374151" }
                }
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: NAVY }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No scan attempts found.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log, idx) => (
            <div key={`${log.voucherId}-${log.attemptedAt}-${idx}`} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{log.offerTitle || "Voucher scan"}</p>
                  <p className="text-sm text-gray-500">
                    {log.userName || "User"} {log.userEmail ? `· ${log.userEmail}` : ""} · {log.businessName || "Business"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.attemptedAt ? new Date(log.attemptedAt).toLocaleString() : "—"}
                    {log.billAmountTotal != null && ` · Bill Rs. ${log.billAmountTotal}`}
                    {log.discountAmount != null && ` · Discount Rs. ${log.discountAmount}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${outcomeClass(log.outcome)}`}>
                  {(log.outcome || "").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pb-4">
        <Pagination
          page={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          total={pagination?.total}
          pageSize={50}
          onChange={onPageChange}
          label="scans"
        />
      </div>
    </div>
  );
};

export default ScanLogView;
