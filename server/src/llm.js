const { round } = require("./stats");

function formatMetric(value, unit) {
  if (value === null || value === undefined) {
    return "not available";
  }
  const formatted = typeof value === "number" ? round(value, 2) : value;
  return `${formatted}${unit}`;
}

function buildSleepSummary(metrics, stats) {
  const sleepHours = formatMetric(metrics.average_sleep_hours, " hours");
  const sleepEfficiency = formatMetric(
    metrics.sleep_efficiency,
    metrics.sleep_efficiency ? "" : ""
  );
  const awakenings = metrics.awakenings ?? null;
  const sleepVar = stats?.average_sleep_hours?.variance;
  const sleepSdText =
    sleepVar !== null && sleepVar !== undefined
      ? ` (variance ${round(sleepVar, 2)})`
      : "";

  return [
    `Routine: not available`,
    `Sleep quality: ${awakenings !== null ? `${awakenings} awakenings/night` : "not available"}`,
    `Alertness: not available`,
    `Timing: not available`,
    `Efficiency: ${sleepEfficiency !== "not available" ? sleepEfficiency : "not available"}`,
    `Duration: ${sleepHours}${sleepSdText}`,
  ].join(" | ");
}

function buildFitnessSummary(metrics, stats) {
  const steps = formatMetric(metrics.average_steps, " steps/day");
  const calories = formatMetric(metrics.calories_burned, " kcal/day");
  const restingHr = formatMetric(metrics.average_resting_hr, " bpm");
  const hrv = formatMetric(metrics.hrv_rmssd, " ms");
  const hrVar = stats?.average_resting_hr?.variance;
  const hrvVar = stats?.hrv_rmssd?.variance;

  const hrVarText =
    hrVar !== null && hrVar !== undefined ? ` (variance ${round(hrVar, 2)})` : "";
  const hrvVarText =
    hrvVar !== null && hrvVar !== undefined ? ` (variance ${round(hrvVar, 2)})` : "";

  return `Steps: ${steps}. Calories: ${calories}. Resting HR: ${restingHr}${hrVarText}. HRV: ${hrv}${hrvVarText}.`;
}

