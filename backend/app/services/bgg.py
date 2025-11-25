"""
BoardGameGeek (BGG) integration helpers.

Provides a thin wrapper around the XML API v2 to fetch base metadata
required by the Admin Portal when onboarding new games.
"""

from __future__ import annotations

from dataclasses import dataclass
from xml.etree import ElementTree as ET

import httpx
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

BGG_API_URL = "https://www.boardgamegeek.com/xmlapi2/thing"


_BGG_CLIENT: httpx.AsyncClient | None = None


def _get_bgg_client() -> httpx.AsyncClient:
    """Return a cached httpx client for BGG API calls."""
    global _BGG_CLIENT
    if _BGG_CLIENT is None:
        _BGG_CLIENT = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=5.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
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
                    BGG_API_URL, params={"id": bgg_id, "stats": 1}, timeout=timeout
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
    )
