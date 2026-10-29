import React, { useEffect, useMemo, useState } from 'react';
import {
  Layer,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  useChartWidth,
} from 'recharts';
import { weekLabel } from './brandMetrics';

const WON = '#3b82f6';
const LOST = '#f87171';
const KEPT = '#93c5fd';
const OTHER = '#64748b';
const MUTED = '#cbd5e1';

function mergeMatrixRows(rows) {
  const merged = new Map();
  rows.forEach((row) => {
    const key = `${row.brand}→${row.item}`;
    const prev = merged.get(key);
    const value = Number(row.value) || 0;
    if (!prev) {
      merged.set(key, { ...row, value });
      return;
    }
    prev.value += value;
    if (row.base != null && prev.base == null) prev.base = row.base;
  });
  return [...merged.values()];
}

export function buildSwitchFlow(rows, wave, onlyBrands = null) {
  const flowRows = (rows || []).filter((row) => (
    row.metric === 'brand_switch_flow'
    && (!wave || row.wave_start === wave)
  ));
  if (!flowRows.length) return null;

  const waves = [...new Set(flowRows.map((row) => row.wave_start))].sort();
  const useWave = wave && waves.includes(wave) ? wave : waves[waves.length - 1];
  let matrixRows = flowRows.filter((row) => row.wave_start === useWave);
  const allow = Array.isArray(onlyBrands) && onlyBrands.length
    ? new Set(onlyBrands.filter(Boolean))
    : null;
  if (allow) {
    // Keep selected brands; fold every other brand into Others so the diagram
    // always reflects the current selection instead of vanishing or staying full-category.
    matrixRows = mergeMatrixRows(
      matrixRows
        .map((row) => {
          const from = allow.has(row.brand) ? row.brand : 'Others';
          const to = allow.has(row.item) ? row.item : 'Others';
          return { ...row, brand: from, item: to };
        })
        .filter((row) => !(row.brand === 'Others' && row.item === 'Others')),
    );
  }
  const brands = [...new Set([
    ...(allow ? [...allow] : []),
    ...matrixRows.map((row) => row.brand),
    ...matrixRows.map((row) => row.item),
  ].filter(Boolean))];

  // Prefer Others last; keep stable visual order by outgoing volume.
  const ordered = brands
    .map((name) => ({
      name,
      out: matrixRows.filter((row) => row.brand === name).reduce((sum, row) => sum + (Number(row.value) || 0), 0),
    }))
    .sort((a, b) => {
      if (a.name === 'Others') return 1;
      if (b.name === 'Others') return -1;
      return b.out - a.out;
    })
    .map((entry) => entry.name);

  if (ordered.length < 2) return null;

  const nodes = [
    ...ordered.map((name) => ({ name, brand: name, side: 'from' })),
    ...ordered.map((name) => ({ name, brand: name, side: 'to' })),
  ];
  const links = [];
  ordered.forEach((from, fromIndex) => {
    ordered.forEach((to, toIndex) => {
      const hit = matrixRows.find((row) => row.brand === from && row.item === to);
      const value = Number(hit?.value);
      if (!Number.isFinite(value) || value <= 0) return;
      links.push({
        source: fromIndex,
        target: ordered.length + toIndex,
        value,
        from,
        to,
        kind: from === to ? 'kept' : 'moved',
      });
    });
  });

  if (!links.length) return null;

  const fromShare = Object.fromEntries(ordered.map((name) => [
    name,
    Math.round(links.filter((link) => link.from === name).reduce((sum, link) => sum + link.value, 0)),
  ]));
  const toShare = Object.fromEntries(ordered.map((name) => [
    name,
    Math.round(links.filter((link) => link.to === name).reduce((sum, link) => sum + link.value, 0)),
  ]));
  const base = matrixRows[0]?.base || null;

  return {
    wave: useWave,
    brands: ordered,
    fromShare,
    toShare,
    base,
    data: { nodes, links },
  };
}

