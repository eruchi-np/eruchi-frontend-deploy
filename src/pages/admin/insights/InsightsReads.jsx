import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useInsightsApi } from './insightsApiContext.jsx';

const emptyForm = {
  scope: 'weekly',
  weekKey: '',
  category: 'ALL',
  brand: '',
  pageId: 'awareness',
  chartId: '',
  title: '',
  body: '',
  sortOrder: 0,
  published: false,
};

const weekLabel = (key) => {
  if (!key) return '—';
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const scopeLabel = (scope) => {
  if (scope === 'weekly') return 'Weekly brief';
  if (scope === 'page') return 'Page note';
  if (scope === 'chart') return 'Chart note';
  return scope;
};

export default function InsightsReads() {
  const adminAPI = useInsightsApi();
  const [meta, setMeta] = useState(null);
  const [waves, setWaves] = useState([]);
  const [reads, setReads] = useState([]);
  const [weekKey, setWeekKey] = useState('');
  const [category, setCategory] = useState('ALL');
  const [previewPublishedOnly, setPreviewPublishedOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const brandOptions = useMemo(() => {
    if (!meta?.brands) return [];
    if (form.category === 'FB' || form.category === 'PC') return meta.brands[form.category] || [];
    return [...new Set([...(meta.brands.FB || []), ...(meta.brands.PC || [])])].sort();
  }, [meta, form.category]);

  const load = async (week, cat) => {
    try {
      const params = {};
      if (week) params.weekKey = week;
      if (cat && cat !== 'ALL') params.category = cat;
      const { data } = await adminAPI.listInsightReads(params, { skipErrorToast: true });
      const waveList = data.waves?.[cat === 'FB' || cat === 'PC' ? cat : 'ALL'] || data.waves?.ALL || [];
      setWaves(waveList);
      setReads(data.reads || []);
      return waveList;
    } catch {
      toast.error('Could not load reads');
      return [];
    }
  };

  useEffect(() => {
    adminAPI.insightReadMeta({ skipErrorToast: true })
      .then(({ data }) => setMeta(data.meta || null))
      .catch(() => toast.error('Could not load read meta'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (weekKey) {
        await load(weekKey, category);
        return;
      }
      const waveList = await load('', category);
      if (cancelled || !waveList.length) return;
      setWeekKey(waveList[waveList.length - 1]);
    })();
    return () => { cancelled = true; };
  }, [weekKey, category]);

  const openCreate = () => {
    setEditing({ id: null });
    setForm({
      ...emptyForm,
      weekKey: weekKey || waves.at(-1) || '',
      category,
      chartId: meta?.charts?.[0]?.id || '',
    });
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      scope: row.scope,
      weekKey: row.weekKey,
      category: row.category || 'ALL',
      brand: row.brand || '',
      pageId: row.pageId || 'awareness',
      chartId: row.chartId || '',
      title: row.title || '',
      body: row.body || '',
      sortOrder: row.sortOrder || 0,
      published: Boolean(row.published),
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      brand: form.brand || '',
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing?.id) {
        await adminAPI.updateInsightRead(editing.id, payload, { skipErrorToast: true });
        toast.success('Read updated');
      } else {
        await adminAPI.createInsightRead(payload, { skipErrorToast: true });
        toast.success('Read created');
      }
      setEditing(null);
      await load(weekKey || form.weekKey, category);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save read');
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (row) => {
    try {
      await adminAPI.updateInsightRead(row.id, { published: !row.published }, { skipErrorToast: true });
      await load(weekKey, category);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this read?')) return;
    try {
      await adminAPI.deleteInsightRead(row.id, { skipErrorToast: true });
      toast.success('Deleted');
      await load(weekKey, category);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const copyFromLast = async () => {
    if (!weekKey) {
      toast.error('Pick a week first');
      return;
    }
    setBusy(true);
    try {
      const { data } = await adminAPI.copyInsightReadsFromLast({
        weekKey,
        category,
      }, { skipErrorToast: true });
      toast.success(
        data.copied
          ? `Copied ${data.copied} from ${weekLabel(data.sourceWeekKey)}`
          : `Nothing new to copy from ${weekLabel(data.sourceWeekKey) || 'previous week'}`,
      );
      await load(weekKey, category);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not copy');
    } finally {
      setBusy(false);
    }
  };

  const weekReads = useMemo(
    () => reads.filter((row) => !weekKey || row.weekKey === weekKey),
    [reads, weekKey],
  );

  const previewReads = useMemo(() => {
    const list = weekReads.filter((row) => (previewPublishedOnly ? row.published : true));
    return {
      weekly: list.filter((row) => row.scope === 'weekly'),
      pages: list.filter((row) => row.scope === 'page'),
      charts: list.filter((row) => row.scope === 'chart'),
    };
  }, [weekReads, previewPublishedOnly]);

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Reads CMS</h2>
        <div className="ri-admin-actions">
          <button type="button" className="ri-admin-btn" disabled={busy || !weekKey} onClick={copyFromLast}>
            Copy from last week
          </button>
          <button type="button" className="ri-admin-btn ri-admin-btn-primary" onClick={openCreate}>
            Add read
          </button>
        </div>
      </div>

      <div className="ri-admin-card mb-4 ri-admin-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
        <label>
          Week
          <select value={weekKey} onChange={(event) => setWeekKey(event.target.value)}>
            {!waves.length ? <option value="">No waves</option> : null}
            {waves.map((item) => (
              <option key={item} value={item}>{weekLabel(item)} · {item}</option>
            )).reverse()}
          </select>
        </label>
        <label>
          Category filter
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {(meta?.categories || [
              { id: 'ALL', label: 'All categories' },
              { id: 'FB', label: 'Functional Beverages' },
              { id: 'PC', label: 'Personal Care' },
            ]).map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={previewPublishedOnly}
            onChange={(event) => setPreviewPublishedOnly(event.target.checked)}
          />
          <span>Preview published only</span>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
        <div className="ri-admin-card overflow-x-auto">
          <table className="ri-admin-table">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Target</th>
                <th>Copy</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {weekReads.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-gray-900">{scopeLabel(row.scope)}</div>
                    <div className="text-xs text-gray-500">{row.categoryLabel}</div>
                  </td>
                  <td className="text-sm">
                    {row.scope === 'page' ? row.pageId : null}
                    {row.scope === 'chart' ? row.chartId : null}
                    {row.scope === 'weekly' ? 'Weekly brief' : null}
                    {row.brand ? <div className="text-xs text-gray-500">{row.brand}</div> : null}
                  </td>
                  <td>
                    {row.title ? <div className="font-medium text-gray-900">{row.title}</div> : null}
                    <div className="text-sm text-gray-600 line-clamp-2">{row.body}</div>
                  </td>
                  <td>
                    <span className={`ri-admin-pill ${row.published ? 'ri-admin-pill-on' : 'ri-admin-pill-off'}`}>
                      {row.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="ri-admin-actions justify-end">
                      <button type="button" className="ri-admin-btn" onClick={() => openEdit(row)}>Edit</button>
                      <button type="button" className="ri-admin-btn" onClick={() => togglePublished(row)}>
                        {row.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" className="ri-admin-btn ri-admin-btn-danger" onClick={() => remove(row)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!weekReads.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    No reads for this week yet. Add one or copy from last week.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="ri-admin-card">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Preview as client</h3>
          <p className="mb-3 text-xs text-gray-500">
            How the brand rail / chart notes look for {weekLabel(weekKey)}.
            {previewPublishedOnly ? ' Published only.' : ' Drafts included.'}
          </p>

          <p className="ri-rail-label mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">Weekly brief</p>
          {previewReads.weekly.length ? previewReads.weekly.map((row) => (
            <div key={row.id} className="mb-3 rounded-lg border border-gray-200 bg-slate-50 p-3">
              {row.title ? <p className="text-sm font-semibold text-gray-900">{row.title}</p> : null}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.body}</p>
              {!row.published ? <p className="mt-1 text-[0.65rem] uppercase text-amber-700">Draft</p> : null}
            </div>
          )) : (
            <p className="mb-3 text-sm text-gray-500">No weekly brief.</p>
          )}

          <p className="ri-rail-label mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">Page notes</p>
          {previewReads.pages.length ? previewReads.pages.map((row) => (
            <div key={row.id} className="mb-3 rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase text-gray-500">{row.pageId}</p>
              {row.title ? <p className="text-sm font-semibold text-gray-900">{row.title}</p> : null}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.body}</p>
            </div>
          )) : (
            <p className="mb-3 text-sm text-gray-500">No page notes.</p>
          )}

          <p className="ri-rail-label mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">Chart notes</p>
          {previewReads.charts.length ? previewReads.charts.map((row) => (
            <div key={row.id} className="mb-3 rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{row.chartId}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {row.title ? `${row.title} — ${row.body}` : row.body}
              </p>
            </div>
          )) : (
            <p className="text-sm text-gray-500">No chart notes.</p>
          )}
        </aside>
      </div>

      {editing ? (
        <div className="ri-admin-modal" role="dialog" aria-modal="true">
          <div className="ri-admin-modal-card">
            <h3 className="mb-3 text-base font-semibold">{editing.id ? 'Edit read' : 'Add read'}</h3>
            <form className="ri-admin-form" onSubmit={save}>
              <label>
                Scope
                <select
                  value={form.scope}
                  onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
                >
                  <option value="weekly">Weekly brief</option>
                  <option value="page">Page note</option>
                  <option value="chart">Chart note</option>
                </select>
              </label>
              <label>
                Week
                <select
                  required
                  value={form.weekKey}
                  onChange={(event) => setForm((current) => ({ ...current, weekKey: event.target.value }))}
                >
                  <option value="">Select week</option>
                  {waves.map((item) => (
                    <option key={item} value={item}>{weekLabel(item)} · {item}</option>
                  )).reverse()}
                </select>
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, brand: '' }))}
                >
                  {(meta?.categories || []).map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Brand (optional)
                <select
                  value={form.brand}
                  onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                >
                  <option value="">All brands</option>
                  {brandOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              {form.scope === 'page' || form.scope === 'chart' ? (
                <label>
                  Page
                  <select
                    value={form.pageId}
                    onChange={(event) => setForm((current) => ({ ...current, pageId: event.target.value }))}
                  >
                    {(meta?.pages || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {form.scope === 'chart' ? (
                <label>
                  Chart
                  <select
                    required
                    value={form.chartId}
                    onChange={(event) => setForm((current) => ({ ...current, chartId: event.target.value }))}
                  >
                    {(meta?.charts || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                Title (optional)
                <input
                  value={form.title}
                  maxLength={160}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label>
                Body
                <textarea
                  required
                  value={form.body}
                  maxLength={4000}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                />
              </label>
              <label>
                Sort order
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 !grid-cols-none">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
                />
                <span>Published</span>
              </label>
              <div className="ri-admin-actions justify-end">
                <button type="button" className="ri-admin-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="ri-admin-btn ri-admin-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
