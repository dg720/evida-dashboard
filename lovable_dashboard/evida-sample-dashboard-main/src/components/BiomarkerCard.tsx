import { TrendingUp, TrendingDown } from "lucide-react";

interface BiomarkerCardProps {
  title: string;
  value: string;
  unit: string;
  status: "target" | "ok" | "elevated" | "high";
  insight: string;
  rangePosition: number; // 0-100
  trend?: "up" | "down" | "stable";
}

const BiomarkerCard = ({
  title,
  value,
  unit,
  status,
  insight,
  rangePosition,
  trend = "stable",
}: BiomarkerCardProps) => {
  const statusConfig = {
    target: { label: "Target", color: "bg-success/10", dotColor: "bg-success", textColor: "text-success" },
    ok: { label: "OK", color: "bg-success/10", dotColor: "bg-success", textColor: "text-success" },
    elevated: {
      label: "Elevated",
      color: "bg-warning/10",
      dotColor: "bg-warning",
      textColor: "text-warning",
    },
    high: { label: "High", color: "bg-destructive/10", dotColor: "bg-destructive", textColor: "text-destructive" },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-card rounded-3xl p-6 card-shadow hover:shadow-xl transition-all group min-h-[280px] flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} ${config.textColor}`}
          >
            {config.label}
          </span>
        </div>
        {trend !== "stable" && (
          <div className={`flex items-center gap-1 ${trend === "down" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">3 mo</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>

      {/* Range Bar with Gradient */}
      <div className="relative h-3 mb-4 rounded-full overflow-hidden bg-gradient-to-r from-[hsl(140_60%_75%)] via-[hsl(45_100%_75%)] via-[hsl(35_100%_75%)] to-[hsl(4_80%_75%)]">
        <div
          className="absolute top-0 w-0.5 h-full bg-white shadow-md"
          style={{ left: `${rangePosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{insight}</p>
    </div>
  );
};

export default BiomarkerCard;
