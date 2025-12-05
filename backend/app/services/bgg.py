"""
BoardGameGeek (BGG) integration helpers.

Provides a thin wrapper around the XML API v2 to fetch base metadata
required by the Admin Portal when onboarding new games.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

import httpx
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

_BGG_CLIENT: httpx.AsyncClient | None = None
_BREAK_TAG_RE = re.compile(r"<\s*br\s*/?\s*>", re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def _get_bgg_client() -> httpx.AsyncClient:
    """Return a cached httpx client for BGG API calls."""
    global _BGG_CLIENT
    if _BGG_CLIENT is None:
        # Use a descriptive User-Agent so BGG doesn't reject automated requests.
        # Include contact info or project name to comply with good practice.
        default_headers = {
            "User-Agent": "BGAI-Admin/1.0 (+https://example.com; dev@your-org.example)",
            "Accept": "application/xml",
        }
        if settings.bgg_api_token:
            default_headers["Authorization"] = f"Bearer {settings.bgg_api_token}"

        _BGG_CLIENT = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=5.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            follow_redirects=True,
            headers=default_headers,
        )
    return _BGG_CLIENT


async def close_bgg_client() -> None:
    """Close the BGG HTTP client."""
    global _BGG_CLIENT
    if _BGG_CLIENT is not None:
        await _BGG_CLIENT.aclose()
        _BGG_CLIENT = None


class BGGServiceError(Exception):
    """Base exception for BGG integration issues."""


class BGGGameNotFound(BGGServiceError):
    """Raised when the requested BGG game cannot be located."""

    def __init__(self, bgg_id: int):
        super().__init__(f"Game with BGG ID {bgg_id} was not found")
        self.bgg_id = bgg_id


@dataclass(slots=True)
class BGGGameData:
    """Subset of BGG metadata required by the Admin Portal."""

    bgg_id: int
    name: str
    min_players: int | None = None
    max_players: int | None = None
    playing_time: int | None = None
    rating: float | None = None
    thumbnail_url: str | None = None
    image_url: str | None = None
    description: str | None = None


def _parse_int(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_child_text(parent: ET.Element, tag: str) -> str | None:
    child = parent.find(tag)
    if child is None or child.text is None:
        return None
    return child.text.strip()


def _get_value_attr(element: ET.Element | None) -> str | None:
    if element is None:
        return None
    return element.attrib.get("value")


def _sanitize_description(value: str | None) -> str | None:
    if not value:
        return None
    text = _BREAK_TAG_RE.sub(" \n ", value)
    text = html.unescape(text)
    text = _TAG_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text)
    return text.strip() or None


def _build_bgg_endpoint() -> str:
    """Return the full XML API v2 endpoint ending in /thing."""
    base = settings.bgg_api_url.rstrip("/")
    return urljoin(f"{base}/", "thing")


async def fetch_bgg_game(bgg_id: int, *, timeout: float = 15.0) -> BGGGameData:
    """
    Fetch base metadata for a game from BoardGameGeek.

    Args:
        bgg_id: BoardGameGeek game identifier.
        timeout: HTTP timeout in seconds.

    Returns:
        BGGGameData with the parsed metadata.

    Raises:
        BGGServiceError: Network or parsing failure.
        BGGGameNotFound: The BGG API returned no items for the given ID.
    """
    client = _get_bgg_client()

    # OPTIMIZATION: Retry on network errors with exponential backoff
    try:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        ):
            with attempt:
                response = await client.get(
                    _build_bgg_endpoint(),
                    params={"id": bgg_id, "stats": 1},
                    timeout=timeout,
                )

                # If BGG rejects the request due to missing/invalid headers or auth,
                # surface a clearer error message for developers.
                if response.status_code == 401:
                    raise BGGServiceError(
                        "BGG API returned 401 Unauthorized. Ensure the configured BGG_API_URL/BGG_API_TOKEN env vars are correct, the client sends a valid User-Agent header, and BGG is not rate-limiting/blocking your requests."
                    )

                response.raise_for_status()
    except httpx.HTTPError as exc:
        raise BGGServiceError(f"BGG request failed: {exc}") from exc

    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as exc:
        raise BGGServiceError("Unable to parse BGG response") from exc

    item = root.find("item")
    if item is None:
        raise BGGGameNotFound(bgg_id)

    names = item.findall("name")
    primary_name = next(
        (name.attrib.get("value") for name in names if name.attrib.get("type") == "primary"),
        None,
    )
    if not primary_name:
        primary_name = names[0].attrib.get("value") if names else f"BGG-{bgg_id}"

    # Ensure primary_name is not None (fallback to BGG-{id} if still None)
    final_name: str = primary_name or f"BGG-{bgg_id}"

    min_players = _parse_int(_get_value_attr(item.find("minplayers")))
    max_players = _parse_int(_get_value_attr(item.find("maxplayers")))
    playing_time = _parse_int(_get_value_attr(item.find("playingtime")))

    thumbnail = _get_child_text(item, "thumbnail")
    image = _get_child_text(item, "image")
    description = _sanitize_description(_get_child_text(item, "description"))

    ratings = item.find("statistics/ratings")
    average_rating = None
    if ratings is not None:
        average_rating = _parse_float(_get_value_attr(ratings.find("average")))

    return BGGGameData(
        bgg_id=bgg_id,
        name=final_name,
        min_players=min_players,
        max_players=max_players,
        playing_time=playing_time,
        rating=average_rating,
        thumbnail_url=thumbnail,
        image_url=image,
        description=description,
    )


if __name__ == "__main__":
    # Quick manual test to run when executing this module directly.
    # Usage (from repo root):
    #   poetry run python backend\app\services\bgg.py
    # or
    #   python backend\app\services\bgg.py
    import asyncio

    async def _main():
        test_id = 174430  # example: Gloomhaven
        print(f"Fetching BGG data for id={test_id}...")
        try:
            data = await fetch_bgg_game(test_id)
            print("Fetched:")
            print(data)
        except BGGGameNotFound as e:
            print(f"Not found: {e}")
        except BGGServiceError as e:
            print(f"BGG service error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")
        finally:
            await close_bgg_client()

    asyncio.run(_main())
