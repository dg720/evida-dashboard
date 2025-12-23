import json
import random
from datetime import datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "server" / "data"
PERSONA_DIR = DATA_DIR / "personas"


PERSONAS = [
    {
        "id": "active-alex",
        "name": "Active Alex",
        "description": "Young adult with regular exercise and high daily step count.",
        "steps_range": (9000, 12000),
        "sleep_range": (7.0, 8.0),
        "stress_range": (20, 35),
        "resting_hr_range": (55, 62),
    },
    {
        "id": "stressed-sam",
        "name": "Stressed Sam",
        "description": "Mid-career professional experiencing high stress and insufficient sleep.",
        "steps_range": (4000, 6500),
        "sleep_range": (5.0, 6.2),
        "stress_range": (65, 85),
        "resting_hr_range": (70, 78),
    },
    {
        "id": "sleep-challenged-chris",
        "name": "Sleep-Challenged Chris",
        "description": "Individual with insomnia symptoms and fragmented sleep.",
        "steps_range": (3500, 5200),
        "sleep_range": (4.5, 5.6),
        "stress_range": (45, 70),
        "resting_hr_range": (68, 80),
    },
    {
        "id": "recovering-riley",
        "name": "Recovering Riley",
        "description": "Person recovering from injury with decreasing step count.",
        "steps_range": (2500, 5500),
        "sleep_range": (6.0, 7.0),
        "stress_range": (40, 60),
        "resting_hr_range": (72, 85),
    },
]


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def generate_series(persona, days=30):
    random.seed(persona["id"])
    today = datetime.utcnow().date()
    series = []
    for day_offset in range(days):
        date = today - timedelta(days=(days - day_offset - 1))
        steps = random.randint(*persona["steps_range"])
        sleep_hours = round(random.uniform(*persona["sleep_range"]), 2)
        stress = random.randint(*persona["stress_range"])
        resting_hr = random.randint(*persona["resting_hr_range"])
        hrv_rmssd = round(random.uniform(40, 80), 1)
        calories = int(1800 + steps * 0.05)
        sleep_eff = round(clamp(random.uniform(0.78, 0.92), 0.7, 0.95), 2)
        active_minutes = int(steps / 120)
        awakenings = random.randint(1, 4) if "sleep" in persona["id"] else random.randint(0, 2)

        series.append(
            {
                "date": date.isoformat(),
                "steps": steps,
                "sleep_hours": sleep_hours,
                "stress_index": stress,
                "resting_hr": resting_hr,
                "hrv_rmssd": hrv_rmssd,
                "calories_burned": calories,
                "sleep_efficiency": sleep_eff,
                "active_minutes": active_minutes,
                "awakenings": awakenings,
                "sleep_stage_rem": round(sleep_hours * 0.25, 2),
                "sleep_stage_deep": round(sleep_hours * 0.22, 2),
                "sleep_stage_light": round(sleep_hours * 0.53, 2),
            }
        )
    return series


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PERSONA_DIR.mkdir(parents=True, exist_ok=True)

    personas_index = []
    for persona in PERSONAS:
        data = generate_series(persona)
        persona_payload = {
            "id": persona["id"],
            "name": persona["name"],
            "description": persona["description"],
            "data": data,
        }
        with (PERSONA_DIR / f"{persona['id']}.json").open("w", encoding="utf-8") as f:
            json.dump(persona_payload, f, indent=2)

        personas_index.append(
            {
                "id": persona["id"],
                "name": persona["name"],
                "description": persona["description"],
                "days": len(data),
            }
        )

    with (DATA_DIR / "personas.json").open("w", encoding="utf-8") as f:
        json.dump(personas_index, f, indent=2)


if __name__ == "__main__":
    main()
