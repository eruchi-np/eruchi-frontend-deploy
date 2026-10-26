import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Menu, X } from 'lucide-react';
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
import { BrandSearch, CompareSearch, MultiBrandSearch } from './BrandPicker';
import useBrandMetrics from './useBrandMetrics';
import {
  exportRowsCsv,
  focusedBrandList,
  markTipSeen,
  parseDashboardSearch,
  tipSeen,
  writeDashboardSearch,
} from './brandViewState';
import {
  ALL,
  BrandBars,
  ChartCard,
  COMPARE_COLORS,
  GroupedBars,
  HorizontalBars,
  LOW,
  SensoryRadar,
  SeriesChart,
  SharePie,
  colorForBrand,
  seriesFor,
  seriesForBrands,
} from './BrandCharts';

const ALL_SERIES_CAP = 5;

export default function BrandDashboard({ client, viewer = null }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const urlSeed = useRef(parseDashboardSearch(window.location.search));
  const {
    rows,
    meta,
    booting,
    page,
    setPage,
    wave,
    setWave,
    error,
    pageReady,
  } = useBrandMetrics(viewer);
  const [compares, setCompares] = useState(urlSeed.current.compare || []);
  const [fromMonth, setFromMonth] = useState(urlSeed.current.from || '');
  const [toMonth, setToMonth] = useState(urlSeed.current.to || '');
  const [navOpen, setNavOpen] = useState(false);
  const [showTip, setShowTip] = useState(() => !viewer && !tipSeen());
  const [allOffset, setAllOffset] = useState(0);
  const seededPage = useRef(false);
  const seededWave = useRef(false);

  useEffect(() => {
    if (seededPage.current) return;
    seededPage.current = true;
    if (urlSeed.current.page) setPage(urlSeed.current.page);
  }, [setPage]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || booting || !pageReady) return undefined;
    const nodes = el.querySelectorAll('[data-reveal]');
    if (!nodes.length) return undefined;
    gsap.set(nodes, { clearProps: 'opacity,transform' });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(nodes, {
        y: 12,
        duration: 0.35,
        stagger: 0.04,
        ease: 'power3.out',
        clearProps: 'transform',
        overwrite: true,
      });
    }, el);
    return () => ctx.revert();
  }, [page, booting, pageReady]);

  const mode = viewer?.mode || 'one';
  const peerMode = mode === 'selected' || mode === 'all';
  const brand = viewer?.brand || meta?.brand || client?.brand || '';
  const categoryLabel = viewer?.categoryLabel || meta?.categoryLabel || client?.categoryLabel || '';
  const rawPeerBrands = peerMode
    ? (viewer?.selectedBrands?.length ? viewer.selectedBrands : [brand].filter(Boolean))
    : [brand, ...compares].filter(Boolean);
  const focusBrand = rawPeerBrands[0] || brand;
  const chartBrands = mode === 'all'
    ? focusedBrandList(rawPeerBrands, focusBrand, ALL_SERIES_CAP, allOffset)
    : rawPeerBrands;
  const peerBrands = chartBrands.slice(1);
  const chartSeries = peerMode ? seriesForBrands(chartBrands) : seriesFor(compares);
  const waves = useMemo(() => wavesOf(rows), [rows]);
  const months = useMemo(() => monthsOf(waves), [waves]);

  useEffect(() => {
    if (!months.length) return;
    const start = waves.length > 16 ? monthKey(waves[waves.length - 12]) : months[0];
    setFromMonth((current) => current || start);
    setToMonth((current) => current || months[months.length - 1]);
  }, [months, waves]);

  useEffect(() => {
    if (!waves.length || seededWave.current) return;
    seededWave.current = true;
    const wanted = urlSeed.current.wave;
    if (wanted && waves.includes(wanted)) setWave(wanted);
  }, [waves, setWave]);

  useEffect(() => {
    writeDashboardSearch({
      page,
      wave,
      from: fromMonth,
      to: toMonth,
      compare: peerMode ? [] : compares,
    }, true);
  }, [page, wave, fromMonth, toMonth, compares, peerMode]);

  useEffect(() => {
    const onPop = () => {
      const next = parseDashboardSearch(window.location.search);
      setPage(next.page);
      if (next.wave) setWave(next.wave);
      if (next.from) setFromMonth(next.from);
      if (next.to) setToMonth(next.to);
      if (!peerMode) setCompares(next.compare);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setPage, setWave, peerMode]);

  useEffect(() => {
    setAllOffset(0);
  }, [mode, viewer?.category, brand]);

  const peers = useMemo(() => peersOf(rows, focusBrand), [rows, focusBrand]);
  const waveIndex = waves.indexOf(wave);
  const previousWave = waveIndex > 0 ? waves[waveIndex - 1] : null;
  const pageId = GROUPS[page].id;
  const allCount = (viewer?.selectedBrands || []).length;
  const allPages = mode === 'all' ? Math.max(1, Math.ceil(Math.max(0, allCount - 1) / (ALL_SERIES_CAP - 1))) : 1;

  const goTo = (next) => {
    const index = Math.min(GROUPS.length - 1, Math.max(0, next));
    setPage(index);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const logout = async () => {
    await brandAPI.logout({ skipErrorToast: true, skipAuthRedirect: true });
    navigate('/brand/login', { replace: true });
  };

  const dismissTip = () => {
    markTipSeen();
    setShowTip(false);
  };

  const kpi = (metric, item = null) => ({
    current: shown(findRow(rows, metric, focusBrand, wave, item)),
    previous: previousWave ? shown(findRow(rows, metric, focusBrand, previousWave, item)) : null,
    peers: peerBrands.map((name, index) => ({
      name,
      value: shown(findRow(rows, metric, name, wave, item)),
      color: peerMode ? colorForBrand(index + 1) : COMPARE_COLORS[index % COMPARE_COLORS.length],
    })),
  });

  const occasionItems = [...new Set([
    ...itemsAt(rows, 'occasion_usage', 'ALL'),
    ...itemsAt(rows, 'occasion_usage', focusBrand),
    ...peerBrands.flatMap((name) => itemsAt(rows, 'occasion_usage', name)),
  ])];
  const occasionData = occasionItems
    .map((item) => {
      const row = findRow(rows, 'occasion_usage', 'ALL', wave, item);
      return { name: item, value: shown(row), low: row?.status === 'low_base' };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);
  const occasionCompareData = occasionItems.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'occasion_usage', focusBrand, wave, item)),
    };
    peerBrands.forEach((name, index) => {
      point[`c${index}`] = shown(findRow(rows, 'occasion_usage', name, wave, item));
    });
    return point;
  }).filter((point) => point.you != null || peerBrands.some((_, index) => point[`c${index}`] != null));

  const reasonData = itemsAt(rows, 'switch_reason', 'ALL')
    .map((item) => {
      const row = findRow(rows, 'switch_reason', 'ALL', wave, item);
      return { name: item, value: shown(row), low: row?.status === 'low_base' };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);
  const reasonItems = [...new Set([
    ...itemsAt(rows, 'switch_reason', 'ALL'),
    ...itemsAt(rows, 'switch_reason', focusBrand),
    ...peerBrands.flatMap((name) => itemsAt(rows, 'switch_reason', name)),
  ])];
  const reasonCompareData = reasonItems.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'switch_reason', focusBrand, wave, item)),
    };
    peerBrands.forEach((name, index) => {
      point[`c${index}`] = shown(findRow(rows, 'switch_reason', name, wave, item));
    });
    return point;
  }).filter((point) => point.you != null || peerBrands.some((_, index) => point[`c${index}`] != null));

  const attributes = itemsAt(rows, 'sensory_mean', focusBrand);
  const sensorySeries = peerMode
    ? [
        ...seriesForBrands(chartBrands),
        { key: 'all', name: 'Category', color: ALL },
      ]
    : [
        ...seriesFor(compares),
        { key: 'all', name: 'Category', color: ALL },
      ];
  const sensoryData = attributes.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'sensory_mean', focusBrand, wave, item)),
      all: shown(findRow(rows, 'sensory_mean', 'ALL', wave, item)),
    };
    peerBrands.forEach((name, index) => {
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

  const exportView = () => {
    const metric = GROUPS[page].metrics[0];
    const trendRows = trend(rows, metric, focusBrand, peerBrands, null, fromMonth, toMonth);
    if (!trendRows.length) return;
    const csvRows = trendRows.map((point) => {
      const row = { week: point.label, [focusBrand]: point.you };
      peerBrands.forEach((name, index) => {
        row[name] = point[`c${index}`];
      });
      return row;
    });
    exportRowsCsv(`eruchi-${pageId}-${wave || 'range'}.csv`, csvRows);
  };

  const firstWave = waves[0] || '';
  const lastWave = waves[waves.length - 1] || '';
  const firstMonth = months[0] || '';
  const lastMonth = months[months.length - 1] || '';

  const sideNav = (
    <>
      <div className="min-w-0">
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
                  {item.label === 'Functional Beverages' ? 'FB' : item.label === 'Personal Care' ? 'PC' : item.label}
                </button>
              ))}
            </div>
            {viewer.modes ? (
              <div className="flex rounded-full bg-slate-100 p-1">
                {viewer.modes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => viewer.onMode(item.id)}
                    className={`flex-1 rounded-full px-2 py-1 text-xs font-medium ${item.id === mode ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{categoryLabel}</p>
        )}
        {viewer ? (
          mode === 'one' ? (
            <BrandSearch brands={viewer.brands} value={focusBrand} onChange={viewer.onBrand} />
          ) : mode === 'selected' ? (
            <MultiBrandSearch
              brands={viewer.brands}
              selected={viewer.selectedBrands || []}
              onToggle={viewer.onToggleSelected}
              onFocus={viewer.onFocusSelected}
              focusBrand={focusBrand}
            />
          ) : (
            <div>
              <h1 className="text-2xl font-bold">All brands</h1>
              <p className="mt-1 text-xs text-gray-500">{allCount} in this category · charts show {Math.min(ALL_SERIES_CAP, chartBrands.length)} at a time</p>
            </div>
          )
        ) : (
          <h1 className="text-2xl font-bold">{brand}</h1>
        )}
        {viewer ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">{categoryLabel}</p> : null}
        {viewer && peerMode ? (
          <p className="mt-1 text-xs text-gray-500">Headlines use {focusBrand}. Charts show every selected brand.</p>
        ) : null}
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
        {peerMode ? (
          mode === 'all' ? (
            <div className="space-y-2">
              <div className="max-h-28 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {chartBrands.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => viewer.onFocusSelected?.(name)}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: colorForBrand(index) }}
                      title="Set focus for headlines"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              {allCount > ALL_SERIES_CAP ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:opacity-40"
                    disabled={allOffset <= 0}
                    onClick={() => setAllOffset((value) => Math.max(0, value - (ALL_SERIES_CAP - 1)))}
                  >
                    Prev brands
                  </button>
                  <span className="text-[11px] text-gray-400">
                    {Math.floor(allOffset / (ALL_SERIES_CAP - 1)) + 1}/{allPages}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:opacity-40"
                    disabled={allOffset + (ALL_SERIES_CAP - 1) >= Math.max(0, allCount - 1)}
                    onClick={() => setAllOffset((value) => value + (ALL_SERIES_CAP - 1))}
                  >
                    Next brands
                  </button>
                </div>
              ) : null}
            </div>
          ) : null
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 text-xs text-gray-500">
        {peerMode ? (
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorForBrand(0) }} /> Focus</span>
        ) : (
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> You</span>
        )}
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ALL }} /> Category</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOW }} /> Low base</span>
      </div>

      {viewer ? null : (
        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/brand/account')}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-700"
          >
            Account
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#e11d48] px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(225,29,72,0.28)]"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="brand-dashboard min-h-screen bg-[#f4f7fb] text-gray-900">
      <div className={`sticky z-50 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden ${viewer ? 'top-[5.5rem]' : 'top-0'}`}>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700" onClick={() => setNavOpen(true)}>
          <Menu className="h-4 w-4" /> Menu
        </button>
        <p className="min-w-0 truncate text-sm font-semibold">{viewer ? (mode === 'all' ? 'All brands' : focusBrand) : brand}</p>
        <button type="button" className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700" onClick={exportView} disabled={!pageReady}>
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setNavOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[min(20rem,90vw)] flex-col gap-5 overflow-y-auto bg-white px-4 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Sections</p>
              <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={() => setNavOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sideNav}
          </aside>
        </div>
      ) : null}

      <div className={`lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start ${viewer ? 'lg:-mt-[5.5rem]' : ''}`}>
        <aside className={`hidden border-b border-gray-200 bg-white px-4 py-4 lg:flex lg:flex-col lg:gap-5 lg:border-b-0 lg:border-r ${viewer ? 'lg:relative lg:z-[65]' : ''}`}>
          {sideNav}
        </aside>

        <main ref={panelRef} className={`min-w-0 space-y-8 px-4 py-6 ${viewer ? 'lg:pt-[5.5rem]' : ''}`}>
          {viewer?.toolbar ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              {viewer.toolbar}
            </div>
          ) : null}
          <div className="hidden items-center justify-end lg:flex">
            <button
              type="button"
              onClick={exportView}
              disabled={!pageReady || booting}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

        {showTip ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
            <p>Use the week arrows and From/To months to move through the charts. Open Compare to line up peers.</p>
            <button type="button" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-800" onClick={dismissTip}>Got it</button>
          </div>
        ) : null}

        {meta?.source === 'sample' ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            These figures are a sample, so you can click through the dashboard before live metrics arrive.
          </p>
        ) : null}
        {meta?.source === 'live' ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Showing live brand metrics for this category.
          </p>
        ) : null}
        {meta?.source === 'mixed' ? (
          <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Some metrics are live; the rest still use sample figures until you import them.
          </p>
        ) : null}

        {booting ? (
          <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-gray-500 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            Loading your dashboard...
          </p>
        ) : null}

        {!booting ? <BrandKpiRow kpi={kpi} /> : null}

        {pageReady && pageId === 'awareness' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Awareness</h2>
          <p className="text-sm text-gray-500">People who selected the brand when shown the list.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="This week" note={chartBrands.join(', ')}>
              <BrandBars data={snapshot(rows, 'awareness_prompted', focusBrand, peerBrands, wave, null, peerMode)} metric="awareness_prompted" />
            </ChartCard>
            <ChartCard title="First mention" note="The first brand they named, this week.">
              <BrandBars data={snapshot(rows, 'awareness_unprompted', focusBrand, peerBrands, wave, 'first_mention', peerMode)} metric="awareness_unprompted" item="first_mention" />
            </ChartCard>
          </div>
          <ChartCard title="Prompted awareness over the weeks" wide>
            <SeriesChart data={trend(rows, 'awareness_prompted', focusBrand, peerBrands, null, fromMonth, toMonth)} metric="awareness_prompted" series={chartSeries} />
          </ChartCard>
          {hasMetric(rows, 'awareness_unprompted') ? (
            <ChartCard title="Any mention" note="Named the brand without a list." wide>
              <SeriesChart kind="area" data={trend(rows, 'awareness_unprompted', focusBrand, peerBrands, 'any_mention', fromMonth, toMonth)} metric="awareness_unprompted" series={chartSeries} />
            </ChartCard>
          ) : null}
        </div>}

        {pageReady && pageId === 'buying' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Buying</h2>
          <ChartCard title="Penetration" note="Bought in the past 3 months." wide>
            <SeriesChart kind="area" data={trend(rows, 'penetration', focusBrand, peerBrands, null, fromMonth, toMonth)} metric="penetration" series={chartSeries} />
          </ChartCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Trial this week" note="Ever tried the brand.">
              <BrandBars data={snapshot(rows, 'trial', focusBrand, peerBrands, wave, null, peerMode)} metric="trial" />
            </ChartCard>
            <ChartCard title="Purchases per month" note="Among people whose main brand is this one.">
              <BrandBars data={snapshot(rows, 'purchase_frequency', focusBrand, peerBrands, wave, null, peerMode)} metric="purchase_frequency" />
            </ChartCard>
            <ChartCard title="Rupees per trip" note={wave ? weekLabel(wave) : ''} wide>
              <BrandBars data={snapshot(rows, 'spend_per_trip', focusBrand, peerBrands, wave, null, peerMode)} metric="spend_per_trip" />
            </ChartCard>
          </div>
          <ChartCard title="Share of wallet" note="Share of their category spend that goes to this brand." wide>
            <SeriesChart kind="area" data={trend(rows, 'share_of_wallet', focusBrand, peerBrands, null, fromMonth, toMonth)} metric="share_of_wallet" series={chartSeries} />
          </ChartCard>
        </div>}

        {pageReady && pageId === 'occasions' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Occasions</h2>
          <p className="text-sm text-gray-500">People can pick more than one, so these can add up past 100%.</p>
          {occasionData.length ? (
            <ChartCard title={`Category · ${wave ? weekLabel(wave) : 'Occasions'}`} wide>
              <HorizontalBars data={occasionData} metric="occasion_usage" fill />
            </ChartCard>
          ) : null}
          {occasionCompareData.length ? (
            <ChartCard title={`By brand · ${wave ? weekLabel(wave) : 'Occasions'}`} note={chartBrands.join(', ')} wide>
              <GroupedBars data={occasionCompareData} metric="occasion_usage" series={chartSeries} fill />
            </ChartCard>
          ) : null}
          {!occasionData.length && !occasionCompareData.length ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No occasion data for this week.</p>
          ) : null}
        </div>}

        {pageReady && pageId === 'switching' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Switching</h2>
          <p className="text-sm text-gray-500">These two shares will not add up to 100%.</p>
          <ChartCard title="Category over the weeks" wide>
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
          <ChartCard title="Switched brand by brand" note={chartBrands.join(', ')} wide>
            <SeriesChart
              kind="area"
              data={trend(rows, 'brand_switching', focusBrand, peerBrands, 'switched_brand', fromMonth, toMonth)}
              metric="brand_switching"
              item="switched_brand"
              series={chartSeries}
            />
          </ChartCard>
          <ChartCard title="Reduced or stopped by brand" note={chartBrands.join(', ')} wide>
            <SeriesChart
              kind="area"
              data={trend(rows, 'brand_switching', focusBrand, peerBrands, 'lapsed_reduced_or_stopped', fromMonth, toMonth)}
              metric="brand_switching"
              item="lapsed_reduced_or_stopped"
              series={chartSeries}
            />
          </ChartCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Why people switched" note="Category share of switchers.">
              {reasonData.length ? (
                <SharePie data={reasonData} metric="switch_reason" />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">No switch reasons for this week.</p>
              )}
            </ChartCard>
            <ChartCard title="Reasons by brand" note={chartBrands.join(', ')}>
              {reasonCompareData.length ? (
                <GroupedBars data={reasonCompareData} metric="switch_reason" series={chartSeries} />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">No brand-level switch reasons for this week.</p>
              )}
            </ChartCard>
          </div>
        </div>}

        {pageReady && pageId === 'loyalty' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Loyalty</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="NPS this week" note={wave ? weekLabel(wave) : ''}>
              <BrandBars data={snapshot(rows, 'nps', focusBrand, peerBrands, wave, 'NPS', peerMode)} metric="nps" item="NPS" />
            </ChartCard>
            <ChartCard title="Promoters, passives, detractors" note={`${focusBrand} buyers this week.`}>
              <SharePie
                metric="nps"
                data={[
                  { name: 'Promoters', value: shown(findRow(rows, 'nps', focusBrand, wave, 'promoters_pct')), fill: '#059669' },
                  { name: 'Passives', value: shown(findRow(rows, 'nps', focusBrand, wave, 'passives_pct')), fill: '#94a3b8' },
                  { name: 'Detractors', value: shown(findRow(rows, 'nps', focusBrand, wave, 'detractors_pct')), fill: '#e11d48' },
                ]}
              />
            </ChartCard>
          </div>
          {hasMetric(rows, 'cross_purchase_affinity') ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Also bought</h3>
              <p className="text-sm text-gray-500">Other brands {focusBrand} buyers also bought. The pair is not the same in reverse.</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title={`Share of ${focusBrand} buyers`} note={wave ? weekLabel(wave) : ''} fit>
                  <HorizontalBars data={ranked(rows, 'cross_purchase_affinity', focusBrand, wave)} metric="cross_purchase_affinity" />
                </ChartCard>
                <ChartCard title="Lift" note="1 means no extra link between the brands." fit>
                  <HorizontalBars data={ranked(rows, 'cross_purchase_lift', focusBrand, wave)} metric="cross_purchase_lift" />
                </ChartCard>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-gray-500">Loading also-bought brands...</p>
          )}
        </div>}

        {pageReady && pageId === 'sensory' && <div className="space-y-3" data-reveal>
          <h2 className="text-xl font-semibold">Sensory</h2>
          <p className="text-sm text-gray-500">Average score from 1 to 5. This category stays on its own chart.</p>
          {sensoryData.length ? (
            <ChartCard title={wave ? weekLabel(wave) : 'Sensory'} wide>
              <SensoryRadar data={sensoryData} series={sensorySeries} />
            </ChartCard>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No sensory scores for this week.</p>
          )}
        </div>}

        {!booting && !pageReady ? (
          <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-gray-500 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            Loading this section...
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <section className="rounded-3xl bg-white p-6 text-sm text-gray-600 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
          <h2 className="text-base font-semibold text-gray-900">How to read this</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>{viewer ? 'Admins can view one brand, a selected set, or every brand in the category. Click Focus on a brand to set the headline. In All mode, charts page through five brands at a time.' : 'Search to compare, up to five brands.'} The week arrows move one week. From and To set the months on the long charts.</li>
            <li>A low base mark means fewer than 50 people. Under 30 people, the number is hidden.</li>
            <li>A gap in a line means that week is missing or too small to show. It is not zero.</li>
            <li>Functional Beverages and Personal Care are never mixed. Comparing stays inside the category.</li>
          </ul>
        </section>
        </main>
      </div>
    </div>
  );
}
