"""
Usage tracking service for analytics and rate limiting
Tracks user interactions, feature usage, and enforces daily limits
"""

from datetime import datetime, timedelta
from typing import Any, cast

from postgrest.types import CountMethod

from app.config import settings
from app.services.supabase import SupabaseRecord, get_supabase_client

USAGE_COUNT_METHOD: CountMethod = cast(CountMethod, "exact")


async def log_usage_event(
    *,
    user_id: str,
    event_type: str,
    game_id: str | None = None,
    feature_key: str | None = None,
    extra_info: dict[str, Any] | None = None,
) -> None:
    """
    Log a usage event for analytics.

    Args:
        user_id: User UUID
        event_type: Event type (game_open, faq_view, chat_question, chat_answer, etc.)
        game_id: Optional game UUID
        feature_key: Optional feature key
        extra_info: Optional additional event data

    Raises:
        Exception: If logging fails (non-blocking, just prints error)
    """
    supabase = await get_supabase_client()

    try:
        new_event = {
            "user_id": user_id,
            "game_id": game_id,
            "feature_key": feature_key,
            "event_type": event_type,
            "environment": settings.environment,
            "extra_info": extra_info,
            "timestamp": datetime.utcnow().isoformat(),
        }

        await supabase.table("usage_events").insert(new_event).execute()

    except Exception as exc:
        # Non-blocking: log error but don't fail the request
        print(f"Error logging usage event: {exc}")


async def get_daily_usage_count(
    *,
    user_id: str,
    event_type: str,
    game_id: str | None = None,
) -> int:
    """
    Get count of usage events for a user today.

    Args:
        user_id: User UUID
        event_type: Event type to count (e.g., 'chat_question')
        game_id: Optional game UUID to filter by

    Returns:
        Count of events today

    Raises:
        Exception: If query fails
    """
    supabase = await get_supabase_client()

    # Calculate start of today (UTC)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        query = (
            supabase.table("usage_events")
            .select("id", count=USAGE_COUNT_METHOD)
            .eq("user_id", user_id)
            .eq("event_type", event_type)
            .eq("environment", settings.environment)
            .gte("timestamp", today_start.isoformat())
        )

        if game_id:
            query = query.eq("game_id", game_id)

        response = await query.execute()

        # Extract count from response
        if hasattr(response, "count") and response.count is not None:
            return response.count

        return 0

    except Exception as exc:
        print(f"Error getting daily usage count: {exc}")
        return 0


async def check_daily_limit(
    *,
    user_id: str,
    event_type: str,
    daily_limit: int,
    game_id: str | None = None,
) -> dict[str, Any]:
    """
    Check if user has reached their daily limit for an event type.

    Args:
        user_id: User UUID
        event_type: Event type to check (e.g., 'chat_question')
        daily_limit: Maximum events allowed per day
        game_id: Optional game UUID to filter by

    Returns:
        dict with:
            - has_quota: bool - Whether user can still perform the action
            - daily_used: int - Events used today
            - daily_limit: int - Daily limit
            - remaining: int - Remaining quota
            - reset_at: datetime - When quota resets (start of next day UTC)
    """
    daily_used = await get_daily_usage_count(
        user_id=user_id, event_type=event_type, game_id=game_id
    )

    remaining = max(0, daily_limit - daily_used)
    has_quota = remaining > 0

    # Calculate reset time (start of next day UTC)
    tomorrow_start = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)

    return {
        "has_quota": has_quota,
        "daily_used": daily_used,
        "daily_limit": daily_limit,
        "remaining": remaining,
        "reset_at": tomorrow_start,
    }


async def get_user_stats(
    *,
    user_id: str,
    days: int = 7,
) -> dict[str, Any]:
    """
    Get usage statistics for a user over the past N days.

    Args:
        user_id: User UUID
        days: Number of days to look back

    Returns:
        dict with aggregated statistics
    """
    supabase = await get_supabase_client()

    # Calculate start date
    start_date = datetime.utcnow() - timedelta(days=days)

    try:
        response = (
            await supabase.table("usage_events")
            .select("event_type, game_id")
            .eq("user_id", user_id)
            .eq("environment", settings.environment)
            .gte("timestamp", start_date.isoformat())
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)

        # Aggregate by event type
        event_counts: dict[str, int] = {}
        game_counts: dict[str, int] = {}

        for event in data:
            event_type = event.get("event_type", "unknown")
            game_id = event.get("game_id")

            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            if game_id:
                game_counts[game_id] = game_counts.get(game_id, 0) + 1

        return {
            "user_id": user_id,
            "days": days,
            "total_events": len(data),
            "event_counts": event_counts,
            "game_counts": game_counts,
            "period_start": start_date.isoformat(),
            "period_end": datetime.utcnow().isoformat(),
        }

    except Exception as exc:
        print(f"Error getting user stats: {exc}")
        return {
            "user_id": user_id,
            "days": days,
            "total_events": 0,
            "event_counts": {},
            "game_counts": {},
        }
