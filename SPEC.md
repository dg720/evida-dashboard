# Wearables Health Dashboard – Project Specification

This specification describes an end‑to‑end web application for visualising wearable sensor data and providing AI‑generated coaching.  The goal is to deliver a clean, intuitive experience for non‑technical users while preserving flexibility for future expansion (additional data sources, new analytics and sensors).

## 1. User personas & dummy data

To allow prototyping without live access to user accounts, the application will ship with synthetic personas representing typical health situations.  Each persona will have 30 days of mock data covering steps, heart‑rate, sleep and stress metrics.  These examples will help developers test UI components and the LLM coach.

| Persona | Description | Sample data characteristics |
|---|---|---|
| **Active Alex** | Young adult with regular exercise and high daily step count. | 10 k steps/day, 7–8 h sleep, low stress index, resting HR ~60 bpm. |
| **Stressed Sam** | Mid‑career professional experiencing high stress and insufficient sleep. | 4–6 k steps/day, frequent stress spikes, irregular sleep (5 h/night), resting HR ~75 bpm. |
| **Sleep‑Challenged Chris** | Individual with insomnia symptoms. | 3–4 awakenings/night, total sleep < 5.5 h, high resting HRV but variable HR. |
| **Recovering Riley** | Person recovering from injury. | Decreasing step count, moderate sleep, elevated resting heart‑rate, occasional high stress. |

The dummy data generator (`scripts/generate_dummy_data.py`) will create JSON/CSV files with timestamps, metrics and optional notes.  Developers can extend or modify these personas.

## 2. Application architecture

