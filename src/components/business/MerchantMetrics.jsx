import { formatRs, discountLabel } from "../../utils/billMath";

export const emptyMerchantMetrics = () => ({
  totalScans: 0,
  totalVisits: 0,
  totalSales: 0,
  totalGrossRevenue: 0,
  totalDiscounts: 0,
  averageOrderValue: null,
  conversion: null,
  redeemedThisMonth: 0,
  liveVouchers: 0,
  growth: {
    visits: null,
    sales: null,
    averageOrderValue: null,
    conversion: null,
  },
  customers: {
    student: { count: 0, percent: 0 },
    workingProfessional: { count: 0, percent: 0 },
    others: { count: 0, percent: 0 },
  },
  repeatVisits: {
    once: 0,
    twice: 0,
    moreThanTwice: 0,
    returnVisits: 0,
  },
  offers: [],
  showRepeatVisits: true,
});

export function formatPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const rounded = Math.round(Number(value) * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

export function GrowthLine({ value, light = false }) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const rounded = Math.round(Number(value) * 10) / 10;
  const positive = rounded > 0;
  const negative = rounded < 0;
  const color = light
    ? "text-white/80"
    : positive
      ? "text-green-600"
      : negative
        ? "text-red-600"
        : "text-gray-400";
  const abs = Math.abs(rounded);
  const amount = Number.isInteger(abs) ? `${abs}%` : `${abs.toFixed(1)}%`;
  const sign = positive ? "+" : negative ? "-" : "";
  return (
    <p className={`text-xs mt-1 font-medium ${color}`}>
      {sign}{amount} vs last month
    </p>
  );
}

function MetricCard({ label, value, hint, growth }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <GrowthLine value={growth} />
      {hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  );
}

export function OfferMetrics({ issued = 0, redeemed = 0, conversion = null }) {
  return (
    <p className="text-xs text-gray-500 mt-1">
      Issued {issued} · Redeemed {redeemed} · Conversion {formatPercent(conversion)}
    </p>
  );
}

export default function MerchantMetrics({ metrics, showRepeatVisits = true }) {
  const growth = metrics.growth || {};
  const customers = metrics.customers || emptyMerchantMetrics().customers;
  const repeat = metrics.repeatVisits || emptyMerchantMetrics().repeatVisits;
  const showRepeat = showRepeatVisits && metrics.showRepeatVisits !== false;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Total Visits"
          value={metrics.totalVisits ?? 0}
          growth={growth.visits}
          hint="Approved redemptions"
        />
        <MetricCard
          label="Average Order Value"
          value={metrics.averageOrderValue == null ? "—" : formatRs(metrics.averageOrderValue)}
          growth={growth.averageOrderValue}
          hint="Sales before discount ÷ visits"
        />
        <MetricCard
          label="Conversion"
          value={formatPercent(metrics.conversion)}
          growth={growth.conversion}
          hint="Visits ÷ vouchers purchased"
        />
        <MetricCard
          label="Total Sales"
          value={formatRs(metrics.totalSales)}
          growth={growth.sales}
          hint="Sum of bill amounts before discount"
        />
        <MetricCard
          label="Total Gross Revenue"
          value={formatRs(metrics.totalGrossRevenue)}
          hint="Sum of bill amounts after discount"
        />
        <MetricCard
          label="Total Discounts"
          value={formatRs(metrics.totalDiscounts)}
          hint="Total sales minus gross revenue"
        />
        <MetricCard
          label="Total Scans"
          value={metrics.totalScans ?? 0}
          hint="All scan attempts"
        />
        <MetricCard
          label="Redeemed this Month"
          value={metrics.redeemedThisMonth ?? 0}
          hint="Approved redemptions this month"
        />
        <MetricCard
          label="Live Vouchers"
          value={metrics.liveVouchers ?? 0}
          hint="Active offers"
        />
      </div>

      <div className={`grid grid-cols-1 ${showRepeat ? "sm:grid-cols-2" : ""} gap-4 mt-4`}>
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalVisits ?? 0} visits</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p>Student: {customers.student?.percent ?? 0}%</p>
            <p>Working professional: {customers.workingProfessional?.percent ?? 0}%</p>
            <p>Others: {customers.others?.percent ?? 0}%</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share of approved redemptions</p>
        </div>

        {showRepeat ? (
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-500">Repeat visits</p>
            <div className="mt-3 space-y-1 text-sm text-gray-800">
              <p>1st visit: <span className="font-semibold">{repeat.once ?? 0}</span></p>
              <p>2nd visit: <span className="font-semibold">{repeat.twice ?? 0}</span></p>
              <p>More than 2: <span className="font-semibold">{repeat.moreThanTwice ?? 0}</span></p>
            </div>
            <p className="text-xs text-gray-400 mt-2">{repeat.returnVisits ?? 0} return visits</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function OfferMetricsList({ offers = [] }) {
  if (!offers.length) {
    return <p className="text-sm text-gray-500">No voucher offers yet.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {offers.map((offer) => (
        <div key={offer.offerId} className="p-4 border-b last:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 break-words">{offer.title}</p>
              <p className="text-sm text-gray-500">{discountLabel(offer)}</p>
              <OfferMetrics
                issued={offer.issued}
                redeemed={offer.redeemed}
                conversion={offer.conversion}
              />
            </div>
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                offer.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {offer.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
