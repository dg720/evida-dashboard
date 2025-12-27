from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_personas():
    response = client.get("/personas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()
    assert "id" in response.json()[0]


def test_chat():
    response = client.post(
        "/chat",
        json={
            "metrics": {
                "average_steps": 8500,
                "average_sleep_hours": 6.5,
                "average_resting_hr": 70,
                "hrv_rmssd": 55,
                "stress_index": 60,
                "calories_burned": 2200,
                "sleep_efficiency": 0.85,
            },
            "user_context": {
                "age": 34,
                "gender": "male",
                "fitness_goal": "Train for a half marathon",
                "sleep_goal": "Improve sleep duration",
            },
            "query": "I feel tired after work and my stress is high. How can I improve?",
            "series": [
                {
                    "date": "2024-01-01",
                    "steps": 8000,
                    "sleep_hours": 6.2,
                    "resting_hr": 70,
                    "hrv_rmssd": 55,
                    "stress_index": 60,
                    "calories_burned": 2100,
                    "sleep_efficiency": 0.82,
                    "active_minutes": 40,
                },
            ],
        },
    )
    assert response.status_code == 200
    assert response.json().get("message")
