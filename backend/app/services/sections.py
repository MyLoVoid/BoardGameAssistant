"""
Sections service for managing app section data
Handles section retrieval
"""

from typing import cast

from app.models.schemas import AppSection
from app.services.supabase import SupabaseRecord, get_supabase_client


async def get_sections_list(enabled_only: bool = True) -> list[AppSection]:
    """
    Get list of app sections

    Args:
        enabled_only: If True, only return enabled sections (default: True)

    Returns:
        List of app sections ordered by display_order
    """
    supabase = await get_supabase_client()

    # Build query
    query = supabase.table("app_sections").select(
        "id, key, name, description, display_order, enabled, created_at, updated_at"
    )

    # Filter by enabled if requested
    if enabled_only:
        query = query.eq("enabled", True)

    # Order by display_order
    query = query.order("display_order", desc=False)

    # Execute query
    response = await query.execute()

    # Map to AppSection objects
    sections = [AppSection(**cast(SupabaseRecord, section)) for section in response.data]

    return sections
