"""
Script to create the Board Game Companion (BGC) section if it doesn't exist
Run this once to initialize the default section
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import Any

from app.services.supabase import get_supabase_client


def _normalize_response_obj(raw: Any) -> dict[str, Any]:
    """Normalize a Supabase response item to a dict with string keys.

    Handles dicts, objects with __dict__, and mappings with byte keys.
    """
    # Fallback simple mapping from attributes
    if raw is None:
        return {}

    # If it's already a dict-like object, iterate its items
    if isinstance(raw, dict):
        items = raw.items()
    elif hasattr(raw, "__dict__"):
        items = raw.__dict__.items()
    elif hasattr(raw, "items"):
        try:
            items = raw.items()
        except Exception:
            items = []
    else:
        return {
            "id": getattr(raw, "id", None),
            "name": getattr(raw, "name", None),
            "enabled": getattr(raw, "enabled", None),
        }

    normalized: dict[str, Any] = {}
    for k, v in items:
        if isinstance(k, bytes | bytearray):
            key = k.decode(errors="ignore")
        else:
            key = str(k)
        normalized[key] = v

    return normalized


async def create_bgc_section():
    """Create BGC section if it doesn't exist"""

    supabase = await get_supabase_client()

    # Check if BGC section already exists
    response = await supabase.table("app_sections").select("*").eq("key", "BGC").execute()

    if response.data:
        raw = response.data[0]
        section = _normalize_response_obj(raw)
        print("✓ BGC section already exists:")
        print(f"  - ID: {section.get('id')}")
        print(f"  - Name: {section.get('name')}")
        print(f"  - Enabled: {section.get('enabled')}")
        return section

    # Create BGC section
    print("Creating BGC section...")

    new_section = {
        "key": "BGC",
        "name": "Board Game Companion",
        "description": "Your intelligent assistant for board games",
        "display_order": 1,
        "enabled": True,
    }

    response = await supabase.table("app_sections").insert(new_section).execute()

    if response.data:
        raw = response.data[0]
        section = _normalize_response_obj(raw)
        print("✓ BGC section created successfully:")
        print(f"  - ID: {section.get('id')}")
        print(f"  - Name: {section.get('name')}")
        print(f"  - Key: {section.get('key')}")
        return section
    else:
        print("✗ Failed to create BGC section")
        return None


async def main():
    """Main function"""
    print("=" * 50)
    print("BGC Section Setup")
    print("=" * 50)
    print()

    section = await create_bgc_section()

    print()
    print("=" * 50)
    if section:
        print("Setup completed successfully!")
    else:
        print("Setup failed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
