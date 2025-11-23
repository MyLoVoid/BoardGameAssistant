# BGAI-0005:: Mobile Supabase Integration

## Overview

**Title**: Integrate real Supabase authentication in mobile app
**Author**: Camilo Ramirez
**Goal**: Replace mock authentication with real Supabase client and backend integration for sign in, sign up, and user profile management.

## Summary

- Adds `@supabase/supabase-js` dependency to mobile app for real authentication.
- Creates Supabase client configuration using local dev environment (`http://127.0.0.1:54321`).
- Implements real auth service replacing mock functions with Supabase sign in, sign up, and session management.
- Integrates with backend `/auth/me` endpoint to fetch user roles and complete profile after authentication.
- Updates `AuthContext` to use real Supabase sessions with automatic token refresh and persistence via AsyncStorage.
- Implements fully functional sign-up screen with name, email, and password fields.

## Key Files

### New Files
- `mobile/src/config/env.ts` — Environment configuration with Supabase URLs and keys (dev/prod).
- `mobile/src/services/supabase.ts` — Supabase client singleton with AsyncStorage persistence.
- `mobile/src/services/auth.ts` — Real auth service with `signIn()`, `signUp()`, `signOut()`, `validateSession()`, and `getUserProfile()`.

### Modified Files
- `mobile/package.json:20` — Added `@supabase/supabase-js@^2.39.0` dependency.
- `mobile/src/context/AuthContext.tsx:5,45,51,56` — Replaced mock auth with real Supabase service calls, added `signUp()` method, improved session validation.
- `mobile/src/screens/auth/SignInScreen.tsx:16-17` — Cleared default test credentials.
- `mobile/src/screens/auth/SignUpScreen.tsx:14-99` — Implemented full registration form with real Supabase integration.

## Detailed Changes

### Configuration & Setup
- **Environment Config** (`env.ts`): Stores Supabase URL and anon key for dev (localhost:54321) and prod (placeholder).
- **Supabase Client** (`supabase.ts`): Creates singleton client configured with AsyncStorage for session persistence and auto-refresh.

### Authentication Flow
1. **Sign In**: `signIn(email, password)` → Supabase auth → Backend `/auth/me` → Returns user with role.
2. **Sign Up**: `signUp(email, password, fullName)` → Supabase registration → Backend `/auth/me` → Auto sign-in.
3. **Session Validation**: `validateSession()` → Checks Supabase session → Refreshes token if needed → Fetches profile.
4. **Sign Out**: `signOut()` → Clears Supabase session → Removes local storage.

### Backend Integration
- All auth methods call backend's `/auth/me` endpoint to fetch user profile including role.
- Token from Supabase is sent as `Authorization: Bearer <token>` header.
- User role comes from backend, not Supabase, maintaining authorization logic on server.

### Session Persistence
- Sessions stored in AsyncStorage via Supabase client.
- Auto-refresh enabled for seamless token renewal.
- `bootstrapAsync()` in AuthContext validates session on app start.

## Testing Notes

**Prerequisites**:
1. Supabase local running: `npx supabase status`
2. Backend API running on port 8000
3. Mobile dependencies installed: `cd mobile && npm install`

**Test Scenarios**:
- ✅ Sign up new user → Creates account in Supabase → Auto sign-in → Fetches role from backend
- ✅ Sign in existing user → Validates credentials → Fetches profile with role
- ✅ Session persistence → Close/reopen app → User remains signed in
- ✅ Sign out → Clears session → Returns to login screen
- ✅ Token refresh → Session auto-refreshes when token expires

## Follow-ups

1. Add error handling for network failures and improve user feedback.
2. Implement forgot password flow using Supabase password reset.
3. Add email confirmation flow if required for production.
4. Create feature flag checks after sign-in to control app section access.
5. Add loading states and better validation to sign-up form.
6. Implement profile editing functionality.

## Related Documentation

- `BGAI-0001_supabase.md` — Supabase schema and user profiles table
- `BGAI-0003_authentication.md` — Backend authentication endpoints
- `BGAI-0004_mobile-shell.md` — Mobile app navigation and auth context foundation
