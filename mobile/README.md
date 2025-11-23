## BGAI Mobile Shell (ABG-0004)

React Native + Expo client that consumes the FastAPI backend and Supabase auth. This iteration only sets up the navigation/auth shell so Expo can run locally while backend teams continue adding endpoints.

### Requisitos

- Node.js 20.x + npm 10.x
- Expo CLI (`npm install -g expo-cli`) opcional, `npx expo` también funciona
- Supabase CLI (solo si quieres probar login real a futuro)

### Scripts

```bash
cd mobile
npm install
npm run start      # expo start
npm run android    # lanza emulador Android
npm run ios        # usa simulador iOS (macOS)
npm test           # jest-expo
```

### Estructura

```
mobile/
├── assets/               # logos genéricos (reemplazar cuando haya branding)
├── src/
│   ├── App.tsx           # Providers + NavigationContainer
│   ├── navigation/       # Stack/tabs para auth y contenido
│   ├── screens/          # Auth, Home, Games, Chat, Profile
│   ├── context/          # AuthProvider (token mock)
│   ├── hooks/            # useAuth
│   ├── services/         # Cliente API (mock provisional)
│   └── data/             # Juegos seed para UI
└── __tests__/            # Pruebas smoke con Testing Library
```

### Variables de entorno

La app lee `expo.extra.apiUrl` desde `app.json` (o `app.config.ts` si se migra) para apuntar al backend FastAPI (`http://localhost:8000` por defecto). Ajusta ese valor cuando despliegues en dev/staging/prod.

### Próximos pasos (cliente)

1. Sustituir `mockSignIn` por Supabase JS client (`@supabase/supabase-js`) y usar `SecureStore` para tokens.
2. Conectar `/auth/me` del backend para refrescar perfil/roles y bloquear features vía feature flags.
3. Consumir los endpoints reales de juegos/FAQs cuando ABG-0005 esté listo.
4. Añadir traducciones y assets definitivos en `assets/`.
