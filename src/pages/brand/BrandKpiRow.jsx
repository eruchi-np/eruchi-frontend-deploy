import React, { forwardRef } from 'react';
import { formatValue, pointsDelta } from './brandMetrics';

function Kpi({ label, metric, item, current, previous, low = false, peers = [] }) {
  const delta = pointsDelta(current, previous);
  const unit = metric === 'spend_per_trip' ? ' Rs' : (metric === 'nps' || metric === 'purchase_frequency' || metric === 'cross_purchase_lift' ? '' : ' pts');
  return (
    <div data-reveal className="ri-card border-l-4 border-[var(--primary)] !rounded-[var(--r-card)] !shadow-[var(--shadow-pop)]">
      <p className="text-sm text-[var(--ink-3)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--primary-ink)]">{formatValue(metric, item, current)}</p>
      {low ? <p className="mt-1 text-xs text-[var(--warn-ink)]">Low base · directional only</p> : null}
      <p className={`mt-1 text-xs ${delta == null || delta === 0 ? 'text-[var(--ink-3)]' : delta > 0 ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
        {delta == null ? 'No earlier week' : delta === 0 ? 'No change vs previous week' : `${delta > 0 ? '+' : ''}${delta}${unit} vs previous week`}
      </p>
      {peers.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-2">
          {peers.map((peer) => (
            <li key={peer.name} className="flex items-center justify-between gap-2 text-xs text-[var(--ink-2)]">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: peer.color }} />
                <span className="truncate">{peer.name}</span>
              </span>
              <span className="shrink-0 tabular-nums font-medium text-[var(--ink)]">{formatValue(metric, item, peer.value)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MiniKpi({ label, metric, item, current }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">{label}</p>
      <p className="truncate text-sm font-bold tabular-nums text-[var(--ink)]">{formatValue(metric, item, current)}</p>
    </div>
  );
}

const BrandKpiRow = forwardRef(function BrandKpiRow({ kpi, compact = false }, ref) {
  if (compact) {
    return (
      <div ref={ref} className="grid min-w-0 grid-cols-4 gap-3">
        <MiniKpi label="Awareness" metric="awareness_prompted" {...kpi('awareness_prompted')} />
        <MiniKpi label="Penetration" metric="penetration" {...kpi('penetration')} />
        <MiniKpi label="Trial" metric="trial" {...kpi('trial')} />
        <MiniKpi label="NPS" metric="nps" item="NPS" {...kpi('nps', 'NPS')} />
      </div>
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Prompted awareness" metric="awareness_prompted" {...kpi('awareness_prompted')} />
      <Kpi label="Penetration" metric="penetration" {...kpi('penetration')} />
      <Kpi label="Trial" metric="trial" {...kpi('trial')} />
      <Kpi label="NPS" metric="nps" item="NPS" {...kpi('nps', 'NPS')} />
    </div>
  );
});

export default BrandKpiRow;
