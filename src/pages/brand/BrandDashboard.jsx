import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Download, Menu, X } from 'lucide-react';
import { brandAPI } from '../../services/api';
import {
  findRow,
  hasMetric,
  isLowBase,
  monthKey,
  shown,
  uniqueBrands,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import {
  AWARENESS_TYPE_SERIES,
  EXPORT_CHART_CATALOG,
  GROUPS,
  MARKET_PEN_SERIES,
  awarenessTypeSnapshot,
  inSpan,
  itemsAt,
  marketPenetrationSnapshot,
  nearestWave,
  ranked,
  snapshot,
  trend,
} from './brandDashboardMetrics';
import BrandKpiRow from './BrandKpiRow';
import { BrandSearch, CompareSearch, MultiBrandSearch } from './BrandPicker';
import BrandSwitchFlow, { buildNetGains } from './BrandSwitchFlow';
import useBrandMetrics from './useBrandMetrics';
import {
  exportElementsPdf,
  exportPanelPdf,
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
  LOW,
  NetGainsBars,
  NpsStackedBars,
  SensoryRadar,
  SeriesChart,
  SwitchReasonBars,
  colorForBrand,
  seriesFor,
  seriesForBrands,
} from './BrandCharts';

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
    preloadAll,
  } = useBrandMetrics(viewer);
  const [compares, setCompares] = useState(urlSeed.current.compare || []);
  const [fromWave, setFromWave] = useState(urlSeed.current.from || '');
  const [toWave, setToWave] = useState(urlSeed.current.to || '');
  const [navOpen, setNavOpen] = useState(false);
  const [showTip, setShowTip] = useState(() => !viewer && !tipSeen());
  const [showTop, setShowTop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState('section');
  const [exportCharts, setExportCharts] = useState([]);
  const [exportAll, setExportAll] = useState(false);
  const seededPage = useRef(false);
  const seededWave = useRef(false);
  const seededCompares = useRef(Boolean(urlSeed.current.compare?.length));

  useEffect(() => {
    if (seededPage.current) return;
    seededPage.current = true;
    if (urlSeed.current.page) setPage(urlSeed.current.page);
  }, [setPage]);

  const mode = viewer?.mode || 'one';
  const peerMode = mode === 'selected' || mode === 'all';
  const brand = viewer?.brand || meta?.brand || client?.brand || '';
  const categoryLabel = viewer?.categoryLabel || meta?.categoryLabel || client?.categoryLabel || '';
  const rawPeerBrands = mode === 'selected'
    ? (viewer?.selectedBrands || []).filter(Boolean)
    : peerMode
      ? (viewer?.selectedBrands?.length ? viewer.selectedBrands : [brand].filter(Boolean))
      : [brand, ...compares].filter(Boolean);
  const needsBrandPick = mode === 'selected' && !rawPeerBrands.length;
  const focusBrand = rawPeerBrands[0] || brand;
  // All = every brand; Selected stays capped by the picker (max 5).
  const chartBrands = mode === 'all' && focusBrand && rawPeerBrands.includes(focusBrand)
    ? [focusBrand, ...rawPeerBrands.filter((name) => name !== focusBrand)]
    : rawPeerBrands;
  const peerBrands = chartBrands.slice(1);
  const chartSeries = peerMode ? seriesForBrands(chartBrands) : seriesFor(compares, focusBrand || 'You');
  const stackCharts = mode === 'all';
  const chartGrid = stackCharts
    ? 'grid min-w-0 grid-cols-1 gap-4'
    : 'grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2';
  const brandPageSize = stackCharts ? Math.max(chartBrands.length, 1) : 5;
  const drillBrand = viewer?.onSelectOneBrand
    ? (name) => {
      if (!name || name === 'Category' || name === 'ALL' || name === 'Others') return;
      viewer.onSelectOneBrand(name);
    }
    : null;
  const waves = useMemo(
    () => (meta?.waves?.length ? meta.waves : wavesOf(rows)),
    [meta?.waves, rows],
  );

  const resolveWeekParam = (value, list) => {
    if (!value || !list.length) return '';
    if (list.includes(value)) return value;
    // Legacy month key (YYYY-MM) → nearest wave in that month.
    if (/^\d{4}-\d{2}$/.test(value)) {
      const hit = list.find((item) => monthKey(item) === value);
      return hit || '';
    }
    return nearestWave(list, value) || '';
  };

  useEffect(() => {
    if (!waves.length || !wave) return;
    if (!waves.includes(wave)) setWave(waves.at(-1) || '');
  }, [waves, wave, setWave]);

  useEffect(() => {
    if (!waves.length) return;
    const startDefault = waves.length > 16 ? waves[waves.length - 12] : waves[0];
    const endDefault = waves[waves.length - 1];
    setFromWave((current) => {
      const resolved = resolveWeekParam(current, waves);
      return resolved || startDefault;
    });
    setToWave((current) => {
      const resolved = resolveWeekParam(current, waves);
      return resolved || endDefault;
    });
  }, [waves]);

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
      from: fromWave,
      to: toWave,
      compare: peerMode ? [] : compares,
    }, true);
  }, [page, wave, fromWave, toWave, compares, peerMode]);

  useEffect(() => {
    const onPop = () => {
      const next = parseDashboardSearch(window.location.search);
      setPage(next.page);
      if (next.wave) setWave(next.wave);
      if (next.from) setFromWave(resolveWeekParam(next.from, waves) || next.from);
      if (next.to) setToWave(resolveWeekParam(next.to, waves) || next.to);
      if (!peerMode) setCompares(next.compare);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setPage, setWave, peerMode]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 360);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Unique brands from the active metrics store (live when present).
  const allowedBrands = useMemo(() => {
    if (viewer?.brands?.length) return uniqueBrands(viewer.brands);
    if (meta?.brands?.length) return uniqueBrands(meta.brands);
    return [];
  }, [viewer?.brands, meta?.brands]);

  const peers = useMemo(
    () => allowedBrands.filter((name) => name && name !== focusBrand),
    [allowedBrands, focusBrand],
  );

  useEffect(() => {
    setCompares((current) => {
      const next = current.filter((name) => peers.includes(name));
      return next.length === current.length ? current : next;
    });
  }, [peers]);

  // Brand portal: default up to 3 top peers on the section lead metric (once).
  useEffect(() => {
    if (viewer || peerMode || seededCompares.current) return;
    if (!focusBrand || !wave || !rows.length || !peers.length) return;
    const leadMetric = GROUPS[page]?.metrics?.[0] || 'awareness_prompted';
    const rankedPeers = peers
      .map((name) => ({
        name,
        value: shown(findRow(rows, leadMetric, name, wave)),
      }))
      .filter((row) => row.value != null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((row) => row.name);
    if (!rankedPeers.length) return;
    seededCompares.current = true;
    setCompares(rankedPeers);
  }, [viewer, peerMode, focusBrand, wave, rows, peers, page]);

  const waveIndex = waves.indexOf(wave);
  const previousWave = waveIndex > 0 ? waves[waveIndex - 1] : null;
  const pageId = GROUPS[page].id;
  const allCount = (viewer?.selectedBrands || []).length;

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

  const kpi = (metric, item = null) => {
    const currentRow = findRow(rows, metric, focusBrand, wave, item);
    return {
      current: shown(currentRow),
      previous: previousWave ? shown(findRow(rows, metric, focusBrand, previousWave, item)) : null,
      low: isLowBase(currentRow),
      peers: peerBrands.map((name, index) => ({
        name,
        value: shown(findRow(rows, metric, name, wave, item)),
        color: peerMode ? colorForBrand(index + 1) : COMPARE_COLORS[index % COMPARE_COLORS.length],
      })),
    };
  };

  const occasionItems = [...new Set([
    ...itemsAt(rows, 'occasion_usage', 'ALL'),
    ...itemsAt(rows, 'occasion_usage', focusBrand),
    ...peerBrands.flatMap((name) => itemsAt(rows, 'occasion_usage', name)),
    ...chartBrands.flatMap((name) => itemsAt(rows, 'occasion_usage', name)),
  ])];
  const occasionMatrixSeries = [
    ...(peerMode ? seriesForBrands(chartBrands) : seriesFor(compares, focusBrand || 'You')),
    ...(mode === 'selected' ? [] : [{ key: 'all', name: 'Category', color: ALL }]),
  ];
  const occasionMatrixData = occasionItems.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'occasion_usage', focusBrand, wave, item)),
      all: shown(findRow(rows, 'occasion_usage', 'ALL', wave, item)),
    };
    peerBrands.forEach((name, index) => {
      point[`c${index}`] = shown(findRow(rows, 'occasion_usage', name, wave, item));
    });
    return point;
  }).filter((point) => (
    point.you != null
    || point.all != null
    || peerBrands.some((_, index) => point[`c${index}`] != null)
  ));

  const attributes = itemsAt(rows, 'sensory_mean', focusBrand);
  // Keep sensory readable: focus + up to 2 peers; category only when under three brands.
  const sensoryBrands = chartBrands.slice(0, 3);
  const sensoryPeerBrands = sensoryBrands.slice(1);
  const sensorySeries = [
    ...(peerMode
      ? seriesForBrands(sensoryBrands)
      : seriesFor(compares.slice(0, 2), focusBrand || 'You')),
    ...(mode === 'selected' || sensoryBrands.length >= 3
      ? []
      : [{ key: 'all', name: 'Category', color: ALL }]),
  ];

  const flowOnlyBrands = mode === 'selected' || mode === 'all'
    ? chartBrands
    : (compares.length ? [focusBrand, ...compares].filter(Boolean) : null);
  const netGains = buildNetGains(rows, wave, focusBrand, flowOnlyBrands);

  const switchReasonItems = [...new Set([
    ...itemsAt(rows, 'switch_reason', focusBrand),
    ...itemsAt(rows, 'switch_reason', 'ALL'),
  ])];
  const switchReasonData = switchReasonItems
    .map((item) => ({
      name: item,
      focus: shown(findRow(rows, 'switch_reason', focusBrand, wave, item)),
      all: shown(findRow(rows, 'switch_reason', 'ALL', wave, item)),
    }))
    .filter((row) => row.focus != null || row.all != null)
    .sort((a, b) => ((b.focus || 0) + (b.all || 0)) - ((a.focus || 0) + (a.all || 0)));

  const npsStackBrands = peerMode
    ? chartBrands
    : [focusBrand, ...peerBrands].filter(Boolean);
  const npsStackData = npsStackBrands.map((name) => {
    const npsRow = findRow(rows, 'nps', name, wave, 'NPS');
    const promotersRow = findRow(rows, 'nps', name, wave, 'promoters_pct');
    const passivesRow = findRow(rows, 'nps', name, wave, 'passives_pct');
    const detractorsRow = findRow(rows, 'nps', name, wave, 'detractors_pct');
    const promoters = shown(promotersRow);
    const passives = shown(passivesRow);
    const detractors = shown(detractorsRow);
    const nps = shown(npsRow);
    if (promoters == null && passives == null && detractors == null && nps == null) return null;
    return {
      name,
      promoters: promoters ?? 0,
      passives: passives ?? 0,
      detractors: detractors ?? 0,
      nps,
      low: isLowBase(npsRow) || isLowBase(promotersRow) || isLowBase(passivesRow) || isLowBase(detractorsRow),
    };
  }).filter(Boolean);
  const sensoryData = attributes.map((item) => {
    const point = {
      name: item,
      you: shown(findRow(rows, 'sensory_mean', focusBrand, wave, item)),
      all: shown(findRow(rows, 'sensory_mean', 'ALL', wave, item)),
    };
    sensoryPeerBrands.forEach((name, index) => {
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

  const openExport = () => {
    const allIds = EXPORT_CHART_CATALOG.flatMap((group) => group.charts.map((chart) => chart.id));
    setExportCharts(allIds);
    setExportMode('section');
    setExportOpen(true);
  };

  const toggleExportChart = (title) => {
    setExportCharts((current) => (
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    ));
  };

  const waitForPaint = async () => {
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    window.dispatchEvent(new Event('resize'));
    await new Promise((resolve) => window.setTimeout(resolve, 900));
  };

  const runExport = async () => {
    if (!panelRef.current || exporting) return;
    setExportOpen(false);
    setExporting(true);
    const filename = `eruchi-${exportMode === 'dashboard' ? 'dashboard' : exportMode === 'charts' ? 'charts' : pageId}-${wave || 'range'}.pdf`;
    try {
      if (exportMode === 'section') {
        await waitForPaint();
        await exportPanelPdf(panelRef.current, filename);
      } else if (exportMode === 'charts') {
        await preloadAll();
        setExportAll(true);
        await waitForPaint();
        const nodes = exportCharts
          .map((title) => panelRef.current.querySelector(`[data-export-chart="${CSS.escape(title)}"]`))
          .filter(Boolean);
        await exportElementsPdf(nodes, filename);
        setExportAll(false);
      } else {
        await preloadAll();
        setExportAll(true);
        await waitForPaint();
        await exportPanelPdf(panelRef.current, filename);
        setExportAll(false);
      }
    } catch {
      setExportAll(false);
    } finally {
      setExporting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showSection = (id) => exportAll || (pageReady && pageId === id);

  const firstWave = waves[0] || '';
  const lastWave = waves[waves.length - 1] || '';

  const sideNav = (
    <>
      <div className="min-w-0">
        {viewer ? (
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex rounded-full bg-slate-100 p-1">
              {(viewer.categories?.length
                ? viewer.categories
                : [
                  { category: 'FB', label: 'Functional Beverages' },
                  { category: 'PC', label: 'Personal Care' },
                ]
              ).map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => viewer.onCategory(item.category)}
                  className={`flex-1 rounded-full px-2 py-1 text-xs font-medium ${item.category === viewer.category ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                >
                  {item.label === 'Functional Beverages' || item.category === 'FB'
                    ? 'FB'
                    : item.label === 'Personal Care' || item.category === 'PC'
                      ? 'PC'
                      : item.label}
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
            <BrandSearch brands={allowedBrands} value={focusBrand} onChange={viewer.onBrand} />
          ) : mode === 'selected' ? (
            <MultiBrandSearch
              brands={allowedBrands}
              selected={(viewer.selectedBrands || []).filter((name) => allowedBrands.includes(name))}
              onToggle={viewer.onToggleSelected}
              onFocus={viewer.onFocusSelected}
              focusBrand={focusBrand}
            />
          ) : (
            <div>
              <h1 className="text-2xl font-bold">All brands</h1>
              <p className="mt-1 text-xs text-gray-500">{allCount} in this category — charts show every brand (full width)</p>
            </div>
          )
        ) : (
          <h1 className="text-2xl font-bold">{brand}</h1>
        )}
        {viewer ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">{categoryLabel}</p> : null}
        {viewer && peerMode ? (
          <p className="mt-1 text-xs text-gray-500">
            {needsBrandPick
              ? 'Select brands below to fill the charts.'
              : `Headlines use ${focusBrand}. Charts show only the selected brands.`}
          </p>
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
            <button type="button" className="h-9 w-8 shrink-0 rounded-lg border border-gray-200 text-sm disabled:opacity-40" disabled={waveIndex <= 0} onClick={() => setWave(waves[waveIndex - 1])} aria-label="Previous week">&lt;</button>
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
            <button type="button" className="h-9 w-8 shrink-0 rounded-lg border border-gray-200 text-sm disabled:opacity-40" disabled={waveIndex < 0 || waveIndex >= waves.length - 1} onClick={() => setWave(waves[waveIndex + 1])} aria-label="Next week">&gt;</button>
          </div>
        </div>
        <label>
          From week
          <select
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            value={fromWave}
            onChange={(event) => {
              const next = event.target.value;
              if (!next || !waves.includes(next)) return;
              setFromWave(next);
              if (toWave && next > toWave) setToWave(next);
            }}
          >
            {waves.map((item) => (
              <option key={`from-${item}`} value={item}>{weekLabel(item).replace('Week of ', '')}</option>
            ))}
          </select>
        </label>
        <label>
          To week
          <select
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            value={toWave}
            onChange={(event) => {
              const next = event.target.value;
              if (!next || !waves.includes(next)) return;
              setToWave(next);
              if (fromWave && next < fromWave) setFromWave(next);
            }}
          >
            {waves.map((item) => (
              <option key={`to-${item}`} value={item}>{weekLabel(item).replace('Week of ', '')}</option>
            ))}
          </select>
        </label>
        {peerMode ? (
          mode === 'all' ? (
            <div className="max-h-36 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {chartBrands.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => (viewer.onSelectOneBrand || viewer.onFocusSelected)?.(name)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: colorForBrand(index) }}
                    title="Open this brand alone"
                  >
                    {name}
                  </button>
                ))}
              </div>
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
                    {name} <span aria-hidden="true">&times;</span>
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
        <button type="button" className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700" onClick={openExport} disabled={!pageReady || exporting}>
          <Download className="h-4 w-4" /> {exporting ? 'PDF...' : 'PDF'}
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
        <aside className={`hidden border-b border-gray-200 bg-white px-4 py-4 lg:flex lg:flex-col lg:gap-5 lg:border-b-0 lg:border-r ${viewer ? 'lg:relative lg:z-[65] lg:pt-[5.5rem]' : ''}`}>
          {sideNav}
        </aside>

        <main ref={panelRef} className={`min-w-0 px-4 ${viewer ? 'space-y-4 py-4 lg:pt-[5.5rem]' : 'space-y-8 py-6'}`}>
          {viewer?.toolbar ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">{viewer.toolbar}</div>
              <button
                type="button"
                onClick={openExport}
                disabled={!pageReady || booting || exporting}
                className="hidden shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 lg:inline-flex"
              >
                <Download className="h-4 w-4" /> {exporting ? 'Exporting PDF...' : 'Export PDF'}
              </button>
            </div>
          ) : (
            <div className="hidden items-center justify-end lg:flex">
              <button
                type="button"
                onClick={openExport}
                disabled={!pageReady || booting || exporting}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> {exporting ? 'Exporting PDF...' : 'Export PDF'}
              </button>
            </div>
          )}

        {showTip ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
            <p>Use the week arrows and From/To weeks to move through the charts. Open Compare to line up peers.</p>
            <button type="button" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-800" onClick={dismissTip}>Got it</button>
          </div>
        ) : null}

        {!booting && rows.some((row) => row.status === 'suppressed' || row.status === 'low_base') ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Some figures are low-base (under 50 people). They show as directional only — use them for early shape, not precise comparison.
          </p>
        ) : null}

        {booting ? (
          <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-gray-500 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            Loading your dashboard...
          </p>
        ) : null}

        {!booting && !needsBrandPick ? <BrandKpiRow kpi={kpi} /> : null}

        {needsBrandPick ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-16 text-center shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            <p className="text-lg font-semibold text-gray-900">Select a brand</p>
            <p className="mt-2 text-sm text-gray-500">
              Pick one or more brands above to show charts and headlines for this view.
            </p>
          </div>
        ) : null}

        {!needsBrandPick && showSection('awareness') && <div className="space-y-3" data-export-section="Awareness">
          <h2 className="text-xl font-semibold">Awareness</h2>
          <p className="text-sm text-gray-500">
            Top of mind is first mention. Unprompted is named without a list (not first). Prompted is when shown the list.
          </p>
          <ChartCard
            title="Awareness this week"
            note={chartBrands.join(', ')}
            exportKey="Awareness this week"
            wide
          >
            <GroupedBars
              data={awarenessTypeSnapshot(rows, chartBrands, wave)}
              metric="awareness_prompted"
              series={AWARENESS_TYPE_SERIES}
              pageSize={brandPageSize}
              onBrandClick={drillBrand}
            />
          </ChartCard>
          {hasMetric(rows, 'awareness_unprompted') ? (
            <ChartCard
              title="Unprompted awareness over the weeks"
              note="Named the brand unprompted (any mention)."
              exportKey="Unprompted awareness over the weeks"
              wide
            >
              <SeriesChart
                kind="area"
                data={trend(rows, 'awareness_unprompted', focusBrand, peerBrands, 'any_mention', fromWave, toWave, waves)}
                metric="awareness_unprompted"
                item="any_mention"
                series={chartSeries}
                onBrandClick={drillBrand}
              />
            </ChartCard>
          ) : (
            <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
              Unprompted awareness — data currently being gathered for this category.
            </p>
          )}
          <ChartCard title="Prompted awareness over the weeks" note="Selected when shown the list." wide>
            <SeriesChart
              data={trend(rows, 'awareness_prompted', focusBrand, peerBrands, null, fromWave, toWave, waves)}
              metric="awareness_prompted"
              series={chartSeries}
              onBrandClick={drillBrand}
            />
          </ChartCard>
        </div>}

        {!needsBrandPick && showSection('buying') && <div className="space-y-3" data-export-section="Penetration and Purchase">
          <h2 className="text-xl font-semibold">Penetration and Purchase</h2>
          <div className={chartGrid}>
            <ChartCard
              title="Market Penetration"
              note={wave ? weekLabel(wave) : 'Awareness (prompted + unprompted) beside penetration.'}
              exportKey="Market Penetration"
              wide={stackCharts}
            >
              <GroupedBars
                data={marketPenetrationSnapshot(rows, chartBrands, wave)}
                metric="penetration"
                series={MARKET_PEN_SERIES}
                pageSize={brandPageSize}
                onBrandClick={drillBrand}
              />
            </ChartCard>
            <ChartCard
              title="Penetration over the weeks"
              note={fromWave && toWave && fromWave !== toWave
                ? `Weeks ${weekLabel(fromWave).replace('Week of ', '')} – ${weekLabel(toWave).replace('Week of ', '')}`
                : (wave ? weekLabel(wave) : 'Bought recently')}
              exportKey="Penetration over the weeks"
              wide={stackCharts}
            >
              <SeriesChart kind="area" data={trend(rows, 'penetration', focusBrand, peerBrands, null, fromWave, toWave, waves)} metric="penetration" series={chartSeries} onBrandClick={drillBrand} />
            </ChartCard>
          </div>
          <div className={chartGrid}>
            <ChartCard title="Trial this week" note="Ever tried the brand." wide={stackCharts}>
              <BrandBars data={snapshot(rows, 'trial', focusBrand, peerBrands, wave, null, peerMode)} metric="trial" onBrandClick={drillBrand} />
            </ChartCard>
            <ChartCard title="Purchase Frequency" note="Purchases per month among people whose main brand is this one." exportKey="Purchase Frequency" wide={stackCharts}>
              <BrandBars data={snapshot(rows, 'purchase_frequency', focusBrand, peerBrands, wave, null, peerMode)} metric="purchase_frequency" onBrandClick={drillBrand} />
            </ChartCard>
            <ChartCard title="Rupees per trip" note={wave ? weekLabel(wave) : ''} wide>
              <BrandBars data={snapshot(rows, 'spend_per_trip', focusBrand, peerBrands, wave, null, peerMode)} metric="spend_per_trip" onBrandClick={drillBrand} />
            </ChartCard>
          </div>
          <div className={chartGrid}>
            <ChartCard title="Share of wallet" note="Share of this category spend that goes to these brands." wide={stackCharts}>
              <SeriesChart kind="area" data={trend(rows, 'share_of_wallet', focusBrand, peerBrands, null, fromWave, toWave, waves)} metric="share_of_wallet" series={chartSeries} onBrandClick={drillBrand} />
            </ChartCard>
            <ChartCard title="Share of wallet, by buyer type" note="Awaiting buyer-type breakdown." exportKey="Share of wallet, by buyer type" wide={stackCharts}>
              <p className="py-10 text-center text-sm text-amber-800">Data currently being gathered.</p>
            </ChartCard>
          </div>
          {hasMetric(rows, 'cross_purchase_affinity') ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Cross Purchase Affinity</h3>
              <p className="text-sm text-gray-500">
                {mode === 'selected'
                  ? `Other selected brands ${focusBrand} buyers also bought — not limited to this category.`
                  : `Other brands ${focusBrand} buyers also bought. The pair is not the same in reverse.`}
              </p>
              <div className={chartGrid}>
                <ChartCard title={`Share of ${focusBrand} buyers`} note={wave ? weekLabel(wave) : ''} exportKey="Also bought share" fit wide={stackCharts}>
                  <BrandBars
                    data={ranked(rows, 'cross_purchase_affinity', focusBrand, wave).filter((row) => (
                      allowedBrands.includes(row.name)
                      && (mode !== 'selected' || chartBrands.includes(row.name))
                    ))}
                    metric="cross_purchase_affinity"
                    onBrandClick={drillBrand}
                  />
                </ChartCard>
                <ChartCard title="Lift" note="1 means no extra link between the brands." exportKey="Also bought lift" fit wide={stackCharts}>
                  <BrandBars
                    data={ranked(rows, 'cross_purchase_lift', focusBrand, wave).filter((row) => (
                      allowedBrands.includes(row.name)
                      && (mode !== 'selected' || chartBrands.includes(row.name))
                    ))}
                    metric="cross_purchase_lift"
                    onBrandClick={drillBrand}
                  />
                </ChartCard>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
              Cross Purchase Affinity — data currently being gathered for this category.
            </p>
          )}
        </div>}

        {!needsBrandPick && showSection('occasions') && <div className="space-y-3" data-export-section="Occasions">
          <h2 className="text-xl font-semibold">Occasions</h2>
          <p className="text-sm text-gray-500">Brand × occasion matrix. People can pick more than one, so shares can add past 100%.</p>
          {occasionMatrixData.length ? (
            <ChartCard
              title="Occasion matrix"
              note={[wave ? weekLabel(wave) : null, chartBrands.join(', ')].filter(Boolean).join(' · ')}
              exportKey="Occasion matrix"
              wide
              tall
            >
              <GroupedBars data={occasionMatrixData} metric="occasion_usage" series={occasionMatrixSeries} />
            </ChartCard>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No occasion data for this week.</p>
          )}
        </div>}

        {!needsBrandPick && showSection('switching') && <div className="space-y-3" data-export-section="Switching">
          <h2 className="text-xl font-semibold">Switching</h2>
          <p className="text-sm text-gray-500">Flow and net gains use the same panelists across waves. Reasons are from switchers this week.</p>
          <ChartCard
            title="Main brand flow"
            note="Same panelists across waves. Blue bands are gains; coral bands are losses."
            howToRead="Each band is the share of matched panelists who moved from one main brand to another between waves. Click a brand name to open that brand alone."
            tall
            wide
            exportKey="Main brand flow"
          >
            {hasMetric(rows, 'brand_switch_flow') ? (
              <BrandSwitchFlow
                rows={rows}
                wave={wave}
                defaultFocus={focusBrand}
                onlyBrands={flowOnlyBrands}
                onBrandClick={drillBrand}
              />
            ) : (
              <p className="py-10 text-center text-sm text-amber-800">Data currently being gathered for brand switch flow.</p>
            )}
          </ChartCard>
          <ChartCard
            title="Brand switching tracker"
            note={focusBrand ? `Net gains and losses for ${focusBrand}.` : 'Net gains and losses.'}
            howToRead="Share of matched panelists won from or lost to each competitor. Net is won minus lost. Click a competitor to open that brand alone."
            exportKey="Brand switching tracker"
            wide
          >
            {netGains?.data?.length ? (
              <NetGainsBars data={netGains.data} onBrandClick={drillBrand} />
            ) : (
              <p className="py-10 text-center text-sm text-amber-800">
                {hasMetric(rows, 'brand_switch_flow')
                  ? 'No competitor wins or losses for this brand this week.'
                  : 'Data currently being gathered for brand switch flow.'}
              </p>
            )}
          </ChartCard>
          {mode !== 'selected' ? (
            <ChartCard title="Category over the weeks" wide exportKey="Category over the weeks">
              <SeriesChart
                kind="area"
                data={waves.filter((item) => inSpan(item, fromWave, toWave)).map((item) => ({
                  label: weekLabel(item).replace('Week of ', ''),
                  reduced: shown(findRow(rows, 'brand_switching', 'ALL', item, 'lapsed_reduced_or_stopped')),
                  adopted: shown(findRow(rows, 'brand_switching', 'ALL', item, 'adopted_or_increased')),
                }))}
                metric="brand_switching"
                series={[
                  { key: 'reduced', name: 'Reduced or stopped', color: '#0891b2' },
                  { key: 'adopted', name: 'Adopted or increased', color: '#059669' },
                ]}
              />
              {!rows.some((row) => row.metric === 'brand_switching' && row.item === 'adopted_or_increased') ? (
                <p className="mt-2 text-xs text-amber-700">Adopted or increased — data currently being gathered.</p>
              ) : null}
            </ChartCard>
          ) : null}
          <ChartCard
            title="Brand switching reasons"
            note={focusBrand ? `Why switchers name each reason · ${focusBrand} vs category.` : ''}
            howToRead="Share of switchers naming each reason (more than one allowed). Blue is this brand; coral is the category. Live metrics do not yet split left vs came."
            exportKey="Brand switching reasons"
            wide
          >
            {switchReasonData.length ? (
              <SwitchReasonBars data={switchReasonData} focusLabel={focusBrand || 'This brand'} />
            ) : (
              <p className="py-10 text-center text-sm text-amber-800">
                Data currently being gathered for switch reasons.
              </p>
            )}
          </ChartCard>
        </div>}

        {!needsBrandPick && showSection('loyalty') && <div className="space-y-3" data-export-section="Loyalty">
          <h2 className="text-xl font-semibold">Loyalty</h2>
          <ChartCard
            title="NPS this week"
            note={wave ? weekLabel(wave) : ''}
            howToRead="Each bar is that brand’s buyers this week: promoters (would recommend), passives, and detractors. NPS at the end is promoters minus detractors (Net Promoter Score)."
            exportKey="NPS this week"
            wide
          >
            {npsStackData.length ? (
              <NpsStackedBars data={npsStackData} onBrandClick={drillBrand} />
            ) : (
              <p className="py-10 text-center text-sm text-gray-500">No NPS breakdown for this week.</p>
            )}
          </ChartCard>
          <ChartCard
            title="NPS over the weeks"
            note={[fromWave ? weekLabel(fromWave) : null, toWave ? weekLabel(toWave) : null].filter(Boolean).join(' → ')}
            howToRead="Net Promoter Score by week. A gap means that week is missing or too small to show — it is not zero. Click a brand in the legend to open it alone."
            exportKey="NPS over the weeks"
            wide
          >
            <SeriesChart
              data={trend(rows, 'nps', focusBrand, peerBrands, 'NPS', fromWave, toWave, waves)}
              metric="nps"
              item="NPS"
              series={chartSeries}
              onBrandClick={drillBrand}
            />
          </ChartCard>
        </div>}

        {!needsBrandPick && showSection('sensory') && <div className="space-y-3" data-export-section="Sensory">
          <h2 className="text-xl font-semibold">Sensory</h2>
          <p className="text-sm text-gray-500">
            Average score from 1 to 5. Chart shows up to three brands so the radar stays readable.
          </p>
          {sensoryData.length ? (
            <ChartCard
              title="Sensory"
              note={[wave ? weekLabel(wave) : null, sensoryBrands.join(', ')].filter(Boolean).join(' · ')}
              howToRead="Average score from 1 (low) to 5 (high) on each attribute. Up to three brands so the shape stays readable."
              exportKey="Sensory"
              wide
            >
              <SensoryRadar data={sensoryData} series={sensorySeries} />
            </ChartCard>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No sensory scores for this week.</p>
          )}
        </div>}

        {!booting && !pageReady && !exportAll ? (
          <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-sm text-gray-500 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            Loading this section...
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!exportAll ? (
          <section className="rounded-3xl bg-white p-6 text-sm text-gray-600 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
            <h2 className="text-base font-semibold text-gray-900">How to read this</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>{viewer ? 'Admins can view one brand, a selected set (up to five), or every brand in the category. All mode shows every brand on full-width charts — click a brand on a chart (or its chip) to open that brand alone.' : 'Search to compare, up to five brands.'} The week arrows move one week. From and To set the weeks on the long charts.</li>
              <li>A low base / directional mark means fewer than 50 people (including under 30). Treat those figures as early shape, not precise comparison.</li>
              <li>A gap in a line means that week is missing or too small to show. It is not zero.</li>
              <li>Functional Beverages and Personal Care are never mixed. Comparing stays inside the category.</li>
            </ul>
          </section>
        ) : null}
        </main>
      </div>

      {exportOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Export PDF</h2>
              <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={() => setExportOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { id: 'section', label: 'This section', hint: `Only ${GROUPS[page]?.label || 'the open tab'}` },
                { id: 'dashboard', label: 'Whole dashboard', hint: 'Every section in one PDF' },
                { id: 'charts', label: 'Selected charts', hint: 'Pick charts from any section' },
              ].map((option) => (
                <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 ${exportMode === option.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="export-mode"
                    className="mt-1"
                    checked={exportMode === option.id}
                    onChange={() => setExportMode(option.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {exportMode === 'charts' ? (
              <div className="mt-4 max-h-56 space-y-3 overflow-y-auto rounded-2xl border border-gray-100 p-3">
                {EXPORT_CHART_CATALOG.map((group) => (
                  <div key={group.section}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.section}</p>
                    <div className="space-y-1.5">
                      {group.charts.map((chart) => (
                        <label key={chart.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={exportCharts.includes(chart.id)}
                            onChange={() => toggleExportChart(chart.id)}
                          />
                          <span className="truncate">{chart.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setExportOpen(false)}>Cancel</button>
              <button
                type="button"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                disabled={exportMode === 'charts' && !exportCharts.length}
                onClick={runExport}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
