import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from 'recharts';
import { ArrowUp } from 'lucide-react';
import { weightedMovingAverage } from '../../../utils/healthChartMath';

/** Shared health-dashboard palette — navy brand + clear series hues. */
const COLORS = {
  navy: '#1B2A4A',
  bar: '#7DD3FC',
  barStrong: '#0EA5E9',
  line: '#1B2A4A',
  line2: '#0284C7',
  line3: '#059669',
  line4: '#7C3AED',
  wma: '#D97706',
  email: '#38BDF8',
  google: '#1B2A4A',
  impact: '#0D9488',
  series: ['#0EA5E9', '#1B2A4A', '#059669', '#D97706', '#7C3AED', '#DB2777'],
};

const rateFill = (pct) => {
  if (pct == null || Number.isNaN(Number(pct))) return COLORS.navy;
  const value = Number(pct);
  if (value >= 70) return '#059669';
  if (value >= 40) return '#0EA5E9';
  if (value >= 20) return '#D97706';
  return '#DC2626';
};

function AxisGutter({ label }) {
  if (!label) return null;
  return (
    <div className="relative w-8 shrink-0">
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[11px] text-gray-500">
        {label}
      </span>
    </div>
  );
}

function AxisFrame({ yLabel, yRightLabel, xLabel, children }) {
  return (
    <div>
      <div className="flex">
        <AxisGutter label={yLabel} />
        <div className="min-w-0 flex-1">{children}</div>
        <AxisGutter label={yRightLabel} />
      </div>
      {xLabel ? <p className="text-center text-[11px] text-gray-500 mt-1">{xLabel}</p> : null}
    </div>
  );
}