The system is divided into a **front‑end dashboard**, a **back‑end API** and an optional **LLM health coach** service.  The deployment target is [Railway](https://railway.app) which offers both web hosting and managed containers.  

### 2.1 Front‑end (React + Tailwind)

- **Framework**: The dashboard will use **React** with **Vite** for a fast development environment and **Tailwind CSS** for utility‑based styling.
- **Pages and Navigation**:
  - **Home page** – landing page introducing the app, listing available personas and enabling users to upload their own data (e.g., export from Garmin, Strava, Oura, Whoop).  A top nav bar (logo, “Dashboard”, “Chat Coach”, “Upload Data”) allows quick navigation.
  - **Dashboard view** – displays time‑series charts and summaries.  Users can toggle among modules:
    - **Overview tab** – high‑level metrics (steps, calories, stress, sleep, readiness score) with gauge charts.  Use cards similar to Garmin Connect’s daily summary.
    - **Activity tab** – line charts for steps and active minutes (similar to Strava weekly overview), bar charts for weekly step totals, scatter plot for heart‑rate vs pace if available.
    - **Sleep tab** – night‑by‑night hypnogram (REM, deep, light) styled after Oura’s Sleep graph; summary metrics such as sleep efficiency and number of awakenings.  Include a weekly bar chart of total sleep.
    - **Stress & Recovery tab** – daily stress score line graph, heart‑rate variability chart and a readiness indicator like WHOOP’s recovery score.
    - **Comparison tab** – allows users to compare metrics between two personas or between a persona and normative ranges (e.g., Sleep Health & Lifestyle dataset averages).  Use dual axes or side‑by‑side bar charts.
  - **Chat Coach page** – minimal chat UI in a new tab (see Section 5).
  - **Upload page** – form allowing users to upload CSV/JSON exports.  Data is sent to the back‑end for parsing and displayed in the same dashboard components.
- **State management**: Use Redux Toolkit or React Context to manage user selection (current persona vs uploaded data), theme settings, and loading state.
- **Charts**: Use **Recharts** or **D3.js** for interactive charts.  Provide tooltips on hover and allow zooming/panning.

### 2.2 Back-end API

- **Language**: Python with **FastAPI** (required) for the API and LLM orchestration.
- **Endpoints**:
  - `GET /personas` – returns list of available dummy personas.
  - `GET /persona/:id/data` – returns time‑series data for the selected persona.
  - `POST /upload` – accepts user‑uploaded JSON or CSV; returns cleaned and aggregated data ready for visualisation.
  - `POST /chat` – proxy to the LLM health coach service; accepts the user’s question and current summary metrics; returns a model‑generated response.
- **Data storage**: For dummy data, simple JSON files stored in the repository.  For uploaded data, keep it in memory or a lightweight database (SQLite) within the container.  Do not persist personal data across sessions unless user accounts are implemented.
- **Deployment**: Railway can host Node or Python servers.  Define a `Procfile` or `start` script accordingly.  Use environment variables for the LLM API key.

### 2.3 LLM Health Coach service

- **Model access**: Use OpenAI’s API (or an open‑source alternative like LLaMA hosted on HuggingFace Inference Endpoints).  The back‑end will forward chat requests to this service.
- **Input format**: The dashboard will compile a JSON object with aggregated metrics (e.g., average steps, resting HR, sleep duration) and the user’s prompt (e.g., “How can I improve my sleep?”).  The back‑end will convert this into a structured prompt for the LLM.
- **Output**: The LLM returns a plain‑language response which is streamed back to the front‑end.
- **Safety**: Implement a response filter in the back‑end to detect unsupported content (diagnosis, medical treatment) and append a disclaimer (“This is not medical advice”).

## 3. Competitor benchmarks & design inspiration

To design a dashboard that resonates with end users, we reviewed leading consumer wearables platforms including Oura, Whoop, Garmin, Apple, Google Fit and Strava.  These systems share common patterns—clear scores, colour‑coded gauges, trend summaries and interactive heatmaps—that can inform Evida’s design.

- **Oura** – the ring’s Readiness score balances short‑term overnight metrics (resting heart rate, body temperature, sleep quality, HRV) with longer‑term activity and HRV trends.  Scores are colour‑coded: 85–100 indicates an optimal state, 70–84 good and lower values suggest the need to prioritise rest【918174569622894†L49-L92】.  Oura’s Daytime Stress feature refreshes every 15 minutes and uses HRV and body temperature to classify a user’s state as restored, relaxed, engaged or stressed【702495122400206†L845-L859】.  These concepts inspire a single readiness gauge and a stress status indicator that update frequently.

- **Whoop** – Whoop calculates a Strain score (0–21) based on cardiovascular load and labels zones as light (0–7), moderate (7–14), high (14–18) or all‑out (18–21)【535114547798760†L55-L80】.  Its Recovery score integrates resting heart rate, HRV, respiratory rate and sleep quality, displayed as a coloured bar (green 67–100 %, yellow 34–66 %, red < 34 %)【535114547798760†L102-L124】.  A similar dual‑metric design (exertion vs recovery) can be incorporated into the Evida stress & recovery tab.

- **Garmin** – The Forerunner 965 introduces a Training Readiness score updated throughout the day and derived from sleep score, recovery time, HRV status, acute load and recent stress.  It uses coloured zones from poor (red, 1–24) to prime (purple, 95–100)【713395133026006†L461-L533】.  Garmin’s Body Battery energy gauge and morning reports summarising sleep and readiness also offer design cues for an energy bar and daily summary card.

- **Apple Health** – The Summary tab surfaces “Highlights” for notable metrics and a “Show All Highlights” button; the Trends section visualises long‑term changes in metrics like resting heart rate, steps and sleep duration【783720797373583†L362-L380】.  This suggests adding a highlights carousel and trend lines that alert users to significant changes.

- **Google Fit** – The platform awards **Move Minutes** and **Heart Points**: one minute of moderate activity (50–69 % max heart‑rate) earns one Heart Point, while vigorous activity (≥ 70 %) earns two【319160212968073†L21-L67】.  When no heart‑rate sensor is available, cadence thresholds are used.  Incorporating gamified points that translate activity intensity into a single score can motivate users.

- **Strava** – Strava’s Weekly Heatmap visualises the cumulative activity “heat” for the past seven days, updated daily and available across sports categories【218922621899721†L40-L66】.  A simplified heatmap of stress or activity intensity across the week could provide an intuitive overview in Evida.

By synthesising these ideas, the Evida dashboard should:

1. **Use colour‑coded gauges and score bands** (e.g., readiness, recovery, activity) to provide quick feedback.
2. **Include highlight cards and trend lines** that surface meaningful changes in metrics over days or weeks.
3. **Offer separate tabs for activity, sleep, stress/recovery and comparisons**, mirroring the structure of competitor apps.
4. **Provide gamified points or “heat” visualisations** to encourage engagement, similar to Heart Points and heatmaps.
5. **Present daily summaries and energy gauges** to show how yesterday’s sleep and stress affect today’s readiness.

These inspirations ensure the interface remains familiar to users of existing wearables while differentiating Evida through integrated coaching and open data import.

## 4. User experience guidelines

- **Simplicity** – Keep the interface uncluttered.  Display no more than three metrics per card.  Use clear icons (e.g., footstep icon for steps, bed icon for sleep) inspired by Garmin Connect’s UI.
- **Accessibility** – Ensure high contrast; provide tooltips explaining metrics; support keyboard navigation.  Use alt text for all icons.
- **Responsiveness** – Use CSS grid/flex to ensure charts resize gracefully on mobile; hide complex charts on small screens and provide summary statistics instead.
- **Personalisation** – When the user selects a persona or uploads data, adapt the colour theme to reflect their status (e.g., green for high recovery, red for high stress).

## 5. Chat Coach interface

- Place the **Chat Coach** in a separate tab accessible from the navigation bar to avoid overwhelming the main dashboard.
- The chat UI includes:
  - **Conversation window** – shows a scrollable history of messages.  Differentiate system/user/model messages with background colours.
  - **Input box** – multi‑line text area with a placeholder (“Ask about your sleep or fitness…”).
  - **Send button** – triggers a POST to `/chat` with the current persona’s aggregated metrics and the user’s query.
  - **Loading indicator** – spinner while the model is generating a response.
  - **Disclaimer banner** – fixed line at the bottom reminding users that the coach is informational.
- The front‑end will maintain a queue of messages to support streaming responses (if enabled by the API).

## 6. Deployment steps on Railway

1. **Repository** – Create a Git repository with two directories: `client` (React app) and `server` (Express/FastAPI).  Include `Procfile` or `railway.toml` to define build and start commands.
2. **Environment variables** – Add `OPENAI_API_KEY` (or equivalent) to Railway’s environment settings.  Optionally include `UPLOAD_LIMIT` to cap file sizes.
3. **Build & deploy** – Railway auto‑detects Node and Python projects.  For a multi‑service project, define separate services in `railway.toml`.  Ensure that the client is built (e.g., `npm run build`) and served as static files through the back‑end (Express static middleware or Python `aiofiles`).
4. **Testing** – Use Railway’s temporary preview URLs to verify that the dashboard loads, dummy personas display correctly and the chat endpoint returns responses.

## 7. Future extensions

- **Real wearable integrations** – Add OAuth flows for Garmin/Strava/Oura/Whoop APIs.  Store access tokens securely and use their APIs to pull real user data.
- **User accounts** – Implement authentication so users can sign up and save their data.  Use a database (Postgres) managed by Railway.
- **Notifications** – Allow the coach to send periodic email or in‑app notifications summarising weekly progress.
- **More sensors** – Incorporate HRV, EDA, body temperature data as additional metrics when available.

This specification provides the structure for a comprehensive yet approachable wearables dashboard combined with an AI coach.  Developers can follow the outlined file structure, endpoints and UI components to implement the application and deploy it on Railway.

## 8. LLM Health Coach Design

This document defines the high‑level design for the conversational agent (“Health Coach”) that interfaces with the wearable data dashboard.  It outlines the agent’s capabilities, input and output specifications, and integration points with the API backend.

## Purpose

The Health Coach is an AI‑powered assistant that uses aggregated wearable metrics and user queries to generate personalised insights and suggestions.  It is not a medical device; its outputs are informational and should always include a disclaimer shown in the Chat Coach UI banner.

## Agent capabilities

1. **Data summarisation** – The agent can ingest a summary of the user’s recent data (steps, heart‑rate, sleep, stress, etc.) and reason about trends (e.g., increasing stress, decreasing sleep duration).
2. **Comparative analysis** – The agent may compare the user’s metrics to normative ranges or personalised baselines and highlight deviations.
3. **Goal tracking** – When the user states a goal (e.g., “I want to run a 10 K” or “Improve my sleep”), the agent tracks relevant metrics and provides incremental feedback.
4. **Behavioural recommendations** – Using best practices (e.g., SMART goals), the agent suggests concrete actions such as adjusting bedtime, increasing daily steps, or practising relaxation techniques.
5. **Clarifications and education** – The agent answers general questions about metrics (e.g., “What is HRV?”) and explains why certain behaviours may affect health.

## Inputs

The back‑end API composes a request for the agent containing:

```json
{
  "metrics": {
    "average_steps": 8500,
    "average_sleep_hours": 6.5,
    "average_resting_hr": 70,
    "hrv_rmssd": 55,
    "stress_index": 60,
    "calories_burned": 2200,
    "sleep_efficiency": 0.85
  },
  "user_context": {
    "age": 34,
    "gender": "male",
    "fitness_goal": "Train for a half marathon",
    "sleep_goal": "Improve sleep duration"
  },
  "query": "I feel tired after work and my stress is high. How can I improve?"
}
```

The `metrics` dictionary may vary based on available sensors.  The `user_context` provides demographic info and current goals.  The `query` contains the user’s natural‑language question.

## Outputs

The agent returns a JSON structure that includes the generated message and optional structured recommendations. The message should not embed the disclaimer (the UI banner handles it):

```json
{
  "message": "I’m sorry to hear you’ve been feeling tired. Over the past week your average sleep has been 6.5 hours, which is below the 7–9 hour range recommended for adults. Your stress index is also elevated. Consider setting a regular bedtime, practising a 10‑minute relaxation routine before sleep and increasing light physical activity. Your current step average is 8.5 k; aim for 10 k steps and incorporate short walks during breaks.",
  "recommendations": [
    {
      "category": "Sleep",
      "action": "Set a consistent bedtime and aim for 7–8 h of sleep",
      "priority": "high"
    },
    {
      "category": "Stress",
      "action": "Try deep‑breathing or meditation for 10 minutes before bed",
      "priority": "medium"
    },
    {
      "category": "Activity",
      "action": "Increase daily steps to 10 k by adding short walks",
      "priority": "low"
    }
  ]
}
```

The `recommendations` array is optional; if provided, each entry includes a category and a priority.  The front‑end can render these as checklist items.  The disclaimer is mandatory and must appear in the Chat Coach UI banner (not appended to each message).

## Prompt template

The back‑end constructs a prompt that includes:

- A system message describing the assistant’s role (e.g., “You are a health coach that analyses wearable data and offers lifestyle recommendations.  You are not a doctor and must not provide medical diagnoses or treatment.”).
- A summary of the user’s metrics and context, converted into readable sentences.
- The user’s question.

Example prompt:

> System: You are a health coach that analyses wearable data and offers lifestyle recommendations.  You are not a doctor and must not provide medical diagnoses or treatment.
>
> Data summary: Over the past week, the user averaged 8.5 k steps per day, slept 6.5 hours per night, had an average resting heart rate of 70 bpm, HRV (RMSSD) of 55 ms and stress index of 60/100.  The user is 34‑year‑old male training for a half marathon and aims to improve sleep duration.
>
> User: I feel tired after work and my stress is high. How can I improve?

The agent should produce a fuller reply (≈2–3 paragraphs) referencing the data summary and include brief SMART recommendations.

## Prompt engineering strategies

Recent research on fine‑tuned personal health LLMs provides guidance on how to structure prompts for best results.  Google’s PH‑LLM project built a case‑study dataset of 857 annotated examples covering sleep and fitness; experts used the **RU‑SATED** framework (Routine, Sleep quality, Alertness, Timing, Efficiency, Duration) to analyse sleep patterns and applied **SMART** goal setting to recommendations【607570519451339†L330-L350】.  Their model also used a multi‑layer perceptron (MLP) adapter that encodes the mean and variance of about twenty sensor variables into a small number of “data tokens” prepended to the text prompt, allowing the LLM to condition on quantitative features without exceeding context length【607570519451339†L720-L751】.  PH‑LLM achieved 79 % accuracy on a sleep‑medicine exam and 88 % on a fitness exam and was judged by experts to deliver near‑expert recommendations【607570519451339†L34-L61】.

To leverage these insights for Evida’s Health Coach, adopt the following prompt engineering techniques:

1. **Structured data preamble** – Begin the prompt with a concise, human‑readable summary of the user’s recent metrics and context.  Include averages and variance where meaningful (e.g., mean and standard deviation of sleep duration, resting heart rate and HRV) to emulate the PH‑LLM adapter and give the model a statistical picture of the data.
2. **Use domain frameworks** – For sleep questions, organise the summary using RU‑SATED categories (Routine, Sleep quality, Alertness, Timing, Efficiency, Duration) to help the model cover all aspects of sleep health【607570519451339†L330-L350】.  For fitness queries, mention training load, strain and recovery metrics.
3. **Prompt with normative ranges** – Explicitly state evidence‑based ranges (e.g., “7–9 hours of sleep is recommended for adults”) when summarising metrics to help the model contrast the user’s data against benchmarks.
4. **Embed goals and context** – Include the user’s stated goals (e.g., run a 10 K, improve stress) and demographic factors up front so the model can tailor suggestions.
5. **Ask for SMART recommendations** – Direct the model to propose **Specific, Measurable, Achievable, Relevant and Time‑bound** actions rather than generic advice【607570519451339†L330-L350】.
6. **Limit scope and discourage hallucinations** – Add a system instruction reminding the model to base its response solely on the provided metrics and not invent data or diagnoses.  Emphasise that it should state when data is missing rather than guessing.

Integrating these techniques into the prompt template will improve the relevance, personalisation and safety of the agent’s responses.

## Safety rules

1. **No diagnoses** – The agent must not diagnose medical conditions or suggest specific treatments or medications.
2. **Emphasise consultation** – Remind users to consult healthcare professionals for persistent or serious issues.
3. **No prescriptions** – Avoid prescribing exercise intensities unsuitable for the user’s fitness level; instead offer general guidance.
4. **Respect privacy** – Do not speculate on sensitive personal information beyond what is provided.

## Implementation notes

- The agent can be implemented as an HTTP client to OpenAI’s `gpt-3.5-turbo` or similar model.  Pass the constructed messages as JSON to the API.  To mimic the PH‑LLM adapter, compute simple aggregate statistics (means, variances) of sensor metrics on the back‑end and include them in the prompt preamble rather than sending raw time‑series data.
- Define a separate module (`llm.js` or `llm.py`) responsible for building prompts, calling the model and parsing responses.  This module should include a fallback to template-based responses if the API fails.
- Rate limit requests to avoid exceeding token quotas.  Consider caching recent responses for repeated queries.  If using an open‑source model, experiment with few‑shot examples that demonstrate RU‑SATED and SMART frameworks to anchor the model’s behaviour.

## Integration workflow

1. **User opens Chat Coach** and sends a message.
2. **Front‑end** collects the current persona’s aggregated metrics and sends them with the user’s query to `POST /chat`.
3. **Back‑end API** validates the input, constructs the prompt, calls the LLM and applies the safety filter to the response.
4. **Back‑end** returns the structured output (`message`, `recommendations`) to the front‑end.
5. **Front‑end** displays the message in the chat window and renders the recommendations as checklist items or cards.

## Future enhancements

- **Context persistence** – Maintain conversation history across sessions to provide more contextualised advice.
- **Custom prompts per user goal** – Fine‑tune the agent for specific domains (e.g., stress management vs athletic training) using additional examples.
- **Multilingual support** – Provide translations of prompts and responses for international users.
- **Agent analytics** – Log interactions to monitor the types of questions asked and assess the agent’s effectiveness (with user consent).
