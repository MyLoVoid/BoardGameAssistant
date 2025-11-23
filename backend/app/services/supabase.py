"""Supabase helpers for backend services."""

from functools import lru_cache
from typing import Any, cast

import httpx
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config import settings

_HTTPX_CLIENT: httpx.Client | None = None


def _get_httpx_client() -> httpx.Client:
    """Return a cached httpx client used by Supabase sub-clients."""
    global _HTTPX_CLIENT
    if _HTTPX_CLIENT is None:
        _HTTPX_CLIENT = httpx.Client(timeout=10.0)
    return _HTTPX_CLIENT


@lru_cache
def get_supabase_client() -> Client:
    """
    Get Supabase client instance (singleton pattern with caching)

    Returns:
        Supabase client configured with service role key for backend operations
    """
    options = SyncClientOptions(httpx_client=_get_httpx_client())
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        options=options,
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


def close_supabase_clients() -> None:
    """Close shared httpx client and reset cached Supabase clients."""
    global _HTTPX_CLIENT
    get_supabase_client.cache_clear()
    get_supabase_admin_client.cache_clear()
    if _HTTPX_CLIENT is not None:
        _HTTPX_CLIENT.close()
        _HTTPX_CLIENT = None


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
