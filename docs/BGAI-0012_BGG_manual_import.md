# BGAI-0012: BGG Manual Import & Section Endpoint

## Overview

**Title**: Manual Game Creation & BGG Sync Improvements
**Author**: Camilo Ramirez
**Date**: 2025-11-25
**Branch**: BGAI-0012_BGG_Sync
**Goal**: Enable manual game creation in Admin Portal and fix BGG API integration issues

## Summary

This implementation addresses two critical needs for the Admin Portal game management:

1. **Manual Game Creation**: Since BGG API integration requires official licensing (currently in application process), admins need a way to add games manually without depending on BGG
2. **BGG API Fixes**: Fixed redirect handling and improved User-Agent headers for BGG XML API v2
3. **Sections Endpoint**: Created missing `/sections` endpoint to populate section dropdown in both import and create modals

**Key Achievements:**
- ✅ Complete manual game creation UI with all metadata fields
- ✅ Fixed BGG API redirect issue (HTTP 302) with `follow_redirects=True`
- ✅ Added proper User-Agent headers for BGG API compliance
- ✅ Created `/sections` endpoint for dynamic section loading
- ✅ Updated API types to support full game metadata
- ✅ Documentation updates warning about BGG licensing status

**Files Modified:** 11 files (5 backend, 6 frontend)

## Modified Files

### Backend

1. **`backend/app/services/bgg.py`**
   - Added `follow_redirects=True` to httpx client (fixes 302 redirect errors)
   - Added descriptive User-Agent header for BGG API compliance
   - Added 401 error handling with clear message
   - Added manual test script for quick validation

2. **`backend/app/models/schemas.py`**
   - Created `AppSection` schema (id, key, name, description, display_order, enabled)
   - Created `SectionsListResponse` schema
   - Updated schemas to match actual database structure

3. **`backend/app/services/sections.py`** (NEW)
   - Created `get_sections_list()` service
   - Filters by enabled status
   - Orders by display_order

4. **`backend/app/api/routes/games.py`**
   - Added `GET /sections` endpoint
   - Returns enabled sections ordered by display_order
   - No authentication required (public endpoint)

5. **`backend/scripts/insert_bgc_section.sql`** (NEW)
   - SQL script to create BGC section if missing
   - Includes verification query

### Frontend

6. **`admin-portal/lib/types.ts`**
   - Updated `AppSection` interface to match backend schema
   - Extended `CreateGameRequest` with all optional fields:
     - `min_players`, `max_players`, `playing_time`
     - `rating`, `thumbnail_url`, `image_url`

7. **`admin-portal/lib/api.ts`**
   - Updated `createGame()` method to send all fields
   - Properly maps all optional parameters to backend format

8. **`admin-portal/components/games/create-game-modal.tsx`** (NEW)
   - Full-featured modal for manual game creation
   - Required fields: name, section, status
   - Optional fields: BGG ID, players, time, rating, images
   - Form validation and error handling
   - Loading states and success callbacks

9. **`admin-portal/components/games/import-bgg-modal.tsx`**
   - Fixed section display to use `section.name` instead of `section.name_key`
   - Added error handling when no sections available

10. **`admin-portal/app/(dashboard)/games/page.tsx`**
    - Added "Create Game" button alongside "Import from BGG"
    - Integrated CreateGameModal component
    - Both modals share same success callback (loadGames)

### Documentation

11. **Multiple documentation files updated**
    - `MVP.md` - Added BGG licensing warning
    - `README.md` - Added BGG status section
    - `docs/BGAI-0001_supabase.md` - Added BGC section creation instructions
    - `docs/BGAI-0010_admin-portal-backend.md` - Added BGG licensing warning

## Detailed Changes

### 1. BGG API Integration Fixes

**Problem**: BGG API returns 302 redirect from `www.boardgamegeek.com` to `boardgamegeek.com`, causing httpx errors.

**Solution**:
```python
_BGG_CLIENT = httpx.AsyncClient(
    timeout=httpx.Timeout(15.0, connect=5.0),
    limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    follow_redirects=True,  # ← Added
    headers={
        "User-Agent": "BGAI-Admin/1.0 (+https://example.com; dev@your-org.example)",
        "Accept": "application/xml",
    },
)
```

**Impact**: BGG imports now work correctly for all game IDs.

### 2. Manual Game Creation Flow

**Backend Endpoint** (already existed):
```
POST /admin/games
Authorization: Bearer <admin_token>

{
  "section_id": "uuid",
  "name_base": "Game Name",
  "status": "active",
  // Optional fields:
  "bgg_id": 123456,
  "min_players": 1,
  "max_players": 5,
  "playing_time": 60,
  "rating": 8.5,
  "thumbnail_url": "https://...",
  "image_url": "https://..."
}
```

