# GitHub Copilot Instructions

## Product Context
- Build "Board Game Assistant Inteligent" (BGAI), a modular companion app for board games.
- Ship a cross-platform mobile client with React Native + Expo, a web admin portal with Next.js, backed by Supabase and a thin FastAPI layer that orchestrates GenAI providers.
- Support Android and iOS, Spanish and English, and run separate dev/prod environments.

## Core Functional Scope
- Implement authentication with Supabase email/password and expose role-based access (`admin`, `developer`, `basic`, `premium`, `tester`).
- Deliver the Board Game Companion (BGC) section: list games, surface game detail, FAQs, external BGG link, and a GenAI-powered chat per game.
- Model monetization as feature-access differences (no real payments in MVP) driven by roles, feature flags, and usage limits.
- Defer offline mode, but keep data access patterns and schemas ready for future caching.
- Provide a **web admin portal** (Next.js) for game onboarding, FAQ management, and document upload/processing (internal use only, roles: `admin`/`developer`).

## Architecture Expectations
- **Mobile Frontend**: keep client logic declarative; consume backend endpoints for data, flags, and analytics. Structure screens and hooks under `mobile/src` by feature (Auth, Navigation, BGC, Game detail).
- **Admin Portal**: Next.js app consuming `/admin/*` endpoints from FastAPI. Manages game onboarding from BGG, FAQs, and document uploads.
- **Supabase**: own authentication, relational data (users, sections, games, FAQs, feature_flags, chat history, usage_events), and document references in `game_documents`. Also provides Storage for PDFs.
- **Backend façade (FastAPI)**: enforce authZ, feature-flag checks, usage limits, BGG sync, analytics events, and the GenAI adapter RAG pipeline. Expose two API surfaces: public (`/games`, `/genai/query`) for mobile, and admin (`/admin/games`, `/admin/games/{id}/documents`, `/admin/games/{id}/process-knowledge`) for the portal.
- Never call BoardGameGeek or GenAI providers directly from the mobile client or admin portal; run all syncs and RAG orchestration server-side.

## Data Model Highlights
- Tables to reflect: `users`, `app_sections`, `games`, `game_faqs`, `feature_flags`, `chat_sessions`, `chat_messages`, `game_documents` (formerly `game_docs_vectors`), `usage_events`.
- **Key change**: Deprecate `game_docs_vectors` with embedded `chunk_text`/`embedding` columns. Replace with `game_documents` storing references to files uploaded to GenAI providers (OpenAI Files API, Gemini File API, Claude). Fields: `provider_name`, `provider_file_id`, `vector_store_id`, `status` (`pending`, `uploading`, `processing`, `ready`, `error`), `file_path` (Supabase Storage), `language`, `source_type`.
- Include language columns (`language`) where content is localized; default to Spanish with English fallback logic on the backend.
- Feature flags must capture `scope_type`, `scope_id`, `feature_key`, optional `role`, `environment`, and an `enabled` flag plus optional metadata JSON.

## GenAI & RAG Guidance (Updated Strategy)
- **Deprecated approach**: Self-hosted pgvector embeddings with `game_docs_vectors` table storing `chunk_text` + `embedding`.
- **New approach**: Delegate vectorization and search to GenAI provider native services:
  - **OpenAI**: Upload documents via Files API, create Vector Stores, use Assistants API with File Search tool.
  - **Gemini**: Upload documents via File API, use Grounding with Google Search for retrieval.
  - **Claude**: Upload context directly into prompts with Prompt Caching (no native vector store).
- The backend acts as an **orchestrator**:
  - Admin portal uploads PDFs to Supabase Storage.
  - Backend processes documents: uploads to provider, stores `provider_file_id`/`vector_store_id` in `game_documents`.
  - `/genai/query` endpoint queries the provider's File Search API with user question, retrieves context, and generates answer.
- The `/genai/query` endpoint validates auth, checks feature flags, manages chat sessions, logs usage, delegates search to the provider (filtering by `game_id` + `language`), calls the configured model, stores messages, and responds with answer plus optional citations/model info.
- Track provider/model name, session language, message counts, token estimates, and document references for analytics.

## Analytics & Telemetry
- Record usage via `usage_events` for key interactions (`game_open`, `faq_view`, `chat_question`, `chat_answer`).
- Ensure chat tables allow reporting on per-user, per-game, per-role trends.

## Development Priorities
- Document the finalized schema (fields, types, FKs, indexes) before implementation.
- Define REST endpoints (`/app/games`, `/app/games/{id}`, `/app/chat/session`, `/genai/query`) with explicit request/response contracts and error handling.
- Seed feature flags per environment to reflect role gating (e.g., `chat` enabled for basic/premium/tester, `score_helper` limited to tester in dev).
- Stand up Supabase dev/prod projects with consistent schema and credential management.

## Coding Conventions
- Follow TypeScript standards (2-space indent, PascalCase components) on the mobile app; adhere to Black + isort + mypy-ready Python on the backend.
- Keep features toggleable and data-driven; avoid hardcoding role logic or language-specific content into the client.
- Centralize analytics triggers in backend endpoints or explicit client calls so usage stays consistent across platforms.
