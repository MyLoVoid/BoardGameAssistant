# BGAI-0013:: Dark Mode Support

## Overview

**Pull Request**: _pending (branch `copilot/add-dark-mode-admin-portal`)_  
**Title**: Add dark/light/system theme toggle to admin portal  
**Author**: Camilo Ramirez  
**Target Branch**: dev

## Summary
Scope: Implements theme infrastructure (light/dark/system) plus documentation updates for the admin portal UI.  
Expected outcome: Admin users can switch themes via the header toggle; preference persists and all shared UI components honor the palette.  
Risk/Impact: Medium – touches global styling, Tailwind config, layout provider, and shared components; visual regressions possible without full UI QA.  
- Adds `ThemeProvider`, toggle component, and CSS variable palettes.  
- Updates layout shell, cards, badges, tabs, and alerts to consume tokens.  
- Refreshes README files and BGAI-0011 doc with implementation details and usage guidance.  
- Linting currently blocked on Windows by `next lint` CLI bug; run from WSL/macOS or add explicit ESLint config before release.

## Modified Files (Paths)
- **README.md** (root) – document high-level dark-mode availability in the architecture summary.  
- **admin-portal/README.md** – add feature description, usage steps, and theme token reference.  
- **admin-portal/app/globals.css** – define light/dark CSS variable sets and apply theme-aware base styles.  
- **admin-portal/app/layout.tsx** – wrap App Router with the new `ThemeProvider` and enable hydration warning suppression.  
- **admin-portal/components/games/documents-tab.tsx** – replace hardcoded Tailwind colors with semantic tokens for alerts and badges.  
- **admin-portal/components/games/game-info-tab.tsx** – same token alignment for success/error banners.  
- **admin-portal/components/layout/header.tsx** – surface the theme toggle next to the user menu.  
- **admin-portal/components/ui/badge.tsx** – add `success`/`warning` variants mapped to token colors.  
- **admin-portal/components/ui/theme-toggle.tsx** (new) – icon button cycling light/dark/system with accessibility copy.  
- **admin-portal/lib/theme-context.tsx** (new) – context + hook persisting preference and reacting to `prefers-color-scheme`.  
- **admin-portal/tailwind.config.ts** – enable `darkMode: 'class'` and expose new semantic color tokens.  
- **docs/BGAI-0011_admin-portal-frontend.md** – append BGAI-0013 addendum describing architecture, palette, and accessibility.

## Detailed Changes

### Theme Infrastructure
- Introduced `ThemeProvider` (`admin-portal/lib/theme-context.tsx`) storing `theme` (light/dark/system) and derived `effectiveTheme`; syncs with `localStorage` and OS preference via `matchMedia`.  
- Added `ThemeToggle` UI control that mounts safely client-side, cycles modes, and exposes ARIA labels (sun/moon/monitor icons).  
- Wrapped the entire portal in the provider via `app/layout.tsx` and set `suppressHydrationWarning` to avoid mismatches when the DOM class changes before hydration.

### Styling & Tokens
- Declared CSS variable palettes in `app/globals.css` for both themes, including semantic tokens (`--success`, `--warning`) and applied them through Tailwind base layer (`bg-background`, `text-foreground`).  
- Converted Tailwind config to `darkMode: 'class'` and mapped utilities (`background`, `card`, `border`, `success`, etc.) to the CSS variables so every component inherits theme values.  
- Updated badges, alert banners, and callouts in `documents-tab.tsx`/`game-info-tab.tsx` to use `bg-success/10`, `text-success`, or other tokenized classes instead of static `bg-green-50`/`text-red-600` combinations.

### Layout & Component Touches
- Inserted the toggle button in `components/layout/header.tsx`, keeping the existing user info + sign-out actions.  
- Ensured cards, modals, and list items rely on tokenized classes so both light and dark backgrounds read correctly.  
- Verified badges now provide `success`, `warning`, and `destructive` variants tied to semantic colors for consistent status chips across tabs.

### Documentation
- Root `README.md` describes the admin portal’s dark-mode toggle alongside other architecture notes.  
- `admin-portal/README.md` gained a dedicated “Dark Mode” section (modes, usage steps, token list) to guide operators and devs.  
- `docs/BGAI-0011_admin-portal-frontend.md` includes an “Update: Dark Mode Support (BGAI-0013)” section summarizing implementation, palette, affected files, and accessibility considerations.

## Testing Notes
- Attempted `npm run lint` inside `admin-portal`, but Next 16 on Windows resolves the path incorrectly (`Invalid project directory ... admin-portal\lint`). Requires running from WSL/macOS or adding an explicit `eslint.config.js` + direct `eslint` script before CI can validate.  
- Manual UI verification (desktop/mobile) still pending; capture screenshots for the PR to prove parity across themes.

## Open Questions / Follow-ups
1. Decide whether to migrate to the new `eslint.config.js` format so `eslint` can run without Next’s wrapper (workaround for Windows CLI issue).  
2. Consider persisting theme preference server-side once Supabase profiles expose user settings to share the selection across browsers.  
3. Add automated visual or unit tests (e.g., ThemeProvider hook) once linting is unblocked to prevent regressions.

## END
End of Technical Documentation for BGAI-0013 - GitHub Copilot
