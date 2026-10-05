/** Standardized multiple linear regression (OLS). Returns null if underdetermined. */
export function standardizedImpactWeights(rows, predictors, outcomeKey) {
  const sample = (rows || []).filter((row) => {
    if (!Number.isFinite(Number(row[outcomeKey]))) return false;
    return predictors.every((key) => Number.isFinite(Number(row[key])));
  });
  if (sample.length < predictors.length + 2) return null;

  const means = {};
  const stds = {};
  for (const key of [...predictors, outcomeKey]) {
    const values = sample.map((row) => Number(row[key]));
    const mean = values.reduce((sum, n) => sum + n, 0) / values.length;
    const variance = values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length;
    means[key] = mean;
    stds[key] = Math.sqrt(variance) || 1;
  }

  const X = sample.map((row) => predictors.map((key) => (Number(row[key]) - means[key]) / stds[key]));
  const y = sample.map((row) => (Number(row[outcomeKey]) - means[outcomeKey]) / stds[outcomeKey]);
  const k = predictors.length;
  const xtx = Array.from({ length: k }, () => Array(k).fill(0));
  const xty = Array(k).fill(0);
  for (let i = 0; i < X.length; i += 1) {
    for (let a = 0; a < k; a += 1) {
      xty[a] += X[i][a] * y[i];
      for (let b = 0; b < k; b += 1) xtx[a][b] += X[i][a] * X[i][b];
    }
  }

  const beta = solveLinear(xtx, xty);
  if (!beta) return null;
  return predictors.map((key, index) => ({
    variable: key,
    weight: beta[index],
    n: sample.length,
  }));
}

const solveLinear = (matrix, vector) => {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    if (pivot !== col) [a[col], a[pivot]] = [a[pivot], a[col]];
    const div = a[col][col];
    for (let j = col; j <= n; j += 1) a[col][j] /= div;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j += 1) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
};
