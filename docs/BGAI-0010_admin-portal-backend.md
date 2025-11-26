# BGAI-0010:: Admin Portal Backend

## Overview

**Pull Request**: Not provided (local request)  
**Title**: Admin portal backend scaffolding  
**Author**: Camilo Ramirez  
**Target Branch**: Not provided

## Summary
- Scope: expose FastAPI `/admin` endpoints for managing games, FAQs, documents, and knowledge jobs.
- Expected outcome: internal users can create/edit catalog content and trigger document processing via authenticated APIs.
- Risk/Impact: Medium – new write paths touch Supabase tables and require strict role enforcement plus schema migrations.
- Adds BGG import support so admins can hydrate games directly from BoardGameGeek.
- Introduces `knowledge_documents` storage and seeds so RAG processing runs are tracked independently from file uploads.
- Provides unit coverage for BGG parsing and knowledge job orchestration to limit regressions.

> ⚠️ **IMPORTANTE - Estado de la API de BGG (2025-11-25)**: La integración con BoardGameGeek XML API v2 (`https://www.boardgamegeek.com/xmlapi2/thing`) está **en proceso de aplicación**. Actualmente **NO tenemos licencia oficial** de BGG y la funcionalidad de importación **NO debe usarse en producción**. El código implementado en `backend/app/services/bgg.py` está disponible únicamente para desarrollo y testing local. Se requiere aprobación formal de BoardGameGeek antes del uso productivo.

## Modified Files (Paths)
- `backend/app/api/routes/admin.py` – Module: `backend/api` – add admin router and endpoints.
- `backend/app/main.py` – Module: `backend/app` – register admin router with FastAPI app.
- `backend/app/services/admin_games.py` – Module: `backend/services` – implement Supabase-backed admin operations.
- `backend/app/services/bgg.py` – Module: `backend/services` – add BoardGameGeek XML client.
- `backend/app/models/schemas.py` – Module: `backend/models` – extend Pydantic schemas for admin payloads and documents.
- `backend/tests/test_bgg_service.py` – Module: `backend/tests` – exercise BGG parser.
- `backend/tests/test_admin_knowledge_service.py` – Module: `backend/tests` – cover knowledge-processing planner.
- `supabase/migrations/20241125000000_add_knowledge_documents.sql` – Module: `supabase/migrations` – create `knowledge_documents` table.
- `supabase/seed.sql` – Module: `supabase/seeds` – seed sample document + knowledge rows for the portal flows.
- `docs/BGAI-0001_supabase.md` – Module: `docs` – record schema/seed deltas tied to knowledge documents.

## Detailed Changes

### Admin HTTP Endpoints
- Added `/admin` router guarded by `require_role("admin", "developer")` exposing game creation, updates, BGG imports, FAQ CRUD, document registration, and `/process-knowledge` trigger routes with typed request/response schemas.
- Reused `SuccessResponse` for delete acknowledgements and ensured all endpoints convert service errors into FastAPI `HTTPException` payloads.

### Service Layer & Integrations
- Created `admin_games` service that encapsulates Supabase operations (game CRUD, FAQ mutations, document registration) plus knowledge-processing orchestration that writes to `knowledge_documents` and updates `game_documents`.
- Implemented lightweight BGG XML parser (via `httpx` + `ElementTree`) that extracts the subset of metadata required for imports and surfaces typed errors for the API.
- Expanded `schemas.py` with admin-specific request models, document/knowledge responses, and corrected FAQ `display_order` naming to align with Supabase.

### Knowledge Documents Schema & Seeds
- Added migration to create `knowledge_documents` with indexes, RLS policies, and triggers aligned to Supabase security guardrails.
- Updated seeds to produce sample `game_documents` IDs, insert matching knowledge rows for seeded games, and document the change set inside `BGAI-0001`.

### Testing
- Added unit tests for the BGG parser and the knowledge-processing workflow, covering default processing behaviour and “mark ready” flows.
- Command: `cd backend && poetry run pytest tests/test_bgg_service.py tests/test_admin_knowledge_service.py`.

## END
End of Technical Documentation for BGAI-0010 - GitHub Copilot
