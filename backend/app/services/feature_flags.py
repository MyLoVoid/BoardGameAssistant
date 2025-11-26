"""
Feature flags service for access control and feature management
Validates user access to features based on scope, role, and environment
"""

import asyncio
from typing import cast

from app.config import settings
from app.models.schemas import FeatureAccess, FeatureFlag
from app.services.supabase import SupabaseRecord, get_supabase_client


async def get_feature_flags(
    feature_key: str,
    scope_type: str | None = None,
    scope_id: str | None = None,
    role: str | None = None,
) -> list[FeatureFlag]:
    """
    Get feature flags from database with optional filters

    Args:
        feature_key: Feature key to check (e.g., 'chat', 'faq')
        scope_type: Optional scope type filter (global, section, game, user)
        scope_id: Optional scope ID filter
        role: Optional role filter

    Returns:
        List of matching feature flags
    """
    supabase = await get_supabase_client()

    # Build query
    query = (
        supabase.table("feature_flags")
        .select("*")
        .eq("feature_key", feature_key)
        .eq("environment", settings.environment)
    )

    # Add optional filters
    if scope_type:
        query = query.eq("scope_type", scope_type)
    if scope_id:
        query = query.eq("scope_id", scope_id)
    if role:
        query = query.eq("role", role)

    try:
        response = await query.execute()
        data = cast(list[SupabaseRecord], response.data)
        return [FeatureFlag(**flag) for flag in data]
    except Exception as exc:
        print(f"Error fetching feature flags: {exc}")
        return []