**Frontend Modal**:
- Clean 2-column layout for optional fields
- Auto-loads sections from `/sections` endpoint
- Validates required fields
- Resets form on close
- Shows loading states during submission

### 3. Sections Endpoint

**New Endpoint**:
```
GET /sections?enabled_only=true
```

**Response**:
```json
{
  "sections": [
    {
      "id": "uuid",
      "key": "BGC",
      "name": "Board Game Companion",
      "description": "Your intelligent assistant for board games",
      "display_order": 1,
      "enabled": true,
      "created_at": "2025-11-25T...",
      "updated_at": "2025-11-25T..."
    }
  ],
  "total": 1
}
```

**Usage**: Both ImportBGGModal and CreateGameModal load sections dynamically.

### 4. Database Schema Alignment

Fixed discrepancy between TypeScript types and actual database schema:

**Old (incorrect)**:
```typescript
interface AppSection {
  name_key: string;
  is_active: boolean;
  order_index: number;
}
```

**New (correct)**:
```typescript
interface AppSection {
  key: string;
  name: string;
  enabled: boolean;
  display_order: number;
}
```

## BGG Licensing Status

> ⚠️ **IMPORTANT**: The BoardGameGeek XML API v2 integration is **in application process**. We currently **DO NOT have official licensing** from BGG. The code is implemented and functional for **development/testing purposes only**.

**Current Status (2025-11-25)**:
- ❌ No official BGG license
- ❌ Integration in application process
- ⚠️ NOT approved for production use
- ✅ Code ready for dev/testing

### BGG Credentials & Environment Variables

Now that BGG granted us a sandbox token, configure the backend `.env` with:

| Variable | Description |
| --- | --- |
| `BGG_API_URL` | Base URL of the authorized XML endpoint. The backend automatically appends `/thing` if the base omits it. |
| `BGG_API_TOKEN` | Bearer token issued by BGG. Required for every request; keep it out of source control. |

Both values are read via `backend/app/config.py` and injected into the shared httpx client in `backend/app/services/bgg.py`. Update deployment secrets (Supabase functions, Render, etc.) before enabling the import flow in those environments.

**Documented in**:
- `MVP.md` - Section 8
- `README.md` - BGG Integration section
- `docs/BGAI-0010_admin-portal-backend.md` - Summary
- `backend/app/services/bgg.py` - Comments

## Testing

### Manual Game Creation
1. Start backend: `cd backend && poetry run uvicorn app.main:app --reload`
2. Start admin portal: `cd admin-portal && npm run dev`
3. Login with `admin@bgai.test` / `Admin123!`
4. Navigate to Games page
5. Click "Create Game" button
6. Fill form with:
   - Name: "Test Game Manual"
   - Section: "Board Game Companion"
   - Status: "active"
   - Optional: min_players=2, max_players=4, playing_time=60
7. Click "Create Game"
8. ✅ Game appears in list immediately

### BGG Import (when licensed)
1. Same setup as above
2. Click "Import from BGG"
3. Enter BGG ID: 174430 (Gloomhaven)
4. Select section and status
5. Click "Import Game"
6. ✅ Game imported with all BGG metadata

### Sections Endpoint
```bash
curl http://localhost:8000/sections
```
Expected: JSON with BGC section

## UI/UX Improvements

### Games Page Header
**Before**:
```
[Import from BGG]
```

**After**:
```
[Create Game (outline)] [Import from BGG (primary)]
```

### Create Game Modal
- **Layout**: Scrollable modal with 2-column grid for optional fields
- **Validation**: Real-time validation, disabled submit if no sections
- **Feedback**: Loading spinner, error alerts, success callback
- **Reset**: Form clears on close/success
- **Accessibility**: Proper labels, placeholders, disabled states

## Migration Notes

### For Existing Deployments

1. **Create BGC Section** (if missing):
```sql
INSERT INTO public.app_sections (key, name, description, display_order, enabled)
SELECT 'BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_sections WHERE key = 'BGC');
```

Or run: `supabase db reset` (includes all seeds)

2. **Update frontend dependencies** (if needed):
```bash
cd admin-portal && npm install
```

3. **Restart backend** to load new BGG client settings

## Follow-up Tasks

- [ ] Obtain official BGG XML API license
- [ ] Add image upload functionality for manual games
- [ ] Implement BGG ID validation (check if game exists)
- [ ] Add bulk import from CSV/JSON
- [ ] Create game duplication feature
- [ ] Add year_published field to manual creation

## Related Documentation

- **BGAI-0001**: Supabase schema (includes app_sections table)
- **BGAI-0010**: Admin backend API (includes POST /admin/games)
- **BGAI-0011**: Admin portal frontend (base UI components)
- **MVP.md**: Section 8 - BGG as data source
- **README.md**: Setup and BGG status

## END
End of Technical Documentation for BGAI-0012 - Manual Game Creation & BGG Fixes
