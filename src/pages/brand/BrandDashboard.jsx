import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { brandAPI } from '../../services/api';
import {
  findRow,
  hasMetric,
  monthKey,
  monthsOf,
  peersOf,
  shown,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import {
  GROUPS,
  inSpan,
  itemsAt,
  nearestWave,
  ranked,
  snapshot,
  trend,
} from './brandDashboardMetrics';
import BrandKpiRow from './BrandKpiRow';
import { BrandSearch, CompareSearch } from './BrandPicker';
import useBrandMetrics from './useBrandMetrics';
import {
  ALL,
  BrandBars,
  ChartCard,
  COMPARE_COLORS,
  HorizontalBars,
  LOW,
  SensoryRadar,
  SeriesChart,
  SharePie,
  YOU,
  seriesFor,
} from './BrandCharts';

export default function BrandDashboard({ client, viewer = null }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const {
    rows,
    meta,
    booting,
    sectionLoading,
    loaded,
    page,
    setPage,
    wave,
    setWave,
    error,
    pageReady,
  } = useBrandMetrics(viewer);
  const [compares, setCompares] = useState([]);
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  useEffect(() => {
    const el = panelRef.current;
    if (!el || booting) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      });
    }, el);
    return () => ctx.revert();
  }, [page, booting, pageReady]);

  const brand = viewer?.brand || meta?.brand || client?.brand || '';
  const categoryLabel = viewer?.categoryLabel || meta?.categoryLabel || client?.categoryLabel || '';
  const waves = useMemo(() => wavesOf(rows), [rows]);
  const months = useMemo(() => monthsOf(waves), [waves]);
  useEffect(() => {
    if (!months.length) return;
    const start = waves.length > 16 ? monthKey(waves[waves.length - 12]) : months[0];
    setFromMonth((current) => current || start);
    setToMonth((current) => current || months[months.length - 1]);
  }, [months, waves]);
  const peers = useMemo(() => peersOf(rows, brand), [rows, brand]);
  const waveIndex = waves.indexOf(wave);
  const previousWave = waveIndex > 0 ? waves[waveIndex - 1] : null;
  const pageId = GROUPS[page].id;

  const goTo = (next) => {
    const index = Math.min(GROUPS.length - 1, Math.max(0, next));
    setPage(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = async () => {
    await brandAPI.logout({ skipErrorToast: true, skipAuthRedirect: true });
    navigate('/brand/login', { replace: true });
  };

  const kpi = (metric, item = null) => ({
    current: shown(findRow(rows, metric, brand, wave, item)),
    previous: previousWave ? shown(findRow(rows, metric, brand, previousWave, item)) : null,
  });

  const occasionData = itemsAt(rows, 'occasion_usage', 'ALL')
    .map((item) => {
      const row = findRow(rows, 'occasion_usage', 'ALL', wave, item);
      return { name: item, value: shown(row), low: row?.status === 'low_base' };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);

  const reasonData = itemsAt(rows, 'switch_reason', 'ALL')
    .map((item) => {
      const row = findRow(rows, 'switch_reason', 'ALL', wave, item);
      return { name: item, value: shown(row), low: row?.status === 'low_base' };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);

  const attributes = itemsAt(rows, 'sensory_mean', brand);
  const sensorySeries = [
    { key: 'you', name: 'You', color: YOU },
    { key: 'all', name: 'Category', color: ALL },
    ...compares.map((name, index) => ({ key: `c${index}`, name, color: COMPARE_COLORS[index] })),
  ];
  const sensoryData = attributes.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'sensory_mean', brand, wave, item)),
      all: shown(findRow(rows, 'sensory_mean', 'ALL', wave, item)),
    };
    compares.forEach((name, index) => {
      point[`c${index}`] = shown(findRow(rows, 'sensory_mean', name, wave, item));
    });
    return point;
  });

  const toggleCompare = (name) => {
    setCompares((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= 5) return current;
      return [...current, name];
    });
  };

  const firstWave = waves[0] || '';
  const lastWave = waves[waves.length - 1] || '';
  const firstMonth = months[0] || '';
  const lastMonth = months[months.length - 1] || '';

  return (
    <div className="brand-dashboard min-h-screen overflow-visible bg-[#f4f7fb] text-gray-900">
      <aside className="flex w-full flex-col gap-5 overflow-visible border-b border-gray-200 bg-white px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {viewer ? (
              <div className="mb-3 flex flex-col gap-2">
                <button type="button" onClick={() => navigate('/admin')} className="self-start rounded-full px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
                  Admin
                </button>
                <div className="flex rounded-full bg-slate-100 p-1">
                  {viewer.categories.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => viewer.onCategory(item.category)}
                      className={`flex-1 rounded-full px-2 py-1 text-xs font-medium ${item.category === viewer.category ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{categoryLabel}</p>
            )}
            {viewer ? (
              <BrandSearch brands={viewer.brands} value={brand} onChange={viewer.onBrand} />
            ) : (
              <h1 className="text-2xl font-bold">{brand}</h1>
            )}
            {viewer ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">{categoryLabel}</p> : null}
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {GROUPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium ${index === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-slate-100'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-3 text-xs text-gray-500">
          <div>
            <p>Week</p>
            <div className="mt-1 flex items-center gap-1">
              <button type="button" className="h-9 w-8 shrink-0 rounded-lg border border-gray-200 text-sm disabled:opacity-40" disabled={waveIndex <= 0} onClick={() => setWave(waves[waveIndex - 1])} aria-label="Previous week">‹</button>
              <input
                type="date"
                className="h-9 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-900"
                value={wave}
                min={firstWave || undefined}
                max={lastWave || undefined}
                onChange={(event) => {
                  const next = nearestWave(waves, event.target.value);
                  if (next) setWave(next);
                }}
              />
              <button type="button" className="h-9 w-8 shrink-0 rounded-lg border border-gray-200 text-sm disabled:opacity-40" disabled={waveIndex < 0 || waveIndex >= waves.length - 1} onClick={() => setWave(waves[waveIndex + 1])} aria-label="Next week">›</button>
            </div>
          </div>
          <label>
            From
            <input
              type="month"
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              value={fromMonth}
              min={firstMonth || undefined}
              max={(toMonth && toMonth < lastMonth ? toMonth : lastMonth) || undefined}
              onChange={(event) => {
                const next = event.target.value;
                if (!next || (firstMonth && next < firstMonth) || (lastMonth && next > lastMonth)) return;
                setFromMonth(next);
              }}
            />
          </label>
          <label>
            To
            <input
              type="month"
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              value={toMonth}
              min={(fromMonth && fromMonth > firstMonth ? fromMonth : firstMonth) || undefined}
              max={lastMonth || undefined}
              onChange={(event) => {
                const next = event.target.value;
                if (!next || (firstMonth && next < firstMonth) || (lastMonth && next > lastMonth)) return;
                setToMonth(next);
              }}
            />
          </label>
          <CompareSearch peers={peers} compares={compares} onToggle={toggleCompare} />
          {compares.length ? (
            <div className="flex flex-wrap gap-1">
              {compares.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCompare(name)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: COMPARE_COLORS[index] }}
                >
                  {name} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> You</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ALL }} /> Category</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOW }} /> Low base</span>
        </div>
        {viewer ? null : (
          <button
            type="button"
            onClick={logout}
            className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-[#e11d48] px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(225,29,72,0.28)]"
          >
            Logout
          </button>
        )}
      </aside>

      <main ref={panelRef} className="min-w-0 space-y-8 px-4 py-6 lg:ml-72">
        {meta?.source === 'sample' ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            These figures are a sample, so you can click through the dashboard before live metrics arrive.
          </p>
        ) : null}

        <BrandKpiRow kpi={kpi} />

        {pageReady && pageId === 'awareness' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Awareness</h2>
          <p className="text-sm text-gray-500">People who selected the brand when shown the list.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="This week" note={compares.length ? `${brand} and ${compares.join(', ')}` : brand}>
              <BrandBars data={snapshot(rows, 'awareness_prompted', brand, compares, wave)} metric="awareness_prompted" />
            </ChartCard>
            <ChartCard title="First mention" note="The first brand they named, this week.">
              <BrandBars data={snapshot(rows, 'awareness_unprompted', brand, compares, wave, 'first_mention')} metric="awareness_unprompted" item="first_mention" />
            </ChartCard>
          </div>
          <ChartCard title="Prompted awareness over the weeks" wide>
            <SeriesChart data={trend(rows, 'awareness_prompted', brand, compares, null, fromMonth, toMonth)} metric="awareness_prompted" series={seriesFor(compares)} />
          </ChartCard>
          {hasMetric(rows, 'awareness_unprompted') ? (
            <ChartCard title="Any mention" note="Named the brand without a list." wide>
              <SeriesChart kind="area" data={trend(rows, 'awareness_unprompted', brand, compares, 'any_mention', fromMonth, toMonth)} metric="awareness_unprompted" series={seriesFor(compares)} />
            </ChartCard>
          ) : null}
        </div>}

        {pageReady && pageId === 'buying' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Buying</h2>
          <ChartCard title="Penetration" note="Bought in the past 3 months." wide>
            <SeriesChart kind="area" data={trend(rows, 'penetration', brand, compares, null, fromMonth, toMonth)} metric="penetration" series={seriesFor(compares)} />
          </ChartCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Trial this week" note="Ever tried the brand.">
              <BrandBars data={snapshot(rows, 'trial', brand, compares, wave)} metric="trial" />
            </ChartCard>
            <ChartCard title="Purchases per month" note="Among people whose main brand is this one.">
              <BrandBars data={snapshot(rows, 'purchase_frequency', brand, compares, wave)} metric="purchase_frequency" />
            </ChartCard>
            <ChartCard title="Rupees per trip" note={wave ? weekLabel(wave) : ''} wide>
              <BrandBars data={snapshot(rows, 'spend_per_trip', brand, compares, wave)} metric="spend_per_trip" />
            </ChartCard>
          </div>
          <ChartCard title="Share of wallet" note="Share of their category spend that goes to this brand." wide>
            <SeriesChart kind="area" data={trend(rows, 'share_of_wallet', brand, compares, null, fromMonth, toMonth)} metric="share_of_wallet" series={seriesFor(compares)} />
          </ChartCard>
        </div>}

        {pageReady && pageId === 'occasions' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Occasions</h2>
          <p className="text-sm text-gray-500">People can pick more than one, so these can add up past 100%.</p>
          <ChartCard title={wave ? weekLabel(wave) : 'Occasions'} wide>
            <HorizontalBars data={occasionData} metric="occasion_usage" fill />
          </ChartCard>
        </div>}

        {pageReady && pageId === 'switching' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Switching</h2>
          <p className="text-sm text-gray-500">These two shares will not add up to 100%.</p>
          <ChartCard title="Over the weeks" wide>
            <SeriesChart
              kind="area"
              data={wavesOf(rows).filter((item) => inSpan(item, fromMonth, toMonth)).map((item) => ({
                label: weekLabel(item).replace('Week of ', ''),
                switched: shown(findRow(rows, 'brand_switching', 'ALL', item, 'switched_brand')),
                reduced: shown(findRow(rows, 'brand_switching', 'ALL', item, 'lapsed_reduced_or_stopped')),
              }))}
              metric="brand_switching"
              series={[
                { key: 'switched', name: 'Switched brand', color: '#7c3aed' },
                { key: 'reduced', name: 'Reduced or stopped', color: '#0891b2' },
              ]}
            />
          </ChartCard>
          <ChartCard title="Why people switched" note="Share of switchers. These should add up to about 100%." wide>
            <SharePie data={reasonData} metric="switch_reason" />
          </ChartCard>
        </div>}

        {pageReady && pageId === 'loyalty' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Loyalty</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="NPS this week" note={wave ? weekLabel(wave) : ''}>
              <BrandBars data={snapshot(rows, 'nps', brand, compares, wave, 'NPS')} metric="nps" item="NPS" />
            </ChartCard>
            <ChartCard title="Promoters, passives, detractors" note="Your buyers this week.">
              <SharePie
                metric="nps"
                data={[
                  { name: 'Promoters', value: shown(findRow(rows, 'nps', brand, wave, 'promoters_pct')), fill: '#059669' },
                  { name: 'Passives', value: shown(findRow(rows, 'nps', brand, wave, 'passives_pct')), fill: '#94a3b8' },
                  { name: 'Detractors', value: shown(findRow(rows, 'nps', brand, wave, 'detractors_pct')), fill: '#e11d48' },
                ]}
              />
            </ChartCard>
          </div>
          {hasMetric(rows, 'cross_purchase_affinity') ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Also bought</h3>
              <p className="text-sm text-gray-500">Other brands these buyers also bought. The pair is not the same in reverse.</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Share of your buyers" note={wave ? weekLabel(wave) : ''} fit>
                  <HorizontalBars data={ranked(rows, 'cross_purchase_affinity', brand, wave)} metric="cross_purchase_affinity" />
                </ChartCard>
                <ChartCard title="Lift" note="1 means no extra link between the brands." fit>
                  <HorizontalBars data={ranked(rows, 'cross_purchase_lift', brand, wave)} metric="cross_purchase_lift" />
                </ChartCard>
              </div>
            </div>
          ) : null}
        </div>}

        {pageReady && pageId === 'sensory' && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Sensory</h2>
          <p className="text-sm text-gray-500">Average score from 1 to 5. This category stays on its own chart.</p>
          <ChartCard title={wave ? weekLabel(wave) : 'Sensory'} wide>
            <SensoryRadar data={sensoryData} series={sensorySeries} />
          </ChartCard>
        </div>}

        {sectionLoading && !GROUPS[page].metrics.every((metric) => loaded[metric]) ? (
          <p className="text-sm text-gray-500">Loading this section...</p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <section className="rounded-3xl bg-white p-6 text-sm text-gray-600 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
          <h2 className="text-base font-semibold text-gray-900">How to read this</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Search to compare, up to five brands. The week arrows move one week. From and To set the months on the long charts.</li>
            <li>A low base mark means fewer than 50 people. Under 30 people, the number is hidden.</li>
            <li>A gap in a line means that week is missing or too small to show. It is not zero.</li>
            <li>Functional Beverages and Personal Care are never mixed. Comparing stays inside your category, and it does not open the other brand’s page.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
