"""Integration tests for games endpoints using the Supabase dev stack."""

from __future__ import annotations

import time
from collections.abc import Generator

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from tests.supabase_test_helpers import get_game_id_by_bgg, get_user_and_profile


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


@pytest.fixture(scope="module")
def premium_user():
    return get_user_and_profile("premium@bgai.test")


@pytest.fixture(scope="module")
def tester_user():
    return get_user_and_profile("tester@bgai.test")


@pytest.fixture(scope="module")
def gloomhaven_id() -> str:
    return get_game_id_by_bgg(174430)


@pytest.fixture(scope="module")
def terraforming_mars_id() -> str:
    return get_game_id_by_bgg(167791)


# =====================================================
# GET /games - List games tests
# =====================================================


def test_get_games_list_as_basic_user(client: TestClient, basic_user):
    user, _ = basic_user
    token = _make_token(user.id, user.email)
    response = client.get("/games", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["games"], list)
    assert body["games"], "Expected seeded games to be available"
    sample_game = body["games"][0]
    assert "description" in sample_game



