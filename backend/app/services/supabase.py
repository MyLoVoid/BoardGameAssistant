"""Supabase helpers for backend services."""

import asyncio
from typing import Any, cast

import httpx
from weakref import WeakKeyDictionary
from supabase._async.client import AsyncClient, create_client
from supabase.lib.client_options import AsyncClientOptions

from app.config import settings

_HTTPX_CLIENT: httpx.AsyncClient | None = None
_LOOP_CLIENTS: WeakKeyDictionary[asyncio.AbstractEventLoop, AsyncClient] | None = None
_LOOP_ADMIN_CLIENTS: WeakKeyDictionary[asyncio.AbstractEventLoop, AsyncClient] | None = None


def _loop_clients() -> WeakKeyDictionary[asyncio.AbstractEventLoop, AsyncClient]:
    global _LOOP_CLIENTS
    if _LOOP_CLIENTS is None:
        _LOOP_CLIENTS = WeakKeyDictionary()
    return _LOOP_CLIENTS


def _loop_admin_clients() -> WeakKeyDictionary[asyncio.AbstractEventLoop, AsyncClient]:
    global _LOOP_ADMIN_CLIENTS
    if _LOOP_ADMIN_CLIENTS is None:
        _LOOP_ADMIN_CLIENTS = WeakKeyDictionary()
    return _LOOP_ADMIN_CLIENTS


def _get_httpx_client() -> httpx.AsyncClient:
    """Return a cached httpx client used by Supabase sub-clients."""
    global _HTTPX_CLIENT
    if _HTTPX_CLIENT is None:
        _HTTPX_CLIENT = httpx.AsyncClient(
            timeout=10.0, limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
    return _HTTPX_CLIENT


async def get_supabase_client() -> AsyncClient:
    """Get Supabase client instance (loop-scoped singleton)."""
    loop = asyncio.get_running_loop()
    clients = _loop_clients()
    client = clients.get(loop)
    if client is None:
        options = AsyncClientOptions(httpx_client=_get_httpx_client())
        client = await create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
            options=options,
        )
        clients[loop] = client
    return client


async def get_supabase_admin_client() -> AsyncClient:
    """Get Supabase admin client with elevated privileges."""
    loop = asyncio.get_running_loop()
    clients = _loop_admin_clients()
    admin_client = clients.get(loop)
    if admin_client is None:
        admin_client = await get_supabase_client()
        clients[loop] = admin_client
    return admin_client


async def close_supabase_clients() -> None:
    """Close shared httpx client and reset cached Supabase clients."""
    global _HTTPX_CLIENT, _LOOP_CLIENTS, _LOOP_ADMIN_CLIENTS
    _LOOP_CLIENTS = None
    _LOOP_ADMIN_CLIENTS = None
    if _HTTPX_CLIENT is not None:
        await _HTTPX_CLIENT.aclose()
        _HTTPX_CLIENT = None


SupabaseRecord = dict[str, Any]


async def get_user_by_id(user_id: str) -> SupabaseRecord | None:
    """Get user profile by user ID."""
    supabase = await get_supabase_client()

    try:
        response = (
            await supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
        )
        if response is None:
            return None
        data = cast(SupabaseRecord | None, response.data)
        if data is None:
            return None
        return data
    except Exception as exc:  # TODO: narrow to postgrest.APIError when dependency is added
        print(f"Error fetching user profile: {exc}")
        return None


async def get_user_profile(user_id: str) -> SupabaseRecord | None:
    """Backward-compatible alias for fetching a profile by ID."""
    return await get_user_by_id(user_id)
