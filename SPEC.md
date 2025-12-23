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

### 2.2 Back‑end API

- **Language**: Node.js with **Express** for rapid development.  Alternatively, Python (FastAPI) can be used if more convenient for data processing.
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
