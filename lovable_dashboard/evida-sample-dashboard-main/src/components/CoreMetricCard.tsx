import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface CoreMetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: "ok" | "high" | "low";
  icon: LucideIcon;
  chartData?: { date: string; value: number }[];
  trend?: string;
  yAxisDomain?: [number, number];
  healthyRange?: [number, number]; // [min, max] for healthy zone
}

const CoreMetricCard = ({
  title,
  value,
  unit,
  status,
  icon: Icon,
  chartData,
  trend,
  yAxisDomain,
  healthyRange,
}: CoreMetricCardProps) => {
  const statusConfig = {
    ok: { label: "Target", className: "bg-success-light text-success border border-success/20" },
    high: { label: "High", className: "bg-destructive-light text-destructive border border-destructive/20" },
    low: { label: "Attention", className: "bg-warning-light text-warning border border-warning/20" },
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      {/* Top row: Icon + Label on left, Status badge on right */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[status].className}`}>
          {statusConfig[status].label}
        </span>
      </div>

      {/* Middle row: Large value with inline trend */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">{value}</span>
          <span className="text-xl text-muted-foreground">{unit}</span>
        </div>
        {trend && (
          <p className="text-sm text-muted-foreground mt-2">{trend}</p>
        )}
      </div>

      {/* Bottom row: Mini chart */}
      {chartData && (
        <div className="h-32 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 0.5 }}
              />
              <YAxis
                hide
                domain={yAxisDomain}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--background))"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default CoreMetricCard;
