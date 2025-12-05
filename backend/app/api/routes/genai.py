"""
GenAI API routes
Endpoints for AI-powered chat queries with RAG (Retrieval Augmented Generation)
"""

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.core.auth import get_current_user
from app.models.schemas import (
    AuthenticatedUser,
    ChatCitation,
    ChatModelInfo,
    ChatQueryRequest,
    ChatQueryResponse,
    ChatUsageLimits,
    ErrorResponse,
)
from app.services.chat_sessions import (
    add_message,
    get_or_create_session,
    get_session_history,
    update_session_stats,
)
from app.services.feature_flags import check_chat_access
from app.services.games import get_game_by_id
from app.services.gemini_provider import GeminiProviderError, query_gemini
from app.services.supabase import SupabaseRecord, get_supabase_client
from app.services.usage_tracking import check_daily_limit, log_usage_event

router = APIRouter()


async def _get_vector_store_id(game_id: str, language: str) -> str | None:
    """
    Get the vector store ID for a game from game_documents table.

    Looks for documents with status='ready' for the given game and language.
    Returns the first found vector_store_id (all documents for a game share the same store).

    Args:
        game_id: Game UUID
        language: Language code (es, en)

    Returns:
        Vector store ID or None if not found
    """
    supabase = await get_supabase_client()

    try:
        response = (
            await supabase.table("game_documents")
            .select("vector_store_id")
            .eq("game_id", game_id)
            .eq("language", language)
            .eq("status", "ready")
            .not_.is_("vector_store_id", "null")
            .limit(1)
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)

        if data and len(data) > 0:
            return data[0].get("vector_store_id")

        # Fallback to English if requested language not found
        if language != "en":
            response_en = (
                await supabase.table("game_documents")
                .select("vector_store_id")
                .eq("game_id", game_id)
                .eq("language", "en")
                .eq("status", "ready")
                .not_.is_("vector_store_id", "null")
                .limit(1)
                .execute()
            )

            data_en = cast(list[SupabaseRecord], response_en.data)
            if data_en and len(data_en) > 0:
                return data_en[0].get("vector_store_id")

        return None

    except Exception as exc:
        print(f"Error fetching vector store ID: {exc}")
        return None


