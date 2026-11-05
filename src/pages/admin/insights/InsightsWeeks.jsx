import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';

const weekLabel = (key) => {
  if (!key) return '—';
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function InsightsWeeks() {
  const adminAPI = useInsightsApi();
  const [weeks, setWeeks] = useState([]);
  const [category, setCategory] = useState('FB');
  const [busyKey, setBusyKey] = useState('');
  const [draftCopy, setDraftCopy] = useState({});

  const load = async (cat = category) => {
    try {
      const { data } = await adminAPI.listInsightWeeks({ category: cat }, { skipErrorToast: true });
      const rows = data.weeks || [];
      setWeeks(rows);
      setDraftCopy(Object.fromEntries(rows.map((row) => [`${row.category}:${row.weekKey}`, row.nextUpdateCopy || ''])));
    } catch {
      toast.error('Could not load weeks');
    }
  };

  useEffect(() => { load(category); }, [category]);

  const rows = useMemo(
    () => weeks.filter((row) => row.category === category),
    [weeks, category],
  );

  const save = async (row, patch) => {
    const key = `${row.category}:${row.weekKey}`;
    setBusyKey(key);
    try {
      const { data } = await adminAPI.upsertInsightWeek({
        weekKey: row.weekKey,
        category: row.category,
        ...patch,
      }, { skipErrorToast: true });
      setWeeks((current) => {
        const next = current.filter((item) => !(item.weekKey === row.weekKey && item.category === row.category));
        next.push(data.week);
        return next.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
      });
      if (typeof patch.nextUpdateCopy === 'string') {
        setDraftCopy((current) => ({ ...current, [key]: patch.nextUpdateCopy }));
      }
      toast.success(patch.status === 'published' ? 'Published' : patch.status === 'draft' ? 'Unpublished' : 'Saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save week');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Weeks</h2>
        <div className="ri-admin-actions ri-admin-form">
          <label className="!gap-0">
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Category"
            >
              <option value="FB">Functional Beverages</option>
              <option value="PC">Personal Care</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        Waves come from live metrics. Until you publish at least one week, brand clients still see every wave.
        After the first publish, only published weeks are visible. Next-update copy shows on the latest published week.
      </p>

      <div className="ri-admin-card overflow-x-auto">
        <table className="ri-admin-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Status</th>
              <th>Next-update copy</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => {
              const key = `${row.category}:${row.weekKey}`;
              const busy = busyKey === key;
              const copyValue = draftCopy[key] ?? row.nextUpdateCopy ?? '';
              return (
                <tr key={key}>
                  <td>
                    <div className="font-medium">{weekLabel(row.weekKey)}</div>
                    <div className="text-xs text-gray-500">{row.weekKey}{row.hasMetrics ? '' : ' · no metrics'}</div>
                  </td>
                  <td>
                    <span className={`ri-admin-pill ${row.status === 'published' ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                      {row.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="ri-admin-form">
                      <div className="flex min-w-[16rem] flex-wrap gap-2">
                        <input
                          className="min-w-[12rem] flex-1"
                          value={copyValue}
                          maxLength={280}
                          placeholder="e.g. Next update Friday"
                          onChange={(event) => setDraftCopy((current) => ({ ...current, [key]: event.target.value }))}
                        />
                        <button
                          type="button"
                          className="ri-admin-btn"
                          disabled={busy || copyValue === (row.nextUpdateCopy || '')}
                          onClick={() => save(row, { nextUpdateCopy: copyValue })}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="ri-admin-actions justify-end">
                      {row.status === 'published' ? (
                        <button
                          type="button"
                          className="ri-admin-btn"
                          disabled={busy}
                          onClick={() => save(row, { status: 'draft' })}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ri-admin-btn ri-admin-btn-primary"
                          disabled={busy}
                          onClick={() => save(row, { status: 'published', nextUpdateCopy: copyValue })}
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                  No waves in live metrics for this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
