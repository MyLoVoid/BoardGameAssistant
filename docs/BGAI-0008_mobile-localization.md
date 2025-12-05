# BGAI-0008:: Mobile Localization

## Overview

**Task**: Enable dynamic language selection across the mobile client  
**Author**: Codex (pairing with Camilo Ramírez)  
**Context**: Replaces hardcoded Spanish strings with a reusable localization system so the BGAI app can switch between Spanish and English at runtime while querying FAQs in the chosen language.

## Summary

- Introduced a lightweight i18n layer (`LanguageProvider`, `useLanguage`, translation catalog) with persistence via AsyncStorage.
- Added a language selector UI in the Profile tab so users can toggle between ES/EN; choice propagates instantly through the app.
- Replaced literal strings in auth, home, games, chat, tabs, and navigator headers with translation keys; ensured FAQ requests use the selected language.
- Cleaned up supporting components (TextField display name, mock array types) and configured Expo’s ESLint default for consistent linting.
- Validated linting via `npm run lint` to confirm the new code meets project standards.

## Modified Files

- `mobile/src/App.tsx` — Wraps the navigation tree with `LanguageProvider`.
- `mobile/src/context/AuthContext.tsx` — Removes unused `AuthUser` import after refactor.
- `mobile/src/hooks/useGames.ts`, `mobile/src/hooks/useGameDetail.ts` — Consume `useLanguage` for localized errors and to forward the FAQ language parameter.
- `mobile/src/navigation/MainTabs.tsx`, `mobile/src/navigation/AuthNavigator.tsx`, `mobile/src/navigation/GamesNavigator.tsx` — Localize tab titles, headers, and reuse translation keys.
- `mobile/src/screens/**/*.tsx` — Auth, Home, Games list/detail, Chat, Profile screens migrated to `t()`; Profile hosts the new selector.
- `mobile/src/services/gamesApi.ts` — Removes debug logging now that hooks handle errors and localization.
- `mobile/src/components/TextField.tsx`, `mobile/src/data/mockGames.ts` — ESLint fixes (display name, array typing).
- `mobile/package.json`, `mobile/eslint.config.js` — Expo lint auto-configured ESLint and the accompanying flat config.

### New Files

- `mobile/src/localization/translations.ts` — Canonical ES/EN dictionaries plus locale types.
- `mobile/src/context/LanguageContext.tsx` — Language provider, persistence logic, and translation helper.
- `mobile/src/components/LanguageSelector.tsx` — UI control to toggle languages.
- `docs/BGAI-0008_abf-0007-mobile-localization.md` — This document.

## Detailed Changes

### Localization Infrastructure
- Created translation catalog with mirrored keys for English and Spanish, covering common phrases, navigation labels, and contextual strings (`translations.ts`).
- Implemented `LanguageProvider` that hydrates from `AsyncStorage`, exposes `language`, `setLanguage`, and `t()` for key interpolation, and persists selections.
- Added `LanguageSelector` pill buttons (ES/EN) that call `setLanguage()`; styled for clarity and reusability.
- Wrapped the entire app in `LanguageProvider` so every screen, hook, and navigator can access `useLanguage()` without prop drilling.

### UI Integration
- Home screen now renders CTAs and section cards via translations, eliminating duplicated “Board Game Companion” entries.
- Sign-in/up/forgot-password screens reuse auth keys for labels, subtitles, and error fallbacks; navigator headers reflect the selected language.
- BGC stack and bottom tabs display localized titles; Game detail header updates to either the game name or the localized fallback.
- Games list/detail screens adopt localized copy (loaders, errors, FAQ headings, metrics) and display language-aware FAQ info.
- Profile tab shows localized metadata and the language selector component so users can switch languages at any time.
- Chat screen rehydrates the assistant greeting and placeholder when the language changes, ensuring conversation starters remain consistent.

### Data & Hooks
- `useGames` reports missing-token and fetch errors via translation keys.
- `useGameDetail` removes the hardcoded `'es'` parameter, using the current locale when requesting `/games/{id}/faqs` and reloading automatically on switch.
- `gamesApi` cleanup removes temporary debug logs added during earlier troubleshooting.

### Tooling
- Running `npm run lint` triggered Expo’s automatic ESLint setup; the generated `eslint.config.js` plus new `eslint` dev dependency remain to enforce consistent linting in CI/local workflows.
- Fixed lint warnings introduced by the new config (TextField display name, array-type rule, hook dependencies).

## Testing

```
cd mobile
npm run lint
```

Manual verification:
1. Launch Expo (`npx expo start --android`), sign in, and navigate through Home → BGC → Game detail to confirm strings render in Spanish by default.
2. Open the Profile tab, toggle the language selector, and ensure:
   - Home CTA, navigation tabs, auth screen labels, chat placeholders, and game metadata update immediately.
   - Opening a game after switching languages refetches FAQs in the correct language and updates the FAQ heading badge.
3. Restart the app to confirm the language persists via AsyncStorage.

## Follow-ups

1. Extend translations to remaining components (e.g., future settings screens or error toasts) as they are implemented.
2. Consider pulling locale preference from backend profile to sync across devices.
3. Add automated tests for `LanguageProvider` and localized hooks once a testing scaffold for contexts is in place.
