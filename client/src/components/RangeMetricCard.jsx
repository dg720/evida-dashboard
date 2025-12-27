const STATUS_STYLES = {
  target: "bg-emerald-100 text-emerald-700",
  low: "bg-sky-100 text-sky-700",
  high: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-200 text-slate-600",
};

function RangeMetricCard({
  label,
  value,
  unit,
  status = "neutral",
  percentile = 0,
  trendLabel,
  trendText,
  detail,
}) {
  const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.neutral;
  const markerPosition = Math.max(0, Math.min(percentile, 100));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
          {status === "neutral" ? "Baseline" : status}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
        {unit ? <span className="text-sm text-slate-500">{unit}</span> : null}
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-slate-200">
        <div
          className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white bg-accent shadow"
          style={{ left: `calc(${markerPosition}% - 0.5rem)` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{trendLabel}</span>
        <span>{trendText}</span>
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default RangeMetricCard;
