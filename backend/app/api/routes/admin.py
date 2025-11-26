"""
Admin portal API routes.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import AuthenticatedUser, require_role
from app.models.schemas import (
    BGGImportRequest,
    BGGImportResponse,
    DocumentCreateRequest,
    FAQCreateRequest,
    FAQUpdateRequest,
    Game,
    GameCreateRequest,
    GameDocument,
    GameFAQ,
    GameUpdateRequest,
    KnowledgeProcessRequest,
    KnowledgeProcessResponse,
    SuccessResponse,
)
from app.services.admin_games import (
    AdminPortalError,
    create_game,
    create_game_document,
    create_game_faq,
    delete_game_document,
    delete_game_faq,
    import_game_from_bgg,
    list_game_documents,
    process_game_knowledge,
    sync_game_from_bgg,
    update_game,
    update_game_faq,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

CurrentAdmin = Annotated[AuthenticatedUser, Depends(require_role("admin", "developer"))]


def _handle_admin_error(exc: AdminPortalError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=str(exc))


@router.post(
    "/games",
    response_model=Game,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new game",
)
async def create_game_endpoint(
    request: GameCreateRequest,
    current_user: CurrentAdmin,
) -> Game:
    """Create a new game via the admin portal."""
    try:
        return await create_game(request)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.patch(
    "/games/{game_id}",
    response_model=Game,
    summary="Update an existing game",
)
async def update_game_endpoint(
    game_id: str,
    request: GameUpdateRequest,
    current_user: CurrentAdmin,
) -> Game:
    try:
        return await update_game(game_id, request)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.post(
    "/games/import-bgg",
    response_model=BGGImportResponse,
    summary="Import or refresh a game using the BGG API",
)
async def import_game_from_bgg_endpoint(
    request: BGGImportRequest,
    current_user: CurrentAdmin,
) -> BGGImportResponse:
    try:
        game, action = await import_game_from_bgg(request)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc

    synced_at = game.last_synced_from_bgg_at or datetime.now(tz=UTC)
    return BGGImportResponse(
        game=game,
        action=action,
        synced_at=synced_at,
        source="bgg",
    )


@router.post(
    "/games/{game_id}/sync-bgg",
    response_model=Game,
    summary="Sync an existing game with BGG metadata",
)
async def sync_game_from_bgg_endpoint(
    game_id: str,
    current_user: CurrentAdmin,
) -> Game:
    try:
        return await sync_game_from_bgg(game_id)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.post(
    "/games/{game_id}/faqs",
    response_model=GameFAQ,
    status_code=status.HTTP_201_CREATED,
    summary="Create FAQ entry",
)
async def create_game_faq_endpoint(
    game_id: str,
    request: FAQCreateRequest,
    current_user: CurrentAdmin,
) -> GameFAQ:
    try:
        return await create_game_faq(game_id, request.model_dump())
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.patch(
    "/games/{game_id}/faqs/{faq_id}",
    response_model=GameFAQ,
    summary="Update FAQ entry",
)
async def update_game_faq_endpoint(
    game_id: str,
    faq_id: str,
    request: FAQUpdateRequest,
    current_user: CurrentAdmin,
) -> GameFAQ:
    try:
        return await update_game_faq(game_id, faq_id, request.model_dump(exclude_unset=True))
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.delete(
    "/games/{game_id}/faqs/{faq_id}",
    response_model=SuccessResponse,
    summary="Delete FAQ entry",
)
async def delete_game_faq_endpoint(
    game_id: str,
    faq_id: str,
    current_user: CurrentAdmin,
) -> SuccessResponse:
    try:
        await delete_game_faq(game_id, faq_id)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc

    return SuccessResponse(
        message="FAQ deleted successfully",
        data={"faq_id": faq_id},
    )


@router.post(
    "/games/{game_id}/documents",
    response_model=GameDocument,
    status_code=status.HTTP_201_CREATED,
    summary="Create a game document reference",
)
async def create_game_document_endpoint(
    game_id: str,
    request: DocumentCreateRequest,
    current_user: CurrentAdmin,
) -> GameDocument:
    try:
        return await create_game_document(game_id, request.model_dump())
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.get(
    "/games/{game_id}/documents",
    response_model=list[GameDocument],
    summary="List game document references",
)
async def list_game_documents_endpoint(
    game_id: str,
    current_user: CurrentAdmin,
    lang: str | None = Query(default=None, alias="lang"),
) -> list[GameDocument]:
    try:
        return await list_game_documents(game_id, language=lang)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc


@router.delete(
    "/games/{game_id}/documents/{document_id}",
    response_model=SuccessResponse,
    summary="Delete game document reference",
)
async def delete_game_document_endpoint(
    game_id: str,
    document_id: str,
    current_user: CurrentAdmin,
) -> SuccessResponse:
    try:
        await delete_game_document(game_id, document_id)
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc

    return SuccessResponse(
        message="Document deleted successfully",
        data={"document_id": document_id},
    )


@router.post(
    "/games/{game_id}/process-knowledge",
    response_model=KnowledgeProcessResponse,
    summary="Trigger knowledge processing for one or more documents",
)
async def process_game_knowledge_endpoint(
    game_id: str,
    request: KnowledgeProcessRequest,
    current_user: CurrentAdmin,
) -> KnowledgeProcessResponse:
    try:
        processed_ids, knowledge_docs = await process_game_knowledge(
            game_id,
            request,
            triggered_by=current_user.user_id,
        )
    except AdminPortalError as exc:
        raise _handle_admin_error(exc) from exc

    return KnowledgeProcessResponse(
        game_id=game_id,
        processed_document_ids=processed_ids,
        knowledge_documents=knowledge_docs,
    )
