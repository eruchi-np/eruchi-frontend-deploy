import { useEffect, useRef, useState } from 'react';
import { brandAPI } from '../../services/api';
import { wavesOf } from './brandMetrics';
import { GROUPS, KPI_METRICS } from './brandDashboardMetrics';

export default function useBrandMetrics(viewer) {
  const cacheRef = useRef({});
  const inflight = useRef(new Map());
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [booting, setBooting] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [loaded, setLoaded] = useState({});
  const [page, setPage] = useState(0);
  const [wave, setWave] = useState('');
  const [error, setError] = useState('');

  const ensure = (metrics) => {
    const unique = [...new Set(metrics)];
    const needed = unique.filter((metric) => !cacheRef.current[metric]);
    if (!needed.length) return Promise.resolve();

    const pending = needed.filter((metric) => inflight.current.has(metric));
    const toFetch = needed.filter((metric) => !inflight.current.has(metric));
    const waits = pending.map((metric) => inflight.current.get(metric));

    if (toFetch.length) {
      const request = (viewer
        ? viewer.fetchMetrics(toFetch.join(','))
        : brandAPI.metrics(toFetch.join(','), { skipAuthRedirect: false })
      )
        .then(({ data }) => {
          const grouped = {};
          (data.rows || []).forEach((row) => {
            if (!grouped[row.metric]) grouped[row.metric] = [];
            grouped[row.metric].push(row);
          });
          toFetch.forEach((metric) => {
            if (!grouped[metric]) grouped[metric] = [];
          });
          cacheRef.current = { ...cacheRef.current, ...grouped };
          setLoaded((current) => {
            const next = { ...current };
            toFetch.forEach((metric) => { next[metric] = true; });
            return next;
          });
          setRows(Object.values(cacheRef.current).flat());
          setMeta((current) => current || data);
          setWave((current) => current || wavesOf(data.rows || []).at(-1) || '');
        })
        .catch(() => setError('Could not load this section.'))
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
  }, []);

  useEffect(() => {
    const group = GROUPS[page];
    if (group.id === 'loyalty') {
      ensure(['nps']).then(() => ensure(['cross_purchase_affinity', 'cross_purchase_lift']));
      return;
    }
    ensure(group.metrics);
  }, [page]);

  useEffect(() => {
    const next = GROUPS[page + 1];
    if (!next) return undefined;
    const timer = window.setTimeout(() => {
      if (next.id === 'loyalty') ensure(['nps']);
      else ensure(next.metrics);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [page, rows]);

  const group = GROUPS[page];
  const pageReady = group.id === 'loyalty'
    ? Boolean(loaded.nps)
    : group.metrics.every((metric) => loaded[metric]);

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
  };
}
