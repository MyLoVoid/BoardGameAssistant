## 0. Resumen ejecutivo del MVP

* **Producto:** App móvil “Board Game Assitant Inteligent” (BGAI), asistente modular para juegos de mesa.
* **Plataformas:** Android e iOS.
* **Arquitectura elegida:**

  * App móvil multiplataforma (React Native + Expo).
  * Backend principal en **Supabase** (Auth, Postgres, vectores con pgvector).
  * **Backend fino propio** (Python + FastAPI) como API REST + **GenAI Adapter** (RAG por juego, integraciones IA).
* **Escala inicial:** ~100 usuarios testers, 10–50 juegos en MVP (escalable a 500–1000 juegos).
* **Idiomas:** ES / EN desde el MVP.
* **Entornos:** dev y prod separados.

---

## 1. Objetivo y contexto

* Crear una app que actúe como **asistente para juegos de mesa**, centrada inicialmente en una sección de ayuda por juego.
* Toda la arquitectura debe ser **modular**:

  * Secciones que se puedan activar/desactivar.
  * Juegos como “subsecciones” configurables.
  * Features (FAQ, chat IA, score helpers, etc.) controlados por configuración, no hardcodeados.

---

## 2. Alcance funcional del MVP

### 2.1. Funcionalidades principales

1. **Login y gestión de usuarios**

   * Registro / login con email + password.
   * Roles de usuario: `admin`, `developer`, `basic`, `premium`, `tester`.
   * MVP sin pagos reales, pero con roles y estructura listos para diferenciar features.

2. **Sección Board Game Companion (BGC)**

   * Home de la sección con lista de juegos disponibles.
   * Entre 10 y 50 juegos en el MVP (pensado para escalar a 500–1000).

3. **Detalle de juego (subsección por juego)**

   * **Home del juego**:

     * Información general del juego (nombre, nº de jugadores, tiempo, rating, portada, etc.).
     * Datos sincronizados desde **BoardGameGeek (BGG)** y cacheados en la BD propia.
   * **FAQs**:

     * Lista de preguntas y respuestas por juego.
     * Multi-idioma ES/EN (al menos un idioma seguro).
   * **Enlace a BGG**:

     * Link a la página oficial del juego en BGG.
   * **Helper GenAI (chat)**:

     * Interfaz tipo chat donde el usuario hace preguntas sobre el juego.
     * El backend llama al servicio GenAI (RAG por juego) y devuelve las respuestas.
     * Historial de conversación guardado por usuario/juego/sesión.

4. **Monetización (estructura, no cobro real)**

   * Diferenciación conceptual entre `basic`, `premium` y `tester` mediante:

     * Acceso a juegos.
     * Acceso a ciertas features (por ej., helpers avanzados).
     * Límites de uso (número de preguntas al día).

5. **Sin modo offline en el MVP**, pero sin cerrarse puertas para añadirlo después (modelo de datos y llamadas pensado para ello).

---

## 3. Usuarios, roles y diferencias iniciales

Roles definidos:

* **admin**

  * Acceso total a todas las secciones y juegos.
  * Puede gestionar configuración, features, juegos, etc.

* **developer**

  * Similar a admin en entorno dev (tests y pruebas).
  * Pensado para pruebas técnicas y debugging.

* **basic**

  * Acceso a juegos “free”.
  * Acceso a FAQs completas.
  * Chat IA con límite diario de preguntas (por definir, p. ej. 20 preguntas/día).
  * Sin acceso a helpers avanzados (score helper, meta features) en primera instancia.

* **premium**

  * Acceso a todos los juegos actuales.
  * Chat IA con límite más alto o prácticamente sin límite (para el MVP).
  * Acceso a helpers avanzados (score helper, meta games cuando se creen).
  * Posible acceso anticipado a nuevas secciones.

* **tester**

  * Rol de prueba interna:

    * Acceso a todos los juegos.
    * Todas las features activas, incluidas las marcadas como beta.
    * Sin límites de uso estrictos (o límites muy altos).

La activación efectiva de features se modela con **feature flags**, no con lógica quemada en la app.

---

## 4. Arquitectura técnica adoptada

### 4.1. Visión general

* **App móvil (React Native + Expo)**

  * UI, navegación, estado de la app.
  * No contiene lógica de negocio compleja; se limita a consumir APIs y mostrar datos.
  * Modulada por secciones:

    * Módulo Auth.
    * Módulo Navegación.
    * Módulo “Board Game Companion”.
    * Módulo “Juego” que se configura dinámicamente según la info que llega del backend.

