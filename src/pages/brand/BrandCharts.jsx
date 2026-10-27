import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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

const HEIGHT = {
  sm: 250,
  md: 300,
  lg: 340,
  xl: 420,
};

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

export function yAxisTitle(metric, item = null) {
  if (metric === 'nps' && item === 'NPS') return 'NPS score';
  if (metric === 'spend_per_trip') return 'Rupees per trip';
  if (metric === 'purchase_frequency') return 'Purchases per month';
  if (metric === 'sensory_mean') return 'Score (1 to 5)';
  if (metric === 'cross_purchase_lift') return 'Lift';
  if (metric === 'cross_purchase_affinity') return '% of buyers';
  if (metric === 'brand_switching') return '% of people';
  if (metric === 'switch_reason') return '% of switchers';
  if (metric === 'occasion_usage') return '% of people';
  return '% of people';
}

const AXIS_LABEL = { fontSize: 11, fill: '#64748b' };

function YAxisLabel({ value }) {
  return (
    <Label
      value={value}
      angle={-90}
      position="insideLeft"
      offset={8}
      style={{ ...AXIS_LABEL, textAnchor: 'middle' }}
    />
  );
}

function XAxisLabel({ value }) {
  return (
    <Label value={value} position="insideBottom" offset={-2} style={{ ...AXIS_LABEL, textAnchor: 'middle' }} />
  );
}

function Tip({ active, payload, label, metric, item }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-gray-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value == null ? 'Not enough responses' : formatValue(metric, item, entry.value)}
          {entry.payload?.[`${entry.dataKey}Low`] || entry.payload?.low ? ' · low base (directional)' : ''}
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

function resolveHeight({ tall = false, wide = false, fit = false }) {
  if (fit) return HEIGHT.sm;
  if (wide && tall) return HEIGHT.xl;
  if (wide) return HEIGHT.lg;
  if (tall) return HEIGHT.lg;
  return HEIGHT.sm;
}

export function ChartCard({ title, note, children, tall = false, fit = false, wide = false, exportKey = null }) {
  const height = resolveHeight({ tall, wide, fit });
  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.props?.height != null) return child;
    return React.cloneElement(child, { height });
  });

  return (
    <section
      data-export-chart={exportKey || title}
      className={`min-w-0 max-w-full rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:p-6 ${wide ? 'lg:col-span-2' : ''}`}
    >
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {note ? <p className="mt-1 text-sm text-gray-500">{note}</p> : null}
      <div className="mt-4 w-full min-w-0 max-w-full">{content}</div>
    </section>
  );
}

