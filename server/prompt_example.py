"""
Evida Health Coach — Google-research-style prompt template (multimodal fusion + coaching goals)

This module builds a robust, structured prompt for an LLM health coach using:
A) multimodal fusion: aggregated summaries + derived health scores (from wearables)
B) coaching context: imported coaching calls (goals, constraints, plans)

It produces:
- system_prompt: strict behavioral policy + safety boundaries
- developer_prompt: structured context packet (JSON) + response schema requirements
- user_prompt: the user's query

Replace the placeholder JSON dicts with real payloads.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


# ----------------------------
# 1) Placeholders (to replace)
# ----------------------------

WEARABLES_SUMMARY_JSON: Dict[str, Any] = {
    # Populate from your pipeline (Terra API / normalized DB).
    # Keep this compact: 7/14/30d aggregates, deltas, variability, plus derived scores.
    "window_days": 14,
    "generated_at": "YYYY-MM-DDTHH:MM:SSZ",
    "data_quality": {
        "coverage_pct": 0.92,
        "missingness_notes": ["HRV missing 2 nights"],
        "device_sources": ["oura", "garmin"],
    },
    "demographics": {
        "age": None,
        "sex": None,
        "timezone": "Europe/London",
    },
    "baselines": {
        "baseline_window_days": 30,
        "sleep_duration_mean_h": None,
        "hrv_rmssd_mean_ms": None,
        "resting_hr_mean_bpm": None,
        "steps_mean": None,
    },
    "aggregates": {
        # A) Multimodal fusion: aggregates + variability
        "sleep": {
            "duration_mean_h": None,
            "duration_std_h": None,
            "efficiency_mean_pct": None,
            "efficiency_std_pct": None,
            "bedtime_mean_local": None,
            "bedtime_std_min": None,
            "wake_time_mean_local": None,
            "wake_time_std_min": None,
            "awakenings_mean": None,
        },
        "recovery": {
            "resting_hr_mean_bpm": None,
            "resting_hr_std_bpm": None,
            "hrv_rmssd_mean_ms": None,
            "hrv_rmssd_std_ms": None,
            "resp_rate_mean_rpm": None,
        },
        "activity": {
            "steps_mean": None,
            "steps_std": None,
            "active_minutes_mean": None,
            "training_load_mean": None,   # if available
            "strain_mean": None,          # if available
        },
        "stress": {
            "stress_index_mean": None,    # device-specific normalized index if you have one
            "stress_index_std": None,
            "high_stress_minutes_mean": None,
        },
    },
    "derived_scores": {
        # Provide transparent, explainable scores (0–100) with banding.
        # These can be deterministic rules at first; later learned.
        "readiness_score_0_100": None,
        "recovery_score_0_100": None,
        "sleep_score_0_100": None,
        "activity_score_0_100": None,
        "stress_burden_score_0_100": None,
        "score_bands": {
            "green": [80, 100],
            "yellow": [60, 79],
            "red": [0, 59],
        },
        "score_explanations": {
            # short, non-LLM explanations of how each score is computed (for transparency)
            "readiness_score_0_100": "Computed from sleep score, HRV vs baseline, RHR vs baseline, and recent load.",
        },
    },
    "notable_trends": [
        # Short bullet facts, no interpretation.
        # Example: "Sleep duration down 35 min vs baseline."
    ],
    "alerts": [
        # Optional deterministic flags
        # Example: {"type": "low_hrv_streak", "days": 4, "severity": "medium"}
    ],
}

COACHING_CONTEXT_JSON: Dict[str, Any] = {
    # Populate from imported coaching calls / meeting notes (scribe).
    "meeting_id": "m_123",
    "meeting_date": "YYYY-MM-DD",
    "source": "scribe_summary",
    "coach_brief": [
        # concise bullet statements (<=10) that are safe to show to model
        # Example: "Primary goal: improve sleep consistency for energy at work."
    ],
    "goals": [
        # Structured goals with horizon and priority
        # {"id": "g1", "domain": "sleep", "target": "7.5h avg", "horizon_weeks": 6, "priority": "high"}
    ],
    "constraints": [
        # Example: "No caffeine after 2pm", "Knee niggle: avoid high-impact"
    ],
    "plan": {
        # Optional action plan agreed in the call (keep as checklist)
        "weekly_actions": [
            # {"id": "a1", "action": "10-min wind-down routine", "frequency": "daily", "notes": "phone away"}
        ],
        "tracking_preferences": {
            "check_in_day": "Sunday",
            "preferred_style": "direct_and_brief",
        },
    },
    "open_questions": [
        # uncertainties that the coach should clarify if needed
        # "Do night awakenings coincide with late meals?"
    ],
}

USER_QUERY: str = "Why am I waking up at night, and what should I do this week?"


# -----------------------------------------
# 2) Response schema (structured, robust)
# -----------------------------------------

ANALYSIS_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["reasoning_trace", "data_references", "recommendations", "follow_ups", "safety"],
    "properties": {
        "reasoning_trace": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Short bullet chain of evidence. MUST reference provided metrics only (no inventions).",
        },
        "data_references": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["metric_path", "value", "window_days", "comparison"],
                "properties": {
                    "metric_path": {"type": "string", "description": "JSON pointer-like path, e.g., aggregates.sleep.duration_mean_h"},
                    "value": {"type": ["number", "string", "null"]},
                    "window_days": {"type": "number"},
                    "comparison": {"type": "string", "description": "e.g. 'vs baseline', 'trend', 'no baseline available'"},
                },
            },
        },
        "recommendations": {
            "type": "array",
            "description": "Actionable suggestions tied to goals/constraints. SMART where possible.",
            "items": {
                "type": "object",
                "required": ["category", "action", "why", "priority", "timeframe", "success_metric"],
                "properties": {
                    "category": {"type": "string", "enum": ["sleep", "recovery", "activity", "stress", "nutrition", "habits", "other"]},
                    "action": {"type": "string"},
                    "why": {"type": "string"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    "timeframe": {"type": "string", "description": "e.g. 'tonight', 'next 7 days'"},
                    "success_metric": {"type": "string", "description": "e.g. 'sleep_duration_mean_h +30min' or 'bedtime_std_min -15'"},
                },
            },
        },
        "follow_ups": {
            "type": "array",
            "description": "At most 3 clarifying questions ONLY if necessary due to missing data or ambiguity.",
            "items": {"type": "string"},
        },
        "safety": {
            "type": "object",
            "required": ["disclaimer", "red_flags"],
            "properties": {
                "disclaimer": {"type": "string", "description": "Non-medical advice disclaimer."},
                "red_flags": {
                    "type": "array",
                    "description": "If user mentions concerning symptoms, advise seeking professional help. Keep generic.",
                    "items": {"type": "string"},
                },
            },
        },
    },
}

RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["answer", "reasoning_trace", "data_references", "recommendations", "follow_ups", "safety"],
    "properties": {
        "answer": {
            "type": "string",
            "minLength": 1,
            "description": "User-facing response. Clear, minimal, non-alarming. No diagnosis. Include brief disclaimer if relevant.",
        },
        "message": {
            "type": "string",
            "description": "UI compatibility alias for answer. Optional; if omitted, backend will map answer to message.",
        },
        "reasoning_trace": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Short bullet chain of evidence. MUST reference provided metrics only (no inventions).",
        },
        "data_references": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["metric_path", "value", "window_days", "comparison"],
                "properties": {
                    "metric_path": {"type": "string", "description": "JSON pointer-like path, e.g., aggregates.sleep.duration_mean_h"},
                    "value": {"type": ["number", "string", "null"]},
                    "window_days": {"type": "number"},
                    "comparison": {"type": "string", "description": "e.g. 'vs baseline', 'trend', 'no baseline available'"},
                },
            },
        },
        "recommendations": {
            "type": "array",
            "description": "Actionable suggestions tied to goals/constraints. SMART where possible.",
            "items": {
                "type": "object",
                "required": ["category", "action", "why", "priority", "timeframe", "success_metric"],
                "properties": {
                    "category": {"type": "string", "enum": ["sleep", "recovery", "activity", "stress", "nutrition", "habits", "other"]},
                    "action": {"type": "string"},
                    "why": {"type": "string"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    "timeframe": {"type": "string", "description": "e.g. 'tonight', 'next 7 days'"},
                    "success_metric": {"type": "string", "description": "e.g. 'sleep_duration_mean_h +30min' or 'bedtime_std_min -15'"},
                },
            },
        },
        "follow_ups": {
            "type": "array",
            "description": "At most 3 clarifying questions ONLY if necessary due to missing data or ambiguity.",
            "items": {"type": "string"},
        },
        "safety": {
            "type": "object",
            "required": ["disclaimer", "red_flags"],
            "properties": {
                "disclaimer": {"type": "string", "description": "Non-medical advice disclaimer."},
                "red_flags": {
                    "type": "array",
                    "description": "If user mentions concerning symptoms, advise seeking professional help. Keep generic.",
                    "items": {"type": "string"},
                },
            },
        },
    },
}


# -----------------------------------------
# 3) Prompt engineering policy (researchy)
# -----------------------------------------

SYSTEM_POLICY = """You are Evida Health Coach, a careful health-analytics assistant.

