"""Unit tests for admin knowledge processing helpers."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.models.schemas import GameDocument, KnowledgeProcessRequest
from app.services import admin_games


class FakeResponse:
    def __init__(self, data):
        self.data = data


class GameDocumentTableStub:
    def __init__(self, recorder):
        self.recorder = recorder
        self._payload = None
        self._filter = None

    def update(self, payload):
        self._payload = payload
        return self

    def eq(self, column, value):
        self._filter = (column, value)
        return self

    async def execute(self):
        self.recorder["doc_updates"].append({"payload": self._payload, "filter": self._filter})
        return FakeResponse(None)


class FakeSupabaseClient:
    def __init__(self):
        self.storage = {"doc_updates": []}

    def table(self, name):
        if name == "game_documents":
            return GameDocumentTableStub(self.storage)
        raise AssertionError(f"Unexpected table {name}")


def _fake_document(**overrides) -> GameDocument:
    base = {
        "id": "doc-1",
        "game_id": "game-1",
        "title": "Rulebook",
        "language": "es",
        "source_type": "rulebook",
        "file_name": "rulebook.pdf",
        "file_path": "documents/rulebook.pdf",
        "file_size": 1234,
        "file_type": "application/pdf",
        "provider_file_id": None,
        "vector_store_id": None,
        "status": "uploaded",
        "metadata": {},
        "error_message": None,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
        "processed_at": None,
        "uploaded_at": None,
    }
    base.update(overrides)
    return GameDocument(**base)


@pytest.fixture(autouse=True)
def stub_supabase(monkeypatch: pytest.MonkeyPatch):
    client = FakeSupabaseClient()

    async def fake_client():
        return client

    monkeypatch.setattr(admin_games, "get_supabase_admin_client", fake_client)
    return client


@pytest.mark.asyncio
async def test_process_game_knowledge_marks_documents_processing(
    monkeypatch: pytest.MonkeyPatch, stub_supabase
):
    """Documents default to processing status unless mark_as_ready=True."""

    document = _fake_document()

    async def fake_list(*args, **kwargs):
        return [document]

    monkeypatch.setattr(admin_games, "_list_documents_for_processing", fake_list)

    request = KnowledgeProcessRequest(
        document_ids=[document.id],
        language="es",
        provider_name=None,
        provider_file_id=None,
        vector_store_id=None,
        notes="Seed",
        mark_as_ready=False,
    )
    processed_ids, success_count, error_count = await admin_games.process_game_knowledge(
        document.game_id,
        request,
        triggered_by="user-1",
    )

    assert processed_ids == [document.id]
    assert success_count == 1
    assert error_count == 0

    # Verify game_documents was updated with processing status and metadata
    doc_update = stub_supabase.storage["doc_updates"][0]
    assert doc_update["payload"]["status"] == "processing"
    assert doc_update["payload"]["metadata"]["notes"] == "Seed"
    assert doc_update["payload"]["metadata"]["triggered_by"] == "user-1"


@pytest.mark.asyncio
async def test_process_game_knowledge_can_mark_ready(
    monkeypatch: pytest.MonkeyPatch, stub_supabase
):
    """mark_as_ready should set ready status and propagate provider overrides."""

    document = _fake_document()

    async def fake_list(*args, **kwargs):
        return [document]

    monkeypatch.setattr(admin_games, "_list_documents_for_processing", fake_list)

    request = KnowledgeProcessRequest(
        document_ids=[document.id],
        language="es",
        provider_name="openai",
        provider_file_id="file-123",
        vector_store_id="vs-456",
        mark_as_ready=True,
        notes="Finished",
    )

    processed_ids, success_count, error_count = await admin_games.process_game_knowledge(
        document.game_id,
        request,
        triggered_by=None,
    )

    assert processed_ids == [document.id]
    assert success_count == 1
    assert error_count == 0

    # Verify game_documents was updated with ready status and provider metadata
    doc_update = stub_supabase.storage["doc_updates"][0]
    assert doc_update["payload"]["status"] == "ready"
    assert doc_update["payload"]["provider_file_id"] == "file-123"
    assert doc_update["payload"]["vector_store_id"] == "vs-456"
    assert doc_update["payload"]["metadata"]["notes"] == "Finished"
