"""Utility helpers for synchronous Supabase access in tests."""

from __future__ import annotations

from types import SimpleNamespace

import httpx

from app.config import settings

_BASE_URL = settings.supabase_url.rstrip('/')
_AUTH_URL = f"{_BASE_URL}/auth/v1/admin/users"
_REST_URL = f"{_BASE_URL}/rest/v1"
_HEADERS = {
    "apikey": settings.supabase_service_role_key,
    "Authorization": f"Bearer {settings.supabase_service_role_key}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def _request(method: str, url: str, *, headers: dict | None = None, **kwargs) -> httpx.Response:
    merged_headers = {**_HEADERS, **(headers or {})}
    response = httpx.request(method, url, headers=merged_headers, timeout=15, **kwargs)
    response.raise_for_status()
    return response


def _rest_get(table: str, params: dict) -> list[dict]:
    query = dict(params)
    query.setdefault("select", "*")
    resp = _request("GET", f"{_REST_URL}/{table}", params=query)
    data = resp.json()
    if isinstance(data, list):
        return data
    raise AssertionError(f"Unexpected Supabase response: {data}")


def _to_namespace(payload: dict) -> SimpleNamespace:
    return SimpleNamespace(**payload)


def get_user_and_profile(email: str) -> tuple[SimpleNamespace, dict]:
    resp = _request("GET", _AUTH_URL, params={"per_page": 1000})
    data = resp.json()
    users = data.get("users") if isinstance(data, dict) else data
    if not users:
        raise AssertionError(f"Test users list is empty when looking for {email}")
    user = next((record for record in users if record.get("email") == email), None)
    if not user:
        raise AssertionError(f"Test user {email} not found in Supabase response")
    user_id = user.get("id")
    if not user_id:
        raise AssertionError(f"User record missing id for {email}")
    profiles = _rest_get("profiles", {"id": f"eq.{user_id}"})
    if not profiles:
        raise AssertionError(f"Profile record missing for user {email}")
    return _to_namespace(user), profiles[0]


def get_game_id_by_bgg(bgg_id: int) -> str:
    records = _rest_get("games", {"bgg_id": f"eq.{bgg_id}", "select": "id"})
    if not records:
        raise AssertionError(f"Game with BGG ID {bgg_id} not found")
    return str(records[0]["id"])


def get_section_id(key: str) -> str:
    records = _rest_get("app_sections", {"key": f"eq.{key}", "select": "id"})
    if not records:
        raise AssertionError(f"Section {key} not found")
    return str(records[0]["id"])


def insert_game(payload: dict) -> dict:
    resp = _request(
        "POST",
        f"{_REST_URL}/games",
        json=payload,
        headers={"Prefer": "return=representation"},
    )
    data = resp.json()
    if not data or not isinstance(data, list):
        raise AssertionError("Unexpected insert response from Supabase")
    return data[0]


def delete_game(game_id: str) -> None:
    _request(
        "DELETE",
        f"{_REST_URL}/games",
        params={"id": f"eq.{game_id}"},
    )
