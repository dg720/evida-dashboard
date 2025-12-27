function StatCard({ label, value, detail, accent, className = "" }) {
  return (
    <div className={["glass-card rounded-2xl p-5", className].join(" ").trim()}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default StatCard;
