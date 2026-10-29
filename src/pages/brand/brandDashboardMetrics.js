import {
  findRow,
  isLowBase,
  shown,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import { COMPARE_COLORS, YOU, colorForBrand } from './BrandCharts';

export const GROUPS = [
  { id: 'awareness', label: 'Awareness', metrics: ['awareness_prompted', 'awareness_unprompted'] },
  { id: 'buying', label: 'Penetration and Purchase', metrics: ['penetration', 'trial', 'purchase_frequency', 'spend_per_trip', 'share_of_wallet', 'cross_purchase_affinity', 'cross_purchase_lift'] },
  { id: 'occasions', label: 'Occasions', metrics: ['occasion_usage'] },
  { id: 'switching', label: 'Switching', metrics: ['brand_switching', 'switch_reason', 'brand_switch_flow'] },
  { id: 'loyalty', label: 'Loyalty', metrics: ['nps'] },
  { id: 'sensory', label: 'Sensory', metrics: ['sensory_mean'] },
];

export const KPI_METRICS = ['awareness_prompted', 'penetration', 'trial', 'nps'];

/** Grouped awareness bars: Top of mind → Unprompted → Prompted. */
export const AWARENESS_TYPE_SERIES = [
  { key: 'top', name: 'Top of mind', color: '#0f766e' },
  { key: 'unprompted', name: 'Unprompted', color: '#2563eb' },
  { key: 'prompted', name: 'Prompted', color: '#7c3aed' },
];

export function awarenessTypeSnapshot(rows, brands, wave) {
  return (brands || []).filter(Boolean).map((name) => {
    const top = shown(findRow(rows, 'awareness_unprompted', name, wave, 'first_mention'));
    const any = shown(findRow(rows, 'awareness_unprompted', name, wave, 'any_mention'));
    const prompted = shown(findRow(rows, 'awareness_prompted', name, wave, null));
    // Unprompted (not first) ≈ any mention minus top of mind when both exist.
    let unprompted = null;
    if (any != null && top != null) unprompted = Math.max(0, Math.round((any - top) * 10) / 10);
    else if (any != null) unprompted = any;
    return {
      name,
      top,
      unprompted,
      prompted,
    };
  });
}

export const MARKET_PEN_SERIES = [
  { key: 'awareness', name: 'Awareness', color: '#2563eb' },
  { key: 'penetration', name: 'Penetration', color: '#0f766e' },
];

/** Prompted + unprompted (any mention) when available; else prompted only. */
export function marketPenetrationSnapshot(rows, brands, wave) {
  return (brands || []).filter(Boolean).map((name) => {
    const prompted = shown(findRow(rows, 'awareness_prompted', name, wave, null));
    const any = shown(findRow(rows, 'awareness_unprompted', name, wave, 'any_mention'));
    let awareness = null;
    if (prompted != null && any != null) awareness = Math.round((prompted + any) * 10) / 10;
    else if (prompted != null) awareness = prompted;
    else if (any != null) awareness = any;
    return {
      name,
      awareness,
      penetration: shown(findRow(rows, 'penetration', name, wave, null)),
    };
  });
}

/** Stable chart keys for PDF picker (must match data-export-chart). */
export const EXPORT_CHART_CATALOG = [
  {
    section: 'Awareness',
    charts: [
      { id: 'Awareness this week', label: 'Awareness this week' },
      { id: 'Unprompted awareness over the weeks', label: 'Unprompted awareness over the weeks' },
      { id: 'Prompted awareness over the weeks', label: 'Prompted awareness over the weeks' },
    ],
  },
  {
    section: 'Penetration and Purchase',
    charts: [
      { id: 'Market Penetration', label: 'Market Penetration' },
      { id: 'Penetration over the weeks', label: 'Penetration over the weeks' },
      { id: 'Trial this week', label: 'Trial this week' },
      { id: 'Purchase Frequency', label: 'Purchase Frequency' },
      { id: 'Rupees per trip', label: 'Rupees per trip' },
      { id: 'Share of wallet', label: 'Share of wallet' },
      { id: 'Share of wallet, by buyer type', label: 'Share of wallet, by buyer type' },
      { id: 'Also bought share', label: 'Cross purchase share' },
      { id: 'Also bought lift', label: 'Cross purchase lift' },
    ],
  },
  {
    section: 'Occasions',
    charts: [
      { id: 'Occasion matrix', label: 'Occasion matrix' },
    ],
  },
  {
    section: 'Switching',
    charts: [
      { id: 'Main brand flow', label: 'Main brand flow' },
      { id: 'Category over the weeks', label: 'Category over the weeks' },
      { id: 'Brand switching tracker', label: 'Brand switching tracker' },
      { id: 'Brand switching reasons', label: 'Brand switching reasons' },
    ],
  },
  {
    section: 'Loyalty',
    charts: [
      { id: 'NPS this week', label: 'NPS this week' },
      { id: 'NPS over the weeks', label: 'NPS over the weeks' },
    ],
  },
  {
    section: 'Sensory',
    charts: [
      { id: 'Sensory', label: 'Sensory' },
    ],
  },
];

/** Inclusive week range on wave_start (YYYY-MM-DD). */
export function inSpan(wave, fromWave = '', toWave = '') {
  const start = fromWave && toWave && fromWave > toWave ? toWave : fromWave;
  const end = fromWave && toWave && fromWave > toWave ? fromWave : toWave;
  if (start && wave < start) return false;
  if (end && wave > end) return false;
  return true;
}

export function trend(rows, metric, brand, compares, item = null, fromWave = '', toWave = '', waves = null) {
  const waveList = Array.isArray(waves) && waves.length ? waves : wavesOf(rows);
  return waveList.filter((wave) => inSpan(wave, fromWave, toWave)).map((wave) => {
    const you = findRow(rows, metric, brand, wave, item);
    const point = {
      label: weekLabel(wave).replace('Week of ', ''),
      wave,
      you: shown(you),
      youLow: isLowBase(you),
    };
    compares.forEach((name, index) => {
      const other = findRow(rows, metric, name, wave, item);
      point[`c${index}`] = shown(other);
      point[`c${index}Low`] = isLowBase(other);
    });
    return point;
  });
}

export function snapshot(rows, metric, brand, compares, wave, item = null, peerMode = false) {
  return [brand, ...compares].filter(Boolean).map((name, index) => {
    const row = findRow(rows, metric, name, wave, item);
    return {
      name,
      value: shown(row),
      low: isLowBase(row),
      fill: peerMode ? colorForBrand(index) : (index === 0 ? YOU : COMPARE_COLORS[(index - 1) % COMPARE_COLORS.length]),
    };
  });
}

export function nearestWave(waves, iso) {
  if (!iso || !waves.length || iso < waves[0] || iso > waves[waves.length - 1]) return '';
  if (waves.includes(iso)) return iso;
  const target = Date.parse(`${iso}T00:00:00Z`);
  return waves.reduce((best, wave) => (
    Math.abs(Date.parse(`${wave}T00:00:00Z`) - target) < Math.abs(Date.parse(`${best}T00:00:00Z`) - target) ? wave : best
  ), waves[0]);
}

export function itemsAt(rows, metric, brandName) {
  return [...new Set(rows.filter((row) => row.metric === metric && row.brand === brandName).map((row) => row.item).filter(Boolean))];
}

export function ranked(rows, metric, brandName, wave) {
  return itemsAt(rows, metric, brandName)
    .map((item) => {
      const row = findRow(rows, metric, brandName, wave, item);
      return { name: item, value: shown(row), low: isLowBase(row) };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);
}
