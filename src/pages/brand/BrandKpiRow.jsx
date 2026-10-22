import React from 'react';
import { formatValue, pointsDelta } from './brandMetrics';

function Kpi({ label, metric, item, current, previous }) {
  const delta = pointsDelta(current, previous);
  const unit = metric === 'spend_per_trip' ? ' Rs' : (metric === 'nps' || metric === 'purchase_frequency' || metric === 'cross_purchase_lift' ? '' : ' pts');
  return (
    <div data-reveal className="rounded-3xl border-l-4 border-blue-600 bg-white p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-blue-700">{formatValue(metric, item, current)}</p>
      <p className={`mt-1 text-xs ${delta == null || delta === 0 ? 'text-gray-400' : delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {delta == null ? 'No earlier week' : delta === 0 ? 'No change vs previous week' : `${delta > 0 ? '+' : ''}${delta}${unit} vs previous week`}
      </p>
    </div>
  );
}

export default function BrandKpiRow({ kpi }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Prompted awareness" metric="awareness_prompted" {...kpi('awareness_prompted')} />
      <Kpi label="Penetration" metric="penetration" {...kpi('penetration')} />
      <Kpi label="Trial" metric="trial" {...kpi('trial')} />
      <Kpi label="NPS" metric="nps" item="NPS" {...kpi('nps', 'NPS')} />
    </div>
  );
}
