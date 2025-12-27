import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppContext } from "../context/AppContext.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import PersonaSelector from "../components/PersonaSelector.jsx";
import StatCard from "../components/StatCard.jsx";
import TabButton from "../components/TabButton.jsx";
import RangeMetricCard from "../components/RangeMetricCard.jsx";
import FocusScoreCard from "../components/FocusScoreCard.jsx";
import {
  computeHeartHealthScore,
  computeReadiness,
  computeSleepScore,
  formatNumber,
  getLatestDays,
  groupByWeek,
} from "../lib/metrics.js";

const tabs = ["Overview", "Activity", "Sleep", "Stress & Recovery", "Benchmarking"];

function Dashboard() {
  const { series, summary, currentPersonaId, theme } = useAppContext();
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const latestSeries = useMemo(() => getLatestDays(series, 14), [series]);
  const weeklySteps = useMemo(() => groupByWeek(series), [series]);
  const readiness = useMemo(() => computeReadiness(summary), [summary]);
  const sleepScore = useMemo(() => computeSleepScore(summary), [summary]);
  const heartHealthScore = useMemo(
    () => computeHeartHealthScore(currentPersonaId, summary),
    [currentPersonaId, summary]
  );

  if (!series.length) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="font-display text-2xl font-semibold text-ink">No data loaded</p>
        <p className="mt-3 text-sm text-slate-500">
          Select a persona on the home page to populate the dashboard.
        </p>
      </div>
    );
  }

  const trendLabel = series.length >= 90 ? "3 mo trend" : "30-day trend";
  const trends = useMemo(() => {
    const windowSize = Math.min(series.length, 60);
    const half = Math.floor(windowSize / 2);
    if (!half) {
      return {};
    }

    const recent = series.slice(-half);
    const prior = series.slice(-(half * 2), -half);
    const average = (entries, key) => {
      if (!entries.length) {
        return 0;
      }
      return entries.reduce((sum, entry) => sum + (entry[key] || 0), 0) / entries.length;
    };
    const buildTrend = (key) => {
      const recentAvg = average(recent, key);
      const priorAvg = average(prior, key);
      if (!priorAvg) {
        return { direction: "flat", changePct: 0 };
      }
      const changePct = ((recentAvg - priorAvg) / priorAvg) * 100;
      const direction = Math.abs(changePct) < 3 ? "flat" : changePct > 0 ? "up" : "down";
      return { direction, changePct };
    };

    return {
      steps: buildTrend("steps"),
      sleep_hours: buildTrend("sleep_hours"),
      resting_hr: buildTrend("resting_hr"),
      hrv_rmssd: buildTrend("hrv_rmssd"),
      stress_index: buildTrend("stress_index"),
    };
  }, [series]);

  const formatTrend = (trend) => {
    if (!trend) {
      return "No change";
    }
    const magnitude = Math.abs(trend.changePct);
    if (!Number.isFinite(magnitude) || magnitude < 0.1) {
      return "Flat";
    }
    if (trend.direction === "up") {
      return `Up ${magnitude.toFixed(1)}%`;
    }
    if (trend.direction === "down") {
      return `Down ${magnitude.toFixed(1)}%`;
    }
    return "Flat";
  };

  const radarData = useMemo(() => {
    const metrics = [
      {
        key: "average_steps",
        label: "Steps",
        baseline: 8000,
        higherBetter: true,
      },
      {
        key: "average_sleep_hours",
        label: "Sleep",
        baseline: 7.5,
        higherBetter: true,
      },
      {
        key: "stress_index",
        label: "Stress",
        baseline: 40,
        higherBetter: false,
      },
      {
        key: "average_resting_hr",
        label: "Resting HR",
        baseline: 65,
        higherBetter: false,
      },
      {
        key: "hrv_rmssd",
        label: "HRV",
        baseline: 50,
        higherBetter: true,
      },
    ];

    return metrics.map((metric) => {
      const rawValue = summary ? summary[metric.key] : 0;
      const ratio = metric.higherBetter
        ? rawValue / metric.baseline
        : metric.baseline / (rawValue || metric.baseline);
      const score = Math.max(0, Math.min(ratio * 100, 150));
      return {
        metric: metric.label,
        baseline: 100,
        current: score,
      };
    });
  }, [summary]);

  const rangeCards = useMemo(() => {
    const toPercentile = (value, min, max) => {
      if (value === null || value === undefined) {
        return 0;
      }
      if (max === min) {
        return 0;
      }
      const raw = ((value - min) / (max - min)) * 100;
      return Math.max(0, Math.min(raw, 100));
    };
    const getStatus = (value, minTarget, maxTarget) => {
      if (value === null || value === undefined) {
        return "neutral";
      }
      if (value < minTarget) {
        return "low";
      }
      if (value > maxTarget) {
        return "high";
      }
      return "target";
    };

    const configs = [
      {
        key: "average_resting_hr",
        seriesKey: "resting_hr",
        label: "Resting HR",
        unit: "bpm",
        min: 45,
        max: 85,
        target: [55, 70],
        detail: "Lower is generally better for recovery.",
      },
      {
        key: "stress_index",
        seriesKey: "stress_index",
        label: "Stress index",
        unit: "/100",
        min: 15,
        max: 85,
        target: [20, 45],
        detail: "Lower values suggest calmer days.",
      },
      {
        key: "average_sleep_hours",
        seriesKey: "sleep_hours",
        label: "Sleep duration",
        unit: "h",
        min: 5,
        max: 9,
        target: [7, 8.5],
        detail: "Target range for adults: 7-9 hours.",
      },
      {
        key: "hrv_rmssd",
        seriesKey: "hrv_rmssd",
        label: "HRV (RMSSD)",
        unit: "ms",
        min: 20,
        max: 90,
        target: [40, 70],
        detail: "Higher values indicate better recovery.",
      },
    ];

    return configs.map((config) => {
      const value = summary ? summary[config.key] : null;
      return {
        label: config.label,
        value: formatNumber(value, ""),
        unit: config.unit,
        status: getStatus(value, config.target[0], config.target[1]),
        percentile: toPercentile(value, config.min, config.max),
        trendText: formatTrend(trends[config.seriesKey]),
        detail: config.detail,
      };
    });
  }, [summary, trends]);

  const formatRounded = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }
    return Math.round(value);
  };

  const formatOneDecimal = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }
    return Number(value).toFixed(1);
  };

  const formatMonthDay = (value) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${month}/${day}`;
  };

  const isActiveAlex = currentPersonaId === "active-alex";
  const stepsFill = isActiveAlex ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)";

  const scoreBand = (value) => {
    if (value === null || value === undefined) {
      return "Unknown";
    }
    if (value >= 80) {
      return "Optimal";
    }
    if (value >= 65) {
      return "Steady";
    }
    if (value >= 50) {
      return "Elevated";
    }
    return "High";
  };

  const stressBand = (value) => {
    if (value === null || value === undefined) {
      return "Unknown";
    }
    if (value <= 35) {
      return "Calm";
    }
    if (value <= 55) {
      return "Balanced";
    }
    if (value <= 70) {
      return "Elevated";
    }
    return "High";
  };

  const focusHeadlines = {
    sleep: {
      Optimal: "Restorative sleep",
      Steady: "Solid recovery",
      Elevated: "Sleep could improve",
      High: "Prioritize rest",
      Unknown: "Sleep data missing",
    },
    heart: {
      Optimal: "Heart health strong",
      Steady: "Stable heart health",
      Elevated: "Watch recovery load",
      High: "Recovery needs focus",
      Unknown: "Heart score missing",
    },
    stress: {
      Calm: "Calm baseline",
      Balanced: "Stress in check",
      Elevated: "Stress building",
      High: "High stress load",
      Unknown: "Stress data missing",
    },
    recovery: {
      Optimal: "Ready for more",
      Steady: "Recovery on track",
      Elevated: "Ease intensity",
      High: "Recovery needed",
      Unknown: "Recovery data missing",
    },
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Daily trends, recovery signals, and persona comparisons."
        action={<PersonaSelector />}
      />

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <TabButton key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-8">
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-slate-500">In Focus</p>
              <p className="font-display text-xl font-semibold text-ink">
                High-level health signals for today
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FocusScoreCard
                label="Sleep score"
                score={sleepScore}
                headline={focusHeadlines.sleep[scoreBand(sleepScore)]}
                helper="Based on sleep duration + efficiency."
                accentColor={theme?.accent}
              />
              <FocusScoreCard
                label="Heart health"
                score={heartHealthScore}
                headline={focusHeadlines.heart[scoreBand(heartHealthScore)]}
                helper="Synthesized from recovery signals."
                accentColor={theme?.accent}
              />
              <FocusScoreCard
                label="Stress index"
                score={summary?.stress_index ? Math.round(summary.stress_index) : null}
                headline={focusHeadlines.stress[stressBand(summary?.stress_index)]}
                helper="Track workload and recovery balance."
                accentColor={theme?.accent}
              />
              <FocusScoreCard
                label="Recovery readiness"
                score={readiness ? Math.round(readiness) : null}
                headline={focusHeadlines.recovery[scoreBand(readiness)]}
                helper="Composite recovery indicator."
                accentColor={theme?.accent}
              />
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-slate-500">At a glance</p>
              <p className="font-display text-xl font-semibold text-ink">
                Key daily metrics that shape your week
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <StatCard
                label="Daily steps"
                value={formatNumber(formatRounded(summary?.average_steps), "")}
                detail="Target: 8-10k steps/day"
              />
              <StatCard
                label="Sleep duration"
                value={formatNumber(formatOneDecimal(summary?.average_sleep_hours), " h")}
                detail="Recommended: 7-9 hours"
              />
              <StatCard
                label="Calories burned"
                value={formatNumber(formatRounded(summary?.calories_burned), " kcal")}
                detail="Daily energy output"
              />
              <StatCard
                label="Active minutes"
                value={formatNumber(formatRounded(summary?.active_minutes), " min")}
                detail="Movement across the day"
              />
              <StatCard
                label="HRV (RMSSD)"
                value={formatNumber(formatRounded(summary?.hrv_rmssd), " ms")}
                detail="Higher is typically better"
              />
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Trends</p>
              <p className="font-display text-xl font-semibold text-ink">
                Time-series signals from the last two weeks
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass-card rounded-2xl p-6">
                <p className="text-sm font-semibold uppercase text-slate-500">Steps trend</p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer>
                    <AreaChart data={latestSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="steps"
                        stroke="var(--accent)"
                        fill={stepsFill}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <p className="text-sm font-semibold uppercase text-slate-500">Sleep duration</p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer>
                    <AreaChart data={latestSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="sleep_hours"
                        stroke="#0f766e"
                        fill="rgba(15, 118, 110, 0.12)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Steps</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <AreaChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="steps"
                    stroke="var(--accent)"
                    fill={stepsFill}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Active minutes</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <AreaChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="active_minutes"
                    stroke="#0f766e"
                    fill="rgba(15, 118, 110, 0.12)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <p className="text-sm font-semibold uppercase text-slate-500">Weekly totals</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <BarChart data={weeklySteps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="steps" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Sleep" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Sleep stages</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <BarChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sleep_stage_light" stackId="sleep" fill="var(--accent-soft)" />
                  <Bar dataKey="sleep_stage_deep" stackId="sleep" fill="var(--accent-deep)" />
                  <Bar dataKey="sleep_stage_rem" stackId="sleep" fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid h-full grid-rows-2 gap-4">
            <StatCard
              label="Sleep efficiency"
              value={formatNumber(summary?.sleep_efficiency, "")}
              detail="Healthy range: 0.85+"
              accent
              className="h-full"
            />
            <StatCard
              label="Total sleep (avg)"
              value={formatNumber(summary?.average_sleep_hours, " h")}
              detail="Aim for 7-9 hours"
              className="h-full"
            />
          </div>
        </div>
      )}

      {activeTab === "Stress & Recovery" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Stress index</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <AreaChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                  <YAxis domain={[0, 100]} tickCount={6} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="stress_index"
                    fill="rgba(239, 68, 68, 0.12)"
                    stroke="#ef4444"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">HRV (RMSSD)</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <AreaChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatMonthDay} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hrv_rmssd"
                    fill="rgba(22, 163, 74, 0.12)"
                    stroke="#16a34a"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <p className="text-sm font-semibold uppercase text-slate-500">Recovery readiness</p>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-display font-semibold text-ink">{readiness || "--"}</p>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accentDeep">
                  Target 70+
                </span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-accent"
                  style={{ width: `${Math.min(readiness || 0, 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                High readiness means you are likely recovered for training. Lower scores suggest
                easing intensity.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Benchmarking" && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm font-semibold uppercase text-slate-500">Performance radar</p>
              <p className="mt-2 text-sm text-slate-500">
                The hatched area represents the baseline benchmark.
              </p>
              <div className="mt-6 h-[26rem]">
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Baseline"
                      dataKey="baseline"
                      stroke="#94a3b8"
                      fill="url(#baselineHatch)"
                      fillOpacity={0.35}
                    />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.35}
                    />
                    <Tooltip />
                    <defs>
                      <pattern id="baselineHatch" width="6" height="6" patternUnits="userSpaceOnUse">
                        <path d="M0 6L6 0" stroke="#94a3b8" strokeWidth="1" />
                      </pattern>
                    </defs>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-sm font-semibold text-ink">Steps are below baseline</p>
                  <p className="mt-2 text-xs text-slate-500">
                    You are averaging fewer steps than the benchmark range. Aim for one extra
                    15-minute walk to close the gap.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-sm font-semibold text-ink">HRV is trending stronger</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Higher HRV suggests better recovery versus baseline. Maintain consistent sleep
                    timing to keep momentum.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {rangeCards.map((card) => (
                <RangeMetricCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  unit={card.unit}
                  status={card.status}
                  percentile={card.percentile}
                  trendLabel={trendLabel}
                  trendText={card.trendText}
                  detail={card.detail}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
