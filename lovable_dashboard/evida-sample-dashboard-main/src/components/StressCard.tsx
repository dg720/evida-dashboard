import { Heart } from "lucide-react";

interface StressCardProps {
  status: string;
  level: "low" | "moderate" | "high";
  hrv: number;
  baseline: number;
}

const StressCard = ({ status, level, hrv, baseline }: StressCardProps) => {
  // Calculate percentage for circular progress (HRV relative to baseline)
  const percentage = Math.min((hrv / baseline) * 100, 150); // Cap at 150%
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine gradient colors based on HRV vs baseline
  const getGradientId = () => {
    if (hrv >= baseline) return "hrvGradientGood";
    if (hrv >= baseline * 0.85) return "hrvGradientModerate";
    return "hrvGradientLow";
  };

  return (
    <div className="bg-card rounded-3xl p-6 card-shadow hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">RECOVERY</p>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-3 h-3 rounded-full ${
                level === "low"
                  ? "bg-success"
                  : level === "moderate"
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
            />
            <span className="text-2xl font-semibold text-foreground">{status}</span>
          </div>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${level === "low" ? "bg-success/10" : level === "moderate" ? "bg-warning/10" : "bg-destructive/10"} flex items-center justify-center flex-shrink-0`}>
          <Heart className={`w-7 h-7 ${level === "low" ? "text-success" : level === "moderate" ? "text-warning" : "text-destructive"}`} />
        </div>
      </div>

      {/* Circular Progress for HRV */}
      <div className="flex justify-center my-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke={`url(#${getGradientId()})`}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="hrvGradientGood" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--success))" />
                <stop offset="100%" stopColor="hsl(140 60% 60%)" />
              </linearGradient>
              <linearGradient id="hrvGradientModerate" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--warning))" />
                <stop offset="100%" stopColor="hsl(35 90% 70%)" />
              </linearGradient>
              <linearGradient id="hrvGradientLow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--destructive))" />
                <stop offset="100%" stopColor="hsl(4 75% 70%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{hrv} ms</span>
            <span className="text-xs text-muted-foreground">of {baseline} ms baseline</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80 leading-relaxed text-center">HRV-based recovery indicator</p>
    </div>
  );
};

export default StressCard;
