function FocusScoreCard({ label, score, headline, helper, accentColor = "#f97316" }) {
  const value = score ?? 0;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(value, 100));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius - 16}
              stroke="#e2e8f0"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r={radius - 16}
              stroke={accentColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-4xl font-semibold text-ink">{score ?? "--"}</p>
          <span className="text-base font-medium text-slate-500">/ 100</span>
        </div>
      </div>
      {headline ? <p className="mt-4 text-base font-semibold text-ink">{headline}</p> : null}
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default FocusScoreCard;
