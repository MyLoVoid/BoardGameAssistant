"""
Integration tests for admin games endpoints (BGG sync) using the local Supabase dev stack.
"""

from __future__ import annotations

import time
from collections.abc import Generator

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services import bgg as bgg_service
from app.services.bgg import BGGGameData, BGGGameNotFound
from app.services.supabase import get_supabase_client


def _get_user_and_profile(email: str) -> tuple[object, dict]:
    """Fetch a Supabase auth user plus its profile row."""
    client = get_supabase_client()
    users = client.auth.admin.list_users()

    target_user = next((user for user in users if getattr(user, "email", "") == email), None)
    if not target_user:
        raise AssertionError(
            f"Test user {email} not found. Run supabase/create_test_users.sql in Supabase Studio."
        )

    profile_resp = (
        client.table("profiles").select("*").eq("id", target_user.id).maybe_single().execute()
    )
    if not profile_resp or not profile_resp.data:
        raise AssertionError(f"Profile record missing for user {email}")

    return target_user, profile_resp.data  # type: ignore[return-value]


def _make_token(user_id: str, email: str, expires_in: int = 3600) -> str:
    """Craft a Supabase-compatible JWT signed with the local secret."""
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


def _get_test_game_id(bgg_id: int) -> str:
    """Get game ID by BGG ID from database."""
    client = get_supabase_client()
    response = client.table("games").select("id").eq("bgg_id", bgg_id).maybe_single().execute()
    if not response or not response.data:
        raise AssertionError(f"Game with BGG ID {bgg_id} not found in database")

    data = response.data
    if not isinstance(data, dict):
        raise AssertionError(f"Unexpected response type for game with BGG ID {bgg_id}")

    return str(data["id"])


def _get_bgc_section_id() -> str:
    """Fetch the Board Game Companion section ID."""
    client = get_supabase_client()
    response = (
        client.table("app_sections").select("id").eq("key", "BGC").maybe_single().execute()
    )
    if not response or not response.data:
        raise AssertionError("BGC section not found in database")

    data = response.data
    if not isinstance(data, dict):
        raise AssertionError("Unexpected response for app_sections")

    return str(data["id"])


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_user():
    return _get_user_and_profile("admin@bgai.test")


@pytest.fixture(scope="module")
def gloomhaven_id():
    """Gloomhaven game ID (BGG ID: 174430)"""
    return _get_test_game_id(174430)


@pytest.fixture
def game_without_bgg():
    """Insert a temporary game without BGG ID to test validation."""
    client = get_supabase_client()
    section_id = _get_bgc_section_id()
    response = (
        client.table("games")
        .insert(
            {
                "section_id": section_id,
                "name_base": "Temp Game Without BGG",
                "status": "active",
                "min_players": 1,
                "max_players": 4,
            }
        )
        .execute()
    )
    data = response.data
    if not data or not isinstance(data, list) or not data:
        raise AssertionError("Failed to insert temporary game for tests")

    first_item = data[0]
    if not isinstance(first_item, dict):
        raise AssertionError("Unexpected response type for inserted game")

    game_id = str(first_item["id"])
    try:
        yield game_id
    finally:
        client.table("games").delete().eq("id", game_id).execute()


def test_sync_game_from_bgg_updates_metadata(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    """POST /admin/games/{id}/sync-bgg should refresh metadata."""

    def fake_fetch(bgg_id: int, *, timeout: float = 15.0) -> BGGGameData:
        assert bgg_id == 174430
        return BGGGameData(
            bgg_id=bgg_id,
            name="Gloomhaven",
            min_players=1,
            max_players=4,
            playing_time=120,
            rating=8.70,
            thumbnail_url="https://example.test/thumb.png",
            image_url="https://example.test/image.png",
        )

    monkeypatch.setattr(bgg_service, "fetch_bgg_game", fake_fetch)

    user, _ = admin_user
    token = _make_token(user.id, user.email)

    response = client.post(
        f"/admin/games/{gloomhaven_id}/sync-bgg", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    body = response.json()
    assert body["id"] == gloomhaven_id
    assert body["name_base"] == "Gloomhaven"
    assert body["bgg_id"] == 174430
    assert body["thumbnail_url"] == "https://example.test/thumb.png"
    assert body["image_url"] == "https://example.test/image.png"
    assert body["last_synced_from_bgg_at"] is not None


def test_sync_game_requires_bgg_id(
    client: TestClient, admin_user, game_without_bgg, monkeypatch
):
    """Sync should fail if the game has no BGG ID configured."""

    # Ensure the fetch is never called
    def fake_fetch(_bgg_id: int, *, timeout: float = 15.0):
        raise AssertionError("fetch_bgg_game should not be called when BGG ID is missing")

    monkeypatch.setattr(bgg_service, "fetch_bgg_game", fake_fetch)

    user, _ = admin_user
    token = _make_token(user.id, user.email)

    response = client.post(
        f"/admin/games/{game_without_bgg}/sync-bgg", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert "BGG ID" in response.json()["detail"]


def test_sync_game_handles_bgg_errors(client: TestClient, admin_user, gloomhaven_id, monkeypatch):
    """BGG fetch errors should be surfaced as 502 responses."""

    def fake_fetch(bgg_id: int, *, timeout: float = 15.0):
        raise BGGGameNotFound(bgg_id)

    monkeypatch.setattr(bgg_service, "fetch_bgg_game", fake_fetch)

    user, _ = admin_user
    token = _make_token(user.id, user.email)

    response = client.post(
        f"/admin/games/{gloomhaven_id}/sync-bgg", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 502
    assert "Game with BGG ID" in response.json()["detail"]
