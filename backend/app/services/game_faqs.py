"""
Game FAQs service for managing FAQ data
Handles FAQ retrieval with language filtering and fallback
"""

from typing import cast

from app.models.schemas import GameFAQ
from app.services.supabase import SupabaseRecord, get_supabase_client


def get_game_faqs(
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
    supabase = get_supabase_client()

    # Try to get FAQs in requested language
    try:
        response = (
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

        # If we found FAQs in requested language, return them
        if faqs:
            return faqs, language.lower()

        # If no FAQs found and fallback is enabled, try English
        if fallback_to_en and language.lower() != "en":
            response = (
                supabase.table("game_faqs")
                .select("*")
                .eq("game_id", game_id)
                .eq("language", "en")
                .eq("visible", True)
                .order("display_order")
                .execute()
            )

            data = cast(list[SupabaseRecord], response.data)
            faqs = [GameFAQ(**faq) for faq in data]

            if faqs:
                return faqs, "en"

        # No FAQs found in any language
        return [], language.lower()

    except Exception as exc:
        print(f"Error fetching FAQs for game {game_id}: {exc}")
        return [], language.lower()


def get_faq_by_id(faq_id: str) -> GameFAQ | None:
    """
    Get a specific FAQ by ID

    Args:
        faq_id: FAQ UUID

    Returns:
        GameFAQ object if found, None otherwise
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("game_faqs").select("*").eq("id", faq_id).maybe_single().execute()

        if response is None or response.data is None:
            return None

        data = cast(SupabaseRecord, response.data)
        return GameFAQ(**data)
    except Exception as exc:
        print(f"Error fetching FAQ {faq_id}: {exc}")
        return None


def get_available_languages_for_game(game_id: str) -> list[str]:
    """
    Get list of available languages for a game's FAQs

    Args:
        game_id: Game UUID

    Returns:
        List of available language codes
    """
    supabase = get_supabase_client()

    try:
        response = (
            supabase.table("game_faqs")
            .select("language")
            .eq("game_id", game_id)
            .eq("visible", True)
            .execute()
        )

        data = cast(list[SupabaseRecord], response.data)
        languages = list(set(faq["language"] for faq in data))
        return sorted(languages)
    except Exception as exc:
        print(f"Error fetching available languages for game {game_id}: {exc}")
        return []
