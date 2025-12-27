import { Crown } from "lucide-react";

interface ReadinessCardProps {
  score: number;
  status: string;
  insight: string;
}

const ReadinessCard = ({ score, status, insight }: ReadinessCardProps) => {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-3xl p-6 card-shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">READINESS</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground">{score}</span>
            <span className="text-lg text-primary font-semibold">{status}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-7 h-7 text-primary" />
        </div>
      </div>

      {/* Circular Progress */}
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
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{score}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80 leading-relaxed">{insight}</p>
    </div>
  );
};

export default ReadinessCard;
