import { useEffect, useState } from "react";
import { Ticket, BadgePercent, UserRound } from "lucide-react";
import { businessAPI } from "../../services/api";
import { discountLabel } from "../../utils/billMath";
import { emptyMerchantMetrics, formatPercent, GrowthLine } from "../../components/business/MerchantMetrics";

const cardShadow = "shadow-[0_12px_30px_rgba(37,99,235,0.08)]";

export default function BusinessVouchers() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(() => emptyMerchantMetrics());

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await businessAPI.getDashboard();
        setMetrics({ ...emptyMerchantMetrics(), ...data.data });
      } catch (error) {
        console.error("Failed to load vouchers", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500 py-16 text-center">Loading vouchers...</p>;
  }

  const offers = metrics.offers || [];
  const growth = metrics.growth || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Vouchers</h1>
        <p className="text-sm text-gray-500 mt-2">Offers for your store are managed by eRuchi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Ticket size={18} />} label="Live vouchers" value={metrics.liveVouchers ?? 0} hint="Active offers" />
        <StatCard
          icon={<BadgePercent size={18} />}
          label="Redeemed this month"
          value={metrics.redeemedThisMonth ?? 0}
          hint="Approved redemptions"
          growth={growth.visits}
        />
        <StatCard
          icon={<UserRound size={18} />}
          label="Conversion"
          value={formatPercent(metrics.conversion)}
          hint="Visits ÷ vouchers purchased"
          growth={growth.conversion}
          valueClass="text-[#2f6fed]"
        />
      </div>

      <div className={`mt-6 rounded-3xl bg-white ${cardShadow} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Active vouchers</h2>
        </div>
        {offers.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No voucher offers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="px-6 py-3 font-medium">Voucher</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Ruchi Credits</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Redeemed</th>
                  <th className="px-4 py-3 font-medium">Conversion</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.offerId} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-gray-900">{offer.title}</td>
                    <td className="px-4 py-4 text-gray-600">{discountLabel(offer)}</td>
                    <td className="px-4 py-4 text-gray-900">{offer.creditsRequired ?? 0}</td>
                    <td className="px-4 py-4">{offer.issued ?? 0}</td>
                    <td className="px-4 py-4">{offer.redeemed ?? 0}</td>
                    <td className="px-4 py-4">{formatPercent(offer.conversion)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          offer.status === "active"
                            ? "bg-[#2f6fed] text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {offer.status === "active" ? "Live" : "Paused"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint, growth, valueClass = "text-gray-900" }) {
  return (
    <div className={`rounded-3xl bg-white p-6 ${cardShadow}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
          {icon}
        </span>
      </div>
      <p className={`text-3xl font-bold mt-4 ${valueClass}`}>{value}</p>
      <GrowthLine value={growth} />
      <p className="text-xs text-gray-400 mt-2">{hint}</p>
    </div>
  );
}
