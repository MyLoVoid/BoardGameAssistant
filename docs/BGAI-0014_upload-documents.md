# BGAI-0014:: Upload Documents

## Overview

**Pull Request**: N/A (local change)  
**Title**: BGAI-0014: Upload Documents - Requerimiento Completo  
**Author**: Camilo Ramirez  
**Target Branch**: dev

## Summary

Scope: backend + admin portal work to accept PDF/Word uploads per game, persist metadata, and surface status-aware UI for knowledge processing.  
Expected outcome: admins can upload 10 MB PDF/DOC/DOCX files directly from the portal, files are stored under `game_documents/{game_id}/{document_uuid}_filename`, records default to `uploaded` with titles, and the Documents tab reflects status, download links, and “Procesar” affordances with notifications.  
Risk/Impact: **Medium**—touches auth-protected upload endpoint, Supabase Storage helper, DB schema (new column + seed changes), front-end package additions, and new tests; regressions would break admin workflows or storage paths.

- Added multipart `POST /admin/games/{game_id}/documents` flow with server-side validation (extensions, MIME, size, duplicate path) plus Supabase Storage upload helper and resilience on DB failures.
- Extended data model with required `title`, default status `uploaded`, and seed/migration updates removing stale `provider_name` entries.
- Added coverage via `tests/test_admin_documents_api.py` plus fixture fixes for document objects in knowledge-processing tests.
- Introduced toast infrastructure (`react-hot-toast`), a dedicated Add Document modal with client validation, signed download links, and rebuilt Documents table showing title, status badge, “Procesar” buttons, and notifications.
- Wired parent tab → modal callbacks so uploads refresh automatically without losing filters/selection.
- Documented the entire feature (this file) and refreshed README/MVP guidance to reflect the new upload experience.

## Modified Files (Paths)

- **backend/app/api/routes/admin.py** – API: replace JSON document creation with multipart upload endpoint.  
- **backend/app/models/schemas.py** – API Models: add `title` to `GameDocument`, drop obsolete request schema.  
- **backend/app/services/admin_games.py** – Services: validations, storage helper usage, Supabase writes, and helpers for language/source normalization.  
- **backend/app/services/storage.py** *(new)* – Infra: Supabase Storage upload/delete helper with service key auth.  
- **backend/tests/test_admin_knowledge_service.py** – Tests: fixture now sets `title`/`uploaded` status.  
- **backend/tests/test_admin_documents_api.py** *(new)* – Tests: coverage for upload success/validation/duplicate/storage failure.  
- **backend/tests/supabase_test_helpers.py** – Tests: helper to delete inserted documents.  
- **supabase/migrations/20241124000000_migrate_to_game_documents.sql** – Data: default status `uploaded`.  
- **supabase/migrations/20241125000000_add_knowledge_documents.sql** – Data: default status `uploaded`.  
- **supabase/migrations/20241128000000_add_title_to_game_documents.sql** *(new)* – Data: add `title` column + backfill.  
- **supabase/seed.sql** – Seed: include `title` values, drop `provider_name`, set status `uploaded`.  
- **admin-portal/package.json / package-lock.json** – Frontend: add `react-hot-toast`.  
- **admin-portal/app/layout.tsx** – Frontend: mount global toast provider.  
- **admin-portal/components/ui/notifications-provider.tsx** *(new)* – Frontend: Toaster config.  
- **admin-portal/lib/notifications.ts** *(new)* – Frontend: helper wrappers for success/error/info.  
- **admin-portal/lib/types.ts** – Frontend Types: align `GameDocument` + new upload request type.  
- **admin-portal/lib/api.ts** – Frontend API: map new document schema, send FormData, richer error typing.  
- **admin-portal/components/games/add-document-modal.tsx** *(new)* – Frontend UI: upload modal with validations + toasts.  
- **admin-portal/components/games/documents-tab.tsx** – Frontend UI: replace inline form with table, download button, “Procesar” column, refresh wiring.  
- **admin-portal/app/(dashboard)/games/[id]/page.tsx** – Frontend Routing: propagate refresh key to Documents tab.  
- **docs/BGAI-0014_upload-documents.md** *(new)* – Documentation: this file.  
- **README.md / admin-portal/README.md / MVP.md** – Docs: describe new workflow and completion status.

