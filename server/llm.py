from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import OpenAI

from stats import round_value


def format_metric(value: Any, unit: str) -> str:
    if value is None:
        return "not available"
    formatted = round_value(value, 2) if isinstance(value, (int, float)) else value
    return f"{formatted}{unit}"


def build_sleep_summary(metrics: dict[str, Any], stats: dict[str, Any]) -> str:
    sleep_hours = format_metric(metrics.get("average_sleep_hours"), " hours")
    sleep_efficiency = format_metric(metrics.get("sleep_efficiency"), "")
    awakenings = metrics.get("awakenings")
    sleep_var = stats.get("average_sleep_hours", {}).get("variance") if stats else None
    sleep_sd_text = f" (variance {round_value(sleep_var, 2)})" if sleep_var is not None else ""
    return " | ".join(
        [
            "Routine: not available",
            f"Sleep quality: {awakenings} awakenings/night" if awakenings is not None else "Sleep quality: not available",
            "Alertness: not available",
            "Timing: not available",
            f"Efficiency: {sleep_efficiency}" if sleep_efficiency != "not available" else "Efficiency: not available",
            f"Duration: {sleep_hours}{sleep_sd_text}",
        ]
    )


def build_fitness_summary(metrics: dict[str, Any], stats: dict[str, Any]) -> str:
    steps = format_metric(metrics.get("average_steps"), " steps/day")
    calories = format_metric(metrics.get("calories_burned"), " kcal/day")
    resting_hr = format_metric(metrics.get("average_resting_hr"), " bpm")
    hrv = format_metric(metrics.get("hrv_rmssd"), " ms")
    hr_var = stats.get("average_resting_hr", {}).get("variance") if stats else None
    hrv_var = stats.get("hrv_rmssd", {}).get("variance") if stats else None
    hr_var_text = f" (variance {round_value(hr_var, 2)})" if hr_var is not None else ""
    hrv_var_text = f" (variance {round_value(hrv_var, 2)})" if hrv_var is not None else ""
    return f"Steps: {steps}. Calories: {calories}. Resting HR: {resting_hr}{hr_var_text}. HRV: {hrv}{hrv_var_text}."


def build_prompt(
    *,
    metrics: dict[str, Any],
    user_context: dict[str, Any] | None,
    query: str | None,
    stats: dict[str, Any],
    meeting_context: dict[str, Any] | None,
) -> tuple[str, str]:
    sleep_query = bool(re.search(r"sleep|insomnia|tired|fatigue|bedtime|rest", query or "", re.I)) or bool(
        re.search(r"sleep", (user_context or {}).get("sleep_goal", ""), re.I)
    )
    fitness_query = bool(
        re.search(r"run|train|fitness|marathon|steps|activity|workout|exercise", query or "", re.I)
    ) or bool(re.search(r"train|fitness|marathon|run", (user_context or {}).get("fitness_goal", ""), re.I))

    sleep_summary = build_sleep_summary(metrics, stats) if sleep_query else None
    fitness_summary = build_fitness_summary(metrics, stats) if fitness_query else None

    metrics_summary_parts: list[str] = []
    if "average_steps" in metrics:
        metrics_summary_parts.append(f"average steps {format_metric(metrics.get('average_steps'), '')} per day")
    if "average_sleep_hours" in metrics:
        metrics_summary_parts.append(
            f"sleep duration {format_metric(metrics.get('average_sleep_hours'), '')} hours per night"
        )
    if "average_resting_hr" in metrics:
        metrics_summary_parts.append(
            f"resting heart rate {format_metric(metrics.get('average_resting_hr'), '')} bpm"
        )
    if "hrv_rmssd" in metrics:
        metrics_summary_parts.append(f"HRV (RMSSD) {format_metric(metrics.get('hrv_rmssd'), '')} ms")
    if "stress_index" in metrics:
        metrics_summary_parts.append(f"stress index {format_metric(metrics.get('stress_index'), '')}/100")
    if "sleep_efficiency" in metrics:
        metrics_summary_parts.append(f"sleep efficiency {format_metric(metrics.get('sleep_efficiency'), '')}")

    summary_line = (
        f"Data summary: Over the past week, the user had {', '.join(metrics_summary_parts)}."
        if metrics_summary_parts
        else "Data summary: No recent metrics were provided."
    )

    goals = []
    if user_context and user_context.get("fitness_goal"):
        goals.append(f"fitness goal: {user_context.get('fitness_goal')}")
    if user_context and user_context.get("sleep_goal"):
        goals.append(f"sleep goal: {user_context.get('sleep_goal')}")

    context_parts = []
    if user_context and user_context.get("age"):
        context_parts.append(f"age {user_context.get('age')}")
    if user_context and user_context.get("gender"):
        context_parts.append(f"gender {user_context.get('gender')}")
    if goals:
        context_parts.append(", ".join(goals))
    context_line = ", ".join(context_parts)

    framework_lines = []
    if sleep_summary:
        framework_lines.append(f"RU-SATED sleep check: {sleep_summary}.")
        framework_lines.append("Normative range: adults typically need 7-9 hours of sleep.")
    if fitness_summary:
        framework_lines.append(f"Fitness check: {fitness_summary}")
    if not framework_lines:
        framework_lines.append("Normative range: adults typically need 7-9 hours of sleep.")

    system_message = " ".join(
        [
            "You are a health coach that analyzes wearable data and offers lifestyle recommendations.",
            "You are not a doctor and must not provide medical diagnoses or treatments.",
            "Encourage consulting a healthcare professional for persistent or serious issues.",
            "Base your response only on the provided metrics and context. If data is missing, say so.",
            "Format the message with short Markdown section headings in bold.",
            "Use sections: **Summary**, **What stands out**, **Next steps (SMART)**.",
            "Only include **Next steps (SMART)** when the user explicitly asks for advice, recommendations, or a plan.",
            "When you include SMART steps, use 2-4 bullets and include a brief why/how clause.",
            "Tie each recommendation to a metric, goal, or meeting plan detail relevant to the user's question.",
            "If the user asks about imported meeting plans, reference them directly instead of generic guidance.",
            "Keep sentences concise, specific, and actionable.",
            "Do not include a disclaimer in the message; the UI displays it separately.",
            "Return a JSON object with a `message` string and optional `recommendations` array.",
        ]
    )

    user_message_lines = [
        f"User context: {context_line}." if context_line else "User context: not provided.",
        summary_line,
        *framework_lines,
        f"Imported meeting context: {summarize_meeting_context(meeting_context)}"
        if meeting_context
        else None,
        f"User question: {query or 'No question provided.'}",
    ]
    user_message = "\n".join(line for line in user_message_lines if line)

    return system_message, user_message


