"""Unit tests for the BGG service helpers."""

from __future__ import annotations

import asyncio

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
    <description><![CDATA[Sample&nbsp;detail &amp; overview.&mdash;First line<br/>Second line.]]></description>
    <statistics>
      <ratings>
        <average value="8.45"/>
      </ratings>
    </statistics>
  </item>
</items>
"""


class DummyClient:
    def __init__(self, response: DummyResponse):
        self._response = response

    async def get(self, *args, **kwargs):
        return self._response


def test_fetch_bgg_game_parses_basic_fields(monkeypatch: pytest.MonkeyPatch):
    """BGG XML response should be parsed into BGGGameData."""

    monkeypatch.setattr(bgg, "_get_bgg_client", lambda: DummyClient(DummyResponse(SAMPLE_XML)))

    data = asyncio.run(bgg.fetch_bgg_game(123))
    assert data.bgg_id == 123
    assert data.name == "Sample Game"
    assert data.min_players == 1
    assert data.max_players == 5
    assert data.playing_time == 55
    assert data.rating == pytest.approx(8.45)
    assert data.thumbnail_url == "http://example.com/thumb.jpg"
    assert data.image_url == "http://example.com/image.jpg"
    assert data.description == "Sample detail & overview.—First line Second line."


def test_fetch_bgg_game_raises_when_not_found(monkeypatch: pytest.MonkeyPatch):
    """BGGGameNotFound is raised if the XML contains no items."""

    monkeypatch.setattr(
        bgg, "_get_bgg_client", lambda: DummyClient(DummyResponse("<items></items>"))
    )

    with pytest.raises(bgg.BGGGameNotFound):
        asyncio.run(bgg.fetch_bgg_game(999))
