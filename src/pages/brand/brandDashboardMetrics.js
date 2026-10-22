import {
  findRow,
  monthKey,
  shown,
  weekLabel,
  wavesOf,
} from './brandMetrics';
import { COMPARE_COLORS, YOU } from './BrandCharts';

export const GROUPS = [
  { id: 'awareness', label: 'Awareness', metrics: ['awareness_prompted', 'awareness_unprompted'] },
  { id: 'buying', label: 'Buying', metrics: ['penetration', 'trial', 'purchase_frequency', 'spend_per_trip', 'share_of_wallet'] },
  { id: 'occasions', label: 'Occasions', metrics: ['occasion_usage'] },
  { id: 'switching', label: 'Switching', metrics: ['brand_switching', 'switch_reason'] },
  { id: 'loyalty', label: 'Loyalty', metrics: ['nps', 'cross_purchase_affinity', 'cross_purchase_lift'] },
  { id: 'sensory', label: 'Sensory', metrics: ['sensory_mean'] },
];

export const KPI_METRICS = ['awareness_prompted', 'penetration', 'trial', 'nps'];

export function inSpan(wave, fromMonth, toMonth) {
  const month = monthKey(wave);
  const start = fromMonth && toMonth && fromMonth > toMonth ? toMonth : fromMonth;
  const end = fromMonth && toMonth && fromMonth > toMonth ? fromMonth : toMonth;
  if (start && month < start) return false;
  if (end && month > end) return false;
  return true;
}

export function trend(rows, metric, brand, compares, item = null, fromMonth = '', toMonth = '') {
  return wavesOf(rows).filter((wave) => inSpan(wave, fromMonth, toMonth)).map((wave) => {
    const you = findRow(rows, metric, brand, wave, item);
    const point = {
      label: weekLabel(wave).replace('Week of ', ''),
      wave,
      you: shown(you),
      youLow: you?.status === 'low_base',
    };
    compares.forEach((name, index) => {
      const other = findRow(rows, metric, name, wave, item);
      point[`c${index}`] = shown(other);
      point[`c${index}Low`] = other?.status === 'low_base';
    });
    return point;
  });
}

export function snapshot(rows, metric, brand, compares, wave, item = null) {
  return [brand, ...compares].filter(Boolean).map((name, index) => {
    const row = findRow(rows, metric, name, wave, item);
    return {
      name,
      value: shown(row),
      low: row?.status === 'low_base',
      fill: index === 0 ? YOU : COMPARE_COLORS[index - 1],
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
      return { name: item, value: shown(row), low: row?.status === 'low_base' };
    })
    .filter((row) => row.value != null)
    .sort((a, b) => b.value - a.value);
}
