import { Flame } from "lucide-react";

interface ActivityCardProps {
  percentage: number;
  current: string;
  goal: string;
}

const ActivityCard = ({ percentage, current, goal }: ActivityCardProps) => {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card rounded-3xl p-6 card-shadow hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">ACTIVITY</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground">{percentage}</span>
            <span className="text-2xl text-muted-foreground">%</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
          <Flame className="w-7 h-7 text-secondary" />
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
              stroke="url(#activityGradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--secondary))" />
                <stop offset="100%" stopColor="hsl(var(--secondary-light))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{current}</span>
            <span className="text-xs text-muted-foreground">of {goal}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/80 leading-relaxed text-center">Keep moving to reach your goal</p>
    </div>
  );
};

export default ActivityCard;
