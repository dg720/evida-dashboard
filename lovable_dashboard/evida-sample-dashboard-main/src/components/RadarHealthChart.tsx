import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

const data = [
  { metric: "Sleep", value: 65, status: "focus" },
  { metric: "REM", value: 78, status: "good" },
  { metric: "Deep", value: 55, status: "focus" },
  { metric: "HRV", value: 60, status: "focus" },
  { metric: "Oxygen", value: 92, status: "strong" },
  { metric: "Body Temp", value: 88, status: "strong" },
  { metric: "Resting HR", value: 70, status: "good" },
  { metric: "Activity", value: 85, status: "strong" },
];

const CustomPolarAngleAxis = (props: any) => {
  const { payload, x, y, cx, cy } = props;
  const item = data.find(d => d.metric === payload.value);
  const color = item?.status === "strong" 
    ? "hsl(var(--success))" 
    : item?.status === "focus" 
    ? "hsl(var(--warning))"
    : "hsl(var(--muted-foreground))";
  
  const fontWeight = item?.status === "strong" || item?.status === "focus" ? "600" : "400";
  
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
      fill={color}
      fontSize={11}
      fontWeight={fontWeight}
    >
      {payload.value}
    </text>
  );
};

const RadarHealthChart = () => {
  return (
    <div className="bg-card rounded-3xl p-6 card-shadow">
      <h3 className="text-lg font-semibold text-foreground mb-4">Holistic Health Overview</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={<CustomPolarAngleAxis />}
          />
          <Radar
            name="Your Health"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="font-semibold text-success">Strong:</span>
          <span className="text-muted-foreground">Oxygen, Body Temp & Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="font-semibold text-warning">Needs focus:</span>
          <span className="text-muted-foreground">Sleep, Deep & HRV</span>
        </div>
      </div>
    </div>
  );
};

export default RadarHealthChart;
