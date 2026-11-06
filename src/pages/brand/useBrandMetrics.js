import { useEffect, useRef, useState } from 'react';
import { brandAPI } from '../../services/api';
import { wavesOf } from './brandMetrics';
import { GROUPS, KPI_METRICS } from './brandDashboardMetrics';

export default function useBrandMetrics(viewer) {
  const cacheRef = useRef({});
  const inflight = useRef(new Map());
  const failedRef = useRef(new Set());
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [booting, setBooting] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [loaded, setLoaded] = useState({});
  const [page, setPage] = useState(0);
  const [wave, setWave] = useState('');
  const [error, setError] = useState('');

  const markLoaded = (metrics) => {
    setLoaded((current) => {
      const next = { ...current };
      metrics.forEach((metric) => { next[metric] = true; });
      return next;
    });
  };

  const clearFailed = (metrics) => {
    const list = [...new Set(metrics)];
    if (!list.some((metric) => failedRef.current.has(metric))) return;
    list.forEach((metric) => {
      if (!failedRef.current.has(metric)) return;
      failedRef.current.delete(metric);
      delete cacheRef.current[metric];
    });
    setLoaded((current) => {
      const next = { ...current };
      list.forEach((metric) => { delete next[metric]; });
      return next;
    });
  };

  const ensure = (metrics) => {
    const unique = [...new Set(metrics)];
    const toConsider = unique.filter((metric) => !Object.prototype.hasOwnProperty.call(cacheRef.current, metric));
    const pending = toConsider.filter((metric) => inflight.current.has(metric));
    const toFetch = toConsider.filter((metric) => !inflight.current.has(metric));
    const waits = pending.map((metric) => inflight.current.get(metric));

    if (!toFetch.length && !waits.length) return Promise.resolve();

    if (toFetch.length) {
      const request = (viewer
        ? viewer.fetchMetrics(toFetch.join(','))
        : brandAPI.metrics(toFetch.join(','), { skipAuthRedirect: false })
      )
        .then(({ data }) => {
          setError('');
          toFetch.forEach((metric) => failedRef.current.delete(metric));
          const grouped = {};
          (data.rows || []).forEach((row) => {
            if (!grouped[row.metric]) grouped[row.metric] = [];
            grouped[row.metric].push(row);
          });
          toFetch.forEach((metric) => {
            if (!grouped[metric]) grouped[metric] = [];
          });
          cacheRef.current = { ...cacheRef.current, ...grouped };
          markLoaded(toFetch);
          setRows(Object.values(cacheRef.current).flat());
          setMeta((current) => {
            const waves = (data.waves?.length ? data.waves : current?.waves) || [];
            const brands = (data.brands?.length ? data.brands : current?.brands) || [];
            const nextUpdateCopy = typeof data.nextUpdateCopy === 'string'
              ? data.nextUpdateCopy
              : (current?.nextUpdateCopy || '');
            const brandColors = data.brandColors && typeof data.brandColors === 'object'
              ? data.brandColors
              : (current?.brandColors || {});
            if (!current) return { ...data, waves, brands, nextUpdateCopy, brandColors };
            return {
              ...current,
              waves: data.waves?.length ? waves : (current.waves || waves),
              brands: data.brands?.length ? brands : (current.brands || brands),
              nextUpdateCopy,
              brandColors,
              publishGateActive: Boolean(data.publishGateActive ?? current.publishGateActive),
              brandGateActive: Boolean(data.brandGateActive ?? current.brandGateActive),
            };
          });
          const waveList = data.waves?.length ? data.waves : wavesOf(data.rows || []);
          setWave((current) => {
            if (current && waveList.includes(current)) return current;
            if (current && !waveList.length) return current;
            if (current && waveList.length && !waveList.includes(current)) {
              return waveList.at(-1) || '';
            }
            return waveList.at(-1) || '';
          });
        })
        .catch((err) => {
          // Mark attempted so the section leaves the endless loading state.
          // Soft retry: clearFailed() on page revisit will refetch these.
          toFetch.forEach((metric) => {
            failedRef.current.add(metric);
            if (!Object.prototype.hasOwnProperty.call(cacheRef.current, metric)) {
              cacheRef.current[metric] = [];
            }
          });
          markLoaded(toFetch);
          setRows(Object.values(cacheRef.current).flat());
          const message = err?.response?.data?.message || 'Could not load this section.';
          setError(message);
        })
        .finally(() => {
          toFetch.forEach((metric) => inflight.current.delete(metric));
        });
      toFetch.forEach((metric) => inflight.current.set(metric, request));
      waits.push(request);
    }

    setSectionLoading(true);
    return Promise.all(waits).finally(() => {
      setSectionLoading(false);
      setBooting(false);
    });
  };

  useEffect(() => {
    ensure([...new Set([...KPI_METRICS, ...GROUPS[0].metrics])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureChunked = async (metrics) => {
    const list = [...new Set(metrics)];
    for (let index = 0; index < list.length; index += 6) {
      await ensure(list.slice(index, index + 6));
    }
  };

  useEffect(() => {
    clearFailed(GROUPS[page].metrics);
    setError('');
    ensureChunked(GROUPS[page].metrics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Prefetch next section once per page change (do not key on rows — that re-fired endlessly).
  useEffect(() => {
    const next = GROUPS[page + 1];
    if (!next) return undefined;
    const timer = window.setTimeout(() => {
      ensureChunked(next.metrics);
    }, 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const group = GROUPS[page];
  const pageReady = group.metrics.every((metric) => loaded[metric]);

  const preloadAll = () => Promise.all(GROUPS.map((entry) => ensureChunked(entry.metrics)));

  return {
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
    preloadAll,
  };
}
