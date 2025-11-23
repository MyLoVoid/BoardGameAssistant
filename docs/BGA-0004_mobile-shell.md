# BGA-0004:: Mobile Shell

## Overview

**Title**: Bootstrap Expo React Native client  
**Author**: Camilo Ramirez  
**Goal**: Provide a navigable shell so UI/UX teams and QA can exercise auth + navigation flows while backend endpoints are still landing.

## Summary

- Adds `mobile/` Expo project configured with TypeScript, Expo SDK 51, navigation, and Jest powered smoke tests.
- Implements global theming + layout primitives consistent with backend palette.
- Provides auth context that currently mocks Supabase sign-in but stores tokens with `expo-secure-store` so the wiring is ready for a real client.
- Stubs major screens (Auth, Home, Games, Chat, Profile) and navigators (auth stack, games stack, main tabs) reflecting MVP scope.
- Documents setup/run steps in `mobile/README.md` and ships placeholder icons/splash assets to unblock Expo.

## Key Files

- `mobile/app.json` — Expo config (slug, icons, env extras, Android package).
- `mobile/package.json` — Dependencies/scripts (Expo SDK 51, React Navigation, Jest).
- `mobile/src/App.tsx` — Entry point mounting providers + navigation.
- `mobile/src/context/AuthContext.tsx` — Mocked Supabase auth flow with SecureStore caching.
- `mobile/src/navigation/*` — Auth stack, games stack, and main tab navigator.
- `mobile/src/screens/*` — Placeholder UX for login, home, games list/detail, chat, and profile.
- `mobile/__tests__/App.test.tsx` — Smoke test verifying the auth screen renders.

## Follow-ups

1. Replace `mockSignIn/mockValidateToken` with Supabase JS client + backend `/auth/validate`.
2. Consume real backend data for games/FAQs via fetch hooks (after ABG-0005).
3. Introduce localization + theme tokens shared with the design system.
4. Wire feature-flag checks once backend exposes the evaluation endpoint.