export function WeekChecklist({
  weeks,
  selected,
  onChange,
  defaultWeek,
  label = 'Weeks',
  getKey = (row) => row.week || row.key,
  getLabel = (row) => row.week || row.key,
}) {
  const rows = weeks || [];
  const toggle = (key) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
        {rows.map((row) => {
          const key = getKey(row);
          const checked = selected.has(key);
          return (
            <label
              key={key}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border cursor-pointer ${
                checked ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="rounded border-gray-300"
              />
              {getLabel(row)}
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          className="text-sky-800 hover:underline"
          onClick={() => onChange(new Set(defaultWeek ? [defaultWeek] : []))}
        >
          Latest finished week
        </button>
        <button
          type="button"
          className="text-sky-800 hover:underline"
          onClick={() => onChange(new Set(rows.map((row) => getKey(row))))}
        >
          All weeks
        </button>
        <button type="button" className="text-sky-800 hover:underline" onClick={() => onChange(new Set())}>
          Clear
        </button>
      </div>
    </div>
  );
}

export function useDefaultWeekSelection(weeks, getKey = (row) => row.week) {
  const keys = useMemo(() => (weeks || []).map(getKey).filter(Boolean), [weeks, getKey]);
  const defaultWeek = keys.length ? keys[keys.length - 1] : null;
  const [selected, setSelected] = useState(() => new Set(defaultWeek ? [defaultWeek] : []));
  useEffect(() => {
    setSelected(new Set(defaultWeek ? [defaultWeek] : []));
  }, [defaultWeek]);
  return { selected, setSelected, defaultWeek, keys };
}

export function HybridPeopleShareChart({
  rows,
  xKey,
  peopleKey = 'users',
  rateKey = 'rate',
  peopleLabel = 'People',
  rateLabel = 'Share',
  yLabel,
  yRightLabel,
  xLabel,
  showWma = true,
}) {
  const data = useMemo(() => {
    const chron = [...(rows || [])];
    const rates = chron.map((row) => (row[rateKey] == null ? null : Number(row[rateKey]) * 100));
    const wma = showWma ? weightedMovingAverage(rates) : [];
    return chron.map((row, index) => ({
      ...row,
      _people: row[peopleKey] ?? 0,
      _ratePct: rates[index],
      _wma: wma[index],
    }));
  }, [rows, peopleKey, rateKey, showWma]);

  if (!data.length) return <p className="text-sm text-gray-500">No rows yet.</p>;

  return (
    <AxisFrame yLabel={yLabel || peopleLabel} yRightLabel={yRightLabel || rateLabel} xLabel={xLabel}>
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            formatter={(value, name) => {
              if (name === rateLabel || name === '3-period avg') {
                return [value == null ? '–' : `${Math.round(Number(value) * 10) / 10}%`, name];
              }
              return [value, name];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="_people" name={peopleLabel} fill={COLORS.bar} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="_ratePct"
            name={rateLabel}
            stroke={COLORS.line}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.line, strokeWidth: 0 }}
            connectNulls
          />
          {showWma ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="_wma"
              name="3-period avg"
              stroke={COLORS.wma}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function StackedRegistrationsChart({ rows, xKey, yLabel = 'Accounts', xLabel, showWma = true }) {
  const data = useMemo(() => {
    const chron = (rows || []).map((row) => ({
      ...row,
      total: row.total ?? (Number(row.email || 0) + Number(row.google || 0)),
    }));
    const wma = showWma ? weightedMovingAverage(chron.map((row) => row.total)) : [];
    return chron.map((row, index) => ({
      ...row,
      _wma: wma[index],
    }));
  }, [rows, showWma]);
  if (!data.length) return <p className="text-sm text-gray-500">No rows yet.</p>;
  return (
    <AxisFrame yLabel={yLabel} xLabel={xLabel}>
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="email" name="Email" stackId="a" fill={COLORS.email} />
          <Bar dataKey="google" name="Google" stackId="a" fill={COLORS.google} radius={[4, 4, 0, 0]} />
          {showWma ? (
            <Line
              type="monotone"
              dataKey="_wma"
              name="3-period avg"
              stroke={COLORS.wma}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function SimpleBarChart({
  rows,
  xKey,
  yKey,
  label = 'Value',
  percentOnTop = false,
  totalForPercent = null,
  xLabel,
  yLabel,
  horizontal = false,
}) {
  const data = useMemo(() => {
    const total = totalForPercent ?? (rows || []).reduce((sum, row) => sum + (Number(row[yKey]) || 0), 0);
    return (rows || []).map((row) => ({
      ...row,
      _value: Number(row[yKey]) || 0,
      _pct: total ? ((Number(row[yKey]) || 0) / total) * 100 : 0,
    }));
  }, [rows, yKey, totalForPercent]);

  if (!data.length) return <p className="text-sm text-gray-500">No rows yet.</p>;
  const tilt = !horizontal && data.some((row) => String(row[xKey] || '').length > 8);
  const chartHeight = horizontal ? Math.max(220, data.length * 40) : undefined;

  return (
    <AxisFrame yLabel={yLabel || (horizontal ? undefined : label)} xLabel={xLabel || (horizontal ? label : undefined)}>
    <div className={horizontal ? 'w-full' : 'h-72 w-full'} style={horizontal ? { height: chartHeight } : undefined}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: horizontal ? 8 : 24, right: horizontal ? 48 : 12, left: horizontal ? 8 : 0, bottom: tilt ? 12 : 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey={xKey} width={188} tick={{ fontSize: 11 }} interval={0} />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11 }}
                interval={0}
                angle={tilt ? -24 : 0}
                textAnchor={tilt ? 'end' : 'middle'}
                height={tilt ? 56 : 30}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            </>
          )}
          <Tooltip
            formatter={(value, name, props) => {
              if (percentOnTop) {
                return [`${value} (${Math.round(props.payload._pct * 10) / 10}%)`, label];
              }
              return [value, name];
            }}
          />
          <Bar
            dataKey="_value"
            name={label}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            label={percentOnTop ? {
              position: horizontal ? 'right' : 'top',
              formatter: (value, entry) => `${Math.round((entry?.payload?._pct || 0) * 10) / 10}%`,
              fontSize: 11,
              fill: '#4b5563',
            } : false}
          >
            {data.map((row, index) => (
              <Cell
                key={`${row[xKey]}-${index}`}
                fill={percentOnTop ? rateFill(row._pct) : COLORS.series[index % COLORS.series.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function MultiSeriesHybridChart({
  rows,
  xKey,
  bars = [],
  lines = [],
  showWmaFor,
  yLabel = 'Count',
  yRightLabel,
  yRightUnit,
  xLabel,
}) {
  const data = useMemo(() => {
    const chron = [...(rows || [])];
    const wmaKey = showWmaFor ? `_wma_${showWmaFor}` : null;
    const wma = showWmaFor ? weightedMovingAverage(chron.map((row) => row[showWmaFor])) : [];
    return chron.map((row, index) => ({
      ...row,
      ...(wmaKey ? { [wmaKey]: wma[index] } : {}),
    }));
  }, [rows, showWmaFor]);

  if (!data.length) return <p className="text-sm text-gray-500">No rows yet.</p>;
  const barPalette = [COLORS.bar, COLORS.barStrong, '#A78BFA', '#F9A8D4'];
  const linePalette = [COLORS.line, COLORS.line2, COLORS.line3, COLORS.line4, COLORS.wma];
  const rightTitle = yRightLabel || (showWmaFor ? '3-period average' : undefined);

  return (
    <AxisFrame yLabel={yLabel} yRightLabel={rightTitle} xLabel={xLabel}>
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit={yRightUnit} />
          <Tooltip
            formatter={(value, name) => {
              if (name === '3-period avg' || String(name).includes('%')) {
                return [value == null ? '–' : Math.round(Number(value) * 10) / 10, name];
              }
              return [value == null ? '–' : value, name];
            }}
          />
          <Legend />
          {bars.map((series, index) => (
            <Bar
              key={series.key}
              yAxisId={series.axis || 'left'}
              dataKey={series.key}
              name={series.label}
              fill={series.color || barPalette[index % barPalette.length]}
              fillOpacity={series.opacity ?? 0.8}
              radius={[4, 4, 0, 0]}
            />
          ))}
          {lines.map((series, index) => (
            <Line
              key={series.key}
              yAxisId={series.axis || 'right'}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color || linePalette[index % linePalette.length]}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              connectNulls
            />
          ))}
          {showWmaFor ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={`_wma_${showWmaFor}`}
              name="3-period avg"
              stroke={COLORS.wma}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function HorizontalRateChart({ rows, yKey, rateKey = 'rate', label = 'Rate', xLabel, yLabel }) {
  const data = useMemo(
    () => (rows || []).map((row) => ({
      ...row,
      _ratePct: row[rateKey] == null ? 0 : Number(row[rateKey]) * 100,
    })),
    [rows, rateKey]
  );
  if (!data.length) return <p className="text-sm text-gray-500">No rows yet.</p>;
  return (
    <AxisFrame yLabel={yLabel} xLabel={xLabel || label}>
    <div className="w-full" style={{ height: Math.max(220, data.length * 36) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <YAxis type="category" dataKey={yKey} width={120} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${Math.round(Number(value) * 10) / 10}%`, label]} />
          <Bar dataKey="_ratePct" name={label} radius={[0, 4, 4, 0]}>
            {data.map((row, index) => (
              <Cell key={`${row[yKey]}-${index}`} fill={rateFill(row._ratePct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function ImpactWeightChart({ rows }) {
  const data = useMemo(() => [...(rows || [])].sort((a, b) => a.weight - b.weight), [rows]);
  if (!data.length) return null;
  return (
    <AxisFrame yLabel="Survey trait" xLabel="Relative impact on response rate">
    <div className="w-full" style={{ height: Math.max(180, data.length * 40) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="variable" width={140} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [Math.round(Number(value) * 1000) / 1000, 'Relative Impact Weight']} />
          <Bar dataKey="weight" name="Relative Impact Weight" radius={[0, 4, 4, 0]}>
            {data.map((row, index) => (
              <Cell key={`${row.variable}-${index}`} fill={COLORS.series[index % COLORS.series.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </AxisFrame>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg text-white p-3"
      style={{ backgroundColor: '#1B2A4A' }}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
