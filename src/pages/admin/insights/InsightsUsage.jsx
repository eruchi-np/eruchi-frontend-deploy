import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';
import { RuchiEvents } from '../../brand/ruchiAnalytics';

const EVENT_DOCS = [
  { key: 'SESSION', label: 'Session' },
  { key: 'LOGIN', label: 'Login' },
  { key: 'LOGOUT', label: 'Logout' },
  { key: 'SECTION', label: 'Section view' },
  { key: 'WEEK', label: 'Week change' },
  { key: 'COMPARE', label: 'Compare change' },
  { key: 'INSIGHTS_TOGGLE', label: 'Insights toggle' },
  { key: 'CHART_CLICK', label: 'Chart brand click' },
  { key: 'PDF_EXPORT', label: 'PDF export' },
  { key: 'ERROR', label: 'Error' },
];

const href = (base, path, params = {}) => {
  if (!base) return null;
  const url = new URL(`${base}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, value);
  });
  return url.toString();
};

export default function InsightsUsage() {
  const adminAPI = useInsightsApi();
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);

  const projectBase = stats?.projectId && stats?.uiHost
    ? `${String(stats.uiHost).replace(/\/$/, '')}/project/${stats.projectId}`
    : '';

  const load = async (windowDays = days) => {
    setBusy(true);
    try {
      const { data } = await adminAPI.getInsightUsage({ days: windowDays }, { skipErrorToast: true });
      setStats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load usage');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(days); }, [days]);

  const maxDaily = useMemo(
    () => Math.max(1, ...(stats?.daily || []).map((row) => row.count || 0)),
    [stats],
  );

  const exportCsv = async () => {
    try {
      const { data } = await adminAPI.exportInsightUsageCsv({ days }, { skipErrorToast: true });
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ruchi-usage-${days}d.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not export CSV');
    }
  };

  const eventActivityUrl = (eventName) => href(projectBase, '/activity/explore', {
    events: JSON.stringify([{ id: eventName, type: 'events', order: 'descending', name: eventName }]),
  });

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Usage</h2>
        <div className="ri-admin-actions">
          <select
            className="ri-admin-btn"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            aria-label="Days"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button type="button" className="ri-admin-btn" disabled={busy} onClick={() => load(days)}>
            Refresh
          </button>
          <button type="button" className="ri-admin-btn" disabled={!stats?.configured} onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="ri-admin-grid mb-4">
        <div className="ri-admin-stat">
          <span>PostHog API</span>
          <strong className="!text-base">{stats?.configured ? 'Connected' : 'Not configured'}</strong>
        </div>
        <div className="ri-admin-stat">
          <span>Events ({days}d)</span>
          <strong>{stats?.total ?? '—'}</strong>
        </div>
        <div className="ri-admin-stat">
          <span>Project</span>
          <strong className="!text-base">{stats?.projectId || '—'}</strong>
        </div>
      </div>

      {!stats?.configured ? (
        <div className="ri-admin-card mb-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Server setup</p>
          <p className="mt-2">Add to <code className="text-xs">backend/.env</code> and restart the API:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-gray-800">
{`POSTHOG_PERSONAL_API_KEY=phx_…
POSTHOG_PROJECT_ID=12345
POSTHOG_HOST=https://us.i.posthog.com`}
          </pre>
          <p className="mt-2 text-xs text-gray-500">
            Client tracking still uses <code>VITE_PUBLIC_POSTHOG_KEY</code>. Deep-links also use the project ID above.
          </p>
        </div>
      ) : null}

      <div className="ri-admin-card mb-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Daily habit</h3>
        {(stats?.daily || []).length ? (
          <div className="flex h-28 items-end gap-1">
            {stats.daily.map((row) => (
              <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${row.day}: ${row.count}`}>
                <div
                  className="w-full rounded-t bg-[var(--ri-admin-primary,#1b2a4a)]"
                  style={{ height: `${Math.max(4, (row.count / maxDaily) * 100)}%` }}
                />
                <span className="truncate text-[0.6rem] text-gray-400">{String(row.day).slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{busy ? 'Loading…' : 'No daily data yet.'}</p>
        )}
      </div>

      <div className="ri-admin-card mb-4 overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Event counts</h3>
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Name</th>
              <th>Count</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {EVENT_DOCS.map((item) => {
              const eventName = RuchiEvents[item.key];
              const count = stats?.counts?.[eventName] ?? 0;
              const activity = eventActivityUrl(eventName);
              return (
                <tr key={item.key}>
                  <td className="font-semibold text-gray-900">{item.label}</td>
                  <td><code className="text-xs">{eventName}</code></td>
                  <td>{count}</td>
                  <td>
                    {activity ? (
                      <a className="ri-admin-btn" href={activity} target="_blank" rel="noreferrer">Open in PostHog</a>
                    ) : (
                      <span className="ri-admin-btn opacity-50">Open in PostHog</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ri-admin-card">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">PostHog shortcuts</h3>
        <div className="ri-admin-actions">
          {[
            { label: 'Project', path: '' },
            { label: 'Activity', path: '/activity/explore' },
            { label: 'Persons', path: '/persons' },
            { label: 'Insights', path: '/insights' },
          ].map((item) => {
            const url = href(projectBase, item.path);
            return url ? (
              <a key={item.label} className="ri-admin-btn" href={url} target="_blank" rel="noreferrer">{item.label}</a>
            ) : (
              <span key={item.label} className="ri-admin-btn opacity-50">{item.label}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