## Detailed Changes

### Backend: Document Upload Endpoint & Storage Helper

- Replaced the JSON-based document creation endpoint with a multipart `POST /admin/games/{game_id}/documents` that enforces authentication/role checks, reads form fields (`title`, `language`, `source_type`, `file`), and streams file bytes directly.
- Added `_clean_title`, `_normalize_language/source_type`, and `_prepare_file_payload` helpers to sanitize inputs, enforce file extensions (`.pdf/.doc/.docx`), and reject files >10 MB or mismatched MIME types.
- Introduced `upload_game_document()` service that:
  - Generates a UUID-based document ID and storage-safe filename.
  - Builds `file_path = game_documents/{game_id}/{document_uuid}_{filename}` and checks for duplicates before uploading.
  - Uploads file bytes to Supabase Storage using the new `app/services/storage.py` helper, rolling back stored objects if DB writes fail.
  - Inserts the `game_documents` row with `title`, normalized metadata, `status='uploaded'`, and timestamps.
- Added `app/services/storage.py` with HTTPX-based helpers to POST files via the Supabase service role, returning clear errors for 409/conflict and bubbling HTTP failures.
- Updated `GameDocument` schema to require `title` and align with new `file_size/file_type` fields.

### Data Model & Seeds

- Migration `20241128000000_add_title_to_game_documents.sql` adds a `title` column, backfills it from `file_name`, and enforces `NOT NULL` with documentation comment.
- Adjusted existing migrations so the `status` default reflects the allowed enum values (`uploaded`, `ready`, `error`) instead of the retired `pending`.
- Refreshed `supabase/seed.sql` sample data:
  - Added human-readable `title` for each document.
  - Removed the deprecated `provider_name` column from inserts.
  - Ensured sample rows use `status='uploaded'` and queries refer to the new value.

### Admin Portal Frontend

- Added `react-hot-toast`, a global `NotificationsProvider`, and `lib/notifications.ts` helpers so any component can emit success/error/info toasts.
- Created `AddDocumentModal` with:
  - Local validation for title, allowed extensions, and 10 MB limit.
  - Upload spinner and proper error messaging (including specific copy for 409 duplicates).
  - Calls `apiClient.createDocument` with FormData and notifies parent via callback on success.
- Rebuilt the Documents tab into a data table that:
  - Shows title, file metadata, badges, and timestamps per row.
  - Adds a “Procesar” column showing a green “Procesado” badge for ready docs, and a placeholder button (with tooltip + info toast) for everything else until the actual processing queue lands.
  - Adds a “Descargar” button that generates a signed Supabase Storage URL and opens it in a new tab.
  - Keeps bulk selection + Process Knowledge CTA intact.
- Connected the parent game page to refresh the Documents tab after uploads by incrementing a React key and exposing an `onRefreshRequested` prop.

### Testing & Validation

- Added `tests/test_admin_documents_api.py` with async HTTPX monkeypatches to exercise:
  - Successful PDF upload (ensuring Supabase helper is invoked).
  - Client-side validation for extension/size.
  - Duplicate file-path detection.
  - Error propagation when Storage upload fails.
- Updated knowledge-processing tests to seed fake documents with the new mandatory fields (`title`, valid `status`).
- Manual validation checklist (Task 6) covers:
  - Backend: upload success for PDF/DOCX, rejection for >10 MB/invalid types, conflict detection, seed data sanity, Supabase Storage cleanup on failure.
  - Frontend: modal validations, spinner, toasts, auto-close on success, 409 copy, download link, “Procesar” badges/buttons, table refresh without reloading the page.
- `npm run lint` still needs to run outside this sandbox due to the Windows `node.exe` limitation documented in README/MVP.

## END

End of Technical Documentation for BGAI-0014 - Upload Documents
