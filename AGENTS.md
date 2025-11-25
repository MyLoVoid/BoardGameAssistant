# Repository Guidelines

**Documentation**
- `docs/` stores all living design notes; add new research there instead of `MVP.md`.
- `docs/BGAI-0001_supabase.md` documents the canonical Supabase schema, seeds, and tooling—consult it before touching anything in `supabase/` or running migrations.

## Specialized Agents

### Documentation Agent

**Purpose**: Generate technical documentation following the project's standardized format.

**When to Use**:
- User explicitly requests documentation (e.g., "documenta esto", "create documentation", "/documentation")
- After completing a significant feature or milestone
- When changes span multiple files/modules and need to be recorded

**Invocation**:
```
Use Task tool with subagent_type='documentation-writer' and provide detailed context
```

**Agent Instructions**:
The documentation agent should:
1. Instructions and template in `.github/instructions/documentation.instructions.md`
2. Create files in `/docs` with naming format: `BGAI-XXXX_<descriptive-name>.md`
3. Include these mandatory sections:
   - **Header**: US number and name
   - **Overview**: PR/context metadata (if applicable)
   - **Summary**: Scope, expected outcome, risk/impact (5-8 bullets max)
   - **Modified Files**: Paths with module/component mapping and brief reason
   - **Detailed Changes**: Organized by concern/module
   - **Other sections**: As applicable (API changes, database migrations, testing notes, etc.)
4. Keep language concise and factual
5. Do not invent details - only document what can be inferred from code/context
6. Use BGAI-XXXX numbering (check existing docs for next available number)

**Example Output**:
```
/docs/BGAI-0008_mobile-localization.md
```

**Notes**:
- Reference existing docs (`BGAI-0001`, `BGAI-0002`, etc.) for numbering continuity
- If documenting a PR, include PR number, title, author, and target branch
- For architecture decisions, include rationale and alternatives considered
- Link to related docs or external resources when relevant

**Usage Examples**:

```plaintext
User: "documenta la integración de Supabase que acabamos de hacer"
Assistant: [Uses Task tool with detailed context about the Supabase integration]

User: "create documentation for the new feature"
Assistant: [Uses Task tool with context about modified files and changes]

User: "/documentation"
Assistant: [Uses Task tool to generate docs based on recent changes]
```

**Reference Example**:
See `docs/BGAI-0005_mobile-supabase-integration.md` for a complete example following this format.

## Project Structure & Module Organization
- `MVP.md` (root) captures the authoritative architecture and scope; move future design notes into `docs/`.
- `docs/` tracks numbered notes (`BGAI-0001_supabase.md` … `BGAI-0009_mobile-chat-history.md`) so agents can reference history quickly; review `BGAI-0009` before touching chat UX.
- `mobile/` hosts the Expo React Native client: `src/` (screens, hooks, localization), `assets/` (icons, rulebooks), and `__tests__/`.
- `backend/` contains the Python FastAPI service: `app/` (routers, adapters), `rag/` (chunkers, embeddings), `feature_flags/`, and `tests/`.
- `supabase/` stores SQL migrations plus seed YAML so dev/prod schemas stay aligned.
- Shared utilities belong in `scripts/` with cross-platform shims.

## Build, Test, and Development Commands
- `cd mobile && npm install && npx expo start` boots the mobile client with live reload.
- `cd mobile && npm run lint` runs Expo’s ESLint preset (autoconfigured in `eslint.config.js`); fix warnings before pushing.
- `cd backend && poetry install && poetry run uvicorn app.main:app --reload` starts the API facade/GenAI adapter.
- `cd backend && poetry run pytest` executes unit and integration tests, including RAG pipeline fakes.
- `supabase start` and `supabase db reset` spin up Postgres and reseed feature-flag fixtures before backend tests touching data.
- Use `supabase db reset && supabase db seed` when applying updates from `docs/BGAI-0001_supabase.md`, and run `supabase/create_test_users.sql` afterward if you need the role-scoped demo accounts described there.

- React Native uses TypeScript, 2-space indents, PascalCase components, camelCase hooks/utilities, and feature-scoped file names (`BGCGameList.tsx`). All user-facing copy must go through `useLanguage().t()` instead of hardcoded strings.
- Python backend code follows Black (88 chars), isort, and mypy; modules snake_case, Pydantic models PascalCase.
- Keep feature-flag configs declarative: YAML per environment under `backend/feature_flags/ENV.yaml`.

## Content & RAG Guardrails
- New board-game content always flows through Supabase: create/update `games`, `game_faqs`, and scope-specific `feature_flags` (roles + dev/prod) instead of hardcoding availability. Respect status flags (`active`, `beta`, `hidden`) so the client can gate rollouts.
- All BoardGameGeek syncs run server-side (see `MVP.md` §8). Use backend jobs or scripts to fetch XML, normalize fields, and update Supabase tables; mobile and admin tools must never hit BGG directly.
- Vector documents live in `game_docs_vectors`. Follow the ingestion rules from `MVP.md`: upload raw files to storage, chunk ~200–500 words, generate embeddings with the configured provider (`text-embedding-ada-002` by default), and capture metadata (language, source_type, page). Do not insert rows without populated embeddings.
- `POST /genai/query` (FastAPI) is the only entry point for AI answers. It enforces feature-flag checks, multi-language (ES/EN), session management (`chat_sessions`/`chat_messages`), and rate limits stored in feature-flag metadata (`daily_limit`). Keep any new logic compatible with this contract and update schemas if you need extra telemetry.
- `usage_events` already tracks `chat_question`, `chat_answer`, `game_open`, `faq_view`, etc. When adding analytics or admin flows, emit structured events (with `environment`) instead of ad-hoc logging so dashboards remain in sync.

## Testing Guidelines
- UI tests live next to components as `Component.test.tsx` using React Testing Library; snapshot only when UI stabilizes.
- Backend tests live in `backend/tests/` named `test_<module>.py`; mark slow BGG sync specs with `@pytest.mark.integration`.
- Target ≥80% coverage on backend and smoke-cover login, FAQ list, and chat flows before merging.
- Record manual device tests in the PR description (device, OS, Expo SDK).

## Commit & Pull Request Guidelines
- Use imperative, lower-case subjects as seen in history (`add README file to provide project overview`), adding scope where possible (`add auth router`).
- Reference issue IDs in the footer (`Refs #42`) and summarize user impact plus rollout steps.
- PRs must link to Supabase migration IDs, include screenshots for UI work, and list test commands/logs.
- Describe any new secrets or env vars and include rollback/flag plans for risky changes.

- Never embed secrets in Git; store keys in Supabase config and `.env.local` (gitignored).
- Treat feature flags as code: require review plus matching migrations for every change.
- Keep BGG sync jobs backend-only; the mobile client must consume cached data to avoid leaking API keys.
- When editing `supabase/migrations`, `supabase/seed.sql`, `supabase/create_test_users.sql`, or `supabase/config.toml`, align with the guardrails in `docs/BGAI-0001_supabase.md` so enums, RLS, and CLI ports remain consistent across environments.
- Respect the mobile localization state: `LanguageProvider` lives at the top of the tree. Any new screens/hooks must consume `useLanguage` for strings and for language-aware requests (e.g., FAQs, chat).
