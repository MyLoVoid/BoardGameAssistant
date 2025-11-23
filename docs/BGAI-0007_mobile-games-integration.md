# BGAI-0007: Mobile Games Backend Integration

## Overview

**Title**: Integrate mobile app with games backend endpoints
**Author**: Claude Code
**Date**: 2025-01-23
**Goal**: Connect React Native mobile app with backend REST API to display real games data and FAQs instead of mocks.

## Summary

This implementation replaces mock data in the mobile app with real backend integration:

- Created TypeScript types matching backend API models
- Implemented HTTP client service for games endpoints
- Created custom React hooks (`useGames`, `useGameDetail`) with loading/error states
- Updated `GameListScreen` to display real games from `GET /games`
- Updated `GameDetailScreen` to display game details and FAQs from `GET /games/{id}` and `GET /games/{id}/faqs`
- Enhanced `EmptyState` component with action button support
- Added success/warning colors to theme

## Key Files

### New Files

- `mobile/src/types/games.ts` (96 lines) - TypeScript types for games API (GameListItem, Game, GameFAQ, responses)
- `mobile/src/services/gamesApi.ts` (115 lines) - HTTP client for games endpoints
- `mobile/src/hooks/useGames.ts` (58 lines) - Hook for fetching games list
- `mobile/src/hooks/useGameDetail.ts` (93 lines) - Hook for fetching game details and FAQs

### Modified Files

- `mobile/src/screens/games/GameListScreen.tsx` - Replaced mocks with `useGames()` hook, added loading/error states
- `mobile/src/screens/games/GameDetailScreen.tsx` - Replaced mocks with `useGameDetail()` hook, displays real FAQs
- `mobile/src/components/EmptyState.tsx` - Added optional action button (actionText, onAction props)
- `mobile/src/constants/theme.ts` - Added success, successMuted, warning colors

## Detailed Changes

### 1. TypeScript Types (`types/games.ts`)

Created types matching backend Pydantic models from `backend/app/models/schemas.py`:

**Core Types:**
- `GameStatus` - 'active' | 'beta' | 'hidden'
- `Language` - 'es' | 'en'
- `GameListItem` - Simplified game for lists
- `Game` - Complete game model
- `GameFAQ` - FAQ with multi-language support

**API Response Types:**
- `GamesListResponse` - { games: GameListItem[], total: number }
- `GameDetailResponse` - { game: Game, has_faq_access: boolean, has_chat_access: boolean }
- `GameFAQsResponse` - { faqs: GameFAQ[], game_id: string, language: Language, total: number }
- `APIError` - { detail: string, error_code?: string }

### 2. Games API Service (`services/gamesApi.ts`)

HTTP client for backend games endpoints with token-based authentication:

**Functions:**
- `getGames(token, statusFilter?)` - Fetches games list
  - Calls `GET /games?status_filter=active`
  - Returns GamesListResponse

- `getGameDetail(token, gameId)` - Fetches game details
  - Calls `GET /games/{gameId}`
  - Returns GameDetailResponse with feature access flags

- `getGameFAQs(token, gameId, language)` - Fetches FAQs
  - Calls `GET /games/{gameId}/faqs?lang=es`
  - Returns GameFAQsResponse with actual language used (fallback support)

