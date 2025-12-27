export function formatNumber(value, suffix = "") {
  if (value === null || value === undefined) {
    return "--";
  }
  return `${value}${suffix}`;
}

export function getLatestDays(series, count = 14) {
  if (!Array.isArray(series)) {
    return [];
  }
  return series.slice(-count);
}

export function groupByWeek(series) {
  const buckets = {};
  series.forEach((entry) => {
    const date = new Date(entry.date);
    const week = `${date.getUTCFullYear()}-W${getWeekNumber(date)}`;
    buckets[week] = (buckets[week] || 0) + (entry.steps || 0);
  });
  return Object.entries(buckets).map(([week, steps]) => ({
    week,
    steps,
  }));
}

function getWeekNumber(date) {
  const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
}

export function computeReadiness(summary) {
  if (!summary) {
    return null;
  }
  const sleep = summary.average_sleep_hours || 0;
  const stress = summary.stress_index || 0;
  const restingHr = summary.average_resting_hr || 0;
  const sleepScore = Math.min((sleep / 8) * 100, 100);
  const stressScore = Math.max(0, 100 - stress);
  const hrScore = restingHr ? Math.max(0, 100 - (restingHr - 50) * 1.5) : 50;
  return Math.round((sleepScore * 0.4 + stressScore * 0.35 + hrScore * 0.25) * 10) / 10;
}

export function computeSleepScore(summary) {
  if (!summary) {
    return null;
  }
  const sleep = summary.average_sleep_hours || 0;
  const efficiency = summary.sleep_efficiency || 0;
  const durationScore = Math.min((sleep / 8) * 100, 100);
  const efficiencyScore = Math.min(efficiency * 100, 100);
  return Math.round((durationScore * 0.6 + efficiencyScore * 0.4) * 10) / 10;
}
