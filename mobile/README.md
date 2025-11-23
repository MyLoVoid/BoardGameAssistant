## BGAI Mobile App

Expo + React Native client with real Supabase auth, games UI, and bilingual selector.

### Requisitos

- Node.js 20.x + npm 10.x
- `npx expo` (CLI global opcional)
- Supabase CLI (para correr `supabase start`)

### Scripts

```bash
cd mobile
npm install
npx expo start           # bundler
npm run android          # expo start --android
npm run ios              # requiere macOS
npm test                 # jest-expo
npm run lint             # ESLint (config auto Expo)
```

### Estructura

```
mobile/
├── assets/                 # icon/splash placeholders
├── src/
│   ├── App.tsx             # AuthProvider + LanguageProvider + NavigationContainer
│   ├── localization/       # translations.ts
│   ├── context/            # AuthContext, LanguageContext
│   ├── hooks/              # useAuth, useGames, useGameDetail
│   ├── services/           # Supabase client, auth service, gamesApi
│   ├── navigation/         # Auth stack + tabs + games stack
│   ├── screens/            # Auth, Home, Games, Chat, Profile, etc.
│   └── components/         # Button, EmptyState, LanguageSelector, etc.
└── __tests__/              # Jest Expo smoke tests
```

### Variables de entorno

- `.env` (raíz) define Supabase local/backend (compartido con backend).
- `mobile/.env`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321   # cambiar según entorno
  EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
  EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000
  ```
  Usa `10.0.2.2` en emulador Android, `127.0.0.1` en iOS Simulator, o tu IP LAN en dispositivos físicos.

### Flujo actual (nov-2025)

- ✅ Login/sign-up reales con Supabase (BGAI-0005).
- ✅ Consumo real de `GET /games`, `GET /games/{id}`, `GET /games/{id}/faqs` con feature flags (BGAI-0007).
- ✅ Selector de idioma persistente (ES/EN) que refresca UI y FAQs en caliente (BGAI-0008).
- 🔄 Próximo: conectar `POST /genai/query` para chat IA cuando el backend libere el endpoint.

### Notes

- Usa `useLanguage().t()` para cualquier texto UI nuevo.
- Hooks que llamen APIs dependientes del idioma deben escuchar `language` en sus deps.
- Mantén `npm run lint` limpio; Expo autoinstaló `eslint@^9` + `eslint-config-expo`.
