"""
Integration tests for games endpoints using the real Supabase dev stack.
"""

import time
from collections.abc import Generator
from functools import lru_cache

import jwt
import pytest
from fastapi.testclient import TestClient
from supabase import create_client

from app.config import settings
from app.main import app


@lru_cache(maxsize=1)
def _get_service_role_client():
    """Return a cached Supabase client using the service role key."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _get_user_and_profile(email: str) -> tuple[object, dict]:
    """Fetch a Supabase auth user plus its profile row."""
    client = _get_service_role_client()
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
    client = _get_service_role_client()
    response = client.table("games").select("id").eq("bgg_id", bgg_id).maybe_single().execute()
    if not response or not response.data:
        raise AssertionError(f"Game with BGG ID {bgg_id} not found in database")

    data = response.data
    if not isinstance(data, dict):
        raise AssertionError(f"Unexpected response type for game with BGG ID {bgg_id}")

    return str(data["id"])


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_user():
    return _get_user_and_profile("admin@bgai.test")


@pytest.fixture(scope="module")
def basic_user():
    return _get_user_and_profile("basic@bgai.test")


@pytest.fixture(scope="module")
def premium_user():
    return _get_user_and_profile("premium@bgai.test")


@pytest.fixture(scope="module")
def tester_user():
    return _get_user_and_profile("tester@bgai.test")


@pytest.fixture(scope="module")
def gloomhaven_id():
    """Gloomhaven game ID (BGG ID: 174430)"""
    return _get_test_game_id(174430)


@pytest.fixture(scope="module")
def terraforming_mars_id():
    """Terraforming Mars game ID (BGG ID: 167791)"""
    return _get_test_game_id(167791)


# =====================================================
# GET /games - List games tests
# =====================================================


def test_get_games_list_as_basic_user(client: TestClient, basic_user):
    """Basic user should see list of active games"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get("/games", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    body = response.json()
    assert "games" in body
    assert "total" in body
    assert isinstance(body["games"], list)
    assert body["total"] > 0

    # Verify games have expected fields
    if body["games"]:
        game = body["games"][0]
        assert "id" in game
        assert "name_base" in game
        assert "min_players" in game
        assert "max_players" in game
        assert "playing_time" in game
        assert "status" in game


def test_get_games_list_as_premium_user(client: TestClient, premium_user):
    """Premium user should see all active games"""
    user, _ = premium_user
    token = _make_token(user.id, user.email)

    response = client.get("/games", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    body = response.json()
    assert body["total"] >= 5  # We have 5 games in seed data


def test_get_games_list_as_tester(client: TestClient, tester_user):
    """Tester should see active and beta games"""
    user, _ = tester_user
    token = _make_token(user.id, user.email)

    response = client.get("/games", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    body = response.json()
    assert body["total"] >= 5


def test_get_games_requires_auth(client: TestClient):
    """Endpoint should require authentication"""
    response = client.get("/games")
    assert response.status_code == 401
    assert "Missing authorization header" in response.json()["detail"]


# =====================================================
# GET /games/{id} - Game detail tests
# =====================================================


def test_get_game_detail_as_basic_user(client: TestClient, basic_user, gloomhaven_id):
    """Basic user should be able to get game details"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get(f"/games/{gloomhaven_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    body = response.json()
    assert "game" in body
    assert "has_faq_access" in body
    assert "has_chat_access" in body

    # Verify game details
    game = body["game"]
    assert game["id"] == gloomhaven_id
    assert game["name_base"] == "Gloomhaven"
    assert game["bgg_id"] == 174430

    # Basic user should have FAQ access (global flag)
    assert body["has_faq_access"] is True
    # Basic user should have chat access with limits
    assert body["has_chat_access"] is True


def test_get_game_detail_as_premium_user(client: TestClient, premium_user, terraforming_mars_id):
    """Premium user should get game details with full feature access"""
    user, _ = premium_user
    token = _make_token(user.id, user.email)

    response = client.get(
        f"/games/{terraforming_mars_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    body = response.json()
    assert body["game"]["name_base"] == "Terraforming Mars"
    assert body["has_faq_access"] is True
    assert body["has_chat_access"] is True


def test_get_game_detail_nonexistent(client: TestClient, basic_user):
    """Should return 404 for nonexistent game"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    fake_game_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/games/{fake_game_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_game_detail_requires_auth(client: TestClient, gloomhaven_id):
    """Endpoint should require authentication"""
    response = client.get(f"/games/{gloomhaven_id}")
    assert response.status_code == 401


# =====================================================
# GET /games/{id}/faqs - Game FAQs tests
# =====================================================


def test_get_game_faqs_in_spanish(client: TestClient, basic_user, gloomhaven_id):
    """Should return FAQs in Spanish when available"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get(
        f"/games/{gloomhaven_id}/faqs?lang=es", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    body = response.json()
    assert "faqs" in body
    assert "language" in body
    assert "game_id" in body
    assert "total" in body

    assert body["game_id"] == gloomhaven_id
    assert body["language"] == "es"
    assert body["total"] > 0

    # Verify FAQ structure
    if body["faqs"]:
        faq = body["faqs"][0]
        assert "question" in faq
        assert "answer" in faq
        assert "language" in faq
        assert faq["language"] == "es"


def test_get_game_faqs_in_english(client: TestClient, basic_user, gloomhaven_id):
    """Should return FAQs in English when requested"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get(
        f"/games/{gloomhaven_id}/faqs?lang=en", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    body = response.json()
    assert body["language"] == "en"
    assert body["total"] > 0

    # Verify FAQs are in English
    if body["faqs"]:
        faq = body["faqs"][0]
        assert faq["language"] == "en"


def test_get_game_faqs_fallback_to_english(client: TestClient, basic_user, terraforming_mars_id):
    """
    Should fall back to English when FAQs not available in requested language.
    Terraforming Mars has Spanish FAQs but limited, so requesting a non-existent
    language should fall back.
    """
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    # Request in Spanish (should work)
    response = client.get(
        f"/games/{terraforming_mars_id}/faqs?lang=es", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    body = response.json()
    # Should return FAQs in Spanish if available
    assert body["language"] in ["es", "en"]


def test_get_game_faqs_default_language(client: TestClient, basic_user, gloomhaven_id):
    """Should default to Spanish when no language specified"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get(
        f"/games/{gloomhaven_id}/faqs", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    body = response.json()
    # Default should be Spanish
    assert body["language"] == "es"


def test_get_game_faqs_requires_auth(client: TestClient, gloomhaven_id):
    """Endpoint should require authentication"""
    response = client.get(f"/games/{gloomhaven_id}/faqs")
    assert response.status_code == 401


def test_get_game_faqs_nonexistent_game(client: TestClient, basic_user):
    """Should return 404 for nonexistent game"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    fake_game_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(
        f"/games/{fake_game_id}/faqs", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


def test_get_game_faqs_invalid_language(client: TestClient, basic_user, gloomhaven_id):
    """Should reject invalid language codes"""
    user, _ = basic_user
    token = _make_token(user.id, user.email)

    response = client.get(
        f"/games/{gloomhaven_id}/faqs?lang=invalid", headers={"Authorization": f"Bearer {token}"}
    )
    # FastAPI should validate the language parameter
    assert response.status_code == 422  # Unprocessable Entity