def summarize_meeting_context(meeting_context: dict[str, Any]) -> str:
    if not meeting_context or not isinstance(meeting_context, dict):
        return "not provided."
    name = meeting_context.get("patientDisplayName") or meeting_context.get("id") or "meeting"
    created_at = meeting_context.get("createdAt")
    created_label = created_at if not created_at else str(created_at).split("T")[0]
    plan = meeting_context.get("plan") or {}
    plan_summary = []
    for key, value in plan.items():
        if not isinstance(value, dict):
            continue
        baseline = str(value.get("baseline", "")).strip()
        baseline = baseline[:160] if baseline else None
        goals = value.get("smartGoals") or []
        goal_text = "; ".join(goals[:2]) if isinstance(goals, list) and goals else None
        parts = [key, baseline, f"Goals: {goal_text}" if goal_text else None]
        plan_summary.append(" | ".join(part for part in parts if part))
    summary = " || ".join(plan_summary)
    parts = [f"{name} ({created_label})"]
    if summary:
        parts.append(f"Plan summary: {summary}")
    return " | ".join(parts)


def strip_code_fences(text: str) -> str:
    return re.sub(r"^\s*```(?:json)?|\s*```$", "", text.strip(), flags=re.I | re.M)


def extract_message_from_json(text: str) -> str | None:
    match = re.search(r'"message"\s*:\s*"([^"]*)"', text)
    if not match:
        return None
    return match.group(1).replace("\\n", "\n")


def strip_disclaimer(message: str) -> str:
    if not message:
        return message
    return "\n".join(line for line in message.splitlines() if "disclaimer" not in line.lower()).strip()


def parse_model_response(content: str) -> dict[str, Any]:
    if not content:
        return {"message": "I couldn't generate a response at the moment."}
    cleaned = strip_code_fences(content)
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and parsed.get("message"):
            return {
                "message": strip_disclaimer(parsed.get("message", "")),
                "recommendations": parsed.get("recommendations")
                if isinstance(parsed.get("recommendations"), list)
                else None,
            }
    except json.JSONDecodeError:
        pass
    extracted = extract_message_from_json(cleaned)
    if extracted:
        return {"message": strip_disclaimer(extracted)}
    return {"message": strip_disclaimer(cleaned)}


async def call_openai(system_message: str, user_message: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set.")
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        messages=[{"role": "system", "content": system_message}, {"role": "user", "content": user_message}],
        temperature=0.4,
    )
    return response.choices[0].message.content or ""


def fallback_response(metrics: dict[str, Any], user_context: dict[str, Any] | None, query: str | None) -> dict[str, Any]:
    steps = f"{metrics.get('average_steps')} steps/day" if metrics.get("average_steps") else "step data not available"
    sleep = (
        f"{metrics.get('average_sleep_hours')} hours/night"
        if metrics.get("average_sleep_hours")
        else "sleep data not available"
    )
    stress = (
        f"stress index {metrics.get('stress_index')}/100"
        if metrics.get("stress_index") is not None
        else "stress data not available"
    )
    goals = []
    if user_context and user_context.get("fitness_goal"):
        goals.append(user_context.get("fitness_goal"))
    if user_context and user_context.get("sleep_goal"):
        goals.append(user_context.get("sleep_goal"))

    wants_advice = bool(re.search(r"plan|recommend|advice|suggest|improve|help|should i|next steps", query or "", re.I))
    message_parts = [
        "**Summary**",
        f"Based on your recent metrics, your activity is {steps}, sleep is {sleep}, and {stress}.",
        "",
        "**What stands out**",
        f"Your goals include {', '.join(goals)}, so changes tied to those goals will matter most."
        if goals
        else "Let me know which area you want to focus on next.",
    ]
    if wants_advice:
        message_parts.extend(
            [
                "",
                "**Next steps (SMART)**",
                "- Set a consistent bedtime for 3 nights this week.",
                "- Add a 10-minute walk after lunch on 3 days.",
                "- Track energy and stress after each change to see what helps most.",
            ]
        )

    return {
        "message": "\n".join(message_parts),
        "recommendations": [
            {
                "category": "Sleep",
                "action": "Set a consistent bedtime for 3 nights this week",
                "priority": "medium",
            },
            {
                "category": "Activity",
                "action": "Add a 10-minute walk after lunch on 3 days",
                "priority": "low",
            },
        ]
        if wants_advice
        else [],
    }