SAFETY + SCOPE (non-negotiable):
- You are not a doctor. Do NOT diagnose conditions or prescribe medications.
- Provide educational, lifestyle-oriented guidance only.
- If the user mentions severe or alarming symptoms, advise contacting a clinician or emergency services.
- Do not invent metrics, values, or events. Use ONLY the provided context JSON.
- If a needed metric is missing, say so and ask a concise follow-up question.

STYLE:
- Write for a layperson: clear, calm, minimal jargon.
- Be specific and actionable. Use short sections and bullets.
- Tie suggestions to the user's goals and constraints.
- Prefer deterministic explanations: cite the metric and the direction (up/down vs baseline or trend).
- Avoid overclaiming sleep stage precision or causal claims.

OUTPUT FORMAT:
- Return ONLY valid JSON matching the given response schema.
"""

DEVELOPER_INSTRUCTIONS = """You will receive:
(A) a wearables summary JSON with aggregated metrics, variability, and derived scores
(B) a coaching-context JSON with goals, constraints, and action plan
(C) a user query

Your job:
1) Answer the user query grounded in the provided metrics.
2) Use coaching goals/constraints as the PRIMARY intent.
3) Use wearables metrics as evidence (data_references).
4) Provide 3–6 SMART recommendations, prioritized.
5) Ask up to 3 follow-ups only if essential.

