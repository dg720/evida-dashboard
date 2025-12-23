"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const weeklySteps = [
  { day: "Mon", steps: 8200, change: 5 },
  { day: "Tue", steps: 9100, change: 11 },
  { day: "Wed", steps: 7500, change: -8 },
  { day: "Thu", steps: 10200, change: 24 },
  { day: "Fri", steps: 8900, change: 9 },
  { day: "Sat", steps: 9500, change: 16 },
  { day: "Sun", steps: 10800, change: 32 },
]

const hrZones = [
  { time: "6am", resting: 62, moderate: 0, high: 0 },
  { time: "9am", resting: 65, moderate: 0, high: 0 },
  { time: "12pm", resting: 0, moderate: 95, high: 0 },
  { time: "3pm", resting: 68, moderate: 0, high: 0 },
  { time: "6pm", resting: 0, moderate: 110, high: 145 },
  { time: "9pm", resting: 64, moderate: 0, high: 0 },
]

const sleepStages = [
  { night: "Mon", deep: 90, light: 180, rem: 75, awake: 15 },
  { night: "Tue", deep: 85, light: 190, rem: 70, awake: 20 },
  { night: "Wed", deep: 95, light: 175, rem: 80, awake: 10 },
  { night: "Thu", deep: 80, light: 185, rem: 65, awake: 25 },
  { night: "Fri", deep: 92, light: 182, rem: 78, awake: 12 },
  { night: "Sat", deep: 100, light: 170, rem: 85, awake: 8 },
  { night: "Sun", deep: 88, light: 188, rem: 72, awake: 18 },
]

const sleepDuration = [
  { night: "Mon", hours: 7.2, recommended: 8 },
  { night: "Tue", hours: 6.8, recommended: 8 },
  { night: "Wed", hours: 7.5, recommended: 8 },
  { night: "Thu", hours: 6.5, recommended: 8 },
  { night: "Fri", hours: 7.8, recommended: 8 },
  { night: "Sat", hours: 8.2, recommended: 8 },
  { night: "Sun", hours: 7.3, recommended: 8 },
]

const stressData = [
  { day: "Mon", stress: 35 },
  { day: "Tue", stress: 48 },
  { day: "Wed", stress: 42 },
  { day: "Thu", stress: 65 },
  { day: "Fri", stress: 52 },
  { day: "Sat", stress: 28 },
  { day: "Sun", stress: 32 },
]

const radarData = [
  { metric: "Stress", value: 58, average: 50 },
  { metric: "HRV", value: 72, average: 65 },
  { metric: "Activity", value: 85, average: 70 },
  { metric: "Sleep", value: 78, average: 75 },
  { metric: "Recovery", value: 68, average: 60 },
]

export function ChartsSection() {
  return (
    <Tabs defaultValue="activity" className="space-y-6">
      <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="sleep">Sleep</TabsTrigger>
        <TabsTrigger value="stress">Stress & Recovery</TabsTrigger>
        <TabsTrigger value="comparison">Comparison</TabsTrigger>
      </TabsList>

      {/* Activity Tab */}
      <TabsContent value="activity" className="space-y-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weekly Step Count</CardTitle>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download chart</span>
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklySteps}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" className="text-xs" />
                <YAxis stroke="hsl(var(--muted-foreground))" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Bar dataKey="steps" fill="#008080" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Heart Rate Zones</CardTitle>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hrZones}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" className="text-xs" />
                <YAxis stroke="hsl(var(--muted-foreground))" className="text-xs" domain={[0, 160]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="resting"
                  stroke="#008080"
                  strokeWidth={3}
                  name="Resting"
                  dot={{ fill: "#008080", r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="moderate"
                  stroke="#00AFAF"
                  strokeWidth={3}
                  name="Moderate"
                  dot={{ fill: "#00AFAF", r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="#E2725B"
                  strokeWidth={3}
                  name="High Intensity"
                  dot={{ fill: "#E2725B", r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sleep Tab */}
      <TabsContent value="sleep" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sleep Stages</CardTitle>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sleepStages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="night" stroke="hsl(var(--muted-foreground))" className="text-xs" />
                  <YAxis stroke="hsl(var(--muted-foreground))" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="deep" stackId="a" fill="#008080" name="Deep" />
                  <Bar dataKey="light" stackId="a" fill="#00AFAF" name="Light" />
                  <Bar dataKey="rem" stackId="a" fill="#5FCFCF" name="REM" />
                  <Bar dataKey="awake" stackId="a" fill="#E2725B" name="Awake" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sleep Duration Trend</CardTitle>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sleepDuration}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="night" stroke="hsl(var(--muted-foreground))" className="text-xs" />
                  <YAxis stroke="hsl(var(--muted-foreground))" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#008080"
                    fill="#008080"
                    fillOpacity={0.6}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="recommended"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    name="Recommended"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Stress & Recovery Tab */}
      <TabsContent value="stress" className="space-y-6">
        <Card className="border-l-4 border-l-accent shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daily Stress Scores</CardTitle>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" className="text-xs" />
                <YAxis stroke="hsl(var(--muted-foreground))" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="#E2725B"
                  strokeWidth={3}
                  dot={{ fill: "#E2725B", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Comparison Tab */}
      <TabsContent value="comparison" className="space-y-6">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Health Metrics Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare your health metrics against population averages to understand your performance
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={450}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <PolarAngleAxis
                    dataKey="metric"
                    stroke="hsl(var(--foreground))"
                    className="text-sm font-medium"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <PolarRadiusAxis
                    stroke="hsl(var(--muted-foreground))"
                    className="text-xs"
                    angle={90}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                      padding: "12px",
                    }}
                  />
                  <Radar
                    name="Your Score"
                    dataKey="value"
                    stroke="#008080"
                    fill="#008080"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Average"
                    dataKey="average"
                    stroke="#00AFAF"
                    fill="#00AFAF"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "24px",
                      fontSize: "14px",
                    }}
                    iconType="circle"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
