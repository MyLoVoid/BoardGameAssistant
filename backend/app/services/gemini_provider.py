"""
Gemini File Search integration for RAG.

Provides:
- File Search Store management per game
- File upload to Gemini Files API
- Document addition to File Search Store for semantic search
- Error handling and retry logic
"""

from __future__ import annotations

import io
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import httpx
from google import genai
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

# Module-level client
_GEMINI_CLIENT = None


class GeminiProviderError(Exception):
    """Base exception for Gemini provider operations."""

    pass


class GeminiFileUploadError(GeminiProviderError):
    """Raised when file upload to Gemini fails."""

    pass


class GeminiFileSearchStoreError(GeminiProviderError):
    """Raised when file search store operations fail."""

    pass


@dataclass(slots=True)
class GeminiUploadResult:
    """Result of uploading a document to Gemini File Search."""

    file_uri: str  # Operation name from upload (e.g., "operations/upload-abc123")
    file_search_store_id: str  # File search store ID (e.g., "file_search_stores/abc123")
    display_name: str


def _get_gemini_client() -> genai.Client:
    """Get or create Gemini API client."""
    global _GEMINI_CLIENT
    if _GEMINI_CLIENT is None:
        if not settings.google_api_key:
            raise GeminiProviderError("GOOGLE_API_KEY not configured in settings")
        _GEMINI_CLIENT = genai.Client(api_key=settings.google_api_key)
    return _GEMINI_CLIENT


def _build_store_display_name(game_id: str) -> str:
    """Build file search store display name: game-{game_id}"""
    return f"game-{game_id}"


async def _get_or_create_file_search_store(game_id: str) -> str:
    """
    Get or create a Gemini File Search Store for a game (all languages).

    Returns:
        File Search Store ID (e.g., "file_search_stores/abc123")

    Raises:
        GeminiFileSearchStoreError: If file search store operations fail
    """
    client = _get_gemini_client()
    display_name = _build_store_display_name(game_id)

    # List existing file search stores to check if one already exists
    try:
        stores = client.file_search_stores.list()
        for store in stores:
            if store.display_name == display_name:
                if not store.name:
                    raise GeminiFileSearchStoreError(
                        f"File search store '{display_name}' exists but has no name"
                    )
                return store.name
    except GeminiFileSearchStoreError:
        raise
    except Exception as exc:
        raise GeminiFileSearchStoreError(f"Failed to list file search stores: {exc}") from exc

    # Create new file search store
    try:
        store = client.file_search_stores.create(config={"display_name": display_name})
        if not store.name:
            raise GeminiFileSearchStoreError(
                f"Created file search store '{display_name}' but received no name"
            )
        return store.name
    except GeminiFileSearchStoreError:
        raise
    except Exception as exc:
        raise GeminiFileSearchStoreError(
            f"Failed to create file search store '{display_name}': {exc}"
        ) from exc


async def _download_file_from_storage(file_path: str, timeout: float = 30.0) -> bytes:
    """
    Download file from Supabase Storage.

    Args:
        file_path: Full path like "game_documents/{game_id}/{doc_uuid}_{filename}"
        timeout: Download timeout

    Returns:
        File bytes

    Raises:
        GeminiProviderError: If download fails
    """
    # Parse bucket and path from file_path
    parts = file_path.split("/", 1)
    if len(parts) != 2:
        raise GeminiProviderError(f"Invalid file_path format: {file_path}")

    bucket, storage_path = parts

    supabase_url = settings.supabase_url.rstrip("/")
    parsed_url = urlparse(supabase_url)

    # Allow file:// URLs for local testing (e.g., pointing to tmp storage directory)
    if parsed_url.scheme == "file":
        raw_path = unquote(parsed_url.path)
        if parsed_url.netloc:
            raw_path = f"//{parsed_url.netloc}{raw_path}"
        if os.name == "nt" and raw_path.startswith("/") and ":" in raw_path:
            raw_path = raw_path.lstrip("/")

        local_root = Path(raw_path)
        local_file = local_root / bucket / Path(storage_path)

        try:
            return local_file.read_bytes()
        except FileNotFoundError as exc:
            raise GeminiProviderError(f"Local storage file not found: {local_file}") from exc
        except OSError as exc:  # pragma: no cover - unexpected filesystem issues
            raise GeminiProviderError(f"Failed to read local storage file: {exc}") from exc

    # Use Supabase service role to download file directly via HTTP
    # Similar to how storage.py uploads files, we use the direct /object endpoint
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }

    # Build direct object URL (no signing needed with service role key)
    encoded_path = quote(storage_path, safe="/")
    download_url = f"{supabase_url}/storage/v1/object/{bucket}/{encoded_path}"

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(download_url, headers=headers)
            response.raise_for_status()
            return response.content
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise GeminiProviderError(
                f"Failed to download file from storage ({exc.response.status_code}): {detail}"
            ) from exc
        except httpx.HTTPError as exc:
            raise GeminiProviderError(f"Failed to download file from storage: {exc}") from exc


