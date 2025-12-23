import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
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
import { apiFetch } from "../lib/api.js";
import { computeReadiness, formatNumber, getLatestDays, groupByWeek } from "../lib/metrics.js";

const tabs = ["Overview", "Activity", "Sleep", "Stress & Recovery", "Comparison"];

function Dashboard() {
  const { personas, currentPersonaId, series, summary } = useAppContext();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [comparisonId, setComparisonId] = useState("");
  const [comparisonSummary, setComparisonSummary] = useState(null);

  const latestSeries = useMemo(() => getLatestDays(series, 14), [series]);
  const weeklySteps = useMemo(() => groupByWeek(series), [series]);
  const readiness = useMemo(() => computeReadiness(summary), [summary]);
  const fallbackComparisonId = useMemo(() => {
    const fallback = personas.find((persona) => persona.id !== currentPersonaId);
    return fallback ? fallback.id : "";
  }, [personas, currentPersonaId]);
  const effectiveComparisonId = comparisonId || fallbackComparisonId;

  useEffect(() => {
    async function loadComparison() {
      if (!effectiveComparisonId) {
        return;
      }
      const data = await apiFetch(`/persona/${effectiveComparisonId}/data`);
      setComparisonSummary(data.summary);
    }
    loadComparison();
  }, [effectiveComparisonId]);

  if (!series.length) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="font-display text-2xl font-semibold text-ink">No data loaded</p>
        <p className="mt-3 text-sm text-slate-500">
          Select a persona on the home page or upload your own data to populate the dashboard.
        </p>
      </div>
    );
  }

  const readinessChart = [
    { name: "Readiness", value: readiness || 0, fill: "var(--accent)" },
  ];

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
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Daily steps"
              value={formatNumber(summary?.average_steps, "")}
              detail="Target: 8-10k steps/day"
              accent
            />
            <StatCard
              label="Sleep duration"
              value={formatNumber(summary?.average_sleep_hours, " h")}
              detail="Recommended: 7-9 hours"
            />
            <StatCard
              label="Stress index"
              value={formatNumber(summary?.stress_index, "/100")}
              detail="Lower is calmer"
              accent
            />
            <StatCard
              label="Calories burned"
              value={formatNumber(summary?.calories_burned, " kcal")}
              detail="Daily energy output"
            />
            <StatCard
              label="Resting HR"
              value={formatNumber(summary?.average_resting_hr, " bpm")}
              detail="Lower is typically better"
            />
            <StatCard
              label="HRV (RMSSD)"
              value={formatNumber(summary?.hrv_rmssd, " ms")}
              detail="Higher is typically better"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm font-semibold uppercase text-slate-500">Steps trend</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <LineChart data={latestSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="steps" stroke="var(--accent)" strokeWidth={2} />
                    <Brush dataKey="date" height={20} stroke="var(--accent)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm font-semibold uppercase text-slate-500">Readiness score</p>
              <div className="relative mt-4 flex h-64 items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={readinessChart}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" background cornerRadius={12} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-3xl font-display font-semibold text-ink">{readiness || "--"}</p>
                  <p className="text-sm text-slate-500">Recovery readiness</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Steps & active minutes</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <LineChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="steps" stroke="var(--accent)" strokeWidth={2} />
                  <Line type="monotone" dataKey="active_minutes" stroke="#0f766e" strokeWidth={2} />
                  <Brush dataKey="date" height={20} stroke="var(--accent)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
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
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sleep_stage_light" stackId="sleep" fill="#60a5fa" />
                  <Bar dataKey="sleep_stage_deep" stackId="sleep" fill="#1d4ed8" />
                  <Bar dataKey="sleep_stage_rem" stackId="sleep" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <StatCard
              label="Sleep efficiency"
              value={formatNumber(summary?.sleep_efficiency, "")}
              detail="Healthy range: 0.85+"
              accent
            />
            <StatCard
              label="Total sleep (avg)"
              value={formatNumber(summary?.average_sleep_hours, " h")}
              detail="Aim for 7-9 hours"
            />
          </div>
        </div>
      )}

      {activeTab === "Stress & Recovery" && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Stress & HRV</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <AreaChart data={latestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="stress_index" fill="#fecaca" stroke="#ef4444" />
                  <Area type="monotone" dataKey="hrv_rmssd" fill="#bbf7d0" stroke="#16a34a" />
                  <Brush dataKey="date" height={20} stroke="var(--accent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
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

      {activeTab === "Comparison" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase text-slate-500">Compare personas</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <select
                value={effectiveComparisonId}
                onChange={(event) => setComparisonId(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
              >
                {personas
                  .filter((persona) => persona.id !== currentPersonaId)
                  .map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
              </select>
              <p className="text-sm text-slate-500">
                Norms: 7-9 hours sleep, stress index below 40, resting HR under 70 bpm.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    {
                      metric: "Steps",
                      current: summary?.average_steps || 0,
                      compare: comparisonSummary?.average_steps || 0,
                    },
                    {
                      metric: "Sleep",
                      current: summary?.average_sleep_hours || 0,
                      compare: comparisonSummary?.average_sleep_hours || 0,
                    },
                    {
                      metric: "Stress",
                      current: summary?.stress_index || 0,
                      compare: comparisonSummary?.stress_index || 0,
                    },
                    {
                      metric: "Resting HR",
                      current: summary?.average_resting_hr || 0,
                      compare: comparisonSummary?.average_resting_hr || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" name="Current persona" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="compare" name="Comparison persona" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
