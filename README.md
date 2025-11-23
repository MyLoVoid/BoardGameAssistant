npx supabase start

cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd mobile && npx expo start --clear --android.

## Board Game Assistant Intelligent (BGAI)

App móvil + backend para asistir partidas de juegos de mesa con FAQs, chat IA y contenido curado.

### Arquitectura resumida

- **Mobile (Expo / React Native / TypeScript)**: cliente principal con login Supabase, sección BGC, selector de idioma ES/EN y consumo de los endpoints reales (`/auth`, `/games`, `/games/{id}`, `/games/{id}/faqs`). Todo el copy pasa por `LanguageProvider` (`mobile/src/context/LanguageContext.tsx`).
- **Backend (Python 3.13 + FastAPI + Poetry)**: expone autenticación, endpoints de juegos/FAQs, feature flags y en progreso RAG + GenAI Adapter.
- **Supabase (Postgres + Auth + pgvector)**: esquema completo con usuarios, juegos, FAQs multi-idioma, feature flags, chat sessions/messages, vectors y usage events.
- **Docs**: cada feature mayor queda registrado en `/docs/BGAI-XXXX_*.md` (ver lista abajo) y el alcance vivo está en `MVP.md`.

### Requisitos locales

- Node 20 / npm 10 (Expo SDK 54)
- Python 3.13 + Poetry
- Supabase CLI 1.191+
- Docker Desktop (para `supabase start`)

### Puesta en marcha (dev)

```bash
# 1) Supabase local + seeds
supabase start
# (opcional) supabase db reset && supabase db seed

# 2) Backend FastAPI
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3) App móvil Expo
cd mobile
npm install
npx expo start --android   # o --ios / --web
```

Env vars clave:
- `.env` (raíz) contiene Supabase local + backend.
- `mobile/.env` define `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BACKEND_URL`. En simulador Android usar `10.0.2.2`; en dispositivo físico usar IP LAN.

### Scripts útiles

| Comando | Descripción |
| --- | --- |
| `supabase start` | Levanta Postgres, Auth, Studio, etc. |
| `cd backend && poetry run pytest` | Tests de FastAPI. |
| `cd backend && poetry run uvicorn app.main:app --reload` | API local. |
| `cd mobile && npx expo start` | Expo bundler. |
| `cd mobile && npm run lint` | ESLint (auto-config Expo) — corrige antes de subir. |

### Estructura del repo

```
├─ MVP.md                      # Alcance y estado del MVP (actualizado a BGAI-0008)
├─ docs/
│  ├─ BGAI-0001_supabase.md    # Esquema Supabase + seeds
│  ├─ BGAI-0002_backend-bootstrap.md
│  ├─ BGAI-0003_authentication.md
│  ├─ BGAI-0004_mobile-shell.md
│  ├─ BGAI-0005_mobile-supabase-integration.md
│  ├─ BGAI-0006_games-endpoints.md
│  ├─ BGAI-0007_mobile-games-integration.md
│  ├─ BGAI-0008_mobile-localization.md
│  └─ BGAI-0009_mobile-chat-history.md
├─ mobile/                     # App Expo (ver README propio)
│  └─ src/
│     ├─ components/
│     ├─ context/              # Auth + Language providers
│     ├─ hooks/                # useAuth, useGames, useGameDetail, etc.
│     ├─ localization/         # translations.ts
│     ├─ navigation/
│     ├─ screens/
│     └─ services/
├─ backend/                    # FastAPI + Poetry
└─ supabase/                   # Migrations, seeds, config
```

### Estado actual (nov-2025)

- ✅ Supabase schema + seeds con roles, feature flags, FAQs ES/EN y vectores (BGAI-0001).
- ✅ Backend bootstrap + auth + juegos/FAQs con control de acceso (BGAI-0002/3/6).
- ✅ Mobile shell + auth real + consumo de juegos reales (BGAI-0004/5/7).
- ✅ Localización completa con selector de idioma persistente; FAQs y UI cambian en caliente (BGAI-0008).
- ✅ Tab global renombrado a “Historial/History” y documentado como hub de sesiones previas (BGAI-0009).
- 🔄 En progreso: pipeline RAG + GenAI Adapter, endpoints de chat IA.
- 📋 Pendiente: ingestión masiva de documentos, script BGG, assets finales, pruebas end-to-end completas.

### Guías adicionales

- `AGENTS.md` — normas para agentes (incluye reglas de documentación y localización).
- `MVP.md` — backlog vivo, porcentajes por componente y próximos pasos.
- `docs/` — referencia histórica por entregable (consulta antes de tocar cada módulo).

Para nueva documentación, sigue `.github/instructions/documentation.instructions.md`, usa numeración `BGAI-XXXX` y guarda el vivo en `/docs`.
