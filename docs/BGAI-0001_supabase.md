# BGAI-0001:: Supabase

## Overview

**Pull Request**: Not provided (local request)
**Title**: Supabase schema & dev tooling bootstrap
**Author**: Camilo Ramirez
**Target Branch**: Not provided

## Summary
- Scope: Stand up the full Supabase schema, auth profile extension, and supporting tooling for BGAI.
- Expected outcome: Local environments can run `supabase db reset` to obtain the canonical tables, enums, RLS, and feature flag baselines required by the Expo app and FastAPI backend.
- Risk/Impact: Medium - schema touches every core table, so future migrations must be coordinated and backups kept before applying in prod.
- Adds seed content for app sections, marquee games, FAQs (ES/EN), feature flags per role/environment, and placeholder RAG chunks to unblock client integration tests.
- Provides scripted creation of role-scoped test accounts plus config tuning for local auth, storage, realtime, analytics, and embedding extensions.
- Extends `game_docs_vectors` into `game_documents` plus a companion `knowledge_documents` table so the Admin Portal can track document ingestion workflows end-to-end.

## Modified Files (Paths)
- `supabase/migrations/20241122000000_initial_schema.sql` - Module: `supabase/migrations` - add full initial database schema, enums, triggers, and RLS policies.
- `supabase/seed.sql` - Module: `supabase/seeds` - seed BGC section, flagship games, bilingual FAQs, feature flags, and sample vector chunks.
- `supabase/create_test_users.sql` - Module: `supabase/tooling` - helper script to create admin/developer/tester/premium/basic accounts with hashed passwords for local testing.
- `supabase/config.toml` - Module: `supabase/config` - set project id, port map, auth, storage, analytics, and edge runtime defaults for the dev CLI stack.
- `supabase/migrations/20241124000000_migrate_to_game_documents.sql` - Module: `supabase/migrations` - rename `game_docs_vectors` and add provider metadata columns for delegated RAG.
- `supabase/migrations/20241125000000_add_knowledge_documents.sql` - Module: `supabase/migrations` - create `knowledge_documents` with indexes, RLS, and triggers tied to `game_documents`.

## Detailed Changes

### Schema & Security
- Creates typed enums (`user_role`, `game_status`, `language_code`, `scope_type`, `session_status`, `ai_provider`, `message_sender`, `source_type`, `event_type`, `environment_type`) so business logic can rely on constrained values.
- Defines core tables: `profiles`, `app_sections`, `games`, `game_faqs`, `feature_flags`, `chat_sessions`, `chat_messages`, `game_docs_vectors`, and `usage_events`, each with audit columns and targeted indexes (section/status filters, language slices, vector HNSW, etc.).
- Evolves the RAG storage by renaming `game_docs_vectors` → `game_documents`, adding provider reference fields, and introducing `knowledge_documents` that logs processing runs linked back to each raw file.
- Enables pg extensions (`uuid-ossp`, `pgcrypto`, `vector`) required for UUID defaults, password hashing, and pgvector similarity search.
- Applies RLS on every table with policies tuned to MVP access patterns (e.g., public read for enabled sections/active games/visible FAQs, owner-only chat data, authenticated reads for feature flags and RAG chunks, insert-only analytics events).
- Adds `handle_new_user` trigger hooked to `auth.users` to auto-provision `profiles` rows using metadata-provided roles, plus shared `update_updated_at_column` trigger across mutable tables to keep timestamps consistent.

### Seed Data & Feature Flags
- Loads `app_sections` with Board Game Companion plus a placeholder for future modules to validate ordering/enabling logic.
- Inserts representative games (Gloomhaven, Terraforming Mars, Wingspan, Lost Ruins of Arnak, Carcassonne) tied to BGG IDs for early UI/API wiring.
- Provides bilingual FAQs (ES/EN) for key titles so localization/fallback behaviors can be exercised immediately.
- Populates feature flags that encode per-role chat limits, FAQ availability, beta toggles, and section enablement for both `dev` and `prod` environments, keeping metadata JSON for future quotas.
- Supplies sample `game_documents` and `knowledge_documents` rows (without embeddings) to validate the RAG pipeline contract while backend ingestion jobs remain in progress.

### Tooling & Local Dev Experience
- **Test Users**: Now automatically created in `seed.sql` (integrated from `create_test_users.sql`). Running `npx supabase db reset` will create 5 test users:
  - `admin@bgai.test` / `Admin123!` (role: admin)
  - `developer@bgai.test` / `Dev123!` (role: developer)
  - `tester@bgai.test` / `Test123!` (role: tester)
  - `premium@bgai.test` / `Premium123!` (role: premium)
  - `basic@bgai.test` / `Basic123!` (role: basic)
- Users are inserted into `auth.users` with encrypted passwords using `crypt()` and `gen_salt('bf')` from pgcrypto extension.
- The `handle_new_user` trigger automatically creates corresponding `profiles` entries, with roles explicitly updated after creation.
- No manual user creation needed - all test accounts are ready for development/testing after database reset.
- `config.toml` aligns CLI services on stable ports (API 54321, DB 54322, Studio 54323) and switches on API, storage, realtime, analytics, edge functions, and seeding (`seed.sql`) so `supabase start` mirrors the target stack.
- Auth config allows local email/password sign-ups with short OTP throttles, HTTPS redirect allow-list, optional OpenAI key for Studio AI, and placeholders for future OAuth/Twilio hookups.
- Keeps storage/file limits conservative (50MiB) and enables experimental S3 knobs for future OrioleDB/backups without activating them by default.

## Follow-ups / Testing
- Before promoting to prod, capture snapshots of the managed Supabase database and replay this migration in staging to confirm enum compatibility and vector index behavior.
- Build automated ingestion to populate `embedding` vectors and align chunk dimensions with the chosen model (currently sized for `text-embedding-ada-002`).
- Wire backend feature-flag resolver and analytics emitters against the new schema; add integration tests covering RLS access paths for each role.

## END
End of Technical Documentation for BGA-0001 - GitHub Copilot
