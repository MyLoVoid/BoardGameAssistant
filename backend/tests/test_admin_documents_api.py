"""Tests for the admin document upload endpoint."""

from __future__ import annotations

import time
from collections.abc import Iterator
from uuid import UUID

import jwt
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services.storage import StorageServiceError
from tests.supabase_test_helpers import (
    delete_game_document_record,
    get_game_id_by_bgg,
    get_user_and_profile,
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
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_user():
    return get_user_and_profile("admin@bgai.test")


@pytest.fixture(scope="module")
def gloomhaven_id() -> str:
    return get_game_id_by_bgg(174430)


def _auth_headers(admin_user) -> dict[str, str]:
    user, _ = admin_user
    token = _make_token(user.id, user.email)
    return {"Authorization": f"Bearer {token}"}


def _patch_storage(monkeypatch, *, fail: StorageServiceError | None = None):
    upload_calls: list[tuple[str, str]] = []

    async def fake_upload(bucket: str, path: str, **kwargs):
        if fail:
            raise fail
        upload_calls.append((bucket, path))

    async def fake_delete(bucket: str, path: str, **kwargs):
        return None

    monkeypatch.setattr("app.services.admin_games.upload_file_to_bucket", fake_upload)
    monkeypatch.setattr("app.services.admin_games.delete_file_from_bucket", fake_delete)
    return upload_calls


def test_upload_document_success(client: TestClient, admin_user, gloomhaven_id, monkeypatch):
    upload_calls = _patch_storage(monkeypatch)
    response = client.post(
        f"/admin/games/{gloomhaven_id}/documents",
        data={
            "title": "Test Rulebook",
            "language": "es",
            "source_type": "rulebook",
        },
        files={"file": ("rulebook.pdf", b"%PDF-1.4 test content", "application/pdf")},
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == status.HTTP_201_CREATED, response.text
    payload = response.json()
    assert payload["title"] == "Test Rulebook"
    assert payload["language"] == "es"
    assert payload["source_type"] == "rulebook"
    assert payload["status"] == "uploaded"
    assert payload["file_path"].startswith("game_documents/")
    assert len(upload_calls) == 1

    document_id = payload["id"]
    try:
        assert document_id
    finally:
        delete_game_document_record(document_id)


def test_upload_document_rejects_invalid_type(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    _patch_storage(monkeypatch)
    response = client.post(
        f"/admin/games/{gloomhaven_id}/documents",
        data={
            "title": "Bad File",
            "language": "es",
            "source_type": "rulebook",
        },
        files={"file": ("notes.txt", b"plain text", "text/plain")},
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_document_rejects_large_file(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    _patch_storage(monkeypatch)
    oversized = b"x" * (10 * 1024 * 1024 + 1)
    response = client.post(
        f"/admin/games/{gloomhaven_id}/documents",
        data={
            "title": "Too Big",
            "language": "en",
            "source_type": "rulebook",
        },
        files={"file": ("large.pdf", oversized, "application/pdf")},
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "10 MB limit" in response.json()["detail"]


def test_upload_document_detects_duplicates(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    upload_calls = _patch_storage(monkeypatch)
    constant_uuid = UUID("11111111-1111-1111-1111-111111111111")
    monkeypatch.setattr("app.services.admin_games.uuid.uuid4", lambda: constant_uuid)

    headers = _auth_headers(admin_user)
    payload = {
        "title": "Duplicate File",
        "language": "es",
        "source_type": "rulebook",
    }
    files = {"file": ("dup.pdf", b"%PDF-dup-data", "application/pdf")}

    first = client.post(
        f"/admin/games/{gloomhaven_id}/documents",
        data=payload,
        files=files,
        headers=headers,
    )
    assert first.status_code == status.HTTP_201_CREATED, first.text
    doc_id = first.json()["id"]
    try:
        second = client.post(
            f"/admin/games/{gloomhaven_id}/documents",
            data=payload,
            files=files,
            headers=headers,
        )
        assert second.status_code == status.HTTP_409_CONFLICT, second.text
        assert "already exists" in second.json()["detail"]
        assert len(upload_calls) == 1
    finally:
        delete_game_document_record(doc_id)


def test_upload_document_handles_storage_failure(
    client: TestClient, admin_user, gloomhaven_id, monkeypatch
):
    failure = StorageServiceError("storage down")
    _patch_storage(monkeypatch, fail=failure)

    response = client.post(
        f"/admin/games/{gloomhaven_id}/documents",
        data={
            "title": "Storage Failure",
            "language": "es",
            "source_type": "rulebook",
        },
        files={"file": ("file.pdf", b"%PDF-1.4 content", "application/pdf")},
        headers=_auth_headers(admin_user),
    )
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "storage" in response.json()["detail"].lower()
