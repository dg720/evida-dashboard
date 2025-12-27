function FocusScoreCard({ label, score, caption, helper, accentColor = "#f97316" }) {
  const value = score ?? 0;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(value, 100));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-28 w-28">
          <svg className="h-28 w-28 -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={accentColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-display text-2xl font-semibold text-ink">
              {score ?? "--"}
              <span className="text-sm font-medium text-slate-500">/100</span>
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {caption ? <p className="text-base font-semibold text-ink">{caption}</p> : null}
          {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default FocusScoreCard;
