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

/** Legacy spellings → live metric brand names (keep in sync with backend brandClients). */
const BRAND_ALIASES = {
  Xtreme: 'X-treme',
  'Xtreme Energy': 'X-treme',
  'Himalaya Wellness': 'Himalaya',
  "L'Oreal": "L'Oréal",
  Loreal: "L'Oréal",
  Ponds: "Pond's",
};

export function canonicalBrand(brand) {
  if (typeof brand !== 'string') return '';
  const trimmed = brand.trim();
  if (!trimmed) return '';
  if (BRAND_ALIASES[trimmed]) return BRAND_ALIASES[trimmed];
  const lower = trimmed.toLowerCase();
  const hit = Object.entries(BRAND_ALIASES).find(([key]) => key.toLowerCase() === lower);
  return hit ? hit[1] : trimmed;
}

export function findRow(rows, metric, brand, wave, item = null) {
  const names = [...new Set([brand, canonicalBrand(brand)].filter(Boolean))];
  return rows.find((row) =>
    row.metric === metric
    && names.includes(row.brand)
    && row.wave_start === wave
    && (row.item || null) === (item || null)
  ) || null;
}

export function shown(row) {
  if (!row || row.value == null || Number.isNaN(Number(row.value))) return null;
  // Show suppressed early-wave figures; charts mark them as low-base / directional.
  return row.value;
}

export function isLowBase(row) {
  return row?.status === 'low_base' || row?.status === 'suppressed';
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

const ROLLUP_BRANDS = new Set([
  'ALL',
  'Others',
  'Other',
  'Local / unbranded',
  '(no main brand)',
  '(unassigned)',
]);

export function isSelectableBrand(name) {
  if (typeof name !== 'string') return false;
  const brand = name.trim();
  if (!brand) return false;
  if (ROLLUP_BRANDS.has(brand)) return false;
  if (brand.startsWith('(') && brand.endsWith(')')) return false;
  return true;
}

export function uniqueBrands(list) {
  const seen = new Set();
  const out = [];
  (list || []).forEach((name) => {
    const canon = canonicalBrand(name);
    if (!isSelectableBrand(canon) || seen.has(canon)) return;
    seen.add(canon);
    out.push(canon);
  });
  return out.sort();
}

export function brandsOf(rows) {
  return uniqueBrands(
    (rows || [])
      .filter((row) => row.is_brand)
      .map((row) => row.brand),
  );
}

export function peersOf(rows, brand) {
  const focus = canonicalBrand(brand);
  return brandsOf(rows).filter((name) => name !== focus);
}
