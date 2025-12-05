"""Integration-like tests for Gemini provider service."""

from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import httpx
import pytest

from app.services import gemini_provider


@dataclass
class _FakeDocument:
    content: bytes
    display_name: str | None
    mime_type: str | None


class _FakeDocumentOperations:
    def __init__(self, stores: dict[str, dict]):
        self._stores = stores

    def delete(self, *, name: str) -> None:
        try:
            store_name, doc_id = name.split("/documents/")
        except ValueError as exc:  # pragma: no cover - programmer error
            raise ValueError("Invalid document resource name") from exc

        store = self._stores.get(store_name)
        if not store or doc_id not in store["documents"]:
            raise ValueError("Document not found")

        del store["documents"][doc_id]


class _FakeFileSearchStores:
    def __init__(self) -> None:
        self._stores: dict[str, dict] = {}
        self.documents = _FakeDocumentOperations(self._stores)

    def list(self):
        return [
            SimpleNamespace(name=name, display_name=data["display_name"])
            for name, data in self._stores.items()
        ]

    def create(self, *, config: dict):
        display_name = config.get("display_name")
        store_name = f"file_search_stores/{uuid4()}"
        record = {"display_name": display_name, "documents": {}, "uploads": []}
        self._stores[store_name] = record
        return SimpleNamespace(name=store_name, display_name=display_name)

    def upload_to_file_search_store(
        self,
        *,
        file_search_store_name: str,
        file,
        config: dict | None = None,
    ):
        if file_search_store_name not in self._stores:
            raise ValueError("Unknown store")

        file.seek(0)
        content = file.read()

        # Extract display_name and mime_type from config
        config = config or {}
        display_name = config.get("display_name") or getattr(file, "name", None)
        mime_type = config.get("mime_type")

        doc_id = f"doc-{uuid4()}"
        self._stores[file_search_store_name]["documents"][doc_id] = _FakeDocument(
            content=content,
            display_name=display_name,
            mime_type=mime_type,
        )
        operation_name = f"operations/upload-{uuid4()}"
        self._stores[file_search_store_name]["uploads"].append(operation_name)
        return SimpleNamespace(name=operation_name)


class FakeGeminiClient:
    """Simple in-memory Gemini client used for tests."""

    def __init__(self) -> None:
        self.file_search_stores = _FakeFileSearchStores()


@pytest.fixture(autouse=True)
def reset_gemini_client():
    """Ensure global client is reset between tests."""
    gemini_provider._GEMINI_CLIENT = None
    yield
    gemini_provider._GEMINI_CLIENT = None


@pytest.fixture(autouse=True)
def configure_settings(monkeypatch):
    """Provide baseline configuration for settings."""
    monkeypatch.setattr(gemini_provider.settings, "google_api_key", "test-api-key", raising=False)
    monkeypatch.setattr(
        gemini_provider.settings, "supabase_service_role_key", "test-service-key", raising=False
    )
    monkeypatch.setattr(
        gemini_provider.settings,
        "supabase_url",
        "https://test.supabase.co",
        raising=False,
    )


@pytest.fixture
def fake_client():
    """Gemini client with in-memory behavior."""
    client = FakeGeminiClient()
    gemini_provider._GEMINI_CLIENT = client
    return client


@pytest.fixture
def storage_file(tmp_path, monkeypatch):
    """Create a local file accessible via file:// storage URL."""
    root = tmp_path / "storage"
    bucket_dir = root / "game_documents" / "test-game-id"
    bucket_dir.mkdir(parents=True)
    file_path = bucket_dir / "test.txt"
    file_path.write_text("Gemini test document", encoding="utf-8")

    monkeypatch.setattr(gemini_provider.settings, "supabase_url", root.as_uri(), raising=False)
    return "game_documents/test-game-id/test.txt"


@pytest.mark.asyncio
async def test_get_or_create_file_search_store_existing(fake_client):
    """Test getting existing file search store."""
    existing = fake_client.file_search_stores.create(config={"display_name": "game-test-uuid"})

    result = await gemini_provider._get_or_create_file_search_store("test-uuid")

    assert result == existing.name


@pytest.mark.asyncio
async def test_get_or_create_file_search_store_new(fake_client):
    """Test creating new file search store when none exists."""
    result = await gemini_provider._get_or_create_file_search_store("test-uuid")

    assert result.startswith("file_search_stores/")
    assert any(
        store.display_name == "game-test-uuid" for store in fake_client.file_search_stores.list()
    )


@pytest.mark.asyncio
async def test_get_or_create_file_search_store_list_error(fake_client, monkeypatch):
    """Test handling of file search store list error."""

    def _raise():
        raise Exception("API Error")

    monkeypatch.setattr(fake_client.file_search_stores, "list", _raise)

    with pytest.raises(
        gemini_provider.GeminiFileSearchStoreError, match="Failed to list file search stores"
    ):
        await gemini_provider._get_or_create_file_search_store("test-uuid")


@pytest.mark.asyncio
async def test_get_or_create_file_search_store_create_error(fake_client, monkeypatch):
    """Test handling of file search store creation error."""

    def _raise(*_, **__):
        raise Exception("API Error")

    monkeypatch.setattr(fake_client.file_search_stores, "create", _raise)
    fake_client.file_search_stores._stores.clear()

    with pytest.raises(
        gemini_provider.GeminiFileSearchStoreError, match="Failed to create file search store"
    ):
        await gemini_provider._get_or_create_file_search_store("test-uuid")