* **Supabase (backend principal)**

  * Autenticación (email/password, con opción de social login futuro como Google).
  * Base de datos Postgres para:

    * Usuarios y roles.
    * Secciones.
    * Juegos.
    * FAQs.
    * Feature flags.
    * Historial de chat.
    * Eventos de uso.
    * Documentos vectorizados para RAG.
  * pgvector para embeddings por juego.

* **Backend fino propio (API + GenAI Adapter)**

  * **Stack:** Python 3.13+ con FastAPI (soporta 3.14+)
  * **Gestión de dependencias:** Poetry
  * **Dependencias principales:**
    * FastAPI 0.115+ + Uvicorn (servidor ASGI)
    * Pydantic v2 (validación de datos con máximo rendimiento)
    * supabase-py 2.10+ (cliente Supabase)
    * OpenAI 1.58+ / Google Gemini 0.8+ / Anthropic Claude 0.42+
    * LangChain 0.3+ (framework para RAG y aplicaciones LLM)
    * pgvector 0.3+ (extensión PostgreSQL para búsqueda vectorial)
  * Expuesto como API REST.
  * Faz de la app hacia:

    * Supabase (para datos).
    * Proveedores de IA (OpenAI/Gemini/Claude, etc.).
    * BoardGameGeek para sincronización de datos (solo backend, nunca móvil).
  * Encapsula:

    * Autorización (roles, feature flags, límites).
    * RAG (búsqueda de contexto en vectores + llamada al modelo de IA).
    * Lógica de negocio (qué features tiene cada usuario/juego).
    * Registro de analítica y usage events.

* **BoardGameGeek (BGG)**

  * Solo se usa desde backend para sincronizar datos de juegos.
  * Datos (nombre, jugadores, rating, imágenes, etc.) se guardan en la tabla `games`.
  * La app no llama nunca a BGG directamente.

### 4.2. Entornos

* **Entorno dev**

  * App dev configurada para hablar con:

    * Backend dev.
    * Supabase dev.
  * Datos de prueba, juegos de test, usuarios fake.

* **Entorno prod**

  * App prod (la que verá el usuario final).
  * Habla con backend prod y Supabase prod.
  * Datos reales de testers y juegos oficiales.

Ambos entornos mantienen el mismo esquema de BD, pero distintos datos y configuración de flags.

---

## 5. Modelo de datos conceptual (MVP)

Tablas principales (conceptuales; los nombres pueden variar, pero la idea es esta):

1. **`users`**

   * id
   * email
   * password_hash (lo maneja Supabase)
   * display_name
   * role (`admin`, `developer`, `basic`, `premium`, `tester`)
   * created_at
   * otros campos de perfil, si hacen falta.

2. **`app_sections`**

   * id
   * key  → p. ej. `BGC`
   * name → p. ej. “Board Game Companion”
   * description
   * order
   * enabled

3. **`games`**

   * id
   * section_id      → referencia a `app_sections` (MVP: todos en BGC)
   * name_base       → nombre base (por ejemplo, el de BGG)
   * bgg_id
   * min_players
   * max_players
   * playing_time
   * rating
   * thumbnail_url
   * image_url
   * status          → activo, beta, oculto
   * last_synced_from_bgg_at

4. **`game_faqs`**

   * id
   * game_id
   * language        → `es` / `en`
   * question
   * answer
   * order
   * visible

5. **`feature_flags`**

   * id
   * scope_type  → `global`, `section`, `game`, `user`
   * scope_id    → id de la sección, juego o usuario (o null para global)
   * feature_key → `faq`, `chat`, `score_helper`, `meta_games`, `beta_features`, etc.
   * role        → `basic`, `premium`, `tester`, `admin`, etc. (o null para “cualquier rol”)
   * environment → `dev`, `prod`
   * enabled     → true / false
   * metadata    → JSON / texto corto para parámetros (por ejemplo, límite diario)

6. **`chat_sessions`**

   * id
   * user_id
   * game_id
   * started_at
   * last_activity_at
   * status           → activo, cerrado
   * language         → idioma principal de la sesión
   * model_provider   → `openai`, `gemini`, etc.
   * model_name
   * total_messages
   * total_token_estimate (campo orientativo para seguimiento de coste)