async def upload_document_to_gemini(
    *,
    game_id: str,
    file_path: str,
    display_name: str,
    mime_type: str,
) -> GeminiUploadResult:
    """
    Upload a document to Gemini File Search.

    Process:
    1. Get or create file search store for game (all languages)
    2. Download file from Supabase Storage
    3. Upload file directly to file search store

    Args:
        game_id: Game UUID
        file_path: Supabase storage path
        display_name: Human-readable name for the file
        mime_type: MIME type (e.g., "application/pdf")

    Returns:
        GeminiUploadResult with file_uri and file_search_store_id

    Raises:
        GeminiProviderError: If any step fails
    """
    client = _get_gemini_client()

    # Step 1: Get or create file search store
    store_id = await _get_or_create_file_search_store(game_id)

    # Step 2: Download file from Supabase Storage
    try:
        file_bytes = await _download_file_from_storage(file_path)
    except GeminiProviderError:
        raise
    except Exception as exc:
        raise GeminiFileUploadError(f"Failed to download file: {exc}") from exc

    if len(file_bytes) == 0:
        raise GeminiFileUploadError("Downloaded file is empty")

    # Step 3: Upload directly to file search store with retry logic
    operation_name: str
    try:
        # Create a file-like object from bytes
        file_stream = io.BytesIO(file_bytes)
        file_stream.name = display_name

        # Upload with retry on network errors
        operation = None
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        ):
            with attempt:
                # Upload directly to file search store
                file_stream.seek(0)
                operation = client.file_search_stores.upload_to_file_search_store(
                    file_search_store_name=store_id,
                    file=file_stream,
                    config={
                        "mime_type": mime_type,
                        "display_name": display_name,
                    },
                )

        if not operation or not operation.name:
            raise GeminiFileUploadError(
                "File upload to search store succeeded but returned no operation name"
            )

        # Store operation name for later use (type-safe)
        operation_name = operation.name

    except GeminiFileUploadError:
        raise
    except Exception as exc:
        raise GeminiFileUploadError(f"Failed to upload file to Gemini: {exc}") from exc

    return GeminiUploadResult(
        file_uri=operation_name,
        file_search_store_id=store_id,
        display_name=display_name,
    )


async def delete_document_from_gemini(
    *,
    document_name: str,
) -> None:
    """
    Delete a document from a Gemini file search store.

    Args:
        document_name: Document resource name (e.g., "file_search_stores/abc123/documents/doc-456")

    Raises:
        GeminiProviderError: If deletion fails
    """
    client = _get_gemini_client()

    try:
        # Delete document from file search store
        client.file_search_stores.documents.delete(name=document_name)
    except Exception as exc:
        # Log but don't fail - deletion is best-effort
        raise GeminiProviderError(f"Failed to delete document from Gemini: {exc}") from exc


def _debug_list_file_search_stores() -> None:
    """Print existing Gemini File Search stores (manual debugging helper)."""
    client = _get_gemini_client()
    try:
        stores = list(client.file_search_stores.list())
    except Exception as exc:  # pragma: no cover - manual debugging helper
        raise GeminiProviderError(f"Failed to list file search stores: {exc}") from exc

    if not stores:
        print("No file search stores found.")
        return

    print("Existing Gemini File Search stores:")
    for store in stores:
        display_name = getattr(store, "display_name", "<no-display>")
        store_name = getattr(store, "name", "<no-name>")
        print(f"- {display_name} ({store_name})")


if __name__ == "__main__":  # pragma: no cover - manual execution path
    try:
        _debug_list_file_search_stores()
    except GeminiProviderError as exc:
        print(f"[GeminiProviderError] {exc}")
    except Exception as exc:
        print(f"[UnexpectedError] {exc}")
