"""
Game FAQs service for managing FAQ data
Handles FAQ retrieval with language filtering and fallback
"""

import asyncio
from typing import cast

from app.models.schemas import GameFAQ
from app.services.supabase import SupabaseRecord, get_supabase_client


async def get_game_faqs(
    game_id: str,
    language: str = "es",
    fallback_to_en: bool = True,
) -> tuple[list[GameFAQ], str]:
    """
    Get FAQs for a specific game with language filtering

    Args:
        game_id: Game UUID
        language: Preferred language code (es, en)
        fallback_to_en: If True, fall back to English if no FAQs in requested language

    Returns:
        Tuple of (list of FAQs, actual language used)
    """
    supabase = await get_supabase_client()

    try:
        # OPTIMIZATION: If fallback is enabled and language is not EN, query both languages in parallel
        if fallback_to_en and language.lower() != "en":
            requested_lang_task = (
                supabase.table("game_faqs")
                .select("*")
                .eq("game_id", game_id)
                .eq("language", language.lower())
                .eq("visible", True)
                .order("display_order")
                .execute()
            )

            en_lang_task = (
                supabase.table("game_faqs")
                .select("*")
                .eq("game_id", game_id)
                .eq("language", "en")
                .eq("visible", True)
                .order("display_order")
                .execute()
            )

            requested_response, en_response = await asyncio.gather(
                requested_lang_task, en_lang_task
            )

            # Prefer requested language if available
            requested_data = cast(list[SupabaseRecord], requested_response.data)
            requested_faqs = [GameFAQ(**faq) for faq in requested_data]

            if requested_faqs:
                return requested_faqs, language.lower()

            # Fall back to English
            en_data = cast(list[SupabaseRecord], en_response.data)
            en_faqs = [GameFAQ(**faq) for faq in en_data]

            if en_faqs:
                return en_faqs, "en"

            return [], language.lower()

        # No fallback needed or language is already EN
        response = await (
            supabase.table("game_faqs")
            .select("*")
            .eq("game_id", game_id)
            .eq("language", language.lower())
            .eq("visible", True)
            .order("display_order")
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)
        faqs = [GameFAQ(**faq) for faq in data]
        return faqs, language.lower()

    except Exception as exc:
        print(f"Error fetching FAQs for game {game_id}: {exc}")
        return [], language.lower()


async def get_faq_by_id(faq_id: str) -> GameFAQ | None:
    """
    Get a specific FAQ by ID

    Args:
        faq_id: FAQ UUID

    Returns:
        GameFAQ object if found, None otherwise
    """
    supabase = await get_supabase_client()

    try:
        response = (
            await supabase.table("game_faqs").select("*").eq("id", faq_id).maybe_single().execute()
        )

        if response is None or response.data is None:
            return None

        data = cast(SupabaseRecord, response.data)
        return GameFAQ(**data)
    except Exception as exc:
        print(f"Error fetching FAQ {faq_id}: {exc}")
        return None


async def get_available_languages_for_game(game_id: str) -> list[str]:
    """
    Get list of available languages for a game's FAQs

    Args:
        game_id: Game UUID

    Returns:
        List of available language codes
    """
    supabase = await get_supabase_client()

    try:
        response = await (
            supabase.table("game_faqs")
            .select("language")
            .eq("game_id", game_id)
            .eq("visible", True)
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)
        languages = list({faq["language"] for faq in data})
        return sorted(languages)
    except Exception as exc:
        print(f"Error fetching available languages for game {game_id}: {exc}")
        return []