7. **`chat_messages`**

   * id
   * session_id
   * sender     → `user`, `assistant`, `system`
   * content
   * created_at

8. **`game_docs_vectors`** (RAG)

   * id
   * game_id
   * language      → `es` / `en`
   * source_type   → `rulebook`, `faq`, `bgg`, `house_rules`, etc.
   * chunk_text
   * embedding
   * metadata      → información adicional (página, sección del manual, etc.)

9. **`usage_events`** (analítica básica)

   * id
   * user_id
   * game_id        (opcional, solo si aplica)
   * feature_key    → `chat`, `faq`, `game_open`, etc.
   * event_type     → `game_open`, `faq_view`, `chat_question`, `chat_answer`, etc.
   * environment    → `dev` / `prod`
   * timestamp
   * extra_info     → detalles adicionales si se necesitan (ej. número de preguntas, idioma, etc.)

---

## 6. Diseño de RAG y GenAI Adapter

### 6.1. RAG por juego

* Cada juego tiene su propia base de conocimiento en `game_docs_vectors`, con:

  * textos chunked (trozos) de reglas, FAQs extendidos, contenido relevante.
  * embeddings calculados (pgvector).
  * metadata para saber origen e idioma.

Pipeline RAG (conceptual):

1. Pregunta del usuario llega con `game_id` y `language`.
2. Se buscan en `game_docs_vectors` los N trozos más relevantes filtrando por:

   * `game_id`
   * `language`
   * opcionalmente `source_type` si quieres priorizar manual vs FAQs.
3. Se construye el prompt con la pregunta + los trozos relevantes.
4. Se envía el prompt al modelo de IA (OpenAI/Gemini/Claude, etc.).
5. Se recibe respuesta, se guarda y se devuelve al cliente.

### 6.2. Endpoint principal del GenAI Adapter

* **Endpoint:** `POST /genai/query`

**Entrada (request body, conceptual):**

* `game_id`
* `question`
* `language`      → `es` / `en`
* `session_id`    → opcional; si no se envía, se crea una nueva sesión
* (El `user_id` se infiere del token de autenticación en el backend)

**Salida (response body, conceptual):**

* `session_id`    → id de sesión usada/creada
* `answer`        → respuesta en texto para mostrar al usuario
* `citations`     → lista opcional de referencias, por ejemplo ids de `game_docs_vectors` o trozos citados
* `model_info`    → `provider`, `model_name`
* `limits`        → opcional, información de límites de uso (por ejemplo “te quedan 5 preguntas hoy”)

**Lógica interna del endpoint:**

1. Valida token (de Supabase) y obtiene `user_id` y `role`.
2. Comprueba permisos mediante `feature_flags`:

   * ¿Tiene acceso al `chat` para ese `game_id` en ese entorno?
3. Resuelve `session_id`:

   * Si no llega, crea una nueva sesión en `chat_sessions`.
   * Si llega, verifica que pertenece a ese `user_id` y `game_id`.
4. Antes de la IA:

   * Registra un `usage_event` tipo `chat_question`.
5. Ejecuta pipeline RAG:

   * Consulta `game_docs_vectors` para contexto.
   * Llama al modelo de IA con prompt enriquecido.
6. Al recibir la respuesta:

   * Inserta mensajes en `chat_messages` (pregunta + respuesta).
   * Actualiza `chat_sessions` (timestamps, contadores, token estimate).
   * Registra un `usage_event` tipo `chat_answer`.
7. Devuelve la respuesta al cliente.

---

## 7. Analítica en el MVP

Quieres analítica desde el inicio, así que se define:

* **Fuentes de analítica:**

  * `chat_sessions` y `chat_messages`:

    * uso por juego y usuario.
    * longitud de conversaciones.
    * uso por modelo, idioma, etc.
  * `usage_events`:

    * qué juegos se abren más.
    * cuántas veces se consulta FAQ vs chat.
    * comparativa por rol (basic vs premium vs tester).

* **Preguntas típicas que podrás responder:**

  * ¿Qué juegos son más usados?
  * ¿Cuántas preguntas se hacen por día?
  * ¿Qué idioma se usa más?
  * ¿Los testers usan nuevas features?

---

## 8. BGG como fuente de datos

