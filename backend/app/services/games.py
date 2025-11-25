"""
Games service for managing game data
Handles game retrieval with access control via feature flags
"""

import asyncio
from typing import cast

from app.models.schemas import Game, GameListItem
from app.services.feature_flags import (
    check_chat_access,
    check_faq_access,
    get_user_accessible_games,
)
from app.services.supabase import SupabaseRecord, get_supabase_client


async def get_games_list(
    user_id: str,
    user_role: str,
    status_filter: str | None = None,
) -> list[GameListItem]:
    """
    Get list of games that user has access to

    Args:
        user_id: User UUID
        user_role: User role
        status_filter: Optional status filter (active, beta, hidden)

    Returns:
        List of games the user can access
    """
    supabase = await get_supabase_client()

    # Get accessible game IDs for this user
    accessible_game_ids = await get_user_accessible_games(user_id, user_role)

    # If user has no accessible games, return empty list
    if not accessible_game_ids:
        return []

    # Build query
    query = supabase.table("games").select(
        "id, name_base, thumbnail_url, min_players, max_players, playing_time, rating, status"
    )

    # Filter by accessible game IDs
    query = query.in_("id", accessible_game_ids)

    # Apply status filter if provided
    if status_filter:
        query = query.eq("status", status_filter)
    else:
        # Default: show only active games for basic/premium users
        # Tester, admin, developer can see beta games too
        if user_role in ["tester", "admin", "developer"]:
            query = query.in_("status", ["active", "beta"])
        else:
            query = query.eq("status", "active")

    # Order by name
    query = query.order("name_base")

    try:
        response = await query.execute()
        data = cast(list[SupabaseRecord], response.data)
        return [GameListItem(**game) for game in data]
    except Exception as exc:
        print(f"Error fetching games list: {exc}")
        return []


async def get_game_by_id(game_id: str, user_id: str, user_role: str) -> Game | None:
    """
    Get game details by ID

    Args:
        game_id: Game UUID
        user_id: User UUID (for access control)
        user_role: User role (for access control)

    Returns:
        Game object if found and user has access, None otherwise
    """
    # Check if user has access to this game
    accessible_game_ids = await get_user_accessible_games(user_id, user_role)

    if game_id not in accessible_game_ids:
        return None

    supabase = await get_supabase_client()

    try:
        response = await supabase.table("games").select("*").eq("id", game_id).maybe_single().execute()

        if response is None or response.data is None:
            return None

        data = cast(SupabaseRecord, response.data)
        return Game(**data)
    except Exception as exc:
        print(f"Error fetching game {game_id}: {exc}")
        return None


async def get_game_feature_access(game_id: str, user_id: str, user_role: str) -> dict[str, bool]:
    """
    Get feature access flags for a specific game

    Args:
        game_id: Game UUID
        user_id: User UUID
        user_role: User role

    Returns:
        Dictionary with feature access flags (has_faq_access, has_chat_access)
    """
    # OPTIMIZATION: Check FAQ and chat access in parallel
    faq_task = check_faq_access(user_id, user_role, game_id)
    chat_task = check_chat_access(user_id, user_role, game_id)

    faq_access, chat_access = await asyncio.gather(faq_task, chat_task)

    return {
        "has_faq_access": faq_access.has_access,
        "has_chat_access": chat_access.has_access,
    }
