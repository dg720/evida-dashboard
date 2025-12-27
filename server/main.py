import json
import os
import time
from pathlib import Path
from typing import Any

import httpx
from fastapi import Body, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from llm import generate_coach_response
from stats import compute_stats, round_value

app = FastAPI()

cors_origins = (
    [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")]
    if os.getenv("CORS_ORIGINS")
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_ROOT = Path(__file__).resolve().parent / "data"
PERSONAS_INDEX_PATH = DATA_ROOT / "personas.json"

SCRIBE_API_BASE_URL = os.getenv("SCRIBE_API_BASE_URL", "https://evida-scribe-api-production.up.railway.app")
MEETING_CACHE_TTL = 300
MEETING_CACHE: dict[str, dict[str, Any]] = {}


def load_personas_index() -> list[dict[str, Any]]:
    if not PERSONAS_INDEX_PATH.exists():
        return []
    return json.loads(PERSONAS_INDEX_PATH.read_text(encoding="utf-8"))


def load_persona_data(persona_id: str) -> dict[str, Any] | None:
    persona_path = DATA_ROOT / "personas" / f"{persona_id}.json"
    if not persona_path.exists():
        return None
    return json.loads(persona_path.read_text(encoding="utf-8"))


def summarize_series(series: list[dict[str, Any]]) -> dict[str, Any]:
    fields = [
        "steps",
        "sleep_hours",
        "resting_hr",
        "hrv_rmssd",
        "stress_index",
        "calories_burned",
        "sleep_efficiency",
        "active_minutes",
    ]
    stats = compute_stats(series, fields)
    return {
        "average_steps": stats.get("steps", {}).get("mean"),
        "average_sleep_hours": stats.get("sleep_hours", {}).get("mean"),
        "average_resting_hr": stats.get("resting_hr", {}).get("mean"),
        "hrv_rmssd": stats.get("hrv_rmssd", {}).get("mean"),
        "stress_index": stats.get("stress_index", {}).get("mean"),
        "calories_burned": stats.get("calories_burned", {}).get("mean"),
        "sleep_efficiency": stats.get("sleep_efficiency", {}).get("mean"),
        "active_minutes": stats.get("active_minutes", {}).get("mean"),
        "variance": {
            "average_steps": stats.get("steps", {}).get("variance"),
            "average_sleep_hours": stats.get("sleep_hours", {}).get("variance"),
            "average_resting_hr": stats.get("resting_hr", {}).get("variance"),
            "hrv_rmssd": stats.get("hrv_rmssd", {}).get("variance"),
        },
    }


def compute_scores(summary: dict[str, Any]) -> dict[str, Any]:
    sleep = summary.get("average_sleep_hours") or 0
    stress = summary.get("stress_index") or 0
    resting_hr = summary.get("average_resting_hr") or 0
    hrv = summary.get("hrv_rmssd") or 0
    steps = summary.get("average_steps") or 0
    sleep_eff = summary.get("sleep_efficiency") or 0

    sleep_score = min((sleep / 8) * 100, 100) if sleep else None
    efficiency_score = min(sleep_eff * 100, 100) if sleep_eff else None
    sleep_score = (
        round_value(((sleep_score or 0) * 0.6 + (efficiency_score or 0) * 0.4), 1)
        if sleep_score is not None
        else None
    )
    stress_burden = round_value(max(0, 100 - stress), 1) if stress else None
    readiness = (
        round_value(((sleep_score or 0) * 0.4 + (100 - stress) * 0.35 + max(0, 100 - (resting_hr - 50) * 1.5) * 0.25), 1)
        if sleep_score is not None and stress and resting_hr
        else None
    )
    recovery = (
        round_value(((hrv / 70) * 100) * 0.6 + max(0, 100 - (resting_hr - 50) * 1.2) * 0.4, 1)
        if hrv and resting_hr
        else None
    )
    activity = round_value(min(steps / 100, 100), 1) if steps else None

    return {
        "readiness_score_0_100": readiness,
        "recovery_score_0_100": recovery,
        "sleep_score_0_100": sleep_score,
        "activity_score_0_100": activity,
        "stress_burden_score_0_100": stress_burden,
        "score_bands": {"green": [80, 100], "yellow": [60, 79], "red": [0, 59]},
        "score_explanations": {
            "readiness_score_0_100": "Computed from sleep score, HRV vs baseline, RHR vs baseline, and recent load.",
        },
    }


def build_wearables_summary(user_id: str, window_days: int) -> dict[str, Any]:
    persona_data = load_persona_data(user_id)
    if not persona_data:
        raise KeyError("Persona not found.")
    series = persona_data.get("data", [])
    window = series[-window_days:] if window_days else series
    stats = compute_stats(
        window,
        [
            "steps",
            "sleep_hours",
            "resting_hr",
            "hrv_rmssd",
            "stress_index",
            "calories_burned",
            "sleep_efficiency",
            "active_minutes",
        ],
    )
    summary = summarize_series(window)
    baseline_summary = summarize_series(series)
    notable_trends = []
    if summary.get("average_sleep_hours") and baseline_summary.get("average_sleep_hours"):
        delta = round_value(summary["average_sleep_hours"] - baseline_summary["average_sleep_hours"], 2)
        if abs(delta) >= 0.3:
            notable_trends.append(f"Sleep duration {'up' if delta > 0 else 'down'} {abs(delta)}h vs baseline.")
    if summary.get("average_steps") and baseline_summary.get("average_steps"):
        delta = round_value(summary["average_steps"] - baseline_summary["average_steps"], 0)
        if abs(delta) >= 500:
            notable_trends.append(f"Steps {'up' if delta > 0 else 'down'} {abs(delta)} vs baseline.")
    if summary.get("hrv_rmssd") and baseline_summary.get("hrv_rmssd"):
        delta = round_value(summary["hrv_rmssd"] - baseline_summary["hrv_rmssd"], 1)
        if abs(delta) >= 3:
            notable_trends.append(f"HRV {'up' if delta > 0 else 'down'} {abs(delta)} ms vs baseline.")
    if summary.get("stress_index") and baseline_summary.get("stress_index"):
        delta = round_value(summary["stress_index"] - baseline_summary["stress_index"], 1)
        if abs(delta) >= 5:
            notable_trends.append(f"Stress index {'up' if delta > 0 else 'down'} {abs(delta)} vs baseline.")

    return {
        "window_days": window_days,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "data_quality": {
            "coverage_pct": min(len(window) / float(window_days or 1), 1.0),
            "missingness_notes": [],
            "device_sources": ["demo"],
        },
        "demographics": {"age": None, "sex": None, "timezone": "UTC"},
        "baselines": {
            "baseline_window_days": len(series),
            "sleep_duration_mean_h": baseline_summary.get("average_sleep_hours"),
            "hrv_rmssd_mean_ms": baseline_summary.get("hrv_rmssd"),
            "resting_hr_mean_bpm": baseline_summary.get("average_resting_hr"),
            "steps_mean": baseline_summary.get("average_steps"),
        },
        "aggregates": {
            "sleep": {
                "duration_mean_h": summary.get("average_sleep_hours"),
                "duration_std_h": stats.get("sleep_hours", {}).get("std"),
                "efficiency_mean_pct": summary.get("sleep_efficiency"),
                "efficiency_std_pct": stats.get("sleep_efficiency", {}).get("std"),
                "bedtime_mean_local": None,
                "bedtime_std_min": None,
                "wake_time_mean_local": None,
                "wake_time_std_min": None,
                "awakenings_mean": None,
            },
            "recovery": {
                "resting_hr_mean_bpm": summary.get("average_resting_hr"),
                "resting_hr_std_bpm": stats.get("resting_hr", {}).get("std"),
                "hrv_rmssd_mean_ms": summary.get("hrv_rmssd"),
                "hrv_rmssd_std_ms": stats.get("hrv_rmssd", {}).get("std"),
                "resp_rate_mean_rpm": None,
            },
            "activity": {
                "steps_mean": summary.get("average_steps"),
                "steps_std": stats.get("steps", {}).get("std"),
                "active_minutes_mean": summary.get("active_minutes"),
                "training_load_mean": None,
                "strain_mean": None,
            },
            "stress": {
                "stress_index_mean": summary.get("stress_index"),
                "stress_index_std": stats.get("stress_index", {}).get("std"),
                "high_stress_minutes_mean": None,
            },
        },
        "derived_scores": compute_scores(summary),
        "notable_trends": notable_trends,
        "alerts": [],
    }


def build_wearables_summary_from_series(series: list[dict[str, Any]], window_days: int) -> dict[str, Any]:
    window = series[-window_days:] if window_days else series
    summary = summarize_series(window)
    baseline_summary = summarize_series(series)
    stats = compute_stats(window, [
        "steps",
        "sleep_hours",
        "resting_hr",
        "hrv_rmssd",
        "stress_index",
        "calories_burned",
        "sleep_efficiency",
        "active_minutes",
    ])

    return {
        "window_days": window_days,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "data_quality": {
            "coverage_pct": min(len(window) / float(window_days or 1), 1.0),
            "missingness_notes": [],
            "device_sources": ["demo"],
        },
        "demographics": {"age": None, "sex": None, "timezone": "UTC"},
        "baselines": {
            "baseline_window_days": len(series),
            "sleep_duration_mean_h": baseline_summary.get("average_sleep_hours"),
            "hrv_rmssd_mean_ms": baseline_summary.get("hrv_rmssd"),
            "resting_hr_mean_bpm": baseline_summary.get("average_resting_hr"),
            "steps_mean": baseline_summary.get("average_steps"),
        },
        "aggregates": {
            "sleep": {
                "duration_mean_h": summary.get("average_sleep_hours"),
                "duration_std_h": stats.get("sleep_hours", {}).get("std"),
                "efficiency_mean_pct": summary.get("sleep_efficiency"),
                "efficiency_std_pct": stats.get("sleep_efficiency", {}).get("std"),
                "bedtime_mean_local": None,
                "bedtime_std_min": None,
                "wake_time_mean_local": None,
                "wake_time_std_min": None,
                "awakenings_mean": None,
            },
            "recovery": {
                "resting_hr_mean_bpm": summary.get("average_resting_hr"),
                "resting_hr_std_bpm": stats.get("resting_hr", {}).get("std"),
                "hrv_rmssd_mean_ms": summary.get("hrv_rmssd"),
                "hrv_rmssd_std_ms": stats.get("hrv_rmssd", {}).get("std"),
                "resp_rate_mean_rpm": None,
            },
            "activity": {
                "steps_mean": summary.get("average_steps"),
                "steps_std": stats.get("steps", {}).get("std"),
                "active_minutes_mean": summary.get("active_minutes"),
                "training_load_mean": None,
                "strain_mean": None,
            },
            "stress": {
                "stress_index_mean": summary.get("stress_index"),
                "stress_index_std": stats.get("stress_index", {}).get("std"),
                "high_stress_minutes_mean": None,
            },
        },
        "derived_scores": compute_scores(summary),
        "notable_trends": [],
        "alerts": [],
    }


def coaching_context_from_meeting(detail: dict[str, Any]) -> dict[str, Any]:
    plan = detail.get("plan") or {}
    coach_brief = []
    goals = []
    for domain, value in plan.items():
        if not isinstance(value, dict):
            continue
        baseline = value.get("baseline")
        if baseline:
            coach_brief.append(f"{domain}: {baseline}")
        smart_goals = value.get("smartGoals") or []
        for idx, goal in enumerate(smart_goals[:2]):
            goals.append(
                {
                    "id": f"{domain}_{idx}",
                    "domain": domain,
                    "target": goal,
                    "horizon_weeks": None,
                    "priority": "medium",
                }
            )
    return {
        "meeting_id": detail.get("id") or "",
        "meeting_date": (detail.get("createdAt") or "")[:10],
        "source": "scribe_summary",
        "coach_brief": coach_brief,
        "goals": goals,
        "constraints": [],
        "plan": {
            "weekly_actions": [
                {"id": f"action_{idx}", "action": goal, "frequency": "weekly", "notes": ""}
                for idx, goal in enumerate([g["target"] for g in goals][:6])
            ],
            "tracking_preferences": {"check_in_day": "Sunday", "preferred_style": "direct_and_brief"},
        },
        "open_questions": [],
    }


async def fetch_meeting_context(meeting_id: str) -> dict[str, Any]:
    cached = MEETING_CACHE.get(meeting_id)
    if cached and cached.get("expires_at", 0) > time.time():
        return cached["data"]
    url = f"{SCRIBE_API_BASE_URL}/api/meetings/{meeting_id}"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url)
    if response.status_code != 200:
        raise RuntimeError("Unable to load meeting context.")
    detail = response.json()
    context = coaching_context_from_meeting(detail)
    MEETING_CACHE[meeting_id] = {"data": context, "expires_at": time.time() + MEETING_CACHE_TTL}
    return context


def normalize_upload_data(raw_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not isinstance(raw_data, list):
        return []
    normalized = []
    for entry in raw_data:
        normalized.append(
            {
                "date": entry.get("date"),
                "steps": float(entry.get("steps") or entry.get("average_steps") or 0),
                "sleep_hours": float(entry.get("sleep_hours") or entry.get("sleep") or 0),
                "resting_hr": float(entry.get("resting_hr") or entry.get("average_resting_hr") or 0),
                "hrv_rmssd": float(entry.get("hrv_rmssd") or entry.get("hrv") or 0),
                "stress_index": float(entry.get("stress_index") or entry.get("stress") or 0),
                "calories_burned": float(entry.get("calories_burned") or entry.get("calories") or 0),
                "sleep_efficiency": float(entry.get("sleep_efficiency") or 0),
                "active_minutes": float(entry.get("active_minutes") or 0),
                "awakenings": float(entry.get("awakenings") or 0),
                "sleep_stage_rem": float(entry.get("sleep_stage_rem") or 0),
                "sleep_stage_deep": float(entry.get("sleep_stage_deep") or 0),
                "sleep_stage_light": float(entry.get("sleep_stage_light") or 0),
            }
        )
    return normalized


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/personas")
def list_personas() -> list[dict[str, Any]]:
    return load_personas_index()


@app.get("/persona/{persona_id}/data")
def get_persona_data(persona_id: str) -> dict[str, Any]:
    persona_data = load_persona_data(persona_id)
    if not persona_data:
        return JSONResponse(status_code=404, content={"error": "Persona not found."})
    summary = summarize_series(persona_data.get("data", []))
    response = dict(persona_data)
    response["summary"] = summary
    return response


@app.get("/users/{user_id}/wearables/summary")
def get_wearables_summary(user_id: str, window_days: int = 14) -> dict[str, Any]:
    try:
        return build_wearables_summary(user_id, window_days)
    except KeyError:
        return JSONResponse(status_code=404, content={"error": "User not found."})


@app.get("/meetings/{meeting_id}/context")
async def get_meeting_context(meeting_id: str) -> dict[str, Any]:
    try:
        return await fetch_meeting_context(meeting_id)
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Unable to load meeting context."})


@app.post("/upload")
async def upload_data(
    file: UploadFile | None = File(default=None),
    payload: dict[str, Any] | list[dict[str, Any]] | None = Body(default=None),
) -> dict[str, Any]:
    try:
        data: list[dict[str, Any]] = []
        if file:
            content = (await file.read()).decode("utf-8")
            if file.filename and file.filename.endswith(".json"):
                parsed = json.loads(content)
                data = normalize_upload_data(parsed.get("data") if isinstance(parsed, dict) else parsed)
            elif file.filename and file.filename.endswith(".csv"):
                import csv

                records = list(csv.DictReader(content.splitlines()))
                data = normalize_upload_data(records)
        elif payload is not None:
            if isinstance(payload, dict) and "data" in payload:
                data = normalize_upload_data(payload.get("data"))
            elif isinstance(payload, list):
                data = normalize_upload_data(payload)

        if not data:
            return JSONResponse(status_code=400, content={"error": "No data uploaded."})

        summary = summarize_series(data)
        app.state.uploaded_data = {"data": data, "summary": summary}
        return {"data": data, "summary": summary}
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Unable to parse uploaded data."})


def is_valid_chat_payload(body: dict[str, Any]) -> bool:
    if not isinstance(body, dict):
        return False
    if not isinstance(body.get("metrics"), dict):
        return False
    if not isinstance(body.get("query"), str):
        return False
    if body.get("user_context") is not None and not isinstance(body.get("user_context"), dict):
        return False
    if body.get("series") is not None and not isinstance(body.get("series"), list):
        return False
    return True


@app.post("/chat")
async def chat(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    if "user_id" in payload or "message" in payload:
        user_id = payload.get("user_id")
        if not user_id:
            return JSONResponse(status_code=400, content={"error": "user_id is required."})
        window_days = int(payload.get("window_days") or 14)
        message = payload.get("message") or ""
        try:
            wearables_summary = build_wearables_summary(user_id, window_days)
        except KeyError:
            return JSONResponse(status_code=404, content={"error": "User not found."})
        coaching_context = {
            "meeting_id": "",
            "meeting_date": "",
            "source": "none",
            "coach_brief": [],
            "goals": [],
            "constraints": [],
            "plan": {"weekly_actions": [], "tracking_preferences": {}},
            "open_questions": [],
        }
        meeting_id = payload.get("meeting_id")
        if meeting_id:
            try:
                coaching_context = await fetch_meeting_context(str(meeting_id))
            except Exception:
                return JSONResponse(status_code=502, content={"error": "Unable to load meeting context."})
        response = await generate_coach_response(
            wearables_summary=wearables_summary,
            coaching_context=coaching_context,
            user_query=message,
        )
        return response

    if not is_valid_chat_payload(payload):
        return JSONResponse(status_code=400, content={"error": "Invalid request payload."})

    metrics = payload.get("metrics", {})
    query = payload.get("query")
    series = payload.get("series")
    window_days = int(payload.get("window_days") or 14)
    meeting_context = payload.get("meeting_context")
    series_data = series if isinstance(series, list) else []
    wearables_summary = build_wearables_summary_from_series(series_data, window_days)
    coaching_context = (
        coaching_context_from_meeting(meeting_context)
        if isinstance(meeting_context, dict)
        else {
            "meeting_id": "",
            "meeting_date": "",
            "source": "none",
            "coach_brief": [],
            "goals": [],
            "constraints": [],
            "plan": {"weekly_actions": [], "tracking_preferences": {}},
            "open_questions": [],
        }
    )

    response = await generate_coach_response(
        wearables_summary=wearables_summary,
        coaching_context=coaching_context,
        user_query=query or "",
    )
    return response
