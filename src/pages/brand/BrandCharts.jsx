import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatValue } from './brandMetrics';

export const YOU = '#2563eb';
export const ALL = '#14b8a6';
export const LOW = '#4d7c0f';
export const COMPARE_COLORS = ['#64748b', '#0f766e', '#7c3aed', '#0891b2', '#db2777'];
export const BRAND_COLORS = [
  '#2563eb', '#0f766e', '#7c3aed', '#0891b2', '#db2777',
  '#4f46e5', '#65a30d', '#be185d', '#64748b', '#9333ea',
];
const PIE_COLORS = ['#7c3aed', '#0f766e', '#db2777', '#0891b2', '#65a30d', '#4f46e5', '#be185d'];
const BAR_PALETTE = ['#7c3aed', '#0f766e', '#db2777', '#0891b2', '#65a30d', '#4f46e5', '#9333ea', '#be185d', '#0e7490', '#64748b'];

export function colorForBrand(index) {
  return BRAND_COLORS[index % BRAND_COLORS.length];
}

export function seriesFor(compares, focusLabel = 'You') {
  return [
    { key: 'you', name: focusLabel, color: YOU },
    ...compares.slice(0, 5).map((name, index) => ({
      key: `c${index}`,
      name,
      color: COMPARE_COLORS[index],
    })),
  ];
}

export function seriesForBrands(brands) {
  return (brands || []).map((name, index) => ({
    key: index === 0 ? 'you' : `c${index - 1}`,
    name,
    color: colorForBrand(index),
  }));
}

function Tip({ active, payload, label, metric, item }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-gray-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value == null ? 'Not enough responses' : formatValue(metric, item, entry.value)}
          {entry.payload?.[`${entry.dataKey}Low`] || entry.payload?.low ? ' · low base' : ''}
        </p>
      ))}
    </div>
  );
}

function Dot({ cx, cy, payload, dataKey, color }) {
  if (cx == null || cy == null) return null;
  const low = payload?.[`${dataKey}Low`];
  return <circle cx={cx} cy={cy} r={low ? 5 : 3.5} fill={low ? LOW : color} stroke="#fff" strokeWidth={1} />;
}

function useSoloSeries(series) {
  const [soloKey, setSoloKey] = React.useState(null);
  const signature = (series || []).map((entry) => entry.key).join('|');
  React.useEffect(() => setSoloKey(null), [signature]);
  const visible = soloKey
    ? (series || []).filter((entry) => entry.key === soloKey)
    : (series || []);
  const onLegendClick = (payload) => {
    const key = payload?.dataKey
      || (series || []).find((entry) => entry.name === payload?.value)?.key
      || null;
    if (!key) return;
    setSoloKey((current) => (current === key ? null : key));
  };
  return { visible, soloKey, onLegendClick, setSoloKey };
}

function SoloHint({ active, label, onClear }) {
  if (!active) {
    return <p className="mt-2 text-[11px] text-gray-400">Click a brand name to show only that brand.</p>;
  }
  return (
    <p className="mt-2 text-[11px] text-gray-500">
      Showing <span className="font-medium text-gray-800">{label}</span>
      {' · '}
      <button type="button" className="underline hover:text-gray-800" onClick={onClear}>Show all</button>
    </p>
  );
}

function BrandAxisTick({ x, y, payload, soloName, onPick }) {
  const active = soloName === payload.value;
  const muted = soloName && !active;
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill={muted ? '#94a3b8' : '#334155'}
      fontSize={11}
      fontWeight={active ? 600 : 400}
      style={{ cursor: 'pointer' }}
      onClick={() => onPick(payload.value)}
    >
      {payload.value}
    </text>
  );
}

