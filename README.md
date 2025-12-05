npx supabase start

cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd mobile && npx expo start --clear --android.

## Board Game Assistant Intelligent (BGAI)

App móvil + portal admin + backend para asistir partidas de juegos de mesa con FAQs, chat IA y contenido curado.

### Arquitectura resumida

- **Mobile (Expo / React Native / TypeScript)**: cliente principal con login Supabase, sección BGC, selector de idioma ES/EN y consumo de los endpoints reales (`/auth`, `/games`, `/games/{id}`, `/games/{id}/faqs`). Todo el copy pasa por `LanguageProvider` (`mobile/src/context/LanguageContext.tsx`).
- **Admin Portal (Next.js 16 / React 19 / TypeScript / Tailwind)**: portal web interno con soporte dark mode para importar juegos desde BGG, editar metadatos, administrar FAQs ES/EN y gestionar documentos (subidas directas de PDF/DOC/DOCX de hasta 10 MB, descarga firmada y disparo del pipeline RAG). El cliente usa el backend real (`/games`, `/admin/*`), normaliza el `GamesListResponse` para la tabla y protege rutas vía `proxy.ts`. Solo roles `admin` y `developer`. Dark mode con toggle persistente (light/dark/system). Ver [admin-portal/README.md](admin-portal/README.md) (única fuente de documentación del portal).
- **Backend (Python 3.13 + FastAPI + Poetry)**: expone autenticación, endpoints de juegos/FAQs (`/games`, `/games/{id}`, `/games/{id}/faqs`), chat IA con RAG (`/genai/query`), endpoints admin (`/admin/games`, `/admin/games/{id}/faqs`, `/admin/games/{id}/documents`, `/admin/games/{id}/process-knowledge`), y feature flags con control de acceso granular.
- Incluye el CLI de depuración en `backend/app/services/gemini_provider.py` para listar stores/documentos, borrar recursos y abrir un loop de chat contra Gemini usando display names o IDs normalizados, útil cuando se trabaja con `fileSearchStores/...` vs `file_search_stores/...`.
- **Supabase (Postgres + Auth + Storage)**: esquema completo con usuarios, juegos (incluido el nuevo campo `description` con la sinopsis saneada proveniente de BGG), FAQs multi-idioma, feature flags, chat sessions/messages, game_documents (con rutas auto-generadas) y usage events.
- **Docs**: cada feature mayor queda registrado en `/docs/BGAI-XXXX_*.md` (ver lista abajo) y el alcance vivo está en `MVP.md`.

### Requisitos locales

- Node 20 / npm 10 (Expo SDK 54)
- Python 3.13 + Poetry
- Supabase CLI 1.191+
- Docker Desktop (para `supabase start`)

### Puesta en marcha (dev)

```bash
# 1) Supabase local + seeds
# scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
# scoop install supabase
supabase start
# or > npx supabase@latest start
# (opcional) supabase db reset && supabase db seed

# 2) Backend FastAPI
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3) Admin Portal (Next.js) - OPCIONAL
cd admin-portal
npm install
npm run dev  # http://localhost:3000
# cd admin-portal && npm run dev
# Login: admin@bgai.test / Admin123! (auto-creado con supabase db reset)

# 4) App móvil Expo
cd mobile
npm install
npx expo start --clear --android   # o --ios / --web
# cd mobile && npx expo start
```

#### 🔧 Configuración Inicial de Supabase (Primera Vez)

Para que la aplicación funcione correctamente, Supabase necesita datos iniciales (seed data). El comando `supabase db reset` aplica el baseline `supabase/migrations/20251205000000_baseline.sql` y crea automáticamente:

##### ✅ Datos Creados Automáticamente

**1. Usuarios de Prueba** (`auth.users` + `profiles`)
- `admin@bgai.test` / `Admin123!` - Acceso total al Admin Portal
- `developer@bgai.test` / `Dev123!` - Desarrollo y testing
- `tester@bgai.test` / `Test123!` - Testing con features beta
- `premium@bgai.test` / `Premium123!` - Usuario premium (200 chats/día)
- `basic@bgai.test` / `Basic123!` - Usuario básico (20 chats/día)