* Flujo para BGG:

  1. Identificas los juegos y sus `bgg_id`.
  2. Desde backend (o job específico) llamas a la API de BGG.
  3. Parseas XML, extraes:

     * nombre,
     * nº jugadores,
     * tiempo,
     * rating,
     * imágenes.
  4. Guardas/actualizas en `games`.
  5. Opcionalmente logs `last_synced_from_bgg_at`.

* Para el MVP:

  * Basta con un proceso manual/semi-automático para los 10–50 juegos iniciales.
  * No hace falta automatizar actualizaciones periódicas todavía.

---

## 9. Multi-idioma (ES / EN)

* Aplica en tres sitios:

  1. **UI de la app** (manejado en el front).
  2. **Contenido de FAQs y docs de RAG**:

     * `language` en `game_faqs` y `game_docs_vectors`.
  3. **Idioma de la sesión**:

     * `language` en `chat_sessions` y en la llamada a GenAI Adapter.

* Estrategia simple para el MVP:

  * Si el usuario elige ES:

    * se devuelven FAQs `language = 'es'` si existen;
    * si no, fallback a EN.
  * RAG usa el idioma de la sesión para buscar trozos y para el modelo.

---

## 10. Estado del proyecto (Progreso actual)

### ✅ Completado

#### **Base de datos Supabase (100%)**

1. **Esquema completo implementado** (`supabase/migrations/20241122000000_initial_schema.sql`)
   * ✅ 9 tablas principales creadas:
     * `profiles` - Perfiles de usuario con roles
     * `app_sections` - Secciones modulares
     * `games` - Catálogo de juegos con integración BGG
     * `game_faqs` - FAQs multi-idioma (ES/EN)
     * `feature_flags` - Control granular de features
     * `chat_sessions` - Sesiones de conversación IA
     * `chat_messages` - Mensajes individuales
     * `game_docs_vectors` - Vectores para RAG (pgvector)
     * `usage_events` - Analítica
   * ✅ Extensión pgvector habilitada
   * ✅ Índices optimizados (incluyendo HNSW para búsqueda vectorial)
   * ✅ Row Level Security (RLS) configurado
   * ✅ Triggers automáticos (updated_at, creación de perfiles)
   * ✅ Tipos ENUM definidos (roles, idiomas, estados, etc.)

2. **Datos semilla** (`supabase/seed.sql`)
   * ✅ Sección "Board Game Companion" configurada
   * ✅ 5 juegos de ejemplo con datos de BGG:
     * Gloomhaven, Terraforming Mars, Wingspan, Lost Ruins of Arnak, Carcassonne
   * ✅ FAQs multi-idioma de prueba (ES/EN)
   * ✅ Feature flags configurados por rol y entorno (dev/prod)
   * ✅ Chunks de ejemplo para RAG

3. **Entorno de desarrollo local**
   * ✅ Supabase local configurado (`boardgameassistant-dev`)
   * ✅ 5 usuarios de prueba creados con diferentes roles:
     * admin@bgai.test (Admin123!)
     * developer@bgai.test (Dev123!)
     * tester@bgai.test (Test123!)
     * premium@bgai.test (Premium123!)
     * basic@bgai.test (Basic123!)
   * ✅ Variables de entorno separadas (`.env` para prod, `.env.local` para dev)

4. **Herramientas de prueba**
   * ✅ Script SQL para crear usuarios (`supabase/create_test_users.sql`)
   * ✅ Página HTML de prueba de login (`test_login.html`)

#### **Backend API REST - Bootstrap + Autenticación (100%)**

**BGA-0002_backend-bootstrap**

1. **Estructura FastAPI lista para escalar**
   * ✅ Proyecto `backend/` con routers, `run.py`, `app/config.py` y dependencias administradas por Poetry.
   * ✅ `pyproject.toml` y `poetry.lock` fijan FastAPI 0.115+, Supabase client 2.10+, LangChain, IA SDKs y stack pgvector.
   * ✅ Configuración compartida (`.env.example`, `.vscode/settings.json`, `.gitignore`) descrita en `docs/BGA-0002_backend-bootstrap.md`.
   * ✅ Health checks (`/`, `/health`, `/health/ready`) y CORS dinámico listos para que la app Expo haga smoke tests.

2. **Tooling consolidado**
   * ✅ VS Code usa Ruff como formateador y pytest como runner; instrucciones centralizadas en `backend/README.md`.
   * ✅ Settings lee variables desde la raíz (`../../.env`), habilitando `poetry run uvicorn app.main:app --reload`.

