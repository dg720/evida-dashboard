function StatCard({ label, value, detail, accent }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: accent ? "var(--accent-soft)" : "#e2e8f0",
            color: accent ? "var(--accent-deep)" : "#475569",
          }}
        >
          {accent ? "In focus" : "Baseline"}
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default StatCard;