ROBUSTNESS RULES:
- If goals conflict with constraints, propose the safest alternative and explain tradeoff.
- If a score is present, treat it as a summary; still cite the underlying metrics if provided.
- If population benchmarks are not provided, do NOT claim 'above average'—use baseline comparisons instead.
- Keep reasoning_trace short and factual.

Return JSON that strictly matches the response schema below.
"""

@dataclass
class PromptBundle:
    system: str
    developer: str
    user: str


def build_prompt_bundle(
    wearables_summary: Dict[str, Any],
    coaching_context: Dict[str, Any],
    user_query: str,
    response_schema: Dict[str, Any],
) -> PromptBundle:
    """
    Builds a three-message prompt bundle (system/developer/user).
    This is compatible with most chat-completion APIs.
    """
    context_packet = {
        "wearables_summary": wearables_summary,
        "coaching_context": coaching_context,
        "response_schema": response_schema,
    }

    developer = "\n\n".join(
        [
            DEVELOPER_INSTRUCTIONS.strip(),
            "CONTEXT_PACKET_JSON:\n" + json.dumps(context_packet, indent=2, ensure_ascii=False),
        ]
    )

    return PromptBundle(
        system=SYSTEM_POLICY.strip(),
        developer=developer,
        user=user_query.strip(),
    )


if __name__ == "__main__":
    bundle = build_prompt_bundle(
        wearables_summary=WEARABLES_SUMMARY_JSON,
        coaching_context=COACHING_CONTEXT_JSON,
        user_query=USER_QUERY,
        response_schema=RESPONSE_SCHEMA,
    )

    print("\n--- SYSTEM ---\n", bundle.system)
    print("\n--- DEVELOPER ---\n", bundle.developer[:2000], "\n... (truncated) ...")
    print("\n--- USER ---\n", bundle.user)
