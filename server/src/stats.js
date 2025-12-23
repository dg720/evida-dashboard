function mean(values) {
  if (!values || values.length === 0) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function variance(values) {
  if (!values || values.length === 0) {
    return null;
  }
  const avg = mean(values);
  const total = values.reduce((sum, value) => {
    const diff = value - avg;
    return sum + diff * diff;
  }, 0);
  return total / values.length;
}

function round(value, digits = 2) {
  if (value === null || value === undefined) {
    return null;
  }
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function computeStats(series, fields) {
  const stats = {};
  fields.forEach((field) => {
    const values = series
      .map((entry) => entry[field])
      .filter((value) => typeof value === "number" && !Number.isNaN(value));
    stats[field] = {
      mean: round(mean(values)),
      variance: round(variance(values)),
    };
  });
  return stats;
}

module.exports = {
  mean,
  variance,
  round,
  computeStats,
};
