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
            "user_id": "active-alex",
            "message": "Quick check in about my plan?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("answer")
    assert data.get("message")
