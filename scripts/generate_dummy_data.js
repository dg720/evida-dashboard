const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "server", "data");
const personaDir = path.join(dataDir, "personas");

const personas = [
  {
    id: "active-alex",
    name: "Active Alex",
    description: "Young adult with regular exercise and high daily step count.",
    stepsRange: [9000, 12000],
    sleepRange: [7.0, 8.0],
    stressRange: [20, 35],
    restingHrRange: [55, 62],
  },
  {
    id: "stressed-sam",
    name: "Stressed Sam",
    description: "Mid-career professional experiencing high stress and insufficient sleep.",
    stepsRange: [4000, 6500],
    sleepRange: [5.0, 6.2],
    stressRange: [65, 85],
    restingHrRange: [70, 78],
  },
  {
    id: "sleep-challenged-chris",
    name: "Sleep-Challenged Chris",
    description: "Individual with insomnia symptoms and fragmented sleep.",
    stepsRange: [3500, 5200],
    sleepRange: [4.5, 5.6],
    stressRange: [45, 70],
    restingHrRange: [68, 80],
  },
  {
    id: "recovering-riley",
    name: "Recovering Riley",
    description: "Person recovering from injury with decreasing step count.",
    stepsRange: [2500, 5500],
    sleepRange: [6.0, 7.0],
    stressRange: [40, 60],
    restingHrRange: [72, 85],
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function generateSeries(persona, days = 30) {
  const seed = persona.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = seededRandom(seed);
  const today = new Date();
  const series = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const steps =
      Math.floor(persona.stepsRange[0] + rand() * (persona.stepsRange[1] - persona.stepsRange[0]));
    const sleepHours = Number(
      (persona.sleepRange[0] + rand() * (persona.sleepRange[1] - persona.sleepRange[0])).toFixed(2)
    );
    const stress =
      Math.floor(persona.stressRange[0] + rand() * (persona.stressRange[1] - persona.stressRange[0]));
    const restingHr =
      Math.floor(
        persona.restingHrRange[0] +
          rand() * (persona.restingHrRange[1] - persona.restingHrRange[0])
      );
    const hrvRmssd = Number((40 + rand() * 40).toFixed(1));
    const calories = Math.floor(1800 + steps * 0.05);
    const sleepEff = Number(clamp(0.78 + rand() * 0.17, 0.7, 0.95).toFixed(2));
    const activeMinutes = Math.floor(steps / 120);
    const awakenings = persona.id.includes("sleep")
      ? Math.floor(1 + rand() * 3)
      : Math.floor(rand() * 2);

    series.push({
      date: date.toISOString().slice(0, 10),
      steps,
      sleep_hours: sleepHours,
      stress_index: stress,
      resting_hr: restingHr,
      hrv_rmssd: hrvRmssd,
      calories_burned: calories,
      sleep_efficiency: sleepEff,
      active_minutes: activeMinutes,
      awakenings,
      sleep_stage_rem: Number((sleepHours * 0.25).toFixed(2)),
      sleep_stage_deep: Number((sleepHours * 0.22).toFixed(2)),
      sleep_stage_light: Number((sleepHours * 0.53).toFixed(2)),
    });
  }

  return series;
}

function main() {
  fs.mkdirSync(personaDir, { recursive: true });

  const index = personas.map((persona) => {
    const data = generateSeries(persona);
    const payload = {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      data,
    };

    fs.writeFileSync(
      path.join(personaDir, `${persona.id}.json`),
      JSON.stringify(payload, null, 2)
    );

    return {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      days: data.length,
    };
  });

  fs.writeFileSync(path.join(dataDir, "personas.json"), JSON.stringify(index, null, 2));
}

main();