def enrich_response(response: dict[str, Any], metrics: dict[str, Any], user_context: dict[str, Any] | None, query: str | None) -> dict[str, Any]:
    message = response.get("message", "")
    needs_expansion = len(message) < 300
    recommendations = response.get("recommendations") if isinstance(response.get("recommendations"), list) else []
    if not needs_expansion and recommendations:
        return response

    expanded_parts = [message]
    wants_advice = bool(re.search(r"plan|recommend|advice|suggest|improve|help|should i|next steps", query or "", re.I))
    if needs_expansion and wants_advice:
        sleep_hours = metrics.get("average_sleep_hours")
        steps = metrics.get("average_steps")
        stress = metrics.get("stress_index")
        hrv = metrics.get("hrv_rmssd")
        resting_hr = metrics.get("average_resting_hr")

        smart_bullets: list[str] = []
        if sleep_hours is not None:
            target = "7.0" if sleep_hours < 7 else "7.5" if sleep_hours < 8 else "8.0"
            smart_bullets.append(
                f"- **Sleep**: Set a fixed lights-out time to reach {target}h for 4 nights this week, because your average is {round_value(sleep_hours, 2)}h; use a 20-minute wind-down alarm to make it achievable."
            )
        if steps is not None:
            step_target = min(round(steps + 1500), 10000)
            smart_bullets.append(
                f"- **Activity**: Add one 12-minute walk after lunch on 4 days to lift steps toward {step_target}/day, because you are averaging {round_value(steps, 0)} steps; pair it with a calendar reminder."
            )
        if stress is not None:
            smart_bullets.append(
                f"- **Stress**: Do a 5-minute box-breathing reset at 6pm on 3 days to lower your stress index from {round_value(stress, 1)}/100; start with 4-second inhales/exhales to keep it simple."
            )
        if hrv is not None:
            smart_bullets.append(
                f"- **Recovery**: Add one low-intensity day (easy walk or mobility) this week to support HRV ({round_value(hrv, 1)} ms); keep it under 30 minutes so it doesn't add strain."
            )
        if resting_hr is not None and hrv is None:
            smart_bullets.append(
                f"- **Heart health**: Aim for two 20-minute easy sessions this week, because resting HR is {round_value(resting_hr, 1)} bpm; keep effort conversational to encourage recovery."
            )

        if smart_bullets:
            if "Next steps" in message:
                expanded_parts.append("\n".join(smart_bullets))
            else:
                expanded_parts.append("\n".join(["**Next steps (SMART)**", *smart_bullets]))

    enriched_recommendations = (
        recommendations
        if recommendations
        else [
            {
                "category": "Sleep",
                "action": "Set a consistent bedtime for 4 nights this week",
                "priority": "high",
            },
            {
                "category": "Stress",
                "action": "Practice 5 minutes of slow breathing after work on 3 days",
                "priority": "medium",
            },
            {
                "category": "Activity",
                "action": "Add a 15-minute easy walk on 3 days",
                "priority": "low",
            },
        ]
        if wants_advice
        else []
    )

    if not recommendations and user_context and user_context.get("fitness_goal"):
        enriched_recommendations.insert(
            0,
            {
                "category": "Training",
                "action": f"Schedule 2 easy runs this week to build consistency for {user_context.get('fitness_goal')}",
                "priority": "medium",
            },
        )

    return {
        "message": "\n\n".join(part for part in expanded_parts if part).strip(),
        "recommendations": enriched_recommendations,
    }


async def generate_coach_response(
    *,
    metrics: dict[str, Any],
    user_context: dict[str, Any] | None,
    query: str | None,
    meeting_context: dict[str, Any] | None,
    stats: dict[str, Any],
) -> dict[str, Any]:
    system_message, user_message = build_prompt(
        metrics=metrics,
        user_context=user_context,
        query=query,
        stats=stats,
        meeting_context=meeting_context,
    )
    try:
        content = await call_openai(system_message, user_message)
        parsed = parse_model_response(content)
        return enrich_response(parsed, metrics, user_context, query)
    except Exception:
        return enrich_response(fallback_response(metrics, user_context, query), metrics, user_context, query)