**BGA-0003_authentication**

1. **Autenticación Supabase**
   * ✅ Router `/auth` con endpoints `GET /auth/me`, `/auth/me/role`, `/auth/validate` y ejemplo `/auth/admin-only`.
   * ✅ `app/core/auth.py` decodifica JWT de Supabase, verifica `aud=authenticated`, obtiene perfiles vía `app/services/supabase.py` y expone `require_role`.
   * ✅ Modelos Pydantic (`UserProfile`, `AuthenticatedUser`, `TokenPayload`, `ErrorResponse`, etc.) documentan los contratos de respuesta.

2. **Cobertura automática**
   * ✅ `tests/test_auth_endpoints.py` ejecuta pruebas de integración contra usuarios seed (`admin@bgai.test`, `basic@bgai.test`) usando `TestClient`.
   * ✅ Flujos felices y de error (token faltante, expirado, rol insuficiente) probados antes de exponer la API al cliente móvil.

### 🔄 En progreso

#### **Backend API REST - Juegos, FAQs y Feature Flags dinámicos (35%)**
* ⏳ Servicio Supabase para `games`, `game_faqs` y `feature_flags` (lecturas filtradas por rol)
* ⏳ Endpoints `GET /games`, `GET /games/{id}`, `GET /games/{id}/faqs?lang=`
* ⏳ Cache / rate limits basados en metadata de feature flags

#### **Backend API REST - RAG + GenAI Adapter (20%)**
* ⏳ Búsqueda vectorial sobre `game_docs_vectors`
* ⏳ Endpoint `POST /genai/query` con pipeline completo (chunks + llamada a LLM + logging)
* ⏳ Registro en `chat_sessions`, `chat_messages`, `usage_events`

### 📋 Pendiente

1. **Backend API REST - Implementación funcional restante**
   * ⏳ Endpoints de juegos y FAQs (lectura condicionada por flags/roles)
   * ⏳ Servicio de feature flags (evaluación de scopes + límites diarios)
   * ⏳ Rate limiting y analítica (`usage_events`)
   * ⏳ Pipeline RAG + integración OpenAI/Gemini/Claude (`POST /genai/query`)
   * ⏳ Webhooks / jobs para sincronizar juegos (BGG + ingestión de chunks)

2. **App Móvil (React Native + Expo)**
   * Estructura del proyecto
   * Navegación
   * Pantallas de autenticación
   * UI de juegos y chat

3. **Pipeline de procesamiento RAG**
   * Scripts para procesar PDFs
   * Generación de embeddings
   * Carga a `game_docs_vectors`

4. **Integración BGG**
   * Script de sincronización de datos de juegos

---

## 11. Próximos pasos inmediatos (checklist de trabajo)

1. **Backend API REST - Endpoints de juegos (BGC)**
   * `GET /games` - Lista filtrada por rol y feature flags
   * `GET /games/{id}` - Detalle del juego
   * `GET /games/{id}/faqs?lang=es` - FAQs filtradas por idioma

2. **Backend API REST - Sistema de Feature Flags y límites**
   * Servicio para validar acceso a features
   * Función `check_feature_access(user, feature, scope)`
   * Implementar límites de uso (rate limiting por rol)

3. **Backend API REST - Pipeline RAG + GenAI Adapter**
   * Servicio de búsqueda vectorial en `game_docs_vectors`
   * Función `search_relevant_chunks(game_id, question, language)`
   * Integración con OpenAI para embeddings y respuestas
   * Endpoint `POST /genai/query` completo

4. **Backend API REST - Analítica**
   * Servicio para registrar eventos en `usage_events`
   * Integrar logging en todos los endpoints principales
   * Tracking de uso por usuario, juego y feature

5. **Scripts de utilidad**
   * Script para procesar PDFs y generar embeddings
   * Script para sincronizar juegos desde BGG
   * Script para poblar `game_docs_vectors` con documentación real

6. **App Móvil - Setup inicial**
   * Crear proyecto React Native + Expo
   * Configurar navegación
   * Integrar Supabase client
   * Pantallas de login/registro

7. **Integración y testing end-to-end**
   * Conectar app móvil con backend
   * Probar flujo completo: login → ver juegos → consultar FAQ → chat IA
   * Validar feature flags y límites de uso

