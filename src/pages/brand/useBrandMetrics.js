import { useEffect, useRef, useState } from 'react';
import { brandAPI } from '../../services/api';
import { wavesOf } from './brandMetrics';
import { GROUPS, KPI_METRICS } from './brandDashboardMetrics';

export default function useBrandMetrics(viewer) {
  const cacheRef = useRef({});
  const inflight = useRef(new Set());
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [booting, setBooting] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [loaded, setLoaded] = useState({});
  const [page, setPage] = useState(0);
  const [wave, setWave] = useState('');
  const [error, setError] = useState('');

  const ensure = (metrics) => {
    const missing = metrics.filter((metric) => !cacheRef.current[metric] && !inflight.current.has(metric));
    if (!missing.length) return Promise.resolve();
    missing.forEach((metric) => inflight.current.add(metric));
    setSectionLoading(true);
    return (viewer ? viewer.fetchMetrics(missing.join(',')) : brandAPI.metrics(missing.join(','), { skipAuthRedirect: false }))
      .then(({ data }) => {
        const grouped = {};
        (data.rows || []).forEach((row) => {
          if (!grouped[row.metric]) grouped[row.metric] = [];
          grouped[row.metric].push(row);
        });
        missing.forEach((metric) => {
          if (!grouped[metric]) grouped[metric] = [];
        });
        cacheRef.current = { ...cacheRef.current, ...grouped };
        setLoaded((current) => {
          const next = { ...current };
          missing.forEach((metric) => { next[metric] = true; });
          return next;
        });
        setRows(Object.values(cacheRef.current).flat());
        setMeta((current) => current || data);
        setWave((current) => current || wavesOf(data.rows || []).at(-1) || '');
      })
      .catch(() => setError('Could not load this section.'))
      .finally(() => {
        missing.forEach((metric) => inflight.current.delete(metric));
        setSectionLoading(false);
        setBooting(false);
      });
  };

  useEffect(() => {
    ensure([...new Set([...KPI_METRICS, ...GROUPS[0].metrics])]);
  }, []);

  useEffect(() => {
    ensure(GROUPS[page].metrics);
  }, [page]);

  useEffect(() => {
    const next = GROUPS[page + 1];
    if (!next) return undefined;
    const timer = window.setTimeout(() => ensure(next.metrics), 500);
    return () => window.clearTimeout(timer);
  }, [page, rows]);

  const pageReady = GROUPS[page].metrics.every((metric) => loaded[metric]);

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
