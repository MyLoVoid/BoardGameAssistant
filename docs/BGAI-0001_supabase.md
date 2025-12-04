# BGAI-0001:: Supabase

## Overview

**Pull Request**: Not provided (local request)
**Title**: Supabase schema & dev tooling bootstrap
**Author**: Camilo Ramirez
**Target Branch**: Not provided

## Summary
- Scope: Stand up the full Supabase schema, auth profile extension, and supporting tooling for BGAI.
- Expected outcome: Local environments can run `supabase db reset` to obtain the canonical tables, enums, RLS, and feature flag baselines required by the Expo app, FastAPI backend, and Admin Portal (Next.js).
- Risk/Impact: Medium - schema touches every core table, so future migrations must be coordinated and backups kept before applying in prod.
- Adds `description` column to `public.games` so the sanitized BGG synopsis is available to backend, Admin Portal, and mobile clients without recomputing on the fly.
- Seeds app sections, a minimal Wingspan record, feature flags per role/environment, placeholder RAG chunks, and pre-seeded role-scoped test accounts to unblock client + portal integration flows, leaving FAQs empty for manual authoring.
- Provides centralized seeding of role-scoped test accounts (`admin@bgai.test`, `developer@bgai.test`, etc.) plus config tuning for local auth, storage, realtime, analytics, and embedding extensions—no manual SQL scripts required.
- Extends `game_docs_vectors` into `game_documents` table with provider reference fields for tracking document processing.

## Modified Files (Paths)
- `supabase/migrations/20241122000000_initial_schema.sql` - Module: `supabase/migrations` - add full initial database schema, enums, triggers, and RLS policies.
- `supabase/seed.sql` - Module: `supabase/seeds` - seed BGC section, flagship games, bilingual FAQs, feature flags, sample RAG documents, and all role-scoped test users (admin/developer/tester/premium/basic).
- `supabase/create_test_users.sql` - Module: `supabase/tooling` - helper script to create admin/developer/tester/premium/basic accounts with hashed passwords for local testing.
- `supabase/config.toml` - Module: `supabase/config` - set project id, port map, auth, storage, analytics, and edge runtime defaults for the dev CLI stack.
- `supabase/migrations/20241124000000_migrate_to_game_documents.sql` - Module: `supabase/migrations` - rename `game_docs_vectors` and add provider metadata columns for delegated RAG.
- `supabase/migrations/20241125000000_add_knowledge_documents.sql` - Module: `supabase/migrations` - [DEPRECATED] create `knowledge_documents` table (later removed in migration 20241127).
- `supabase/migrations/20241126000000_remove_provider_name_from_game_documents.sql` - Module: `supabase/migrations` - remove `provider_name` column from `game_documents` table; provider selection now happens only during knowledge processing.
- `supabase/migrations/20241127000000_drop_knowledge_documents.sql` - Module: `supabase/migrations` - remove `knowledge_documents` table; processing metadata now tracked directly in `game_documents`.

## Detailed Changes

### Schema & Security
- Creates typed enums (`user_role`, `game_status`, `language_code`, `scope_type`, `session_status`, `ai_provider`, `message_sender`, `source_type`, `event_type`, `environment_type`) so business logic can rely on constrained values.
- Defines core tables: `profiles`, `app_sections`, `games`, `game_faqs`, `feature_flags`, `chat_sessions`, `chat_messages`, `game_docs_vectors`, and `usage_events`, each with audit columns and targeted indexes (section/status filters, language slices, vector HNSW, etc.).
- Evolves the RAG storage by renaming `game_docs_vectors` → `game_documents`, adding provider reference fields to track processing metadata directly in the document records.
- **Nov 2024 Update**: Simplifies document management by removing `provider_name` from `game_documents`. The `file_path` is now auto-generated using the document UUID (pattern: `game_documents/{game_id}/{document_uuid}`). Provider selection (OpenAI/Gemini/Claude) is deferred to the knowledge processing step, eliminating redundant fields from document creation.
- **Nov 2024 Update**: Removes `knowledge_documents` table (migration 20241127). Processing metadata now tracked directly in `game_documents` table, simplifying the architecture by eliminating redundant tracking layer.
- **Dec 2025 Update**: Adds `description` (TEXT) to `public.games`, populated during BGG imports/seeds with HTML-sanitized copy that downstream clients can display without additional parsing.
- Enables pg extensions (`uuid-ossp`, `pgcrypto`, `vector`) required for UUID defaults, password hashing, and pgvector similarity search.
- Applies RLS on every table with policies tuned to MVP access patterns (e.g., public read for enabled sections/active games/visible FAQs, owner-only chat data, authenticated reads for feature flags and RAG chunks, insert-only analytics events).
- Adds `handle_new_user` trigger hooked to `auth.users` to auto-provision `profiles` rows using metadata-provided roles, plus shared `update_updated_at_column` trigger across mutable tables to keep timestamps consistent.