export function ChartCard({ title, note, children, tall = false, fit = false, wide = false }) {
  const frame = fit
    ? 'mt-4'
    : wide
      ? 'relative mt-4 aspect-[2.2/1] min-h-80 max-h-[34rem]'
      : `relative mt-4 ${tall ? 'h-96' : 'h-64'}`;
  return (
    <section data-reveal className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:p-6 ${wide ? 'lg:col-span-2' : ''}`}>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {note ? <p className="mt-1 text-sm text-gray-500">{note}</p> : null}
      <div className={frame}>
        {fit ? children : <div className="absolute inset-0">{children}</div>}
      </div>
    </section>
  );
}

export function SeriesChart({ data, metric, item, series, kind = 'line' }) {
  const Chart = kind === 'area' ? AreaChart : LineChart;
  const Mark = kind === 'area' ? Area : Line;
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} width={36} />
            <Tooltip content={<Tip metric={metric} item={item} />} />
            <Legend onClick={onLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
            {visible.map((entry) => (
              <Mark
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.name}
                stroke={entry.color}
                fill={entry.color}
                fillOpacity={0.18}
                strokeWidth={2.5}
                connectNulls={false}
                dot={kind === 'line' ? (props) => <Dot {...props} color={entry.color} /> : false}
              />
            ))}
          </Chart>
        </ResponsiveContainer>
      </div>
      {(series || []).length > 1 ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
    </div>
  );
}

export function BrandBars({ data, metric, item }) {
  const [soloName, setSoloName] = React.useState(null);
  const signature = (data || []).map((row) => row.name).join('|');
  React.useEffect(() => setSoloName(null), [signature]);
  const shown = soloName ? (data || []).filter((row) => row.name === soloName) : (data || []);
  const pick = (name) => setSoloName((current) => (current === name ? null : name));
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shown} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              tick={<BrandAxisTick soloName={soloName} onPick={pick} />}
              height={36}
            />
            <YAxis tick={{ fontSize: 11 }} width={36} />
            <Tooltip content={<Tip metric={metric} item={item} />} />
            <Bar
              dataKey="value"
              name="This week"
              radius={[8, 8, 0, 0]}
              cursor="pointer"
              onClick={(entry) => pick(entry?.name)}
            >
              {shown.map((entry) => (
                <Cell key={entry.name} fill={entry.low ? LOW : entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(data || []).length > 1 ? (
        <SoloHint active={Boolean(soloName)} label={soloName} onClear={() => setSoloName(null)} />
      ) : null}
    </div>
  );
}

export function GroupedBars({ data, metric, series, pageSize = 5, fill = false }) {
  const [page, setPage] = React.useState(0);
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  const signature = `${(data || []).map((row) => row.name).join('|')}|${(series || []).map((entry) => entry.key).join('|')}`;
  React.useEffect(() => setPage(0), [signature]);
  const pages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = (data || []).slice(safePage * pageSize, safePage * pageSize + pageSize);
  return (
    <div className={fill ? 'flex h-full flex-col' : ''}>
      <div className={fill ? 'min-h-0 flex-1' : 'h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={slice} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={slice.length > 3 ? -20 : 0} textAnchor={slice.length > 3 ? 'end' : 'middle'} height={slice.length > 3 ? 56 : 30} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<Tip metric={metric} />} />
            <Legend onClick={onLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
            {visible.map((entry) => (
              <Bar key={entry.key} dataKey={entry.key} name={entry.name} fill={entry.color} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(series || []).length > 1 ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>{safePage + 1} of {pages}</span>
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

export function HorizontalBars({ data, metric, pageSize = 5, fill = false }) {
  const [page, setPage] = React.useState(0);
  const signature = (data || []).map((row) => row.name).join('|');
  React.useEffect(() => setPage(0), [signature]);
  const pages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = (data || []).slice(safePage * pageSize, safePage * pageSize + pageSize);
  return (
    <div className={fill ? 'flex h-full flex-col' : ''}>
      <div className={fill ? 'min-h-0 flex-1' : 'h-64'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={slice} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f7" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
            <Tooltip content={<Tip metric={metric} />} />
            <Bar dataKey="value" name="Share" radius={[0, 8, 8, 0]}>
              {slice.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.low ? LOW : (metric === 'cross_purchase_lift' ? (entry.value < 1 ? '#e11d48' : '#059669') : BAR_PALETTE[(safePage * pageSize + index) % BAR_PALETTE.length])}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>{safePage + 1} of {pages}</span>
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

export function SharePie({ data, metric }) {
  const slices = (data || []).filter((row) => row.value != null);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={slices} dataKey="value" nameKey="name" innerRadius="38%" outerRadius="62%" paddingAngle={2}>
          {slices.map((entry, index) => (
            <Cell key={entry.name} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<Tip metric={metric} />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SensoryRadar({ data, series }) {
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
            <Tooltip content={<Tip metric="sensory_mean" />} />
            <Legend onClick={onLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
            {visible.map((entry) => (
              <Radar key={entry.key} dataKey={entry.key} name={entry.name} stroke={entry.color} fill={entry.color} fillOpacity={0.18} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {(series || []).length > 1 ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
    </div>
  );
}
