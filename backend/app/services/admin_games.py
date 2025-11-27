"""
Admin portal service helpers.

Provides write operations for games, FAQs, documents, and knowledge-processing
records via Supabase using the service role credentials.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Iterable, Sequence, cast

from fastapi import status

from app.models.schemas import (
    BGGImportRequest,
    Game,
    GameCreateRequest,
    GameDocument,
    GameFAQ,
    GameUpdateRequest,
    KnowledgeProcessRequest,
)
from app.services import bgg as bgg_service
from app.services.supabase import SupabaseRecord, get_supabase_admin_client


class AdminPortalError(Exception):
    """Exception used for predictable admin portal failures."""

    def __init__(self, message: str, *, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.status_code = status_code


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _extract_single(
    data: SupabaseRecord | Sequence[SupabaseRecord] | None,
) -> SupabaseRecord | None:
    if data is None:
        return None
    if isinstance(data, dict):
        return data
    try:
        return next(iter(data))  # type: ignore[arg-type]
    except StopIteration:
        return None


async def _ensure_game_exists(game_id: str) -> SupabaseRecord:
    supabase = await get_supabase_admin_client()
    response = await (
        supabase.table("games").select("*").eq("id", game_id).maybe_single().execute()
    )
    if response is None:
        raise AdminPortalError(f"Game {game_id} not found", status_code=status.HTTP_404_NOT_FOUND)
    record = _extract_single(cast(SupabaseRecord | None, response.data))
    if not record:
        raise AdminPortalError(f"Game {game_id} not found", status_code=status.HTTP_404_NOT_FOUND)
    return record


async def _ensure_faq_exists(faq_id: str) -> SupabaseRecord:
    supabase = await get_supabase_admin_client()
    response = await (
        supabase.table("game_faqs").select("*").eq("id", faq_id).maybe_single().execute()
    )
    if response is None:
        raise AdminPortalError(f"FAQ {faq_id} not found", status_code=status.HTTP_404_NOT_FOUND)
    record = _extract_single(cast(SupabaseRecord | None, response.data))
    if not record:
        raise AdminPortalError(f"FAQ {faq_id} not found", status_code=status.HTTP_404_NOT_FOUND)
    return record


async def _ensure_document_exists(document_id: str) -> SupabaseRecord:
    supabase = await get_supabase_admin_client()
    response = await (
        supabase.table("game_documents")
        .select("*")
        .eq("id", document_id)
        .maybe_single()
        .execute()
    )
    if response is None:
        raise AdminPortalError(
            f"Document {document_id} not found", status_code=status.HTTP_404_NOT_FOUND
        )
    record = _extract_single(cast(SupabaseRecord | None, response.data))
    if not record:
        raise AdminPortalError(
            f"Document {document_id} not found", status_code=status.HTTP_404_NOT_FOUND
        )
    return record


def _build_bgg_payload(bgg_data: bgg_service.BGGGameData, synced_at: datetime) -> dict[str, Any]:
    """Convert BGG metadata into the fields stored in Supabase."""

    return {
        "name_base": bgg_data.name,
        "min_players": bgg_data.min_players,
        "max_players": bgg_data.max_players,
        "playing_time": bgg_data.playing_time,
        "rating": bgg_data.rating,
        "thumbnail_url": bgg_data.thumbnail_url,
        "image_url": bgg_data.image_url,
        # Supabase client expects ISO strings for timestamptz fields
        "last_synced_from_bgg_at": synced_at.isoformat(),
    }


async def create_game(payload: GameCreateRequest) -> Game:
    """Create a new game record."""

    supabase = await get_supabase_admin_client()
    insert_data = payload.model_dump()
    insert_data["last_synced_from_bgg_at"] = None

    try:
        response = await supabase.table("games").insert(insert_data).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to create game: {exc}") from exc

    record = _extract_single(cast(list[SupabaseRecord] | None, response.data))
    if not record:
        raise AdminPortalError("Supabase returned an empty response while creating the game")

    return Game(**record)


async def update_game(game_id: str, payload: GameUpdateRequest) -> Game:
    """Update fields for an existing game."""

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise AdminPortalError("No fields provided to update")

    supabase = await get_supabase_admin_client()

    try:
        await supabase.table("games").update(updates).eq("id", game_id).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to update game {game_id}: {exc}") from exc

    record = await _ensure_game_exists(game_id)
    return Game(**record)


async def import_game_from_bgg(request: BGGImportRequest) -> tuple[Game, str]:
    """Import or refresh a game using the BGG XML API."""

    try:
        bgg_data = await bgg_service.fetch_bgg_game(request.bgg_id)
    except bgg_service.BGGServiceError as exc:
        raise AdminPortalError(str(exc), status_code=status.HTTP_502_BAD_GATEWAY) from exc

    supabase = await get_supabase_admin_client()
    synced_at = _now()
    payload: dict[str, Any] = {
        "section_id": request.section_id,
        "bgg_id": request.bgg_id,
        **_build_bgg_payload(bgg_data, synced_at),
    }
    if request.status:
        payload["status"] = request.status

    existing = await (
        supabase.table("games").select("*").eq("bgg_id", request.bgg_id).maybe_single().execute()
    )
    existing_record = _extract_single(
        cast(SupabaseRecord | None, existing.data) if existing is not None else None
    )

    if existing_record and not request.overwrite_existing:
        raise AdminPortalError(
            f"Game with BGG ID {request.bgg_id} already exists",
            status_code=status.HTTP_409_CONFLICT,
        )

    try:
        if existing_record:
            await supabase.table("games").update(payload).eq("id", existing_record["id"]).execute()
            action = "updated"
            record = await _ensure_game_exists(existing_record["id"])
        else:
            response = await supabase.table("games").insert(payload).execute()
            record = _extract_single(cast(list[SupabaseRecord] | None, response.data))
            if not record:
                raise AdminPortalError("BGG import failed: Supabase returned no data")
            action = "created"
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to write BGG data: {exc}") from exc

    return Game(**record), action


async def sync_game_from_bgg(game_id: str) -> Game:
    """Refresh an existing game using its stored BGG ID."""

    record = await _ensure_game_exists(game_id)
    bgg_id = record.get("bgg_id")
    if not bgg_id:
        raise AdminPortalError(
            "Game does not have a BGG ID configured, cannot sync",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        bgg_id_int = int(bgg_id)
    except (TypeError, ValueError):
        raise AdminPortalError(
            f"Game has invalid BGG ID: {bgg_id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        ) from None

    try:
        bgg_data = await bgg_service.fetch_bgg_game(bgg_id_int)
    except bgg_service.BGGServiceError as exc:
        raise AdminPortalError(str(exc), status_code=status.HTTP_502_BAD_GATEWAY) from exc

    supabase = await get_supabase_admin_client()
    payload = _build_bgg_payload(bgg_data, _now())

    try:
        await supabase.table("games").update(payload).eq("id", game_id).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to sync game {game_id} from BGG: {exc}") from exc

    updated = await _ensure_game_exists(game_id)
    return Game(**updated)


async def create_game_faq(game_id: str, payload: dict[str, Any]) -> GameFAQ:
    """Create FAQ for a game."""

    await _ensure_game_exists(game_id)
    supabase = await get_supabase_admin_client()

    insert_data = {"game_id": game_id, **payload}
    try:
        response = await supabase.table("game_faqs").insert(insert_data).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to create FAQ: {exc}") from exc

    record = _extract_single(cast(list[SupabaseRecord] | None, response.data))
    if not record:
        raise AdminPortalError("Supabase returned an empty response while creating the FAQ")

    return GameFAQ(**record)


async def update_game_faq(game_id: str, faq_id: str, payload: dict[str, Any]) -> GameFAQ:
    """Update an existing FAQ."""

    if not payload:
        raise AdminPortalError("No FAQ fields provided to update")

    faq = await _ensure_faq_exists(faq_id)
    if faq["game_id"] != game_id:
        raise AdminPortalError(
            f"FAQ {faq_id} does not belong to game {game_id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    supabase = await get_supabase_admin_client()
    try:
        await supabase.table("game_faqs").update(payload).eq("id", faq_id).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to update FAQ {faq_id}: {exc}") from exc

    updated = await _ensure_faq_exists(faq_id)
    return GameFAQ(**updated)


async def delete_game_faq(game_id: str, faq_id: str) -> None:
    """Delete FAQ belonging to a game."""

    faq = await _ensure_faq_exists(faq_id)
    if faq["game_id"] != game_id:
        raise AdminPortalError(
            f"FAQ {faq_id} does not belong to game {game_id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    supabase = await get_supabase_admin_client()
    try:
        await supabase.table("game_faqs").delete().eq("id", faq_id).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to delete FAQ {faq_id}: {exc}") from exc


async def create_game_document(game_id: str, payload: dict[str, Any]) -> GameDocument:
    """Register a new document reference."""
    import uuid

    await _ensure_game_exists(game_id)
    supabase = await get_supabase_admin_client()

    # Generate UUID for the document
    document_id = str(uuid.uuid4())

    # Auto-generate file_path using the UUID
    file_path = f"game_documents/{game_id}/{document_id}"

    insert_data = {
        "id": document_id,
        "game_id": game_id,
        "file_path": file_path,
        **payload
    }
    try:
        response = await supabase.table("game_documents").insert(insert_data).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to create document: {exc}") from exc

    record = _extract_single(cast(list[SupabaseRecord] | None, response.data))
    if not record:
        raise AdminPortalError("Supabase returned an empty response while creating the document")

    return GameDocument(**record)


async def list_game_documents(game_id: str, *, language: str | None = None) -> list[GameDocument]:
    """Return document references for a game filtered by language."""

    await _ensure_game_exists(game_id)
    supabase = await get_supabase_admin_client()

    query = supabase.table("game_documents").select("*").eq("game_id", game_id)
    if language:
        query = query.eq("language", language)

    try:
        response = await query.order("created_at", desc=True).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to list documents for game {game_id}: {exc}") from exc

    data = cast(list[SupabaseRecord], response.data or [])
    return [GameDocument(**record) for record in data]


async def delete_game_document(game_id: str, document_id: str) -> None:
    """Delete a document reference ensuring it belongs to the game."""

    document = await _ensure_document_exists(document_id)
    if document["game_id"] != game_id:
        raise AdminPortalError(
            f"Document {document_id} does not belong to game {game_id}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    supabase = await get_supabase_admin_client()
    try:
        await supabase.table("game_documents").delete().eq("id", document_id).execute()
    except Exception as exc:  # pragma: no cover - network/service errors
        raise AdminPortalError(f"Failed to delete document {document_id}: {exc}") from exc


async def _list_documents_for_processing(
    game_id: str,
    *,
    document_ids: Iterable[str] | None,
    language: str | None,
) -> list[GameDocument]:
    supabase = await get_supabase_admin_client()
    query = supabase.table("game_documents").select("*").eq("game_id", game_id)

    if document_ids:
        query = query.in_("id", list(document_ids))
    else:
        query = query.in_("status", ["uploaded", "ready", "error"])

    if language:
        query = query.eq("language", language)

    response = await query.execute()
    data = cast(list[SupabaseRecord], response.data or [])
    return [GameDocument(**record) for record in data]


async def process_game_knowledge(
    game_id: str,
    request: KnowledgeProcessRequest,
    *,
    triggered_by: str | None = None,
) -> tuple[list[str], int, int]:
    """Mark documents for knowledge processing. Returns (processed_ids, success_count, error_count)."""

    documents = await _list_documents_for_processing(
        game_id,
        document_ids=request.document_ids,
        language=request.language,
    )
    if not documents:
        raise AdminPortalError(
            "No documents found to process",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    supabase = await get_supabase_admin_client()
    processed_ids: list[str] = []
    success_count = 0
    error_count = 0
    final_status = "ready" if request.mark_as_ready else "processing"
    processed_at = _now() if request.mark_as_ready else None

    for document in documents:
        updated_file_id = request.provider_file_id or document.provider_file_id
        updated_vector_store = request.vector_store_id or document.vector_store_id

        doc_metadata = document.metadata.copy() if document.metadata else {}
        if request.notes:
            doc_metadata["notes"] = request.notes
        if triggered_by:
            doc_metadata["triggered_by"] = triggered_by

        try:
            await supabase.table("game_documents").update(
                {
                    "status": final_status if document.status != "ready" else document.status,
                    "provider_file_id": updated_file_id,
                    "vector_store_id": updated_vector_store,
                    "processed_at": processed_at.isoformat() if processed_at else None,
                    "metadata": doc_metadata,
                }
            ).eq("id", document.id).execute()

            processed_ids.append(document.id)
            success_count += 1
        except AdminPortalError:
            error_count += 1
            raise
        except Exception as exc:  # pragma: no cover - network/service errors
            error_count += 1
            raise AdminPortalError(f"Failed to process document {document.id}: {exc}") from exc

    return processed_ids, success_count, error_count
