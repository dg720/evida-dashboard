import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Dot } from "recharts";

const data = [
  { day: "Tue", deep: 2, light: 1.5, rem: 1, total: 4.5 },
  { day: "Wed", deep: 2.5, light: 1.8, rem: 1.2, total: 5.5 },
  { day: "Thu", deep: 3, light: 2, rem: 2, total: 7, highlight: true },
  { day: "Fri", deep: 0.8, light: 0.6, rem: 0.4, total: 1.8 },
  { day: "Sat", deep: 1.5, light: 1, rem: 1, total: 3.5 },
];

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.highlight) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2} />
      </g>
    );
  }
  return null;
};

const SleepTrendChart = () => {
  return (
    <div className="bg-card rounded-3xl p-6 card-shadow h-full flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-6">Sleep Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Healthy zone (7-9 hours) */}
          <defs>
            <pattern id="healthyZone" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="hsl(var(--success))" opacity="0.05" />
            </pattern>
          </defs>
          <ReferenceLine y={7} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={9} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{
              value: "Hours",
              angle: -90,
              position: "insideLeft",
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            fill="url(#sleepGradient)"
            strokeWidth={2}
            dot={<CustomDot />}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-6 p-4 bg-success/5 rounded-lg border border-success/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-success">Peak performance:</span> Thursday showed optimal sleep (7h).
          Aim for 7-9 hours consistently.
        </p>
      </div>
    </div>
  );
};

export default SleepTrendChart;
