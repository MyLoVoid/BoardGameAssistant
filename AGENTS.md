# Repository Guidelines

## Living Sources
- `README.md`: quickstart, prerequisites, Supabase + BGG caveats, and the only up-to-date boot instructions for all apps.
- `MVP.md`: authoritative scope/architecture document (v2025-11-26) with feature status, roles, roadmap, and GenAI/BGG rationale—consult before product or data decisions.
- `docs/`: numbered deep dives (`BGAI-0001` … `BGAI-0013`) for Supabase schema, backend/admin/mobile features; add any new research here instead of `MVP.md`.
- `admin-portal/README.md` and `mobile/README.md`: feature-specific setup; admin portal is the single source for portal UX, auth requirements, and toggles like dark mode.

## Specialized Agents

### Documentation Agent

**Purpose**: Generate technical documentation following the standardized format when users request it explicitly or when a feature/milestone spans multiple modules.

**Invoke**: `Use Task tool with subagent_type='documentation-writer' and provide detailed context`.

**Instructions**
1. Follow `.github/instructions/documentation.instructions.md`.
2. Write to `/docs` using `BGAI-XXXX_<descriptive-name>.md`, incrementing from the latest entry.
3. Mandatory sections: Header (US number + name), Overview (PR/context), Summary (5–8 bullets covering scope/outcome/risks), Modified Files (paths + rationale), Detailed Changes (by concern), plus any relevant API/migration/testing notes.
4. Keep wording factual, no speculation, no invented data.
5. Reference related docs/PRs when applicable.

**Example**: `/docs/BGAI-0008_mobile-localization.md`.

**Usage cues**
- User asks “documenta esto”, “create documentation”, `/documentation`.
- After finishing a cross-cutting feature or when multiple files/modules changed.

## Architecture Overview (README + MVP)
- **Mobile (Expo/React Native/TypeScript)**: Supabase-authenticated client with LanguageProvider at the root; consumes real endpoints (`/auth`, `/games`, `/games/{id}`, `/games/{id}/faqs`, `/genai/query`). All UI copy uses `useLanguage().t()` and BGG links come from backend data.
- **Admin Portal (Next.js 16, React 19, Tailwind)**: Internal tool (roles `admin`, `developer`) with dark/light/system toggle. Imports games via BGG ID, edits metadata, manages FAQs/documents, and triggers “Process knowledge”. Routes guarded via `proxy.ts`; see `admin-portal/README.md` for flow.
- **Backend (Python 3.13 + FastAPI + Poetry)**: Single façade for mobile + admin APIs, orchestrates Supabase access, BGG sync, feature-flag/role enforcement, GenAI adapter, and analytics. Admin endpoints: `/admin/games`, `/admin/games/import-bgg`, `/admin/games/{id}/faqs`, `/admin/games/{id}/documents`, `/admin/games/{id}/process-knowledge`.
- **Supabase (Postgres/Auth/Storage)**: Stores users, roles, `app_sections`, `games`, `game_faqs`, `feature_flags`, chat sessions/messages, `game_documents` (metadata replacing the old `game_docs_vectors`) plus `knowledge_documents`, analytics (`usage_events`). Storage keeps PDFs/rulebooks; schema documented in `docs/BGAI-0001_supabase.md`.
- **GenAI/RAG**: Backend is provider-agnostic. Strategy: delegate vectorization/search to provider-native “File Search” (OpenAI Files API, Gemini Files API, Claude). Documents uploaded to providers and tracked locally via `game_documents` metadata (auto `file_path`, provider ids stored in Supabase).

## Environment & Setup
**Prereqs**: Node 20 / npm 10 (Expo SDK 54), Python 3.13 + Poetry, Supabase CLI ≥1.191, Docker Desktop, optional Scoop for Windows install of Supabase CLI.

