import { Moon } from "lucide-react";

interface SleepCardProps {
  score: number;
  duration: string;
  status: string;
}

const SleepCard = ({ score, duration, status }: SleepCardProps) => {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-3xl p-6 card-shadow hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">SLEEP</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground">{score}</span>
            <span className="text-lg text-primary font-semibold">{status}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Moon className="w-7 h-7 text-primary" />
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
              stroke="url(#sleepGradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-light))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{duration}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80 leading-relaxed text-center">Quality sleep supports recovery</p>
    </div>
  );
};

export default SleepCard;