function buildPrompt({ metrics, userContext, query, stats, meetingContext }) {
  const sleepQuery =
    /sleep|insomnia|tired|fatigue|bedtime|rest/i.test(query || "") ||
    /sleep/i.test(userContext?.sleep_goal || "");

  const fitnessQuery =
    /run|train|fitness|marathon|steps|activity|workout|exercise/i.test(query || "") ||
    /train|fitness|marathon|run/i.test(userContext?.fitness_goal || "");

  const sleepSummary = sleepQuery ? buildSleepSummary(metrics, stats) : null;
  const fitnessSummary = fitnessQuery ? buildFitnessSummary(metrics, stats) : null;

  const metricsSummaryParts = [];
  if (metrics.average_steps !== undefined) {
    metricsSummaryParts.push(
      `average steps ${formatMetric(metrics.average_steps, "")} per day`
    );
  }
  if (metrics.average_sleep_hours !== undefined) {
    metricsSummaryParts.push(
      `sleep duration ${formatMetric(metrics.average_sleep_hours, "")} hours per night`
    );
  }
  if (metrics.average_resting_hr !== undefined) {
    metricsSummaryParts.push(
      `resting heart rate ${formatMetric(metrics.average_resting_hr, "")} bpm`
    );
  }
  if (metrics.hrv_rmssd !== undefined) {
    metricsSummaryParts.push(`HRV (RMSSD) ${formatMetric(metrics.hrv_rmssd, "")} ms`);
  }
  if (metrics.stress_index !== undefined) {
    metricsSummaryParts.push(
      `stress index ${formatMetric(metrics.stress_index, "")}/100`
    );
  }
  if (metrics.sleep_efficiency !== undefined) {
    metricsSummaryParts.push(
      `sleep efficiency ${formatMetric(metrics.sleep_efficiency, "")}`
    );
  }

  const summaryLine = metricsSummaryParts.length
    ? `Data summary: Over the past week, the user had ${metricsSummaryParts.join(
        ", "
      )}.`
    : "Data summary: No recent metrics were provided.";

  const goals = [];
  if (userContext?.fitness_goal) {
    goals.push(`fitness goal: ${userContext.fitness_goal}`);
  }
  if (userContext?.sleep_goal) {
    goals.push(`sleep goal: ${userContext.sleep_goal}`);
  }

  const contextLine = [
    userContext?.age ? `age ${userContext.age}` : null,
    userContext?.gender ? `gender ${userContext.gender}` : null,
    goals.length ? goals.join(", ") : null,
  ]
    .filter(Boolean)
    .join(", ");

  const frameworkLines = [];
  if (sleepSummary) {
    frameworkLines.push(`RU-SATED sleep check: ${sleepSummary}.`);
    frameworkLines.push(
      "Normative range: adults typically need 7-9 hours of sleep."
    );
  }
  if (fitnessSummary) {
    frameworkLines.push(`Fitness check: ${fitnessSummary}`);
  }
  if (!frameworkLines.length) {
    frameworkLines.push(
      "Normative range: adults typically need 7-9 hours of sleep."
    );
  }

  const systemMessage = [
    "You are a health coach that analyzes wearable data and offers lifestyle recommendations.",
    "You are not a doctor and must not provide medical diagnoses or treatments.",
    "Encourage consulting a healthcare professional for persistent or serious issues.",
    "Base your response only on the provided metrics and context. If data is missing, say so.",
    "Format the message with short Markdown section headings in bold.",
    "Use sections: **Summary**, **What stands out**, **Next steps (SMART)**.",
    "Use bullet points under Next steps (2-4 items). Each bullet must be SMART and include a why/how clause.",
    "Tie each recommendation to a metric or goal in the data summary.",
    "Keep sentences concise, specific, and actionable.",
    "Do not include a disclaimer in the message; the UI displays it separately.",
    "Return a JSON object with a `message` string and optional `recommendations` array.",
  ].join(" ");

  const userMessage = [
    contextLine ? `User context: ${contextLine}.` : "User context: not provided.",
    summaryLine,
    ...frameworkLines,
    meetingContext ? `Imported meeting context: ${summarizeMeetingContext(meetingContext)}` : null,
    `User question: ${query || "No question provided."}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { systemMessage, userMessage };
}

async function callOpenAI({ systemMessage, userMessage }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return content;
}

function parseModelResponse(content) {
  if (!content) {
    return { message: "I couldn't generate a response at the moment." };
  }

  const cleaned = stripCodeFences(content).trim();
  const parsed = safeParseJson(cleaned);
  if (parsed && parsed.message) {
    return {
      message: stripDisclaimer(parsed.message),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : undefined,
    };
  }

  const extracted = extractMessageFromJson(cleaned);
  if (extracted) {
    return { message: stripDisclaimer(extracted) };
  }

  return { message: stripDisclaimer(cleaned) };
}

function stripCodeFences(text) {
  return text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "");
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractMessageFromJson(text) {
  const match = text.match(/"message"\s*:\s*"([^"]*)"/);
  if (!match) {
    return null;
  }
  return match[1].replace(/\\n/g, "\n");
}

function stripDisclaimer(message) {
  if (!message) {
    return message;
  }
  return message
    .split("\n")
    .filter((line) => !/disclaimer/i.test(line))
    .join("\n")
    .trim();
}

function fallbackResponse({ metrics, userContext }) {
  const steps = metrics.average_steps
    ? `${metrics.average_steps} steps/day`
    : "step data not available";
  const sleep = metrics.average_sleep_hours
    ? `${metrics.average_sleep_hours} hours/night`
    : "sleep data not available";
  const stress =
    metrics.stress_index !== undefined
      ? `stress index ${metrics.stress_index}/100`
      : "stress data not available";

  const goals = [];
  if (userContext?.fitness_goal) {
    goals.push(userContext.fitness_goal);
  }
  if (userContext?.sleep_goal) {
    goals.push(userContext.sleep_goal);
  }

  const message = [
    "**Summary**",
    `Based on your recent metrics, your activity is ${steps}, sleep is ${sleep}, and ${stress}.`,
    "",
    "**What stands out**",
    goals.length
      ? `Your goals include ${goals.join(", ")}, so small changes linked to sleep and activity will have the biggest impact.`
      : "Small changes linked to sleep and activity will have the biggest impact.",
    "",
    "**Next steps (SMART)**",
    "- Set a consistent bedtime for 3 nights this week.",
    "- Add a 10-minute walk after lunch on 3 days.",
    "- Track energy and stress after each change to see what helps most.",
  ].join("\n");

  return {
    message,
    recommendations: [
      {
        category: "Sleep",
        action: "Set a consistent bedtime for 3 nights this week",
        priority: "medium",
      },
      {
        category: "Activity",
        action: "Add a 10-minute walk after lunch on 3 days",
        priority: "low",
      },
    ],
  };
}

async function generateCoachResponse({ metrics, userContext, query, stats, meetingContext }) {
  const { systemMessage, userMessage } = buildPrompt({
    metrics,
    userContext,
    query,
    stats,
    meetingContext,
  });

  try {
    const content = await callOpenAI({ systemMessage, userMessage });
    const parsed = parseModelResponse(content);
    return enrichResponse(parsed, { metrics, userContext });
  } catch {
    return enrichResponse(fallbackResponse({ metrics, userContext }), { metrics, userContext });
  }
}

function summarizeMeetingContext(meetingContext) {
  if (!meetingContext || typeof meetingContext !== "object") {
    return "not provided.";
  }
  const name = meetingContext.patientDisplayName || meetingContext.id || "meeting";
  const createdAt = meetingContext.createdAt
    ? new Date(meetingContext.createdAt).toLocaleDateString()
    : "unknown date";
  const transcript = meetingContext.transcript
    ? String(meetingContext.transcript).slice(0, 240)
    : null;
  const plan = meetingContext.plan;
  const planText = plan ? JSON.stringify(plan).slice(0, 240) : null;
  const parts = [`${name} (${createdAt})`];
  if (transcript) {
    parts.push(`Transcript excerpt: ${transcript}`);
  }
  if (planText) {
    parts.push(`Plan excerpt: ${planText}`);
  }
  return parts.join(" | ");
}

module.exports = {
  buildPrompt,
  generateCoachResponse,
};

function enrichResponse(response, { metrics, userContext }) {
  const message = response.message || "";
  const needsExpansion = message.length < 300;
  const recommendations = Array.isArray(response.recommendations)
    ? response.recommendations
    : [];

  if (!needsExpansion && recommendations.length) {
    return response;
  }

  const expandedMessageParts = [message];
  if (needsExpansion) {
    const sleepHours = metrics.average_sleep_hours;
    const steps = metrics.average_steps;
    const stress = metrics.stress_index;
    const hrv = metrics.hrv_rmssd;
    const restingHr = metrics.average_resting_hr;

    const smartBullets = [];
    if (sleepHours !== undefined && sleepHours !== null) {
      const target = sleepHours < 7 ? "7.0" : sleepHours < 8 ? "7.5" : "8.0";
      smartBullets.push(
        `- **Sleep**: Set a fixed lights-out time to reach ${target}h for 4 nights this week, because your average is ${round(
          sleepHours,
          2
        )}h; use a 20-minute wind-down alarm to make it achievable.`
      );
    }
    if (steps !== undefined && steps !== null) {
      const stepTarget = Math.min(Math.round(steps + 1500), 10000);
      smartBullets.push(
        `- **Activity**: Add one 12-minute walk after lunch on 4 days to lift steps toward ${stepTarget}/day, because you are averaging ${round(
          steps,
          0
        )} steps; pair it with a calendar reminder.`
      );
    }
    if (stress !== undefined && stress !== null) {
      smartBullets.push(
        `- **Stress**: Do a 5-minute box-breathing reset at 6pm on 3 days to lower your stress index from ${round(
          stress,
          1
        )}/100; start with 4-second inhales/exhales to keep it simple.`
      );
    }
    if (hrv !== undefined && hrv !== null) {
      smartBullets.push(
        `- **Recovery**: Add one low-intensity day (easy walk or mobility) this week to support HRV (${round(
          hrv,
          1
        )} ms); keep it under 30 minutes so it doesn't add strain.`
      );
    }
    if (restingHr !== undefined && restingHr !== null && !hrv) {
      smartBullets.push(
        `- **Heart health**: Aim for two 20-minute easy sessions this week, because resting HR is ${round(
          restingHr,
          1
        )} bpm; keep effort conversational to encourage recovery.`
      );
    }

    if (smartBullets.length) {
      if (/Next steps/i.test(message)) {
        expandedMessageParts.push(smartBullets.join("\n"));
      } else {
        expandedMessageParts.push(["**Next steps (SMART)**", ...smartBullets].join("\n"));
      }
    }
  }

  const enrichedRecommendations = recommendations.length
    ? recommendations
    : [
      {
        category: "Sleep",
        action: "Set a consistent bedtime for 4 nights this week",
        priority: "high",
      },
      {
        category: "Stress",
        action: "Practice 5 minutes of slow breathing after work on 3 days",
        priority: "medium",
      },
      {
        category: "Activity",
        action: "Add a 15-minute easy walk on 3 days",
        priority: "low",
      },
    ];

  if (!recommendations.length && userContext?.fitness_goal) {
    enrichedRecommendations.unshift({
      category: "Training",
      action: `Schedule 2 easy runs this week to build consistency for ${userContext.fitness_goal}`,
      priority: "medium",
    });
  }

  return {
    message: expandedMessageParts.filter(Boolean).join("\n\n").trim(),
    recommendations: enrichedRecommendations,
  };
}
