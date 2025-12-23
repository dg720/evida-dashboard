# AGENTS.md – LLM Health Coach Design

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

The agent returns a JSON structure that includes the generated message and optional structured recommendations:

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
