import { GROUPS } from './brandDashboardMetrics';

const ADMIN_KEY = 'eruchi.brandTracker.prefs';
const TIP_KEY = 'eruchi.brandDashboard.tipSeen';

export function readAdminPrefs() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function writeAdminPrefs(prefs) {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function tipSeen() {
  try {
    return localStorage.getItem(TIP_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTipSeen() {
  try {
    localStorage.setItem(TIP_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function parseDashboardSearch(search) {
  const params = new URLSearchParams(search);
  const section = params.get('section') || '';
  const page = Math.max(0, GROUPS.findIndex((item) => item.id === section));
  const compare = (params.get('compare') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    page: page >= 0 ? page : 0,
    wave: params.get('wave') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    compare,
  };
}

export function writeDashboardSearch({ page, wave, from, to, compare }, replace) {
  const params = new URLSearchParams(window.location.search);
  const section = GROUPS[page]?.id;
  if (section) params.set('section', section);
  else params.delete('section');
  if (wave) params.set('wave', wave);
  else params.delete('wave');
  if (from) params.set('from', from);
  else params.delete('from');
  if (to) params.set('to', to);
  else params.delete('to');
  if (compare?.length) params.set('compare', compare.join(','));
  else params.delete('compare');
  const next = `${window.location.pathname}?${params.toString()}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', next);
}

export function focusedBrandList(brands, focus, max = 5, offset = 0) {
  const list = (brands || []).filter(Boolean);
  if (!list.length) return [];
  if (list.length <= max) return list;
  const primary = list.includes(focus) ? focus : list[0];
  const rest = list.filter((name) => name !== primary);
  const start = rest.length ? ((offset % rest.length) + rest.length) % rest.length : 0;
  const window = [...rest.slice(start), ...rest.slice(0, start)].slice(0, max - 1);
  return [primary, ...window];
}

export function exportRowsCsv(filename, rows) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const body = [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