@pytest.mark.asyncio
async def test_upload_document_success(fake_client, storage_file):
    """Test successful document upload with a real file."""
    result = await gemini_provider.upload_document_to_gemini(
        game_id="test-game-id",
        file_path=storage_file,
        display_name="Test Rulebook",
        mime_type="text/plain",
    )

    assert result.display_name == "Test Rulebook"
    assert result.file_uri.startswith("operations/upload-")

    store = fake_client.file_search_stores._stores[result.file_search_store_id]
    assert store["documents"]  # at least one doc stored


@pytest.mark.asyncio
async def test_upload_document_empty_file(fake_client, tmp_path, monkeypatch):
    """Test handling of empty files using local storage."""
    root = tmp_path / "storage"
    bucket_dir = root / "game_documents" / "empty-game"
    bucket_dir.mkdir(parents=True)
    (bucket_dir / "empty.txt").write_text("", encoding="utf-8")

    monkeypatch.setattr(gemini_provider.settings, "supabase_url", root.as_uri(), raising=False)

    with pytest.raises(gemini_provider.GeminiFileUploadError, match="empty"):
        await gemini_provider.upload_document_to_gemini(
            game_id="empty-game",
            file_path="game_documents/empty-game/empty.txt",
            display_name="Empty",
            mime_type="text/plain",
        )


@pytest.mark.asyncio
async def test_upload_document_file_upload_error(fake_client, storage_file, monkeypatch):
    """Test handling of file upload error."""

    def _boom(*_, **__):
        raise Exception("Upload failed")

    monkeypatch.setattr(
        fake_client.file_search_stores,
        "upload_to_file_search_store",
        _boom,
    )

    with pytest.raises(gemini_provider.GeminiFileUploadError, match="Failed to upload file"):
        await gemini_provider.upload_document_to_gemini(
            game_id="test",
            file_path=storage_file,
            display_name="Test",
            mime_type="text/plain",
        )


@pytest.mark.asyncio
async def test_upload_document_no_operation_name(fake_client, storage_file, monkeypatch):
    """Test handling of operation with no name returned by Gemini."""

    class _NoOp:
        name = None

    monkeypatch.setattr(
        fake_client.file_search_stores,
        "upload_to_file_search_store",
        lambda **_: _NoOp(),
    )

    with pytest.raises(
        gemini_provider.GeminiFileUploadError,
        match="File upload to search store succeeded but returned no operation name",
    ):
        await gemini_provider.upload_document_to_gemini(
            game_id="test",
            file_path=storage_file,
            display_name="Test",
            mime_type="text/plain",
        )


@pytest.mark.asyncio
async def test_download_file_invalid_path():
    """Test handling of invalid file path."""
    with pytest.raises(gemini_provider.GeminiProviderError, match="Invalid file_path format"):
        await gemini_provider._download_file_from_storage("invalid-path")


@pytest.mark.asyncio
async def test_download_file_http_error(monkeypatch):
    """Test handling of HTTP error during download."""

    async def _raise_http(*_, **__):
        raise httpx.HTTPError("HTTP Error")

    mock_client = AsyncMock()
    mock_client.get.side_effect = _raise_http

    mock_client_ctx = AsyncMock()
    mock_client_ctx.__aenter__.return_value = mock_client
    mock_client_ctx.__aexit__.return_value = False

    monkeypatch.setattr(httpx, "AsyncClient", lambda *_, **__: mock_client_ctx)

    with pytest.raises(
        gemini_provider.GeminiProviderError, match="Failed to download file from storage"
    ):
        await gemini_provider._download_file_from_storage("game_documents/test-game/doc.pdf")


@pytest.mark.asyncio
async def test_delete_document(fake_client, storage_file):
    """Test document deletion by removing stored document."""
    result = await gemini_provider.upload_document_to_gemini(
        game_id="test-game-id",
        file_path=storage_file,
        display_name="Test",
        mime_type="text/plain",
    )

    store = fake_client.file_search_stores._stores[result.file_search_store_id]
    doc_id = next(iter(store["documents"]))

    await gemini_provider.delete_document_from_gemini(
        document_name=f"{result.file_search_store_id}/documents/{doc_id}"
    )

    assert doc_id not in store["documents"]


@pytest.mark.asyncio
async def test_delete_document_error(fake_client, storage_file, monkeypatch):
    """Test handling of deletion error."""

    def _boom(**_):
        raise Exception("Deletion failed")

    monkeypatch.setattr(fake_client.file_search_stores.documents, "delete", _boom)

    with pytest.raises(gemini_provider.GeminiProviderError, match="Failed to delete document"):
        await gemini_provider.delete_document_from_gemini(
            document_name="file_search_stores/store-123/documents/doc-456"
        )


def test_get_gemini_client_missing_key(monkeypatch):
    """Test client creation failure with missing API key."""
    gemini_provider._GEMINI_CLIENT = None
    monkeypatch.setattr(gemini_provider.settings, "google_api_key", "", raising=False)

    with pytest.raises(gemini_provider.GeminiProviderError, match="GOOGLE_API_KEY not configured"):
        gemini_provider._get_gemini_client()


def test_build_store_display_name():
    """Test file search store display name generation."""
    result = gemini_provider._build_store_display_name("abc-123-def")
    assert result == "game-abc-123-def"