**2. Sección BGC** (`app_sections`)
- Board Game Companion - Sección principal del MVP (requerida para "Import from BGG")

**3. Juegos de Ejemplo** (`games`)
- Solo **Wingspan** para mantener el estado inicial minimalista durante los resets
- El registro incluye BGG ID, rango de jugadores, tiempo de juego, rating e incluso la descripción limpia almacenada en `games.description`

**4. FAQs Multilenguaje** (`game_faqs`)
- No se insertan FAQs por defecto (la tabla queda vacía para que las altas se hagan desde el Admin Portal o importaciones controladas)
- El backend mantiene el mismo sistema de fallback ES → EN; solo necesitas poblarla manualmente

**5. Feature Flags** (`feature_flags`)
- Control de acceso por rol (`basic`, `premium`, `tester`, `developer`, `admin`)
- Límites de chat configurados (20-200 consultas/día según rol)
- Features beta solo para testers y developers
- Configuración separada para entornos `dev` y `prod`

**6. Documentos de Muestra** (`game_documents`)
- Referencias de ejemplo para el pipeline RAG
- **Rutas auto-generadas**: `file_path = game_documents/{game_id}/{document_uuid}_filename`
- Estado inicial `uploaded`; `ready` y `error` indican el progreso del pipeline
- IDs de proveedor/vector store se setean durante el procesamiento de conocimiento
- Metadata de procesamiento almacenado directamente en `game_documents`

##### 🚀 Comando Recomendado (Reset Completo)

```bash
supabase db reset
```

Este comando:
- ✅ Aplica el baseline (`supabase/migrations/20251205000000_baseline.sql`)
- ✅ Ejecuta el seed completo (`supabase/seed.sql`)
- ✅ Crea esquema, tablas, índices, RLS policies y triggers
- ✅ Inserta todos los datos de prueba listados arriba

##### 🔧 Configuración Manual (Solo si NO usas `db reset`)

Si prefieres no hacer reset completo, al menos crea la **sección BGC** (requerida para Admin Portal):

```sql
-- Ejecutar en Supabase Dashboard → SQL Editor
INSERT INTO public.app_sections (key, name, description, display_order, enabled)
SELECT 'BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_sections WHERE key = 'BGC');
```

**Alternativa**: Script Python
```bash
cd backend && python scripts/create_bgc_section.py
```

##### 📚 Documentación Adicional

- **Esquema completo**: `docs/BGAI-0001_supabase.md`
- **Script BGC**: `backend/scripts/README_CREATE_BGC_SECTION.md`
- **Seed SQL**: `supabase/seed.sql` (532 líneas con todos los datos iniciales)

---

#### ⚠️ Estado de la Integración con BoardGameGeek (BGG)

La funcionalidad "Import from BGG" en el Admin Portal utiliza la API XML v2 de BoardGameGeek:
```
https://www.boardgamegeek.com/xmlapi2/thing
```

**ESTADO ACTUAL (2025-11-25)**:
- ❌ **NO tenemos licencia oficial** de BoardGameGeek
- ❌ **La integración está en proceso de aplicación**
- ⚠️ **NO usar en producción** hasta obtener aprobación formal
- ✅ Código implementado y funcional para **desarrollo/testing local únicamente**

**Archivos relacionados**:
- `backend/app/services/bgg.py` - Cliente XML de BGG
- `backend/app/api/routes/admin.py` - Endpoint `/admin/games/import-bgg`

**Vars de entorno (backend `.env`)**:
- `BGG_API_URL`: base de la API autorizada (por defecto `https://www.boardgamegeek.com/xmlapi2`). La app añade `/thing` automáticamente si mantienes solo la raíz.
- `BGG_API_TOKEN`: token firmado por BGG para autenticar peticiones; nunca lo compartas fuera del archivo `.env` o de los stores seguros del deploy.

**Propagación a entornos remotos**
1. **Supabase Edge/Functions / DB Studio**:
   ```bash
   supabase secrets set BGG_API_URL=https://www.boardgamegeek.com/xmlapi2 BGG_API_TOKEN=<token>
   ```
   Verifica con `supabase secrets list` antes de desplegar `supabase functions deploy`.
