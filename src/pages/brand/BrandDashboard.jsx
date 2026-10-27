import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Download, Menu, X } from 'lucide-react';
import { brandAPI } from '../../services/api';
import {
  findRow,
  hasMetric,
  isLowBase,
  monthKey,
  monthsOf,
  shown,
  uniqueBrands,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import {
  EXPORT_CHART_CATALOG,
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
import BrandSwitchFlow from './BrandSwitchFlow';
import useBrandMetrics from './useBrandMetrics';
import {
  exportElementsPdf,
  exportPanelPdf,
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
    preloadAll,
  } = useBrandMetrics(viewer);
  const [compares, setCompares] = useState(urlSeed.current.compare || []);
  const [fromMonth, setFromMonth] = useState(urlSeed.current.from || '');
  const [toMonth, setToMonth] = useState(urlSeed.current.to || '');
  const [navOpen, setNavOpen] = useState(false);
  const [showTip, setShowTip] = useState(() => !viewer && !tipSeen());
  const [allOffset, setAllOffset] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState('section');
  const [exportCharts, setExportCharts] = useState([]);
  const [exportAll, setExportAll] = useState(false);
  const seededPage = useRef(false);
  const seededWave = useRef(false);

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
  const chartBrands = mode === 'all'
    ? focusedBrandList(rawPeerBrands, focusBrand, ALL_SERIES_CAP, allOffset)
    : rawPeerBrands;
  const peerBrands = chartBrands.slice(1);
  const chartSeries = peerMode ? seriesForBrands(chartBrands) : seriesFor(compares, focusBrand || 'You');
  const waves = useMemo(
    () => (meta?.waves?.length ? meta.waves : wavesOf(rows)),
    [meta?.waves, rows],
  );
  const months = useMemo(() => monthsOf(waves), [waves]);

  useEffect(() => {
    if (!waves.length || !wave) return;
    if (!waves.includes(wave)) setWave(waves.at(-1) || '');
  }, [waves, wave, setWave]);

  useEffect(() => {
    if (!months.length) return;
    const start = waves.length > 16 ? monthKey(waves[waves.length - 12]) : months[0];
    const end = months[months.length - 1];
    setFromMonth((current) => {
      if (!current || !months.includes(current)) return start;
      return current;
    });
    setToMonth((current) => {
      if (!current || !months.includes(current)) return end;
      return current;
    });
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

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 360);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Unique brands from the active metrics store (sample is primary for now).
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
  ])];
  const occasionData = occasionItems
    .map((item) => {
      const row = findRow(rows, 'occasion_usage', 'ALL', wave, item);
      return { name: item, value: shown(row), low: isLowBase(row) };
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
      return { name: item, value: shown(row), low: isLowBase(row) };
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
  const sensorySeries = [
    ...(peerMode ? seriesForBrands(chartBrands) : seriesFor(compares, focusBrand || 'You')),
    ...(mode === 'selected' ? [] : [{ key: 'all', name: 'Category', color: ALL }]),
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
              <p className="mt-1 text-xs text-gray-500">{allCount} in this category � charts show {Math.min(ALL_SERIES_CAP, chartBrands.length)} at a time</p>
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
              onClick={openExport}
              disabled={!pageReady || booting || exporting}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> {exporting ? 'Exporting PDF...' : 'Export PDF'}
            </button>
          </div>

        {showTip ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
            <p>Use the week arrows and From/To months to move through the charts. Open Compare to line up peers.</p>
            <button type="button" className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-800" onClick={dismissTip}>Got it</button>
          </div>
        ) : null}

        {meta?.source === 'sample' || meta?.store === 'brand_tracker_metrics_sample' ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Showing brand metrics from the sample database for this category.
          </p>
        ) : null}
        {meta?.source === 'live' ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Showing brand metrics from the database for this category.
          </p>
        ) : null}
        {meta?.source === 'mixed' ? (
          <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Some metrics came from a CSV import; the rest are from the main metrics store.
          </p>
        ) : null}
        {!booting && rows.some((row) => row.status === 'suppressed' || row.status === 'low_base') ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Some figures are low-base (under 50 people). They show as directional only ? use them for early shape, not precise comparison.
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

        {!needsBrandPick && showSection('awareness') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Awareness</h2>
          <p className="text-sm text-gray-500">People who selected the brand when shown the list.</p>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="This week" note={chartBrands.join(', ')}>
              <BrandBars data={snapshot(rows, 'awareness_prompted', focusBrand, peerBrands, wave, null, peerMode)} metric="awareness_prompted" />
            </ChartCard>
            <ChartCard title="First mention" note="The first brand they named, this week.">
              <BrandBars data={snapshot(rows, 'awareness_unprompted', focusBrand, peerBrands, wave, 'first_mention', peerMode)} metric="awareness_unprompted" item="first_mention" />
            </ChartCard>
          </div>
          <ChartCard title="Prompted awareness over the weeks" wide>
            <SeriesChart data={trend(rows, 'awareness_prompted', focusBrand, peerBrands, null, fromMonth, toMonth, waves)} metric="awareness_prompted" series={chartSeries} />
          </ChartCard>
          {hasMetric(rows, 'awareness_unprompted') ? (
            <ChartCard title="Any mention" note="Named the brand without a list." wide>
              <SeriesChart kind="area" data={trend(rows, 'awareness_unprompted', focusBrand, peerBrands, 'any_mention', fromMonth, toMonth, waves)} metric="awareness_unprompted" series={chartSeries} />
            </ChartCard>
          ) : null}
        </div>}

        {!needsBrandPick && showSection('buying') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Buying</h2>
          <ChartCard title="Penetration" note="Bought in the past 3 months." wide>
            <SeriesChart kind="area" data={trend(rows, 'penetration', focusBrand, peerBrands, null, fromMonth, toMonth, waves)} metric="penetration" series={chartSeries} />
          </ChartCard>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
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
            <SeriesChart kind="area" data={trend(rows, 'share_of_wallet', focusBrand, peerBrands, null, fromMonth, toMonth, waves)} metric="share_of_wallet" series={chartSeries} />
          </ChartCard>
        </div>}

        {!needsBrandPick && showSection('occasions') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Occasions</h2>
          <p className="text-sm text-gray-500">People can pick more than one, so these can add up past 100%.</p>
          {occasionData.length && mode !== 'selected' ? (
            <ChartCard title="Category occasions" note={wave ? weekLabel(wave) : ''} exportKey="Category occasions" wide>
              <HorizontalBars data={occasionData} metric="occasion_usage" fill />
            </ChartCard>
          ) : null}
          {occasionCompareData.length ? (
            <ChartCard title="By brand occasions" note={[wave ? weekLabel(wave) : null, chartBrands.join(', ')].filter(Boolean).join(' � ')} exportKey="By brand occasions" wide>
              <GroupedBars data={occasionCompareData} metric="occasion_usage" series={chartSeries} fill />
            </ChartCard>
          ) : null}
          {!occasionCompareData.length && (mode === 'selected' || !occasionData.length) ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No occasion data for this week.</p>
          ) : null}
        </div>}

        {!needsBrandPick && showSection('switching') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Switching</h2>
          <p className="text-sm text-gray-500">These two shares will not add up to 100%.</p>
          <ChartCard
            title="Main brand flow"
            note="Same panelists across waves. Blue bands are gains; coral bands are losses. Click a brand to focus."
            tall
            wide
          >
            <BrandSwitchFlow
              rows={rows}
              wave={wave}
              defaultFocus={focusBrand}
              onlyBrands={
                mode === 'selected' || mode === 'all'
                  ? chartBrands
                  : (compares.length ? [focusBrand, ...compares].filter(Boolean) : null)
              }
            />
          </ChartCard>
          {mode !== 'selected' ? (
            <ChartCard title="Category over the weeks" wide>
              <SeriesChart
                kind="area"
                data={waves.filter((item) => inSpan(item, fromMonth, toMonth)).map((item) => ({
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
          ) : null}
          <ChartCard title="Switched brand by brand" note={chartBrands.join(', ')} wide>
            <SeriesChart
              kind="area"
              data={trend(rows, 'brand_switching', focusBrand, peerBrands, 'switched_brand', fromMonth, toMonth, waves)}
              metric="brand_switching"
              item="switched_brand"
              series={chartSeries}
            />
          </ChartCard>
          <ChartCard title="Reduced or stopped by brand" note={chartBrands.join(', ')} wide>
            <SeriesChart
              kind="area"
              data={trend(rows, 'brand_switching', focusBrand, peerBrands, 'lapsed_reduced_or_stopped', fromMonth, toMonth, waves)}
              metric="brand_switching"
              item="lapsed_reduced_or_stopped"
              series={chartSeries}
            />
          </ChartCard>
          {mode !== 'selected' ? (
            <ChartCard title="Why people switched" note="Category share of switchers. These should add up to about 100%." tall wide>
              {reasonData.length ? (
                <SharePie data={reasonData} metric="switch_reason" prominent />
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">No switch reasons for this week.</p>
              )}
            </ChartCard>
          ) : null}
          <ChartCard title="Reasons by brand" note={chartBrands.join(', ')} wide>
            {reasonCompareData.length ? (
              <GroupedBars data={reasonCompareData} metric="switch_reason" series={chartSeries} fill />
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No brand-level switch reasons for this week.</p>
            )}
          </ChartCard>
        </div>}

        {!needsBrandPick && showSection('loyalty') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Loyalty</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
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
              <p className="text-sm text-gray-500">
                {mode === 'selected'
                  ? `Other selected brands ${focusBrand} buyers also bought.`
                  : `Other brands ${focusBrand} buyers also bought. The pair is not the same in reverse.`}
              </p>
              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title={`Share of ${focusBrand} buyers`} note={wave ? weekLabel(wave) : ''} exportKey="Also bought share" fit>
                  <HorizontalBars
                    data={ranked(rows, 'cross_purchase_affinity', focusBrand, wave).filter((row) => (
                      allowedBrands.includes(row.name)
                      && (mode !== 'selected' || chartBrands.includes(row.name))
                    ))}
                    metric="cross_purchase_affinity"
                  />
                </ChartCard>
                <ChartCard title="Lift" note="1 means no extra link between the brands." exportKey="Also bought lift" fit>
                  <HorizontalBars
                    data={ranked(rows, 'cross_purchase_lift', focusBrand, wave).filter((row) => (
                      allowedBrands.includes(row.name)
                      && (mode !== 'selected' || chartBrands.includes(row.name))
                    ))}
                    metric="cross_purchase_lift"
                  />
                </ChartCard>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-gray-500">Loading also-bought brands...</p>
          )}
        </div>}

        {!needsBrandPick && showSection('sensory') && <div className="space-y-3">
          <h2 className="text-xl font-semibold">Sensory</h2>
          <p className="text-sm text-gray-500">Average score from 1 to 5. This category stays on its own chart.</p>
          {sensoryData.length ? (
            <ChartCard title="Sensory" note={wave ? weekLabel(wave) : ''} exportKey="Sensory" wide>
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
              <li>{viewer ? 'Admins can view one brand, a selected set, or every brand in the category. Click Focus on a brand to set the headline. In All mode, charts page through five brands at a time.' : 'Search to compare, up to five brands.'} The week arrows move one week. From and To set the months on the long charts.</li>
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
          className="fixed bottom-6 right-6 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
