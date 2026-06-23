from fastapi.testclient import TestClient

from app.main import app
from app.services import firebase_service
from app.utils.exceptions import AuthError
from tests.test_validation import valid_payload


def test_generate_without_auth_header_returns_401():
    client = TestClient(app)
    response = client.post("/api/generate-itinerary", json=valid_payload())
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_generate_with_invalid_token_returns_401(monkeypatch):
    def fake_verify(_: str) -> dict:
        raise AuthError("로그인 정보가 만료되었거나 올바르지 않습니다. 다시 로그인해 주세요.")

    monkeypatch.setattr(firebase_service, "verify_id_token", fake_verify)
    client = TestClient(app)
    response = client.post(
        "/api/generate-itinerary",
        json=valid_payload(),
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