2. **Render / Railway / Fly.io**: agrega ambos valores en la sección *Environment* del servicio `backend`. Render, por ejemplo:
   - Dashboard → Service → Environment → Add Secret
   - Key `BGG_API_URL`, Value `https://…`
   - Key `BGG_API_TOKEN`, Value `<token>`
3. **CI/CD**: en GitHub Actions usa `Settings → Secrets → Actions` y define `BGG_API_URL` / `BGG_API_TOKEN`; los workflows deben exportarlas como vars antes de levantar el backend.

**Documentación**: Ver sección "8. BGG como fuente de datos" en `MVP.md` y `docs/BGAI-0010_admin-portal-backend.md`

---

### 🚀 Deployment a Supabase Cloud

**Proyecto en la nube:**
- **URL**: `https://cszvpobhylbzsfrbanbl.supabase.co`
- **Project Ref**: `cszvpobhylbzsfrbanbl`

**Guía completa de deployment:**
Ver **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** para instrucciones detalladas sobre:
- Configuración de Supabase Cloud
- Aplicación de migraciones (`supabase db push`)
- Deployment del backend (Railway/Render/Fly.io)
- Deployment del Admin Portal (Vercel)
- Builds de producción para mobile (Expo EAS)
- Estrategia de seed data (dev vs prod)
- Variables de entorno para cada componente
- Troubleshooting y rollback

**Quick start (Cloud):**
```bash
# 1. Linkear proyecto local con cloud
supabase link --project-ref cszvpobhylbzsfrbanbl

# 2. Aplicar migraciones a cloud
supabase db push

# 3. Configurar variables de entorno
# Ver docs/DEPLOYMENT.md sección 2
```

---

Env vars clave:
- `.env` (raíz) contiene Supabase local + backend.
- `mobile/.env` define `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BACKEND_URL`. En simulador Android usar `10.0.2.2`; en dispositivo físico usar IP LAN.
- `admin-portal/.env.local` define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (ver admin-portal/SETUP.md).

### Scripts útiles

