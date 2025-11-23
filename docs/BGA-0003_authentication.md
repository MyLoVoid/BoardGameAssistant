# BGA-0003:: Supabase Authentication

## Overview

**Pull Request**: Not provided (local request)
**Title**: Implement Supabase-backed auth endpoints
**Author**: Camilo Ramirez
**Target Branch**: Not provided

## Summary
- Scope: Wire FastAPI to Supabase auth, expose `/auth/*` endpoints, and add profile-aware role checks.
- Expected outcome: Mobile/web clients can validate tokens and fetch user profiles via backend instead of calling Supabase directly.
- Risk/Impact: Medium – JWT validation bugs or incorrect role enforcement could block sign-ins; relies on Supabase secrets.
- Adds router wiring, Pydantic schemas, and Supabase service helpers for profile retrieval.
- Implements reusable `require_role` dependency to guard privileged routes.
- Ships pytest integration covering `/auth/me`, `/auth/validate`, `/auth/admin-only`, and failure paths.

## Modified Files (Paths)
- `backend/app/main.py` — Module: `backend/app` — register new auth router with CORS-configured app shell.
- `backend/app/api/routes/auth.py` — Module: `backend/app/api/routes` — define `/auth` endpoints (profile, role, validate, admin-only).
- `backend/app/core/auth.py` — Module: `backend/app/core` — implement JWT decoding, Supabase profile lookup, and role guard dependency.
- `backend/app/models/schemas.py` — Module: `backend/app/models` — add `UserProfile`, `AuthenticatedUser`, `TokenPayload`, and shared error/success responses.
- `backend/app/services/supabase.py` — Module: `backend/app/services` — provide cached Supabase client + `get_user_by_id` helper using service role key.
- `backend/tests/test_auth_endpoints.py` — Module: `backend/tests` — integration tests hitting real Supabase dev stack for auth flows.

## Detailed Changes

### FastAPI Surface & Routing
- `app/main.py` imports the auth router and mounts it under `/auth` while keeping health routes separate.
- CORS middleware leverages settings-derived origin list so Expo/web clients can call the new endpoints in dev.

### Authentication Router (`/auth`)
- `/auth/me` returns full `UserProfile` using the authenticated user dependency; 401/404 responses documented via Pydantic models.
- `/auth/me/role` returns a compact `{user_id, role}` payload for quick gate checks.
- `/auth/validate` verifies the token’s signature/audience and echoes validity plus basic claims.
- `/auth/admin-only` showcases `require_role` usage by restricting to `admin` or `developer`, responding with contextual data on success.

### Core Auth Logic
- `app/core/auth.py` decodes Supabase-issued JWTs with `HS256`, enforcing `aud="authenticated"` and surfacing explicit HTTP errors for expired or mis-targeted tokens.
- `get_current_user` now fetches the associated profile via Supabase service APIs and hydrates an `AuthenticatedUser` model.
- `require_role` factory emits FastAPI dependencies that 403 when the caller’s role is not in the allowed set, enabling reuse across routers.

### Models & Supabase Service
- `app/models/schemas.py` introduces strongly typed models (`UserProfile`, `AuthenticatedUser`, `TokenPayload`, `ErrorResponse`, `SuccessResponse`) to keep responses consistent and documented.
- `app/services/supabase.py` creates cached clients (service and admin) and a `get_user_by_id` helper that reads the `profiles` table with `maybe_single()` to gracefully handle missing rows.

### Testing
- `backend/tests/test_auth_endpoints.py` spins up `TestClient(app)` and authenticates using real Supabase fixtures (`admin@bgai.test`, `basic@bgai.test`).
- Tests cover happy-path profile fetch, validate endpoint, role-protected admin route, missing token rejection, and expired token handling.

## Follow-ups / Testing
- Document required Supabase fixtures (seed SQL) in README so new contributors can run the integration tests locally.
- Add negative tests for invalid audiences and tampered tokens once mocking utilities are in place.
- Consider caching Supabase profile responses or adding tracing once auth traffic increases.

## END
End of Technical Documentation for BGA-0003 - GitHub Copilot