async def check_feature_access(
    user_id: str,
    user_role: str,
    feature_key: str,
    scope_type: str = "global",
    scope_id: str | None = None,
) -> FeatureAccess:
    """
    Check if a user has access to a specific feature

    Feature flag evaluation order (most specific to least specific):
    1. User-specific flag (scope_type=user, scope_id=user_id)
    2. Game-specific flag (scope_type=game, scope_id=game_id)
    3. Section-specific flag (scope_type=section, scope_id=section_id)
    4. Global flag (scope_type=global)

    Within each scope level, role-specific flags take precedence over role-agnostic flags.

    Args:
        user_id: User UUID
        user_role: User role (admin, developer, basic, premium, tester)
        feature_key: Feature key to check (e.g., 'chat', 'faq', 'score_helper')
        scope_type: Scope type (global, section, game, user)
        scope_id: Scope ID (section/game/user UUID)

    Returns:
        FeatureAccess object with access decision and metadata
    """
    # Admin and developer roles have access to everything in dev environment
    if user_role in ["admin", "developer"] and settings.is_development:
        return FeatureAccess(
            has_access=True,
            feature_key=feature_key,
            reason=f"{user_role} role has full access in dev environment",
            metadata=None,
        )

    # Admin always has access in any environment
    if user_role == "admin":
        return FeatureAccess(
            has_access=True,
            feature_key=feature_key,
            reason="admin role has full access",
            metadata=None,
        )

    # Collect all relevant flags to check in order of specificity
    flags_to_check: list[tuple[str, str | None, str | None]] = []

    # 1. User-specific flags
    flags_to_check.append(("user", user_id, user_role))
    flags_to_check.append(("user", user_id, None))

    # 2. Scope-specific flags (game or section)
    if scope_type in ["game", "section"] and scope_id:
        flags_to_check.append((scope_type, scope_id, user_role))
        flags_to_check.append((scope_type, scope_id, None))

    # 3. Global flags
    flags_to_check.append(("global", None, user_role))
    flags_to_check.append(("global", None, None))

    # OPTIMIZATION: Execute all queries in parallel
    tasks = [
        get_feature_flags(
            feature_key=feature_key,
            scope_type=check_scope_type,
            scope_id=check_scope_id,
            role=check_role,
        )
        for check_scope_type, check_scope_id, check_role in flags_to_check
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Evaluate results in order of specificity
    for i, (check_scope_type, _check_scope_id, check_role) in enumerate(flags_to_check):
        result = results[i]

        # Skip if query failed or not a list
        if isinstance(result, Exception) or not isinstance(result, list):
            continue

        # Type narrowing: at this point, result is list[FeatureFlag]
        flags = result

        # If we found a matching flag, use it
        if flags:
            flag = flags[0]  # Take the first match
            if flag.enabled:
                return FeatureAccess(
                    has_access=True,
                    feature_key=feature_key,
                    reason=f"Enabled by {check_scope_type} flag"
                    + (f" for role {check_role}" if check_role else ""),
                    metadata=flag.metadata,
                )
            else:
                return FeatureAccess(
                    has_access=False,
                    feature_key=feature_key,
                    reason=f"Disabled by {check_scope_type} flag"
                    + (f" for role {check_role}" if check_role else ""),
                    metadata=flag.metadata,
                )

    # No matching flag found - default to deny
    return FeatureAccess(
        has_access=False,
        feature_key=feature_key,
        reason=f"No feature flag found for {feature_key} in {scope_type} scope",
        metadata=None,
    )


async def check_game_access(user_id: str, user_role: str, game_id: str) -> FeatureAccess:
    """
    Check if a user has access to a specific game

    Args:
        user_id: User UUID
        user_role: User role
        game_id: Game UUID

    Returns:
        FeatureAccess object indicating if user can access the game
    """
    return await check_feature_access(
        user_id=user_id,
        user_role=user_role,
        feature_key="game_access",
        scope_type="game",
        scope_id=game_id,
    )


async def check_faq_access(user_id: str, user_role: str, game_id: str) -> FeatureAccess:
    """
    Check if a user has access to FAQs for a specific game

    Args:
        user_id: User UUID
        user_role: User role
        game_id: Game UUID

    Returns:
        FeatureAccess object indicating if user can access FAQs
    """
    return await check_feature_access(
        user_id=user_id,
        user_role=user_role,
        feature_key="faq",
        scope_type="game",
        scope_id=game_id,
    )


async def check_chat_access(user_id: str, user_role: str, game_id: str) -> FeatureAccess:
    """
    Check if a user has access to chat for a specific game

    Args:
        user_id: User UUID
        user_role: User role
        game_id: Game UUID

    Returns:
        FeatureAccess object indicating if user can access chat
    """
    return await check_feature_access(
        user_id=user_id,
        user_role=user_role,
        feature_key="chat",
        scope_type="game",
        scope_id=game_id,
    )


async def get_user_accessible_games(user_id: str, user_role: str) -> list[str]:
    """
    Get list of game IDs that a user has access to

    Args:
        user_id: User UUID
        user_role: User role

    Returns:
        List of game UUIDs the user can access
    """
    # Admin and developer in dev have access to all games
    if user_role in ["admin", "developer"] and settings.is_development:
        supabase = await get_supabase_client()
        try:
            response = await supabase.table("games").select("id").execute()
            data = cast(list[SupabaseRecord], response.data)
            return [game["id"] for game in data]
        except Exception as exc:
            print(f"Error fetching all games: {exc}")
            return []

    # For other users, check game_access flags
    supabase = await get_supabase_client()

    # OPTIMIZATION: Fetch game-specific and global flags in parallel
    flags_task = get_feature_flags(
        feature_key="game_access",
        scope_type="game",
        role=user_role,
    )
    global_flags_task = get_feature_flags(
        feature_key="game_access",
        scope_type="global",
        role=user_role,
    )

    flags, global_flags = await asyncio.gather(flags_task, global_flags_task)

    # If there's a global flag enabling access, return all games
    if any(flag.enabled for flag in global_flags):
        try:
            response = await supabase.table("games").select("id").execute()
            data = cast(list[SupabaseRecord], response.data)
            return [game["id"] for game in data]
        except Exception as exc:
            print(f"Error fetching all games: {exc}")
            return []

    # Filter enabled flags
    accessible_game_ids = [flag.scope_id for flag in flags if flag.enabled and flag.scope_id]
    return accessible_game_ids
