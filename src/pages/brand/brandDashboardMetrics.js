import {
  findRow,
  isLowBase,
  monthKey,
  shown,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import { COMPARE_COLORS, YOU, colorForBrand } from './BrandCharts';

export const GROUPS = [
  { id: 'awareness', label: 'Awareness', metrics: ['awareness_prompted', 'awareness_unprompted'] },
  { id: 'buying', label: 'Buying', metrics: ['penetration', 'trial', 'purchase_frequency', 'spend_per_trip', 'share_of_wallet'] },
  { id: 'occasions', label: 'Occasions', metrics: ['occasion_usage'] },
  { id: 'switching', label: 'Switching', metrics: ['brand_switching', 'switch_reason', 'brand_switch_flow'] },
  { id: 'loyalty', label: 'Loyalty', metrics: ['nps', 'cross_purchase_affinity', 'cross_purchase_lift'] },
  { id: 'sensory', label: 'Sensory', metrics: ['sensory_mean'] },
];

export const KPI_METRICS = ['awareness_prompted', 'penetration', 'trial', 'nps'];

/** Stable chart keys for PDF picker (must match data-export-chart). */
export const EXPORT_CHART_CATALOG = [
  {
    section: 'Awareness',
    charts: [
      { id: 'This week', label: 'This week' },
      { id: 'First mention', label: 'First mention' },
      { id: 'Prompted awareness over the weeks', label: 'Prompted awareness over the weeks' },
      { id: 'Any mention', label: 'Any mention' },
    ],
  },
  {
    section: 'Buying',
    charts: [
      { id: 'Penetration', label: 'Penetration' },
      { id: 'Trial this week', label: 'Trial this week' },
      { id: 'Purchases per month', label: 'Purchases per month' },
      { id: 'Rupees per trip', label: 'Rupees per trip' },
      { id: 'Share of wallet', label: 'Share of wallet' },
    ],
  },
  {
    section: 'Occasions',
    charts: [
      { id: 'Category occasions', label: 'Category occasions' },
      { id: 'By brand occasions', label: 'By brand occasions' },
    ],
  },
  {
    section: 'Switching',
    charts: [
      { id: 'Main brand flow', label: 'Main brand flow' },
      { id: 'Category over the weeks', label: 'Category over the weeks' },
      { id: 'Switched brand by brand', label: 'Switched brand by brand' },
      { id: 'Reduced or stopped by brand', label: 'Reduced or stopped by brand' },
      { id: 'Why people switched', label: 'Why people switched' },
      { id: 'Reasons by brand', label: 'Reasons by brand' },
    ],
  },
  {
    section: 'Loyalty',
    charts: [
      { id: 'NPS this week', label: 'NPS this week' },
      { id: 'Promoters, passives, detractors', label: 'Promoters, passives, detractors' },
      { id: 'Also bought share', label: 'Also bought share' },
      { id: 'Also bought lift', label: 'Also bought lift' },
    ],
  },
  {
    section: 'Sensory',
    charts: [
      { id: 'Sensory', label: 'Sensory' },
    ],
  },
];

export function inSpan(wave, fromMonth, toMonth) {
  const month = monthKey(wave);
  const start = fromMonth && toMonth && fromMonth > toMonth ? toMonth : fromMonth;
  const end = fromMonth && toMonth && fromMonth > toMonth ? fromMonth : toMonth;
  if (start && month < start) return false;
  if (end && month > end) return false;
  return true;
}

export function trend(rows, metric, brand, compares, item = null, fromMonth = '', toMonth = '', waves = null) {
  const waveList = Array.isArray(waves) && waves.length ? waves : wavesOf(rows);
  return waveList.filter((wave) => inSpan(wave, fromMonth, toMonth)).map((wave) => {
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