**Startup flow**
1. **Supabase**: `supabase start` (or `npx supabase@latest start`). For clean data run `supabase db reset && supabase db seed`; run `supabase/create_test_users.sql` only if you skip reset.
2. **Backend**:
   ```bash
   cd backend
   poetry install
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. **Admin Portal (optional)**:
   ```bash
   cd admin-portal
   npm install
   npm run dev  # http://localhost:3000
   ```
   Default login after Supabase seed: `admin@bgai.test / Admin123!` (see README for other roles).
4. **Mobile App**:
   ```bash
   cd mobile
   npm install
   npx expo start --clear --android  # or --ios / --web
   ```

Env vars: root `.env` for Supabase/backend, `mobile/.env` for Expo (use `10.0.2.2` on Android emulator), `admin-portal/.env.local` for portal API targets.

## Supabase Seed & Data Guardrails (README §Configuración Inicial)
- `supabase db reset` aplica el baseline único (`supabase/migrations/20251205000000_baseline.sql`) y el seed para recrear todo desde cero (auth, schemas, RLS, datos de prueba).
1. **Users** (`admin@bgai.test`, `developer@bgai.test`, `tester@bgai.test`, `premium@bgai.test`, `basic@bgai.test`).
2. **BGC section** in `app_sections` (key `BGC`). Required for Admin Portal import flows; if reset is skipped, create via SQL or `backend/scripts/create_bgc_section.py`.
3. **Sample games** (Gloomhaven, Terraforming Mars, Wingspan, Lost Ruins of Arnak, Carcassonne) populated with BGG fields.
4. **FAQs** in ES/EN with ES→EN fallback.
5. **Feature flags** with per-role limits (20–200 chats/day) and env-specific configs for `dev`/`prod`.
6. **Sample documents** with auto-generated `file_path`, plus knowledge processing toggles.

Never edit Supabase schema blindly—cross-check `docs/BGAI-0001_supabase.md` before changing migrations/seeds/config.

## BGG Integration Status
- Import uses `https://www.boardgamegeek.com/xmlapi2/thing` and lives in `backend/app/services/bgg.py`.
- As of 2025-11-25 there is **no official license**, so treat the feature as **dev/test only**. Do not enable/ship to production until approval.
- Mobile/admin clients must never call BGG directly; only backend jobs/scripts fetch and normalize BGG data.

## Content & RAG Guardrails
- All board-game content flows through Supabase (`games`, `game_faqs`, `app_sections`, role-scoped `feature_flags`). Respect `active/beta/hidden` flags to gate rollouts.
- Document ingestion: upload raw files to storage, chunk ~200–500 words, send to provider’s vector index, persist embeddings metadata (`language`, `source_type`, `page`, `provider_document_id`) in `game_documents` / `knowledge_documents`. `file_path` is auto-generated via UUID—do not handcraft paths or reintroduce the removed `provider_name` column (migration `20241126000000`).
- `POST /genai/query` is the only chat entry point. It enforces feature flags, ES/EN routing, session mgmt (`chat_sessions`, `chat_messages`), and rate limits stored in flag metadata. Extend schema first if you need extra telemetry.
- Analytics: use `usage_events` for everything (`chat_question`, `chat_answer`, `game_open`, `faq_view`, etc.) and always include `environment`.

## Testing Guidelines
- Mobile UI tests live next to components as `Component.test.tsx` (React Testing Library). Snapshot tests only when UI is stable.
- Backend tests live in `backend/tests/` named `test_<module>.py`; mark BGG sync specs with `@pytest.mark.integration`.
- Target ≥80% backend coverage and smoke-test login, FAQ list, chat flows before merging. Record manual device tests (device, OS, Expo SDK) in PR descriptions.

## Commit & PR Guidelines
- Commit subjects: imperative, lower-case, scoped when possible (`add auth router`). Reference issue IDs in the footer (`Refs #42`).
- PRs deben referenciar el baseline/migración relevante (actual: `20251205000000_baseline.sql`), adjuntar screenshots de UI cuando aplique y listar comandos/logs de pruebas. Documenta nuevas env vars/secrets y outline de rollback/flags.
- Never commit secrets. Keep feature flags declarative (YAML in `backend/feature_flags/ENV.yaml`) and reviewed alongside migrations.
- Backend-only BGG sync jobs; mobile/admin consume cached data.
- When editing `supabase/migrations` (baseline), `supabase/seed.sql`, `supabase/create_test_users.sql`, or `supabase/config.toml`, align with `docs/BGAI-0001_supabase.md` for enums, RLS, and CLI ports.
- Preserve localization: `LanguageProvider` sits at the mobile root. Any new screen/hook must use `useLanguage` for strings and language-aware requests.
