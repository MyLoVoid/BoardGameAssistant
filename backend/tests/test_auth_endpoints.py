"""Integration tests for authentication endpoints using the Supabase dev stack."""

from __future__ import annotations

import time
from collections.abc import Generator

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from tests.supabase_test_helpers import get_user_and_profile


def _make_token(user_id: str, email: str, expires_in: int = 3600) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + expires_in,
    }
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_user():
    return get_user_and_profile("admin@bgai.test")


@pytest.fixture(scope="module")
def basic_user():
    return get_user_and_profile("basic@bgai.test")


def test_auth_me_returns_profile(client: TestClient, admin_user):
    user, profile = admin_user
    token = _make_token(user.id, user.email)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user.id
    assert body["role"] == profile["role"]


def test_auth_validate_returns_claims(client: TestClient, admin_user):
    user, _ = admin_user
    token = _make_token(user.id, user.email)
    response = client.get("/auth/validate", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["user_id"] == user.id


def test_admin_only_rejects_basic_role(client: TestClient, basic_user):
    user, profile = basic_user
    token = _make_token(user.id, user.email)
    response = client.get("/auth/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert profile["role"] == "basic"


def test_protected_route_requires_token(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authorization header"


def test_expired_token_is_rejected(client: TestClient, admin_user):
    user, _ = admin_user
    token = _make_token(user.id, user.email, expires_in=-1)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Token has expired"