@router.post(
    "/genai/query",
    response_model=ChatQueryResponse,
    summary="Query AI assistant for game help",
    description="Send a question to the AI assistant about game rules and mechanics using RAG (Retrieval Augmented Generation)",
    responses={
        200: {"description": "AI-generated answer with citations"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid or missing token"},
        403: {
            "model": ErrorResponse,
            "description": "Forbidden - user does not have access to chat or has reached daily limit",
        },
        404: {
            "model": ErrorResponse,
            "description": "Game not found or no knowledge base available",
        },
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def query_game_assistant(
    request: ChatQueryRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> ChatQueryResponse:
    """
    Query the AI assistant for help with game rules and mechanics.

    This endpoint:
    1. Validates user access to chat feature for the game
    2. Checks and enforces daily usage limits
    3. Retrieves or creates a chat session
    4. Fetches the game's knowledge base (vector store ID)
    5. Queries the AI provider (Gemini) with file search grounding
    6. Stores the question and answer in chat history
    7. Logs analytics events
    8. Returns the answer with citations and usage limits

    Args:
        request: ChatQueryRequest with game_id, question, language, session_id
        current_user: Authenticated user from JWT token

    Returns:
        ChatQueryResponse with session_id, answer, citations, model_info, limits
    """
    # Step 1: Check if user has access to this game
    game = await get_game_by_id(
        game_id=request.game_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {request.game_id} not found or you don't have access to it",
        )

    # Step 2: Check if user has chat access for this game
    chat_access = await check_chat_access(
        user_id=current_user.user_id,
        user_role=current_user.role,
        game_id=request.game_id,
    )

    if not chat_access.has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have access to chat for this game. Reason: {chat_access.reason}",
        )

    # Step 3: Check daily limits from feature flag metadata
    daily_limit: int | None = None
    limits_info: ChatUsageLimits | None = None

    if chat_access.metadata and "daily_limit" in chat_access.metadata:
        daily_limit = int(chat_access.metadata["daily_limit"])

        # Check current usage
        limit_check = await check_daily_limit(
            user_id=current_user.user_id,
            event_type="chat_question",
            daily_limit=daily_limit,
            game_id=request.game_id,
        )

        if not limit_check["has_quota"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Daily limit reached ({daily_limit} questions per day). Resets at {limit_check['reset_at']}",
            )

        limits_info = ChatUsageLimits(
            daily_limit=daily_limit,
            daily_used=limit_check["daily_used"],
            remaining=limit_check["remaining"],
            reset_at=limit_check["reset_at"],
        )

    # Step 4: Get or create chat session
    try:
        session = await get_or_create_session(
            user_id=current_user.user_id,
            game_id=request.game_id,
            language=request.language,
            model_provider="gemini",
            model_name=settings.default_gemini_model_name,
            session_id=request.session_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create or retrieve session: {str(exc)}",
        ) from exc

    session_id = session["id"]

    # Step 5: Get vector store ID for the game
    vector_store_id = await _get_vector_store_id(request.game_id, request.language)

    if not vector_store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No knowledge base found for game {request.game_id} in language {request.language}. "
            "Please contact the administrator to upload game documents.",
        )

    # Step 6: Get session history (last 10 messages)
    history_records = await get_session_history(session_id=session_id, limit=10)

    # Convert history to Gemini format
    session_history = []
    for msg in history_records:
        role = "model" if msg["sender"] == "assistant" else msg["sender"]
        session_history.append({"role": role, "parts": [{"text": msg["content"]}]})

    # Step 7: Query Gemini with file search
    try:
        result = await query_gemini(
            question=request.question,
            vector_store_id=vector_store_id,
            session_history=session_history,
            model_name=settings.default_gemini_model_name,
        )
    except GeminiProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI provider error: {str(exc)}",
        ) from exc

    # Step 8: Store user question in chat_messages
    try:
        await add_message(
            session_id=session_id,
            sender="user",
            content=request.question,
        )
    except Exception as exc:
        print(f"Error storing user message: {exc}")
        # Non-blocking: continue even if message storage fails

    # Step 9: Store assistant answer in chat_messages
    try:
        await add_message(
            session_id=session_id,
            sender="assistant",
            content=result["answer"],
            metadata={
                "citations": result["citations"],
                "model_info": result["model_info"],
            },
        )
    except Exception as exc:
        print(f"Error storing assistant message: {exc}")
        # Non-blocking: continue even if message storage fails

    # Step 10: Update session stats
    token_estimate = result["model_info"].get("total_tokens", 0) or 0
    try:
        await update_session_stats(
            session_id=session_id,
            message_count_increment=2,  # user + assistant
            token_estimate_increment=token_estimate,
        )
    except Exception as exc:
        print(f"Error updating session stats: {exc}")
        # Non-blocking: continue

    # Step 11: Log analytics events
    try:
        await log_usage_event(
            user_id=current_user.user_id,
            event_type="chat_question",
            game_id=request.game_id,
            feature_key="chat",
            extra_info={
                "session_id": session_id,
                "language": request.language,
                "question_length": len(request.question),
            },
        )

        await log_usage_event(
            user_id=current_user.user_id,
            event_type="chat_answer",
            game_id=request.game_id,
            feature_key="chat",
            extra_info={
                "session_id": session_id,
                "answer_length": len(result["answer"]),
                "citations_count": len(result["citations"]),
                "tokens_used": token_estimate,
            },
        )
    except Exception as exc:
        print(f"Error logging analytics: {exc}")
        # Non-blocking: continue

    # Step 12: Build response
    citations = [ChatCitation(**citation) for citation in result["citations"]]
    model_info = ChatModelInfo(**result["model_info"])

    return ChatQueryResponse(
        session_id=session_id,
        answer=result["answer"],
        citations=citations,
        model_info=model_info,
        limits=limits_info,
    )
