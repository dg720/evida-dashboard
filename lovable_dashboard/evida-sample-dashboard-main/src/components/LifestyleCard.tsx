import { Moon, Footprints, Heart, FlaskConical, Activity, ChevronRight } from "lucide-react";

interface LifestyleCardProps {
  title: string;
  value: string;
  unit: string;
  status: "target" | "ok" | "elevated" | "high";
}

const iconMap: Record<string, React.ReactNode> = {
  Sleep: <Moon className="w-5 h-5 text-primary" />,
  Activity: <Footprints className="w-5 h-5 text-secondary" />,
  "Resting HR": <Heart className="w-5 h-5 text-destructive" />,
  Iron: <FlaskConical className="w-5 h-5 text-warning" />,
  AST: <Activity className="w-5 h-5 text-success" />,
};

const LifestyleCard = ({ title, value, unit, status }: LifestyleCardProps) => {
  const statusConfig = {
    target: { label: "Target", bg: "bg-success-light", text: "text-success" },
    ok: { label: "OK", bg: "bg-success-light", text: "text-success" },
    elevated: { label: "OK", bg: "bg-warning-light", text: "text-warning" },
    high: { label: "High", bg: "bg-destructive-light", text: "text-destructive" },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-card rounded-2xl p-5 card-shadow hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20 cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            {iconMap[title] || <Activity className="w-5 h-5 text-primary" />}
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default LifestyleCard;