### Seed Data & Feature Flags
- Loads `app_sections` with Board Game Companion plus a placeholder for future modules to validate ordering/enabling logic.
- Seeds only the Wingspan record (BGC) with BGG metadata including the sanitized description stored in `games.description`, keeping local resets lean while still exercising the full Admin/Mobile flow.
- Leaves `game_faqs` empty so new content is created through the Admin Portal or controlled SQL scripts; localization fallback logic remains unchanged in the backend.
- Populates feature flags that encode per-role chat limits, FAQ availability, beta toggles, and section enablement for both `dev` and `prod` environments, keeping metadata JSON for future quotas.
- Supplies sample `game_documents` rows (without embeddings) to validate the RAG pipeline contract while backend ingestion jobs remain in progress.

### Tooling & Local Dev Experience

- **Test Users (`seed.sql`)**: Running `npx supabase db reset` provisions all required roles automatically:
  - `admin@bgai.test` / `Admin123!`
  - `developer@bgai.test` / `Dev123!`
  - `tester@bgai.test` / `Test123!`
  - `premium@bgai.test` / `Premium123!`
  - `basic@bgai.test` / `Basic123!`
  Each user is inserted into `auth.users` with encrypted passwords via pgcrypto’s `crypt()`/`gen_salt('bf')`, and the `handle_new_user` trigger backfills the corresponding `profiles` role entry. These accounts power the backend integration tests, the mobile client, and the Admin Portal, eliminating the need for manual SQL scripts.
- `config.toml` aligns CLI services on stable ports (API 54321, DB 54322, Studio 54323) and switches on API, storage, realtime, analytics, edge functions, and seeding (`seed.sql`) so `supabase start` mirrors the target stack.
- Auth config allows local email/password sign-ups with short OTP throttles, HTTPS redirect allow-list, optional OpenAI key for Studio AI, and placeholders for future OAuth/Twilio hookups.
- Keeps storage/file limits conservative (50MiB) and enables experimental S3 knobs for future OrioleDB/backups without activating them by default.

## Follow-ups / Testing
- Before promoting to prod, capture snapshots of the managed Supabase database and replay this migration in staging to confirm enum compatibility and vector index behavior.
- Build automated ingestion to populate `embedding` vectors and align chunk dimensions with the chosen model (currently sized for `text-embedding-ada-002`).
- Wire backend feature-flag resolver and analytics emitters against the new schema; add integration tests covering RLS access paths for each role.
- **Admin Portal Setup**: After `supabase db reset`, sign in with the seeded credentials (e.g., `admin@bgai.test` / `Admin123!`) to access the Next.js admin interface at http://localhost:3000. See BGAI-0011 for full Admin Portal documentation.

### Creating the BGC Section (Required for Admin Portal)

The **Board Game Companion (BGC)** section must exist in the `app_sections` table for the "Import from BGG" feature in the Admin Portal to work correctly. This section is automatically created when running `supabase db reset` with the seed data.

**If the section is missing**, execute the following SQL in the Supabase Dashboard (SQL Editor):

```sql
-- Insert BGC section if it doesn't exist
INSERT INTO public.app_sections (key, name, description, display_order, enabled)
SELECT 'BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.app_sections WHERE key = 'BGC'
);

-- Verify the section was created
SELECT id, key, name, description, display_order, enabled, created_at
FROM public.app_sections
WHERE key = 'BGC';
```

**Alternative methods**:
- **Recommended**: Run `supabase db reset` to reset the database and apply all seeds (includes BGC section)
- **SQL Script**: Execute `backend/scripts/insert_bgc_section.sql` in Supabase SQL Editor
- **Python Script**: Run `python backend/scripts/create_bgc_section.py` (requires backend dependencies)

**Verification**: After creating the section, the "Import from BGG" modal in the Admin Portal should display "Board Game Companion" in the Section dropdown, and the "Import Game" button should be enabled.

## END
End of Technical Documentation for BGA-0001 - GitHub Copilot
