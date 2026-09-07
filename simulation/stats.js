// Mean/stdev/percentile helpers for the report -- no external stats
// library (spec §9).
export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function variance(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

export function stdev(values) {
  return Math.sqrt(variance(values));
}

export function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function sum(values) {
  return values.reduce((s, v) => s + v, 0);
}

export function fmt(n, digits = 1) {
  if (!Number.isFinite(n)) return String(n);
  return n.toFixed(digits);
}
