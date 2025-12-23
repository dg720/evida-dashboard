const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const fs = require("fs");
const path = require("path");
const { computeStats } = require("./stats");
const { generateCoachResponse } = require("./llm");

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "2mb" }));

const dataRoot = path.join(__dirname, "..", "data");
const personasIndexPath = path.join(dataRoot, "personas.json");

function loadPersonasIndex() {
  if (!fs.existsSync(personasIndexPath)) {
    return [];
  }
  const raw = fs.readFileSync(personasIndexPath, "utf-8");
  return JSON.parse(raw);
}

function loadPersonaData(personaId) {
  const personaPath = path.join(dataRoot, "personas", `${personaId}.json`);
  if (!fs.existsSync(personaPath)) {
    return null;
  }
  const raw = fs.readFileSync(personaPath, "utf-8");
  return JSON.parse(raw);
}

function summarizeSeries(series) {
  const fields = [
    "steps",
    "sleep_hours",
    "resting_hr",
    "hrv_rmssd",
    "stress_index",
    "calories_burned",
    "sleep_efficiency",
    "active_minutes",
  ];
  const stats = computeStats(series, fields);
  return {
    average_steps: stats.steps?.mean,
    average_sleep_hours: stats.sleep_hours?.mean,
    average_resting_hr: stats.resting_hr?.mean,
    hrv_rmssd: stats.hrv_rmssd?.mean,
    stress_index: stats.stress_index?.mean,
    calories_burned: stats.calories_burned?.mean,
    sleep_efficiency: stats.sleep_efficiency?.mean,
    active_minutes: stats.active_minutes?.mean,
    variance: {
      average_steps: stats.steps?.variance,
      average_sleep_hours: stats.sleep_hours?.variance,
      average_resting_hr: stats.resting_hr?.variance,
      hrv_rmssd: stats.hrv_rmssd?.variance,
    },
  };
}

function normalizeUploadData(rawData) {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map((entry) => ({
    date: entry.date,
    steps: Number(entry.steps ?? entry.average_steps ?? 0),
    sleep_hours: Number(entry.sleep_hours ?? entry.sleep ?? 0),
    resting_hr: Number(entry.resting_hr ?? entry.average_resting_hr ?? 0),
    hrv_rmssd: Number(entry.hrv_rmssd ?? entry.hrv ?? 0),
    stress_index: Number(entry.stress_index ?? entry.stress ?? 0),
    calories_burned: Number(entry.calories_burned ?? entry.calories ?? 0),
    sleep_efficiency: Number(entry.sleep_efficiency ?? 0),
    active_minutes: Number(entry.active_minutes ?? 0),
    awakenings: Number(entry.awakenings ?? 0),
    sleep_stage_rem: Number(entry.sleep_stage_rem ?? 0),
    sleep_stage_deep: Number(entry.sleep_stage_deep ?? 0),
    sleep_stage_light: Number(entry.sleep_stage_light ?? 0),
  }));
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/personas", (_req, res) => {
  const personas = loadPersonasIndex();
  res.json(personas);
});

app.get("/persona/:id/data", (req, res) => {
  const personaId = req.params.id;
  const personaData = loadPersonaData(personaId);
  if (!personaData) {
    res.status(404).json({ error: "Persona not found." });
    return;
  }

  const summary = summarizeSeries(personaData.data);
  res.json({
    ...personaData,
    summary,
  });
});

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    let data = [];
    if (req.file) {
      const content = req.file.buffer.toString("utf-8");
      if (req.file.originalname.endsWith(".json")) {
        const parsed = JSON.parse(content);
        data = normalizeUploadData(parsed.data || parsed);
      } else if (req.file.originalname.endsWith(".csv")) {
        const records = parse(content, {
          columns: true,
          skip_empty_lines: true,
        });
        data = normalizeUploadData(records);
      }
    } else if (req.body && req.body.data) {
      data = normalizeUploadData(req.body.data);
    }

    if (!data.length) {
      res.status(400).json({ error: "No data uploaded." });
      return;
    }

    const summary = summarizeSeries(data);
    app.locals.uploadedData = { data, summary };
    res.json({
      data,
      summary,
    });
  } catch {
    res.status(400).json({ error: "Unable to parse uploaded data." });
  }
});

function isValidChatPayload(body) {
  if (!body || typeof body !== "object") {
    return false;
  }
  if (!body.metrics || typeof body.metrics !== "object") {
    return false;
  }
  if (!body.query || typeof body.query !== "string") {
    return false;
  }
  if (body.user_context && typeof body.user_context !== "object") {
    return false;
  }
  if (body.series && !Array.isArray(body.series)) {
    return false;
  }
  return true;
}

app.post("/chat", async (req, res) => {
  if (!isValidChatPayload(req.body)) {
    res.status(400).json({ error: "Invalid request payload." });
    return;
  }

  const { metrics, user_context: userContext, query, series } = req.body;
  const stats = series ? summarizeSeries(series) : { variance: {} };

  const coachResponse = await generateCoachResponse({
    metrics,
    userContext,
    query,
    stats: {
      average_sleep_hours: { variance: stats.variance.average_sleep_hours },
      average_resting_hr: { variance: stats.variance.average_resting_hr },
      hrv_rmssd: { variance: stats.variance.hrv_rmssd },
    },
  });

  res.json(coachResponse);
});

// Serve built client if present
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

module.exports = app;
