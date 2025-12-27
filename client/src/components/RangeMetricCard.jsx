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
  const statusLabel = status === "neutral" ? "Baseline" : status.charAt(0).toUpperCase() + status.slice(1);
  const markerPosition = Math.max(0, Math.min(percentile, 100));
  const trendDirection = trendText?.toLowerCase().startsWith("up")
    ? "up"
    : trendText?.toLowerCase().startsWith("down")
      ? "down"
      : "flat";
  const trendColor =
    trendDirection === "up" ? "#16a34a" : trendDirection === "down" ? "#ef4444" : "#94a3b8";
  const arrowStyle =
    trendDirection === "flat"
      ? null
      : {
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: `6px solid ${trendColor}`,
          transform: trendDirection === "down" ? "rotate(180deg)" : "none",
        };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
        {unit ? <span className="text-sm text-slate-500">{unit}</span> : null}
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-slate-200">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/60 to-transparent" />
        <div
          className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white bg-slate-800 shadow"
          style={{ left: `calc(${markerPosition}% - 0.5rem)` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          {trendDirection === "flat" ? null : <span style={arrowStyle} />}
          <span style={{ color: trendColor }}>{trendLabel}</span>
        </span>
        <span>{trendText}</span>
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default RangeMetricCard;
