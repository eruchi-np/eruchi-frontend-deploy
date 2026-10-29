import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
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
  ReferenceLine,
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

function resolveHeight({ tall = false, wide = false, fit = false }) {
  if (fit) return HEIGHT.sm;
  if (wide && tall) return HEIGHT.xl;
  if (wide) return HEIGHT.lg;
  if (tall) return HEIGHT.lg;
  return HEIGHT.sm;
}

export function ChartCard({ title, note, howToRead = '', children, tall = false, fit = false, wide = false, exportKey = null }) {
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
      {howToRead ? (
        <details className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700">How to read this</summary>
          <p className="mt-1.5 leading-relaxed">{howToRead}</p>
        </details>
      ) : null}
      <div className="mt-4 w-full min-w-0 max-w-full">{content}</div>
    </section>
  );
}

export function SeriesChart({ data, metric, item, series, kind = 'line', height = HEIGHT.lg, onBrandClick = null }) {
  const Chart = kind === 'area' ? AreaChart : LineChart;
  const Mark = kind === 'area' ? Area : Line;
  const visible = series || [];
  const multi = visible.length > 1;
  const plot = multi ? Math.max(180, height - 28) : height;
  const yTitle = yAxisTitle(metric, item);
  const clickable = typeof onBrandClick === 'function';
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
              wrapperStyle={{ fontSize: 12, cursor: clickable ? 'pointer' : undefined }}
              onClick={clickable ? (entry) => {
                const name = entry?.value;
                if (name && name !== 'Category') onBrandClick(name);
              } : undefined}
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
              cursor={clickable && entry.name !== 'Category' ? 'pointer' : 'default'}
              onClick={clickable && entry.name !== 'Category' ? () => onBrandClick(entry.name) : undefined}
              dot={kind === 'line' ? (props) => <Dot {...props} color={entry.color} /> : false}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

function NpsEndLabel({ x, y, width, height: barH, value }) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const left = (Number(x) || 0) + (Number(width) || 0) + 8;
  const top = (Number(y) || 0) + (Number(barH) || 0) / 2;
  return (
    <text x={left} y={top} dy={4} fill="#0f172a" fontSize={12} fontWeight={600}>
      {`NPS ${Math.round(Number(value))}`}
    </text>
  );
}

