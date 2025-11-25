"""Unit tests for the BGG service helpers."""

from __future__ import annotations

import httpx
import pytest

from app.services import bgg


class DummyResponse:
    def __init__(self, text: str, status_code: int = 200):
        self.text = text
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "error",
                request=httpx.Request("GET", "https://example.com"),
                response=httpx.Response(self.status_code),
            )


SAMPLE_XML = """
<items>
  <item type="boardgame" id="123">
    <name type="primary" value="Sample Game"/>
    <name type="alternate" value="Other Name"/>
    <minplayers value="1"/>
    <maxplayers value="5"/>
    <playingtime value="55"/>
    <thumbnail>http://example.com/thumb.jpg</thumbnail>
    <image>http://example.com/image.jpg</image>
    <statistics>
      <ratings>
        <average value="8.45"/>
      </ratings>
    </statistics>
  </item>
</items>
"""


def test_fetch_bgg_game_parses_basic_fields(monkeypatch: pytest.MonkeyPatch):
    """BGG XML response should be parsed into BGGGameData."""

    monkeypatch.setattr(httpx, "get", lambda *args, **kwargs: DummyResponse(SAMPLE_XML))

    data = bgg.fetch_bgg_game(123)
    assert data.bgg_id == 123
    assert data.name == "Sample Game"
    assert data.min_players == 1
    assert data.max_players == 5
    assert data.playing_time == 55
    assert data.rating == pytest.approx(8.45)
    assert data.thumbnail_url == "http://example.com/thumb.jpg"
    assert data.image_url == "http://example.com/image.jpg"


def test_fetch_bgg_game_raises_when_not_found(monkeypatch: pytest.MonkeyPatch):
    """BGGGameNotFound is raised if the XML contains no items."""

    empty_response = "<items></items>"
    monkeypatch.setattr(httpx, "get", lambda *args, **kwargs: DummyResponse(empty_response))

    with pytest.raises(bgg.BGGGameNotFound):
        bgg.fetch_bgg_game(999)
