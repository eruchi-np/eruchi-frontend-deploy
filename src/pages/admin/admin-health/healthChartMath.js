// Chart helpers. Moving average, display names, and which retention weeks are old enough to show.

/** Newest-heavy 3-period weighted moving average. */
export const weightedMovingAverage = (values, periods = 3) => {
  const nums = (values || []).map((value) => (Number.isFinite(Number(value)) ? Number(value) : null));
  return nums.map((_, index) => {
    let weight = 0;
    let total = 0;
    for (let offset = 0; offset < periods; offset += 1) {
      const at = index - offset;
      if (at < 0 || nums[at] == null) continue;
      const w = periods - offset;
      total += nums[at] * w;
      weight += w;
    }
    return weight ? total / weight : null;
  });
};

export const displayName = (row) => {
  if (!row) return '';
  if (row.name) return row.name;
  const full = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
  return full || row.username || row.userId || '';
};

export const RETENTION_WEEK_CUTOFF = '2026-06-18';

export const afterRetentionCutoff = (week) => String(week || '') > RETENTION_WEEK_CUTOFF;
