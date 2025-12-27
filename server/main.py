import json
import os
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from llm import generate_coach_response
from stats import compute_stats

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
    if not is_valid_chat_payload(payload):
        return JSONResponse(status_code=400, content={"error": "Invalid request payload."})

    metrics = payload.get("metrics", {})
    user_context = payload.get("user_context")
    query = payload.get("query")
    series = payload.get("series")
    meeting_context = payload.get("meeting_context")
    stats = summarize_series(series) if isinstance(series, list) else {"variance": {}}

    response = await generate_coach_response(
        metrics=metrics,
        user_context=user_context,
        query=query,
        meeting_context=meeting_context,
        stats={
            "average_sleep_hours": {"variance": stats.get("variance", {}).get("average_sleep_hours")},
            "average_resting_hr": {"variance": stats.get("variance", {}).get("average_resting_hr")},
            "hrv_rmssd": {"variance": stats.get("variance", {}).get("hrv_rmssd")},
        },
    )
    return response
