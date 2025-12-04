"""Integration tests for admin games endpoints (BGG sync)."""

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
from tests.supabase_test_helpers import (
    delete_game,
    get_game_id_by_bgg,
    get_section_id,
    get_user_and_profile,
    insert_game,
)


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
def gloomhaven_id() -> str:
    return get_game_id_by_bgg(174430)


@pytest.fixture
def game_without_bgg():
    section_id = get_section_id("BGC")
    inserted = insert_game(
        {
            "section_id": section_id,
            "name_base": "Temp Game Without BGG",
            "status": "active",
            "min_players": 1,
            "max_players": 4,
        }
    )
    game_id = str(inserted["id"])
    try:
        yield game_id
    finally:
        delete_game(game_id)


def test_sync_game_from_bgg_updates_metadata(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    async def fake_fetch(bgg_id: int, *, timeout: float = 15.0) -> BGGGameData:
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
            description="Deep dungeon crawler",
        )

    monkeypatch.setattr(bgg_service, "fetch_bgg_game", fake_fetch)

    user, _ = admin_user
    token = _make_token(user.id, user.email)

    response = client.post(
        f"/admin/games/{gloomhaven_id}/sync-bgg", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_sync_game_requires_bgg_id(client: TestClient, admin_user, game_without_bgg, monkeypatch):
    async def fake_fetch(_bgg_id: int, *, timeout: float = 15.0):
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
    async def fake_fetch(bgg_id: int, *, timeout: float = 15.0):
        raise BGGGameNotFound(bgg_id)

    monkeypatch.setattr(bgg_service, "fetch_bgg_game", fake_fetch)

    user, _ = admin_user
    token = _make_token(user.id, user.email)

    response = client.post(
        f"/admin/games/{gloomhaven_id}/sync-bgg", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 502
    assert "Game with BGG ID" in response.json()["detail"]
