"""Supabase helpers for backend services."""

from functools import lru_cache
from typing import Any, cast

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_client() -> Client:
    """
    Get Supabase client instance (singleton pattern with caching)

    Returns:
        Supabase client configured with service role key for backend operations
    """
    return create_client(
        supabase_url=settings.supabase_url, supabase_key=settings.supabase_service_role_key
    )


@lru_cache
def get_supabase_admin_client() -> Client:
    """
    Get Supabase admin client with elevated privileges
    Same as get_supabase_client but with explicit admin context

    Returns:
        Supabase client with admin privileges
    """
    return get_supabase_client()


SupabaseRecord = dict[str, Any]


def get_user_by_id(user_id: str) -> SupabaseRecord | None:
    """
    Get user profile by user ID

    Args:
        user_id: User UUID

    Returns:
        User profile dict or None if not found
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
        if response is None:
            return None
        data = cast(SupabaseRecord | None, response.data)
        if data is None:
            return None
        return data
    except Exception as exc:  # TODO: narrow to postgrest.APIError when dependency is added
        print(f"Error fetching user profile: {exc}")
        return None


async def get_user_profile(user_id: str) -> dict | None:
    """
    Async wrapper for getting user profile

    Args:
        user_id: User UUID

    Returns:
        User profile dict or None if not found
    """
    return get_user_by_id(user_id)
