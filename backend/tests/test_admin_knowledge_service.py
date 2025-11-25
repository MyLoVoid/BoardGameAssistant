"""Unit tests for admin knowledge processing helpers."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.models.schemas import GameDocument, KnowledgeProcessRequest
from app.services import admin_games


class FakeResponse:
    def __init__(self, data):
        self.data = data


class KnowledgeTableStub:
    def __init__(self, recorder):
        self.recorder = recorder
        self._payload = None

    def insert(self, payload):
        self._payload = payload
        return self

    def execute(self):
        record = dict(self._payload)
        record.setdefault("id", f"knowledge-{len(self.recorder['knowledge'])+1}")
        record.setdefault("created_at", datetime.now(tz=timezone.utc))
        self.recorder["knowledge"].append(record)
        return FakeResponse([record])


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

    def execute(self):
        self.recorder["doc_updates"].append({"payload": self._payload, "filter": self._filter})
        return FakeResponse(None)


class FakeSupabaseClient:
    def __init__(self):
        self.storage = {"knowledge": [], "doc_updates": []}

    def table(self, name):
        if name == "knowledge_documents":
            return KnowledgeTableStub(self.storage)
        if name == "game_documents":
            return GameDocumentTableStub(self.storage)
        raise AssertionError(f"Unexpected table {name}")


def _fake_document(**overrides) -> GameDocument:
    base = {
        "id": "doc-1",
        "game_id": "game-1",
        "language": "es",
        "source_type": "rulebook",
        "file_name": "rulebook.pdf",
        "file_path": "documents/rulebook.pdf",
        "file_size": 1234,
        "file_type": "application/pdf",
        "provider_name": None,
        "provider_file_id": None,
        "vector_store_id": None,
        "status": "pending",
        "metadata": {},
        "error_message": None,
        "created_at": datetime.now(tz=timezone.utc),
        "updated_at": datetime.now(tz=timezone.utc),
        "processed_at": None,
        "uploaded_at": None,
    }
    base.update(overrides)
    return GameDocument(**base)


@pytest.fixture(autouse=True)
def stub_supabase(monkeypatch: pytest.MonkeyPatch):
    client = FakeSupabaseClient()
    monkeypatch.setattr(admin_games, "get_supabase_admin_client", lambda: client)
    return client


def test_process_game_knowledge_marks_documents_processing(monkeypatch: pytest.MonkeyPatch, stub_supabase):
    """Documents default to processing status unless mark_as_ready=True."""

    document = _fake_document()
    monkeypatch.setattr(
        admin_games, "_list_documents_for_processing", lambda *args, **kwargs: [document]
    )

    request = KnowledgeProcessRequest(notes="Seed", mark_as_ready=False)
    processed_ids, knowledge_docs = admin_games.process_game_knowledge(
        document.game_id,
        request,
        triggered_by="user-1",
    )

    assert processed_ids == [document.id]
    assert knowledge_docs[0].status == "processing"
    assert knowledge_docs[0].metadata.get("notes") == "Seed"
    assert knowledge_docs[0].metadata.get("triggered_by") == "user-1"
    assert stub_supabase.storage["doc_updates"][0]["payload"]["status"] == "processing"


def test_process_game_knowledge_can_mark_ready(monkeypatch: pytest.MonkeyPatch, stub_supabase):
    """mark_as_ready should set ready status and propagate provider overrides."""

    document = _fake_document()
    monkeypatch.setattr(
        admin_games, "_list_documents_for_processing", lambda *args, **kwargs: [document]
    )

    request = KnowledgeProcessRequest(
        provider_name="openai",
        provider_file_id="file-123",
        vector_store_id="vs-456",
        mark_as_ready=True,
        notes="Finished",
    )

    processed_ids, knowledge_docs = admin_games.process_game_knowledge(
        document.game_id,
        request,
        triggered_by=None,
    )

    assert processed_ids == [document.id]
    inserted = knowledge_docs[0]
    assert inserted.status == "ready"
    assert inserted.provider_name == "openai"
    assert inserted.metadata.get("notes") == "Finished"
    assert stub_supabase.storage["doc_updates"][0]["payload"]["status"] == "ready"