| Comando | Descripción |
| --- | --- |
| `supabase start` | Levanta Postgres, Auth, Studio, etc. |
| `cd backend && poetry run pytest` | Tests de FastAPI. |
| `cd backend && poetry run uvicorn app.main:app --reload` | API local. |
| `cd admin-portal && npm run dev` | Portal admin Next.js (http://localhost:3000). |
| `cd mobile && npx expo start` | Expo bundler. |
| `cd mobile && npm run lint` | ESLint (auto-config Expo) — corrige antes de subir. |
| `cd admin-portal && npm run lint` | Ejecuta el linter de Next.js (ESLint). |

### Estructura del repo

```
├─ MVP.md                      # Alcance y estado del MVP (actualizado a BGAI-0016)
├─ docs/
│  ├─ DEPLOYMENT.md            # Guía de migración y deployment a Supabase Cloud
│  ├─ BGAI-0001_supabase.md    # Esquema Supabase + seeds
│  ├─ BGAI-0002_backend-bootstrap.md
│  ├─ BGAI-0003_authentication.md
│  ├─ BGAI-0004_mobile-shell.md
│  ├─ BGAI-0005_mobile-supabase-integration.md
│  ├─ BGAI-0006_games-endpoints.md
│  ├─ BGAI-0007_mobile-games-integration.md
│  ├─ BGAI-0008_mobile-localization.md
│  ├─ BGAI-0009_mobile-chat-history.md
│  ├─ BGAI-0010_admin-portal-backend.md
│  ├─ BGAI-0011_admin-portal-frontend.md
│  ├─ BGAI-0012_BGG_manual_import.md
│  ├─ BGAI-0013_dark-mode.md
│  ├─ BGAI-0014_upload-documents.md
│  ├─ BGAI-0015_gemini-file-search.md
│  └─ BGAI-0016_ai-chat-implementation.md
├─ admin-portal/               # Portal admin Next.js (ver README propio)
│  ├─ app/                     # Next.js App Router
│  ├─ components/              # React components
│  ├─ lib/                     # API client, types, utils
│  ├─ SETUP.md                 # Guía rápida (3 pasos)
│  └─ README.md                # Documentación completa
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

- ✅ Supabase schema + seeds con roles, feature flags, FAQs ES/EN y game_documents (BGAI-0001).
- ✅ Backend bootstrap + auth + juegos/FAQs con control de acceso (BGAI-0002/3/6).
- ✅ Mobile shell + auth real + consumo de juegos reales (BGAI-0004/5/7).
- ✅ Localización completa con selector de idioma persistente; FAQs y UI cambian en caliente (BGAI-0008).
- ✅ Tab global renombrado a "Historial/History" y documentado como hub de sesiones previas (BGAI-0009).
- ✅ Portal Admin completo: backend admin API con integración BGG (BGAI-0010) + frontend Next.js con gestión de juegos, FAQs y documentos (BGAI-0011).
- ✅ Creación manual de juegos + fix BGG API redirects + endpoint /sections (BGAI-0012).
- ✅ Dark mode con soporte light/dark/system en Admin Portal, toggle persistente en header, tokens CSS y componentes actualizados (BGAI-0013).
- ✅ Upload de documentos (PDF/DOC/DOCX) desde el portal admin con validaciones, toasts, descarga desde Supabase Storage, migraciones `title`/status y endpoint multitpart listo para el pipeline RAG (BGAI-0014).
- ✅ Gestión simplificada de documentos: rutas auto-generadas con UUID, eliminación de `provider_name` del formulario (migración 20241126).
- ✅ **BGAI-0015** — Integración completa Gemini File Search (Dic 2024):
  - Servicio completo `gemini_provider.py` con File Search Store management (uno por juego, multilenguaje)
  - Upload de documentos desde Supabase Storage a Gemini con retry logic y error handling
  - Provider dispatch en `process_game_knowledge()` con persistencia de `provider_file_id` y `vector_store_id`
  - Admin Portal: eliminado prompt de proveedor, botón "Procesar" individual por documento
  - Bug fix crítico: separación storage_path/file_path para prevenir duplicación de bucket
  - API signature fixes: uso correcto de google-genai 1.53.0, config dict para mime_type/display_name
  - 14 tests unitarios (100% passing) con FakeGeminiClient
  - Backward compatible: `provider_name=None` mantiene comportamiento existente
  - Requiere `GOOGLE_API_KEY` en environment

- ✅ **BGAI-0016** — Chat IA con RAG - Endpoint `/genai/query` + UI Móvil (Dic 2024):
  - Backend: Endpoint `POST /genai/query` completo (validación auth, feature flags, rate limits, session mgmt)
  - Recuperación de vector_store_id desde `game_documents` con fallback ES → EN
  - Query execution contra Gemini File Search con context multi-turn
  - Servicios: `chat_sessions.py`, `usage_tracking.py`, `feature_flags.py` (extended), `gemini_provider.py` (extended)
  - Mobile: Tipos TypeScript completos (`ChatMessage`, `ChatSession`, `ChatQueryRequest`, `ChatQueryResponse`, etc.)
  - Mobile: Servicio API client `sendChatMessage()` con token injection
  - Mobile: Hook `useChatSession()` para manejo de estado (messages, sessionId, isLoading, error)
  - Mobile: Componentes de UI (`MessageBubble`, `ChatInput`, `TypingIndicator`, `GameChatScreen`)
  - Soporte multi-idioma ES/EN completo en UI y requests
  - Session persistence en app instance, reutilización de session_id
  - Analytics logging detallado: `chat_question` y `chat_answer` events
  - Enforcement de daily limits extraídos de feature flag metadata
  - Tests completos: backend (happy path, limits, fallback), mobile (send, clear, error handling), integration (E2E)
- 🔄 En progreso: adaptadores OpenAI/Claude, jobs para sincronización BGG masiva, analytics dashboard.
- 📋 Pendiente: licencia oficial BGG, ingestión masiva de documentos, assets finales, performance optimization.

**MVP: ~85% completado** (ver `MVP.md` para detalles)

### Guías adicionales

- `AGENTS.md` — normas para agentes (incluye reglas de documentación y localización).
- `MVP.md` — backlog vivo, porcentajes por componente y próximos pasos.
- `docs/` — referencia histórica por entregable (consulta antes de tocar cada módulo).

Para nueva documentación, sigue `.github/instructions/documentation.instructions.md`, usa numeración `BGAI-XXXX` y guarda el vivo en `/docs`.
