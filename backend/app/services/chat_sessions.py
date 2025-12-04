"""
Chat sessions service for managing chat sessions and messages
Handles session creation, message storage, and session history retrieval
"""

from datetime import UTC, datetime
from typing import Any, cast

from app.services.supabase import SupabaseRecord, get_supabase_client


def _utc_now_iso() -> str:
    """Return current UTC time in ISO-8601 with timezone info."""
    return datetime.now(UTC).isoformat()


async def get_or_create_session(
    *,
    user_id: str,
    game_id: str,
    language: str,
    model_provider: str,
    model_name: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    """
    Get an existing session or create a new one.

    Args:
        user_id: User UUID
        game_id: Game UUID
        language: Language code (es, en)
        model_provider: AI provider (openai, gemini, claude)
        model_name: Model name/version
        session_id: Optional existing session ID

    Returns:
        Session record dict

    Raises:
        Exception: If session not found or creation fails
    """
    supabase = await get_supabase_client()

    # If session_id provided, try to get existing session
    if session_id:
        try:
            response = (
                await supabase.table("chat_sessions")
                .select("*")
                .eq("id", session_id)
                .eq("user_id", user_id)
                .eq("status", "active")
                .maybe_single()
                .execute()
            )

            if response and response.data:
                session = cast(SupabaseRecord, response.data)
                # Update last_activity_at
                await (
                    supabase.table("chat_sessions")
                    .update({"last_activity_at": _utc_now_iso()})
                    .eq("id", session_id)
                    .execute()
                )
                return session
        except Exception as exc:
            print(f"Error fetching existing session {session_id}: {exc}")
            # Fall through to create new session

    # Create new session
    try:
        new_session = {
            "user_id": user_id,
            "game_id": game_id,
            "language": language,
            "model_provider": model_provider,
            "model_name": model_name,
            "status": "active",
            "total_messages": 0,
            "total_token_estimate": 0,
            "started_at": _utc_now_iso(),
            "last_activity_at": _utc_now_iso(),
        }

        response = await supabase.table("chat_sessions").insert(new_session).execute()
        data = cast(list[SupabaseRecord], response.data)

        if not data or len(data) == 0:
            raise Exception("Failed to create session: no data returned")

        return data[0]

    except Exception as exc:
        raise Exception(f"Failed to create chat session: {exc}") from exc


async def add_message(
    *,
    session_id: str,
    sender: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Add a message to a chat session.

    Args:
        session_id: Session UUID
        sender: Message sender (user, assistant, system)
        content: Message content
        metadata: Optional message metadata (citations, etc.)

    Returns:
        Message record dict

    Raises:
        Exception: If message creation fails
    """
    supabase = await get_supabase_client()

    try:
        new_message = {
            "session_id": session_id,
            "sender": sender,
            "content": content,
            "metadata": metadata,
            "created_at": _utc_now_iso(),
        }

        response = await supabase.table("chat_messages").insert(new_message).execute()
        data = cast(list[SupabaseRecord], response.data)

        if not data or len(data) == 0:
            raise Exception("Failed to create message: no data returned")

        return data[0]

    except Exception as exc:
        raise Exception(f"Failed to add chat message: {exc}") from exc


async def update_session_stats(
    *,
    session_id: str,
    message_count_increment: int = 1,
    token_estimate_increment: int = 0,
) -> None:
    """
    Update session statistics (message count, token estimates).

    Args:
        session_id: Session UUID
        message_count_increment: Number of messages to add to count
        token_estimate_increment: Number of tokens to add to estimate

    Raises:
        Exception: If update fails
    """
    supabase = await get_supabase_client()

    try:
        # Fetch current stats
        response = (
            await supabase.table("chat_sessions")
            .select("total_messages, total_token_estimate")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise Exception(f"Session {session_id} not found")

        session = cast(SupabaseRecord, response.data)
        current_messages = session.get("total_messages", 0)
        current_tokens = session.get("total_token_estimate", 0)

        # Update with increments
        await (
            supabase.table("chat_sessions")
            .update(
                {
                    "total_messages": current_messages + message_count_increment,
                    "total_token_estimate": current_tokens + token_estimate_increment,
                    "last_activity_at": _utc_now_iso(),
                    "updated_at": _utc_now_iso(),
                }
            )
            .eq("id", session_id)
            .execute()
        )

    except Exception as exc:
        print(f"Error updating session stats: {exc}")
        # Don't fail the request if stats update fails


async def get_session_history(
    *,
    session_id: str,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """
    Get recent message history for a session.

    Args:
        session_id: Session UUID
        limit: Maximum number of messages to retrieve (default 10)

    Returns:
        List of message records (oldest to newest)

    Raises:
        Exception: If query fails
    """
    supabase = await get_supabase_client()

    try:
        response = (
            await supabase.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)
        return data

    except Exception as exc:
        print(f"Error fetching session history: {exc}")
        return []


async def close_session(*, session_id: str) -> None:
    """
    Close a chat session (set status to 'closed').

    Args:
        session_id: Session UUID

    Raises:
        Exception: If update fails
    """
    supabase = await get_supabase_client()

    try:
        await (
            supabase.table("chat_sessions")
            .update(
                {
                    "status": "closed",
                    "closed_at": _utc_now_iso(),
                    "updated_at": _utc_now_iso(),
                }
            )
            .eq("id", session_id)
            .execute()
        )

    except Exception as exc:
        print(f"Error closing session: {exc}")
        # Don't fail the request if close fails
