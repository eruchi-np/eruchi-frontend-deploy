import { useEffect, useState } from "react";
import { adminAPI } from "../../../services/api";
import MerchantMetrics, { OfferMetricsList } from "../../../components/business/MerchantMetrics";

export default function BusinessDashboardModal({ business, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await adminAPI.getBusinessDashboard(business._id);
        if (!cancelled) setMetrics(data.data);
      } catch {
        if (!cancelled) setError("Failed to load this merchant's dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [business._id]);

  const name = metrics?.business?.brandName || metrics?.business?.name || business.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900">Dashboard</h3>
            <p className="text-sm text-gray-500 truncate">{name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading dashboard…</p>
          ) : error ? (
            <p className="text-sm text-red-600 py-8 text-center">{error}</p>
          ) : (
            <>
              <MerchantMetrics metrics={metrics} showRepeatVisits />
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Voucher offers</h4>
              <OfferMetricsList offers={metrics.offers || []} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