/** Won-from / lost-to by competitor for one focus brand, from the flow matrix. */
export function buildNetGains(rows, wave, focusBrand, onlyBrands = null) {
  if (!focusBrand) return null;
  const flowRows = (rows || []).filter((row) => (
    row.metric === 'brand_switch_flow'
    && (!wave || row.wave_start === wave)
  ));
  if (!flowRows.length) return null;

  const waves = [...new Set(flowRows.map((row) => row.wave_start))].sort();
  const useWave = wave && waves.includes(wave) ? wave : waves[waves.length - 1];
  let matrixRows = flowRows.filter((row) => row.wave_start === useWave);
  const allow = Array.isArray(onlyBrands) && onlyBrands.length
    ? new Set(onlyBrands.filter(Boolean))
    : null;
  if (allow) {
    if (!allow.has(focusBrand)) return null;
    matrixRows = mergeMatrixRows(
      matrixRows
        .map((row) => {
          const from = allow.has(row.brand) ? row.brand : 'Others';
          const to = allow.has(row.item) ? row.item : 'Others';
          return { ...row, brand: from, item: to };
        })
        .filter((row) => !(row.brand === 'Others' && row.item === 'Others')),
    );
  }

  const competitors = [...new Set([
    ...matrixRows.map((row) => row.brand),
    ...matrixRows.map((row) => row.item),
  ])]
    .filter((name) => name && name !== focusBrand);

  const data = competitors.map((name) => {
    const won = Number(matrixRows.find((row) => row.brand === name && row.item === focusBrand)?.value) || 0;
    const lost = Number(matrixRows.find((row) => row.brand === focusBrand && row.item === name)?.value) || 0;
    return {
      name,
      won: Math.round(won * 10) / 10,
      lost: Math.round(lost * 10) / 10,
      lostNeg: -Math.round(lost * 10) / 10,
      net: Math.round((won - lost) * 10) / 10,
    };
  })
    .filter((row) => row.won > 0 || row.lost > 0)
    .sort((a, b) => (Math.abs(b.net) - Math.abs(a.net)) || ((b.won + b.lost) - (a.won + a.lost)));

  if (!data.length) return null;
  return {
    wave: useWave,
    focusBrand,
    base: matrixRows[0]?.base || null,
    data,
  };
}

function linkColor(link, focus) {
  if (!focus) {
    return link.from === link.to ? KEPT : OTHER;
  }
  if (link.from === focus && link.to === focus) return KEPT;
  if (link.to === focus) return WON;
  if (link.from === focus) return LOST;
  return MUTED;
}

function linkOpacity(link, focus) {
  if (!focus) return link.from === link.to ? 0.6 : 0.55;
  if (link.from === focus || link.to === focus) return 0.75;
  return 0.28;
}

function FlowLink(props) {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    payload,
  } = props;
  const focus = props.focusBrand;
  const d = `
    M${sourceX},${sourceY}
    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
  `;
  return (
    <path
      d={d}
      fill="none"
      stroke={linkColor(payload, focus)}
      strokeWidth={Math.max(linkWidth, 1.5)}
      strokeOpacity={linkOpacity(payload, focus)}
    />
  );
}

function FlowNode({ x, y, width, height, payload, index, focusBrand, onFocus, fromShare, toShare }) {
  const containerWidth = useChartWidth();
  if (containerWidth == null) return null;
  const brand = payload.brand || payload.name;
  const isRight = payload.side === 'to' || x > containerWidth / 2;
  const share = isRight ? toShare[brand] : fromShare[brand];
  const active = !focusBrand || focusBrand === brand;
  const fill = active ? '#64748b' : '#cbd5e1';

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={active ? 1 : 0.45}
        radius={2}
        style={{ cursor: 'pointer' }}
        onClick={() => onFocus?.(brand)}
      />
      <text
        x={isRight ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill={active ? '#0f172a' : '#94a3b8'}
        fontSize={12}
        fontWeight={focusBrand === brand ? 700 : 500}
        style={{ cursor: 'pointer' }}
        onClick={() => onFocus?.(brand)}
      >
        {brand}
      </text>
      <text
        x={isRight ? x - 8 : x + width + 8}
        y={y + height / 2 + 14}
        textAnchor={isRight ? 'end' : 'start'}
        dominantBaseline="middle"
        fill={active ? '#64748b' : '#94a3b8'}
        fontSize={11}
        style={{ cursor: 'pointer' }}
        onClick={() => onFocus?.(brand)}
      >
        {share != null ? `${share}%` : ''}
      </text>
    </Layer>
  );
}

function FlowTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  if (item.from != null && item.to != null) {
    const label = item.from === item.to ? 'Kept' : `${item.from} → ${item.to}`;
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-gray-600">{item.value}% of panel</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-gray-900">{item.brand || item.name}</p>
    </div>
  );
}

export default function BrandSwitchFlow({
  rows,
  wave,
  defaultFocus = '',
  onlyBrands = null,
  height = 420,
  onBrandClick = null,
}) {
  const brandKey = Array.isArray(onlyBrands) ? onlyBrands.filter(Boolean).join('|') : '';
  const scopedBrands = brandKey ? brandKey.split('|') : null;
  const flow = useMemo(
    () => buildSwitchFlow(rows, wave, scopedBrands),
    [rows, wave, brandKey],
  );
  const [focusBrand, setFocusBrand] = useState('');

  useEffect(() => {
    setFocusBrand('');
  }, [flow?.wave, brandKey]);

  // Selected/compare scopes need 1+ brands; solo brand view uses full category (onlyBrands null).
  if (scopedBrands && scopedBrands.length < 1) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Select a brand to see the switching flow.
      </p>
    );
  }

  if (!flow) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        No brand-flow matrix for the selected brands this week. Import `brand_switch_flow` rows (from brand → to brand) to show it.
      </p>
    );
  }

  const activeFocus = focusBrand || (flow.brands.includes(defaultFocus) ? defaultFocus : '');
  const fromLabel = weekLabel(flow.wave).replace('Week of ', 'Main brand before ');
  const toLabel = weekLabel(flow.wave).replace('Week of ', 'Main brand in ');

  const onNodeBrand = (brand) => {
    if (brand === 'Others') return;
    if (typeof onBrandClick === 'function') {
      onBrandClick(brand);
      return;
    }
    setFocusBrand((current) => (current === brand ? '' : brand));
  };

  const plot = Math.max(220, height - 72);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WON }} /> Won</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOST }} /> Lost</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KEPT }} /> Kept</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OTHER }} /> Between others</span>
        {flow.base ? <span className="ml-auto">n = {flow.base} panelists in both waves</span> : null}
      </div>
      <div className="mb-1 flex justify-between text-xs font-medium uppercase tracking-wide text-gray-400">
        <span>{fromLabel}</span>
        <span>{toLabel}</span>
      </div>
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <Sankey
          data={flow.data}
          nodeWidth={14}
          nodePadding={28}
          iterations={64}
          margin={{ top: 8, right: 110, bottom: 8, left: 110 }}
          linkCurvature={0.5}
          sort={false}
          node={(props) => (
            <FlowNode
              {...props}
              focusBrand={activeFocus}
              onFocus={onNodeBrand}
              fromShare={flow.fromShare}
              toShare={flow.toShare}
            />
          )}
          link={(props) => <FlowLink {...props} focusBrand={activeFocus} />}
        >
          <Tooltip content={<FlowTip />} />
        </Sankey>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-gray-400">
        {typeof onBrandClick === 'function'
          ? 'Click a brand name to open that brand alone.'
          : activeFocus
            ? `Focusing ${activeFocus}. Blue bands are gains; coral bands are losses. Click the brand again to clear.`
            : 'Click a brand name to highlight its won, lost, and kept flows.'}
      </p>
    </div>
  );
}
