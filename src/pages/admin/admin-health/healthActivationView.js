// Shared counts for activation and surveys. Shares, Nepal week keys, and how long activation took.

const BAR_IDS = ['registered', 'step2', 'pc1', 'pc2', 'firstSurvey', 'activated'];

export const shareOf = (numerator, denominator) => ({
  numerator,
  denominator,
  rate: denominator ? numerator / denominator : null,
});

/** Whole minutes/hours/days for activation medians. */
export const formatActivationDuration = (ms) => {
  if (ms == null || Number.isNaN(Number(ms))) return '–';
  const totalMinutes = Math.max(0, Math.round(Number(ms) / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (days === 0 && (hours === 0 || minutes > 0)) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  }
  return parts.join(' ') || '0 minutes';
};

/** Nepal Monday week key from a Nepal calendar day key (YYYY-MM-DD). */
export const weekKeyFromDayKey = (dayKey) => {
  const [year, month, day] = String(dayKey || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const utc = Date.UTC(year, month - 1, day);
  const dow = new Date(utc).getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  const monday = new Date(utc - back * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
};

export const sumWaterfallBars = (weeks) => {
  const cohortSize = (weeks || []).reduce((total, week) => total + (week.cohortSize || 0), 0);
  const bars = BAR_IDS.map((id) => {
    const count = (weeks || []).reduce((total, week) => {
      const bar = (week.bars || []).find((row) => row.id === id);
      return total + (bar?.count || 0);
    }, 0);
    return { id, count, pctOfCohort: shareOf(count, cohortSize) };
  });
  return { cohortSize, bars };
};

export const registrationsByWeek = (days) => {
  const map = new Map();
  for (const day of days || []) {
    const week = weekKeyFromDayKey(day.day);
    if (!week) continue;
    if (!map.has(week)) map.set(week, { week, total: 0, email: 0, google: 0 });
    const row = map.get(week);
    row.total += day.total || 0;
    row.email += day.email || 0;
    row.google += day.google || 0;
  }
  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week));
};
