export function weekLabel(iso) {
  if (!iso || !iso.includes('-')) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const text = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Week of ${text}`;
}

export function wavesOf(rows) {
  return [...new Set(rows.map((row) => row.wave_start))].sort();
}

export function monthKey(iso) {
  return String(iso || '').slice(0, 7);
}

export function monthLabel(key) {
  if (!key || !key.includes('-')) return '';
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function monthsOf(waves) {
  return [...new Set((waves || []).map(monthKey))].filter((key) => key.length === 7).sort();
}

export function findRow(rows, metric, brand, wave, item = null) {
  return rows.find((row) =>
    row.metric === metric
    && row.brand === brand
    && row.wave_start === wave
    && (row.item || null) === (item || null)
  ) || null;
}

export function shown(row) {
  if (!row || row.status === 'suppressed') return null;
  return row.value;
}

export function pointsDelta(current, previous) {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

export function hasMetric(rows, metric) {
  return rows.some((row) => row.metric === metric);
}

export function formatValue(metric, item, value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const number = Number(value);
  if (metric === 'nps' && item === 'NPS') return `${Math.round(number)}`;
  if (metric === 'spend_per_trip') return `Rs ${Math.round(number)}`;
  if (metric === 'sensory_mean' || metric === 'purchase_frequency' || metric === 'cross_purchase_lift') {
    return number.toFixed(1);
  }
  return `${number.toFixed(1)}%`;
}

export function peersOf(rows, brand) {
  return [...new Set(rows.filter((row) => row.is_brand && row.brand !== brand).map((row) => row.brand))].sort();
}