export function SeriesChart({ data, metric, item, series, kind = 'line', height = HEIGHT.lg }) {
  const Chart = kind === 'area' ? AreaChart : LineChart;
  const Mark = kind === 'area' ? Area : Line;
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  const multi = (series || []).length > 1;
  const plot = multi ? Math.max(180, height - 28) : height;
  const yTitle = yAxisTitle(metric, item);
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <Chart data={data} margin={{ top: multi ? 8 : 12, right: 20, left: 28, bottom: 24 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} height={36}>
            <XAxisLabel value="Week" />
          </XAxis>
          <YAxis tick={{ fontSize: 11 }} width={48}>
            <YAxisLabel value={yTitle} />
          </YAxis>
          <Tooltip content={<Tip metric={metric} item={item} />} />
          {multi ? (
            <Legend
              verticalAlign="top"
              height={28}
              onClick={onLegendClick}
              wrapperStyle={{ cursor: 'pointer', fontSize: 12 }}
            />
          ) : null}
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
              isAnimationActive={false}
              dot={kind === 'line' ? (props) => <Dot {...props} color={entry.color} /> : false}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
      {multi ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
    </div>
  );
}

export function BrandBars({ data, metric, item, height = HEIGHT.sm }) {
  const [soloName, setSoloName] = React.useState(null);
  const signature = (data || []).map((row) => row.name).join('|');
  React.useEffect(() => setSoloName(null), [signature]);
  const shown = soloName ? (data || []).filter((row) => row.name === soloName) : (data || []);
  const pick = (name) => setSoloName((current) => (current === name ? null : name));
  const multi = (data || []).length > 1;
  const plot = multi ? Math.max(180, height - 28) : height;
  const barSize = shown.length <= 1 ? 56 : shown.length <= 3 ? 48 : 36;
  const yTitle = yAxisTitle(metric, item);
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <BarChart data={shown} margin={{ top: 12, right: 16, left: 28, bottom: 28 }} barCategoryGap="28%">
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            tick={multi ? <BrandAxisTick soloName={soloName} onPick={pick} /> : { fontSize: 11 }}
            height={44}
          >
            <XAxisLabel value="Brand" />
          </XAxis>
          <YAxis tick={{ fontSize: 11 }} width={48}>
            <YAxisLabel value={yTitle} />
          </YAxis>
          <Tooltip content={<Tip metric={metric} item={item} />} />
          <Bar
            dataKey="value"
            name="This week"
            barSize={barSize}
            maxBarSize={64}
            radius={[8, 8, 0, 0]}
            cursor={multi ? 'pointer' : 'default'}
            isAnimationActive={false}
            onClick={multi ? (entry) => pick(entry?.name) : undefined}
          >
            {shown.map((entry) => (
              <Cell key={entry.name} fill={entry.low ? LOW : entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {multi ? (
        <SoloHint active={Boolean(soloName)} label={soloName} onClear={() => setSoloName(null)} />
      ) : null}
    </div>
  );
}

export function GroupedBars({ data, metric, series, pageSize = 5, height = HEIGHT.lg }) {
  const [page, setPage] = React.useState(0);
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  const signature = `${(data || []).map((row) => row.name).join('|')}|${(series || []).map((entry) => entry.key).join('|')}`;
  React.useEffect(() => setPage(0), [signature]);
  const pages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = (data || []).slice(safePage * pageSize, safePage * pageSize + pageSize);
  const multi = (series || []).length > 1;
  const footer = (multi ? 28 : 0) + (pages > 1 ? 36 : 0);
  const plot = Math.max(180, height - footer);
  const yTitle = yAxisTitle(metric);
  const xTitle = metric === 'occasion_usage' ? 'Occasion' : metric === 'switch_reason' ? 'Reason' : 'Category';
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <BarChart data={slice} margin={{ top: multi ? 8 : 12, right: 8, left: 28, bottom: slice.length > 3 ? 36 : 28 }} barCategoryGap="18%">
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={slice.length > 3 ? -20 : 0}
            textAnchor={slice.length > 3 ? 'end' : 'middle'}
            height={slice.length > 3 ? 64 : 44}
          >
            <XAxisLabel value={xTitle} />
          </XAxis>
          <YAxis tick={{ fontSize: 11 }} width={48}>
            <YAxisLabel value={yTitle} />
          </YAxis>
          <Tooltip content={<Tip metric={metric} />} />
          {multi ? (
            <Legend
              verticalAlign="top"
              height={28}
              onClick={onLegendClick}
              wrapperStyle={{ cursor: 'pointer', fontSize: 12 }}
            />
          ) : null}
          {visible.map((entry) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.name}
              fill={entry.color}
              maxBarSize={48}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {multi ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
      {pages > 1 ? (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>{safePage + 1} of {pages}</span>
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

export function HorizontalBars({ data, metric, pageSize = 5, height = HEIGHT.sm }) {
  const [page, setPage] = React.useState(0);
  const signature = (data || []).map((row) => row.name).join('|');
  React.useEffect(() => setPage(0), [signature]);
  const pages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = (data || []).slice(safePage * pageSize, safePage * pageSize + pageSize);
  const footer = pages > 1 ? 36 : 0;
  const plot = Math.max(160, height - footer);
  const valueTitle = yAxisTitle(metric);
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <BarChart data={slice} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 28 }} barCategoryGap="18%">
          <CartesianGrid stroke="#eef2f7" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'auto']} height={36}>
            <XAxisLabel value={valueTitle} />
          </XAxis>
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
          <Tooltip content={<Tip metric={metric} />} />
          <Bar dataKey="value" name="Share" maxBarSize={28} radius={[0, 8, 8, 0]} isAnimationActive={false}>
            {slice.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.low ? LOW : (metric === 'cross_purchase_lift' ? (entry.value < 1 ? '#e11d48' : '#059669') : BAR_PALETTE[(safePage * pageSize + index) % BAR_PALETTE.length])}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {pages > 1 ? (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <span>{safePage + 1} of {pages}</span>
          <button type="button" className="rounded-full px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

export function SharePie({ data, metric, prominent = false, height = HEIGHT.lg }) {
  const slices = (data || []).filter((row) => row.value != null);
  if (!prominent) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={height} debounce={50}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius="40%"
            outerRadius="68%"
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((entry, index) => (
              <Cell key={entry.name} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<Tip metric={metric} />} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
      </div>
    );
  }

  const plot = Math.max(200, Math.round(height * 0.7));
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1 overflow-hidden">
        <ResponsiveContainer width="100%" height={plot} debounce={50}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="46%"
              outerRadius="78%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {slices.map((entry, index) => (
                <Cell key={entry.name} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<Tip metric={metric} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full shrink-0 gap-2 sm:grid-cols-2 lg:w-[22rem] lg:grid-cols-1">
        {slices.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-gray-700">
            <span className="inline-flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill || PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-gray-900">
              {formatValue(metric, null, entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SensoryRadar({ data, series, height = HEIGHT.lg }) {
  const { visible, soloKey, onLegendClick, setSoloKey } = useSoloSeries(series);
  const soloLabel = (series || []).find((entry) => entry.key === soloKey)?.name;
  const multi = (series || []).length > 1;
  const plot = multi ? Math.max(200, height - 28) : height;
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
          <Tooltip content={<Tip metric="sensory_mean" />} />
          {multi ? (
            <Legend
              verticalAlign="top"
              height={28}
              onClick={onLegendClick}
              wrapperStyle={{ cursor: 'pointer', fontSize: 12 }}
            />
          ) : null}
          {visible.map((entry) => (
            <Radar
              key={entry.key}
              dataKey={entry.key}
              name={entry.name}
              stroke={entry.color}
              fill={entry.color}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      {multi ? (
        <SoloHint active={Boolean(soloKey)} label={soloLabel} onClear={() => setSoloKey(null)} />
      ) : null}
    </div>
  );
}
