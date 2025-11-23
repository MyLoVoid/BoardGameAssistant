# BGAI-0002:: Backend Bootstrap

## Overview

**Pull Request**: Not provided (local request)
**Title**: Backend bootstrap & developer tooling
**Author**: Camilo Ramirez
**Target Branch**: Not provided

## Summary
- Scope: Scaffold the FastAPI backend (app skeleton, health endpoints, runtime config) plus local developer tooling.
- Expected outcome: Contributors can run `poetry install` + `python backend/run.py` using the shared `.env` template and hit `/docs`.
- Risk/Impact: Medium - first server commit defines lint/test baselines; misconfiguration could block future auth/RAG work.
- Adds environment template, project README, VS Code defaults, Ruff/Pylance setup, and root/backend `.gitignore` policies.
- Establishes standard dependency set (FastAPI, Supabase client, AI SDKs, LangChain, pgvector) pinned via Poetry.
- Exposes health/readiness endpoints with CORS configured off env vars to unblock Expo integration smoke tests.

## Project Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app factory, CORS, routers
│   ├── config.py          # Pydantic settings loader reading root .env
│   └── api/
│       └── routes/
│           └── health.py  # /health and /health/ready endpoints
├── pyproject.toml         # Poetry metadata, dependencies, tooling config
├── run.py                 # Uvicorn launcher honoring Settings values
└── .venv/ (Poetry)        # Local virtualenv created via poetry install
```

## Modified Files (Paths)
- `.env.example` — Module: `root` — add canonical environment template covering backend, Supabase, AI, rate-limit, and logging settings.
- `.gitignore`, `backend/.gitignore` — Module: `repo config` — expand ignored artifacts for Expo/Node, Python venvs, Supabase CLI, and backend-specific caches.
- `.vscode/settings.json` — Module: `tooling` — define workspace defaults (Poetry interpreter, Pylance, Ruff formatter, pytest discovery, env vars).
- `MVP.md` — Module: `docs` — refresh backend stack notes (Python 3.13+, Poetry, dependency list) and project status checklist.
- `backend/pyproject.toml` — Module: `backend` — declare Poetry package metadata, runtime deps, dev-tooling, Black/Ruff/PyTest/Mypy config.
- `backend/run.py` — Module: `backend` — add helper launcher that pulls host/port/log config from settings and starts uvicorn.
- `backend/app/config.py` — Module: `backend/app` — implement Pydantic `Settings` loader reading root `.env`, with typed accessors and helper properties.
- `backend/app/main.py`, `backend/app/api/routes/health.py`, `backend/app/api/dependencies.py` — Module: `backend/app` — bootstrap FastAPI app, CORS middleware, root + health endpoints, and shared auth header dependency.
- `backend/README.md` — Module: `backend` — document stack, requirements, setup commands, testing, and roadmap for subsequent backend features.

## Detailed Changes

### FastAPI Application Skeleton
- Created `app/main.py` to build the FastAPI instance with dynamic docs URLs, register CORS middleware driven by settings, and expose the root endpoint plus startup/shutdown logs referencing Supabase and CORS config.
- Added `app/api/routes/health.py` delivering `/health` and `/health/ready` endpoints returning status/environment metadata and future Supabase/DB readiness placeholders.
- Introduced `app/api/dependencies.py` with a reusable `get_token_header` dependency enforcing `Bearer` tokens, centralizing auth header validation ahead of future secured routes.

### Configuration & Environment Management
- Implemented `app/config.py` using `BaseSettings`/`SettingsConfigDict` to read the root `.env`, define required Supabase/database fields, AI provider keys, RAG, rate limiting, CORS, and logging options, plus convenience properties (`cors_origins_list`, `is_development`, `is_production`).
- Added `.env.example` (root) capturing every expected variable with sensible defaults/comments for dev vs prod, ensuring new contributors can copy it to `.env`.
- Provided `backend/run.py` as the canonical dev entry point invoking uvicorn with host/port/reload/log level derived from `Settings`.

### Tooling, Dependencies, and Documentation
- Authored `backend/pyproject.toml` with Poetry metadata, runtime dependencies (FastAPI stack, Supabase client, AI SDKs, LangChain, pgvector, psycopg2, httpx, security packages) and dev dependencies (pytest stack, Black, Ruff, mypy). Configured Black (100 cols), pytest discovery, mypy, and Ruff (with UP035 ignored to allow `typing.List`).
- Added `.vscode/settings.json` forcing the Poetry venv interpreter, Ruff as formatter/fix-on-save, workspace-wide pytest settings, and search/file watcher exclusions for venv artifacts.
- Expanded root `.gitignore` and new `backend/.gitignore` to cover node_modules, Expo build artifacts, Python caches, Supabase CLI temp files, and backend env variations to prevent accidental commits.
- Published `backend/README.md` detailing the stack, directory layout, prerequisites, install/run/test instructions, linters, troubleshooting steps, and roadmap for auth/games/RAG/analytics phases.
- Updated `MVP.md` to reflect the backend progress (Python 3.13+, Poetry, dependency specifics, progress checklist showing backend setup at 80%).

## Follow-ups / Testing
- Implement Supabase auth middleware, JWT parsing, and `/auth/me` once Supabase client wiring lands; extend readiness probe with actual service checks.
- Flesh out domain routers (`auth`, `games`, `genai`) plus data/service layers (Supabase client, RAG pipeline, analytics logging) scaffolded in the README tree.
- Add automated tests (pytest + httpx client) for health endpoints, config parsing, and future secured routes; integrate Ruff/Black/mypy into CI.

## END
End of Technical Documentation for BGAI-0002 - GitHub Copilot