**Features:**
- Creates Authorization header: `Bearer {token}`
- Handles HTTP errors and returns meaningful error messages
- Uses config.backendUrl from env.ts (http://127.0.0.1:8000)

### 3. Custom Hooks

#### `useGames(statusFilter?)`

Fetches games list from backend with React state management:

**State:**
- `games: GameListItem[]` - List of games
- `isLoading: boolean` - Loading indicator
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh function

**Features:**
- Automatically fetches on mount
- Refetches when statusFilter or auth token changes
- Only fetches if user is authenticated
- Handles loading and error states
- Pull-to-refresh support via refetch()

#### `useGameDetail(gameId, language?)`

Fetches game details and FAQs from backend:

**State:**
- `game: Game | null` - Game details
- `faqs: GameFAQ[]` - List of FAQs
- `hasFaqAccess: boolean` - FAQ access flag from backend
- `hasChatAccess: boolean` - Chat access flag from backend
- `isLoading: boolean` - Loading indicator
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh function

**Features:**
- Fetches game details first
- Conditionally fetches FAQs if user has access
- Handles FAQ fetch errors gracefully (non-critical)
- Refetches when gameId or language changes
- Language defaults to 'es'

### 4. Updated Screens

#### `GameListScreen`

**Before:** Used `mockGames` array and client-side role filtering

**After:**
- Uses `useGames()` hook for real backend data
- Shows loading spinner while fetching
- Shows error state with retry button
- Pull-to-refresh support via RefreshControl
- Uses real field names from backend (name_base, min_players, etc.)
- Shows "BETA" badge for beta games
- Empty state for no accessible games

**State Flow:**
1. Component mounts
2. `useGames()` auto-fetches with auth token
3. Loading state → Shows ActivityIndicator
4. Success → Displays games in FlatList
5. Error → Shows EmptyState with retry button
6. User pulls to refresh → Calls refetch()

#### `GameDetailScreen`

**Before:** Used `mockGames.find()` and placeholder FAQ message

**After:**
- Uses `useGameDetail(gameId, language)` hook
- Shows loading spinner while fetching
- Displays real game info (players, time, rating, status)
- Displays FAQs in language-specific cards
- Shows language used in section title (ES/EN)
- Shows access-based UI:
  - If `hasFaqAccess` → Shows FAQs or empty state
  - If no access → Shows "FAQs no disponibles" message
  - If `hasChatAccess` → Shows "acceso al chat" info card
- Empty state for no FAQs in requested language
- Error state with retry button

**State Flow:**
1. Component mounts with gameId from route params
2. `useGameDetail()` auto-fetches game + FAQs
3. Loading state → Shows ActivityIndicator
4. Success → Displays game details and FAQs
5. Error → Shows EmptyState with retry button

### 5. Enhanced Components

#### `EmptyState` Component

**Added Props:**
- `actionText?: string` - Button label (e.g., "Reintentar")
- `onAction?: () => void` - Button callback

**Before:**
```tsx
<EmptyState title="Error" description="Something went wrong" />
```

**After:**
```tsx
<EmptyState
  title="Error al cargar"
  description="No se pudieron cargar los juegos"
  actionText="Reintentar"
  onAction={refetch}
/>
```

**Styling:**
- Button with primary color background
- Centered layout
- Conditional rendering (only shows if both props provided)

### 6. Theme Updates

Added colors for success and warning states:

```typescript
success: '#34D399',      // Green for success messages
successMuted: '#065F46', // Dark green for success backgrounds
warning: '#FBBF24',      // Amber for warning/beta badges
```

## Integration Flow

### Games List Flow

```
User opens Games tab
  ↓
GameListScreen renders
  ↓
useGames() hook initializes
  ↓
Checks AuthContext for token
  ↓
Calls gamesApi.getGames(token)
  ↓
Sends GET /games with Authorization header
  ↓
Backend validates token, checks feature flags
  ↓
Returns filtered games list
  ↓
Hook updates state: games, isLoading=false
  ↓
FlatList renders real games
  ↓
User taps game → Navigate to GameDetail
```

### Game Detail Flow

```
User taps game from list
  ↓
Navigate to GameDetailScreen with gameId
  ↓
useGameDetail(gameId, 'es') hook initializes
  ↓
Checks AuthContext for token
  ↓
Calls gamesApi.getGameDetail(token, gameId)
  ↓
Sends GET /games/{id} with Authorization header
  ↓
Backend returns game + access flags
  ↓
Hook updates state: game, hasFaqAccess, hasChatAccess
  ↓
If hasFaqAccess → Calls gamesApi.getGameFAQs(token, gameId, 'es')
  ↓
Sends GET /games/{id}/faqs?lang=es
  ↓
Backend returns FAQs (or fallback to EN)
  ↓
Hook updates state: faqs, isLoading=false
  ↓
Screen renders game info + FAQs
```

## Error Handling

**Network Errors:**
- Caught by try/catch in hooks
- Error message extracted from backend response or generic "Failed to load"
- Displayed in EmptyState with retry button

**Authentication Errors:**
- If no token: Shows "No authentication token" error
- If 401: Backend returns "Missing authorization header" → Displayed to user
- If 403: Backend returns "Access forbidden" → Displayed to user

**Not Found Errors:**
- If 404: Backend returns "Game not found or you don't have access"
- Hook sets error state
- EmptyState with retry button shown

**FAQ Errors:**
- Non-critical (game details still shown)
- Logged to console with console.warn()
- Empty FAQs array set
- "No hay FAQs disponibles" message shown

## Testing Instructions

### Prerequisites

1. **Backend running:**
   ```bash
   cd backend
   poetry run uvicorn app.main:app --reload
   ```

2. **Supabase local running:**
   ```bash
   npx supabase status
   # Should show API URL: http://127.0.0.1:54321
   ```

3. **Test users created:**
   ```bash
   cat supabase/create_test_users.sql | docker exec -i supabase_db_boardgameassistant-dev psql -U postgres postgres
   ```

4. **Mobile app dependencies installed:**
   ```bash
   cd mobile
   npm install
   ```

### Manual Testing

1. **Start mobile app:**
   ```bash
   cd mobile
   npm start
   ```

2. **Test Scenarios:**

   **Login Flow:**
   - Sign in with `basic@bgai.test` / `Basic123!`
   - Navigate to Games tab
   - Should see 5 active games from backend
   - Pull to refresh → Should reload games

   **Games List:**
   - Verify games show real names (Gloomhaven, Terraforming Mars, etc.)
   - Verify rating displays correctly (e.g., BGG 8.70)
   - Verify player counts and playing time shown
   - No "BETA" badges for basic user (only sees active games)

   **Game Detail:**
   - Tap on "Gloomhaven"
   - Should show game details with BGG ID
   - Should show "Preguntas Frecuentes (ES)" section
   - Should display 3 Spanish FAQs
   - FAQs should have question in purple and answer in white
   - Should show "✅ Tienes acceso al chat" card

   **Tester Role:**
   - Sign out
   - Sign in with `tester@bgai.test` / `Test123!`
   - Navigate to Games tab
   - Should see active + beta games (if any)
   - Verify "BETA" badge shows for beta games

   **Error Handling:**
   - Stop backend server
   - Pull to refresh on Games tab
   - Should show error state with "Reintentar" button
   - Tap "Reintentar" → Should retry fetch

### Expected API Calls

When viewing games list:
```
GET http://127.0.0.1:8000/games
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "games": [
    {
      "id": "uuid",
      "name_base": "Gloomhaven",
      "thumbnail_url": null,
      "min_players": 1,
      "max_players": 4,
      "playing_time": 120,
      "rating": 8.7,
      "status": "active"
    },
    ...
  ],
  "total": 5
}
```

When viewing game detail:
```
GET http://127.0.0.1:8000/games/{gameId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "game": { ... },
  "has_faq_access": true,
  "has_chat_access": true
}

GET http://127.0.0.1:8000/games/{gameId}/faqs?lang=es
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response 200:
{
  "faqs": [ ... ],
  "game_id": "uuid",
  "language": "es",
  "total": 3
}
```

## Performance Considerations

**Caching:**
- Currently no caching implemented (each navigation refetches)
- Future: Add React Query or SWR for automatic caching and revalidation

**Network Calls:**
- GameDetailScreen makes 2 API calls (game + FAQs)
- Calls are sequential (FAQs only if has_faq_access)
- Both use same auth token (no extra auth calls)

**Loading States:**
- Shows spinner only on initial load
- Pull-to-refresh shows native RefreshControl spinner
- Maintains previous data during refresh (good UX)

## Security Considerations

**Token Handling:**
- Token obtained from AuthContext (stored in SecureStore)
- Sent via Authorization header (never in URL)
- Token validation happens on backend (server-side)

**Access Control:**
- All access control enforced server-side via feature flags
- Mobile app shows/hides UI based on backend response flags
- Cannot bypass access restrictions from client

**Error Messages:**
- Generic errors for unauthorized access (don't reveal system details)
- 404 for both "not found" and "no access" (prevents enumeration)

## Follow-Ups

1. ⏳ Add React Query for caching and automatic background refetch
2. ⏳ Implement language selection (i18n) for FAQ language parameter
3. ⏳ Add image loading for game thumbnails (when backend provides URLs)
4. ⏳ Implement chat screen to consume `POST /genai/query` endpoint
5. ⏳ Add pull-to-refresh to GameDetailScreen
6. ⏳ Add optimistic updates (show loading state while refetching)
7. ⏳ Add analytics tracking (game views, FAQ views)
8. ⏳ Add offline support (cache last fetched data)

## Related Documentation

- `BGAI-0005_mobile-supabase-integration.md` - Authentication setup
- `BGAI-0006_games-endpoints.md` - Backend API implementation
- `CLAUDE.md` - Feature flag architecture
- `MVP.md` - Progress tracking

## Summary of Changes

**Lines of Code:**
- New files: ~362 lines (types + service + hooks)
- Modified files: ~250 lines (screens + components)
- **Total:** ~612 lines

**Files Created:** 4
**Files Modified:** 4
**API Endpoints Integrated:** 3
**Custom Hooks:** 2

## Conclusion

The mobile app now successfully integrates with the backend API to display real games and FAQs. Users can:

- Browse games with proper access control
- View detailed game information
- Read multi-language FAQs with automatic fallback
- See their feature access status (FAQ, chat)
- Refresh data with pull-to-refresh
- Retry on errors

The implementation follows React best practices with custom hooks, proper loading/error states, and clean separation of concerns. The app is ready for the next step: implementing the AI chat feature using the `POST /genai/query` endpoint.