/** Horizontal 100% stack: promoters / passives / detractors, with Net NPS at the bar end. */
export function NpsStackedBars({ data, height = HEIGHT.lg, onBrandClick = null }) {
  const rows = data || [];
  const plot = Math.max(180, Math.min(520, 56 + rows.length * 44));
  const chartH = height != null ? Math.max(plot, height - 28) : plot;
  const clickable = typeof onBrandClick === 'function';
  const pick = (payload) => {
    const name = payload?.name || payload?.payload?.name;
    if (name) onBrandClick(name);
  };
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={chartH} debounce={50}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 72, left: 8, bottom: 28 }}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke="#eef2f7" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} height={36}>
            <XAxisLabel value="% of buyers" />
          </XAxis>
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload;
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="mb-1 font-medium text-gray-900">{label}</p>
                  {payload.map((entry) => (
                    <p key={entry.dataKey} style={{ color: entry.color || entry.fill }}>
                      {entry.name}: {entry.value == null ? '—' : `${Math.round(entry.value)}%`}
                    </p>
                  ))}
                  <p className="mt-1 font-semibold text-gray-900">
                    NPS: {row?.nps == null ? '—' : Math.round(row.nps)}
                    {row?.low ? ' · low base (directional)' : ''}
                  </p>
                </div>
              );
            }}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="promoters" name="Promoters" stackId="nps" fill="#059669" maxBarSize={28} isAnimationActive={false} cursor={clickable ? 'pointer' : 'default'} onClick={clickable ? pick : undefined} />
          <Bar dataKey="passives" name="Passives" stackId="nps" fill="#94a3b8" maxBarSize={28} isAnimationActive={false} cursor={clickable ? 'pointer' : 'default'} onClick={clickable ? pick : undefined} />
          <Bar dataKey="detractors" name="Detractors" stackId="nps" fill="#e11d48" maxBarSize={28} radius={[0, 6, 6, 0]} isAnimationActive={false} cursor={clickable ? 'pointer' : 'default'} onClick={clickable ? pick : undefined}>
            <LabelList dataKey="nps" content={<NpsEndLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Diverging bars: lost (left) vs won (right), net label at the end. */
export function NetGainsBars({ data, height = HEIGHT.lg, onBrandClick = null }) {
  const rows = data || [];
  const max = Math.max(1, ...rows.flatMap((row) => [row.won || 0, row.lost || 0]));
  const plot = Math.max(180, Math.min(480, 48 + rows.length * 40));
  const chartH = height != null ? Math.max(plot, height - 28) : plot;
  const clickable = typeof onBrandClick === 'function';
  const pick = (payload) => {
    const name = payload?.name || payload?.payload?.name;
    if (name) onBrandClick(name);
  };
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={chartH} debounce={50}>
        <BarChart
          data={rows}
          layout="vertical"
          stackOffset="sign"
          margin={{ top: 8, right: 64, left: 8, bottom: 28 }}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke="#eef2f7" horizontal={false} />
          <XAxis
            type="number"
            domain={[-max, max]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${Math.abs(value)}`}
            height={36}
          >
            <XAxisLabel value="% of panel" />
          </XAxis>
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <ReferenceLine x={0} stroke="#cbd5e1" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload;
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="mb-1 font-medium text-gray-900">{label}</p>
                  <p style={{ color: '#f87171' }}>Lost to: {row?.lost ?? 0}%</p>
                  <p style={{ color: '#3b82f6' }}>Won from: {row?.won ?? 0}%</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    Net: {row?.net > 0 ? '+' : ''}{row?.net ?? 0} pts
                  </p>
                </div>
              );
            }}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="lostNeg" name="Lost to" fill="#f87171" stackId="net" maxBarSize={22} isAnimationActive={false} cursor={clickable ? 'pointer' : 'default'} onClick={clickable ? pick : undefined} />
          <Bar dataKey="won" name="Won from" fill="#3b82f6" stackId="net" maxBarSize={22} isAnimationActive={false} cursor={clickable ? 'pointer' : 'default'} onClick={clickable ? pick : undefined}>
            <LabelList
              dataKey="net"
              position="right"
              formatter={(value) => (value == null ? '' : `net ${value > 0 ? '+' : ''}${value}`)}
              style={{ fill: '#0f172a', fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Opposing reasons: focus brand (right) vs category ALL (left). */
export function SwitchReasonBars({ data, focusLabel = 'This brand', height = HEIGHT.lg }) {
  const rows = (data || []).map((row) => ({
    name: row.name,
    focus: row.focus,
    all: row.all,
    focusPlot: row.focus == null ? 0 : row.focus,
    allNeg: row.all == null ? 0 : -row.all,
  }));
  const max = Math.max(1, ...rows.flatMap((row) => [row.focusPlot || 0, Math.abs(row.allNeg) || 0]));
  const plot = Math.max(180, Math.min(520, 48 + rows.length * 42));
  const chartH = height != null ? Math.max(plot, height - 28) : plot;
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={chartH} debounce={50}>
        <BarChart
          data={rows}
          layout="vertical"
          stackOffset="sign"
          margin={{ top: 8, right: 24, left: 8, bottom: 28 }}
          barCategoryGap="18%"
        >
          <CartesianGrid stroke="#eef2f7" horizontal={false} />
          <XAxis
            type="number"
            domain={[-max, max]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${Math.abs(value)}`}
            height={36}
          >
            <XAxisLabel value="% of switchers" />
          </XAxis>
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
          <ReferenceLine x={0} stroke="#cbd5e1" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload;
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="mb-1 font-medium text-gray-900">{label}</p>
                  <p style={{ color: '#f87171' }}>
                    Category: {row?.all == null ? '—' : `${Math.round(row.all)}%`}
                  </p>
                  <p style={{ color: '#3b82f6' }}>
                    {focusLabel}: {row?.focus == null ? '—' : `${Math.round(row.focus)}%`}
                  </p>
                </div>
              );
            }}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="allNeg" name="Category" fill="#f87171" stackId="reason" maxBarSize={18} isAnimationActive={false} />
          <Bar dataKey="focusPlot" name={focusLabel} fill="#3b82f6" stackId="reason" maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BrandBars({ data, metric, item, height = HEIGHT.sm, onBrandClick = null }) {
  const shown = data || [];
  const multi = shown.length > 1;
  const crowded = shown.length > 6;
  const plot = multi ? Math.max(180, height - 28) : height;
  const barSize = shown.length <= 1 ? 56 : shown.length <= 3 ? 48 : crowded ? 28 : 36;
  const yTitle = yAxisTitle(metric, item);
  const clickable = typeof onBrandClick === 'function';
  const chart = (
    <ResponsiveContainer width="100%" height={plot} debounce={50}>
      <BarChart
        data={shown}
        margin={{ top: 12, right: 16, left: 28, bottom: crowded ? 48 : 28 }}
        barCategoryGap={crowded ? '12%' : '28%'}
      >
        <CartesianGrid stroke="#eef2f7" vertical={false} />
        <XAxis
          dataKey="name"
          interval={0}
          tick={{ fontSize: crowded ? 10 : 11 }}
          height={crowded ? 64 : 44}
          angle={crowded ? -28 : 0}
          textAnchor={crowded ? 'end' : 'middle'}
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
          maxBarSize={crowded ? 40 : 64}
          radius={[8, 8, 0, 0]}
          isAnimationActive={false}
          cursor={clickable ? 'pointer' : 'default'}
          onClick={clickable ? (payload) => {
            const name = payload?.name || payload?.payload?.name;
            if (name) onBrandClick(name);
          } : undefined}
        >
          {shown.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.low ? LOW : (entry.fill || (metric === 'cross_purchase_lift'
                ? (entry.value < 1 ? '#e11d48' : '#059669')
                : BAR_PALETTE[index % BAR_PALETTE.length]))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  if (!crowded) {
    return <div className="w-full min-w-0 max-w-full">{chart}</div>;
  }
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto">
      <div style={{ minWidth: Math.max(640, shown.length * 56) }}>{chart}</div>
    </div>
  );
}

export function GroupedBars({ data, metric, series, pageSize = 5, height = HEIGHT.lg, onBrandClick = null }) {
  const [page, setPage] = React.useState(0);
  const visible = series || [];
  const signature = `${(data || []).map((row) => row.name).join('|')}|${visible.map((entry) => entry.key).join('|')}`;
  React.useEffect(() => setPage(0), [signature]);
  const pages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = (data || []).slice(safePage * pageSize, safePage * pageSize + pageSize);
  const multi = visible.length > 1;
  const footer = (multi ? 28 : 0) + (pages > 1 ? 36 : 0);
  const plot = Math.max(180, height - footer);
  const yTitle = yAxisTitle(metric);
  const xTitle = metric === 'occasion_usage' ? 'Occasion' : metric === 'switch_reason' ? 'Reason' : 'Brand';
  const clickable = typeof onBrandClick === 'function' && metric !== 'occasion_usage' && metric !== 'switch_reason';
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
          {multi ? <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} /> : null}
          {visible.map((entry) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.name}
              fill={entry.color}
              maxBarSize={48}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              cursor={clickable ? 'pointer' : 'default'}
              onClick={clickable ? (payload) => {
                const name = payload?.name || payload?.payload?.name;
                if (name) onBrandClick(name);
              } : undefined}
            />
          ))}
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

export function HorizontalGroupedBars({ data, metric, series, height = HEIGHT.lg }) {
  const visible = series || [];
  const rows = data || [];
  const multi = visible.length > 1;
  const plot = Math.max(200, height - (multi ? 28 : 0));
  const valueTitle = yAxisTitle(metric);
  return (
    <div className="w-full min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <BarChart data={rows} layout="vertical" margin={{ top: multi ? 8 : 12, right: 24, left: 8, bottom: 28 }} barCategoryGap="18%">
          <CartesianGrid stroke="#eef2f7" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'auto']} height={36}>
            <XAxisLabel value={valueTitle} />
          </XAxis>
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <Tooltip content={<Tip metric={metric} />} />
          {multi ? <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} /> : null}
          {visible.map((entry) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.name}
              fill={entry.color}
              maxBarSize={22}
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
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
  const visible = series || [];
  const multi = visible.length > 1;
  const plot = multi ? Math.max(200, height - 28) : height;
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={plot} debounce={50}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
          <Tooltip content={<Tip metric="sensory_mean" />} />
          {multi ? <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} /> : null}
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
    </div>
  );
}
