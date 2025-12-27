function StatCard({ label, value, detail, accent }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default StatCard;
