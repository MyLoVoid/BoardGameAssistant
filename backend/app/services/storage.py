"""Supabase Storage helpers for uploading and deleting objects."""

from __future__ import annotations

import httpx
from fastapi import status

from app.config import settings

_STORAGE_BASE_URL = f"{settings.supabase_url.rstrip('/')}/storage/v1"
_AUTH_HEADERS = {
    "Authorization": f"Bearer {settings.supabase_service_role_key}",
    "apikey": settings.supabase_service_role_key,
}


class StorageServiceError(Exception):
    """Raised when Supabase Storage operations fail."""

    def __init__(self, message: str, *, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(message)
        self.status_code = status_code


async def upload_file_to_bucket(
    bucket: str,
    path: str,
    *,
    data: bytes,
    content_type: str,
    timeout: float = 60.0,
) -> None:
    """Upload bytes to Supabase Storage under the given bucket/path."""

    if not data:
        raise StorageServiceError("Cannot upload empty file payload.")

    url = f"{_STORAGE_BASE_URL}/object/{bucket}/{path.lstrip('/')}"
    headers = {
        **_AUTH_HEADERS,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "false",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(url, content=data, headers=headers)
        except httpx.HTTPError as exc:  # pragma: no cover - network errors are rare in tests
            raise StorageServiceError(f"Failed to connect to Supabase Storage: {exc}") from exc

    if response.status_code in (200, 201, 204):
        return
    if response.status_code == status.HTTP_409_CONFLICT:
        raise StorageServiceError(
            "A file already exists at the requested storage path.",
            status_code=status.HTTP_409_CONFLICT,
        )

    raise StorageServiceError(
        f"Supabase Storage upload failed ({response.status_code}): {response.text}"
    )


async def delete_file_from_bucket(
    bucket: str,
    path: str,
    *,
    timeout: float = 20.0,
) -> None:
    """Delete a file from Supabase Storage. Ignores missing files."""

    url = f"{_STORAGE_BASE_URL}/object/{bucket}/{path.lstrip('/')}"
    headers = {**_AUTH_HEADERS}

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.delete(url, headers=headers)
        except httpx.HTTPError:
            return  # Cleanup best-effort only.

    if response.status_code in (200, 204, 404):
        return

    raise StorageServiceError(
        f"Supabase Storage delete failed ({response.status_code}): {response.text}"
    )
