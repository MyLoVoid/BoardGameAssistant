# MVP – Board Game Assistant Intelligence (BGAI)

> Versión: 2025-12-04
> Estado: **MVP en desarrollo** (Portal admin + RAG + Chat IA completado BGAI-0010–BGAI-0016)

## 0. Resumen ejecutivo del MVP

* **Producto:** App móvil “Board Game Assitant Inteligent” (BGAI), asistente modular para juegos de mesa.
**Plataformas:**

- App móvil para **Android e iOS** (multiplataforma, React Native + Expo).
- **Portal web de administración de juegos** (Next.js + Supabase + backend propio).

**Arquitectura elegida (alto nivel):**

- **App móvil** (React Native + Expo).
- **Backend propio fino** (Python + FastAPI) como **fachada única**:
  - API REST para la app móvil.
  - API REST `/admin/...` para el portal de administración.
  - Orquestador de GenAI/RAG.
  - Integración con BoardGameGeek (BGG).
- **Supabase** como backend principal:
  - Autenticación (Auth).
  - Base de datos Postgres (usuarios, juegos, FAQs, vectores RAG, analítica, etc.).
  - Almacenamiento de archivos (PDFs de reglas, ayudas, expansiones).
- **GenAI & RAG**:
  - GenAI Adapter en backend propio (FastAPI).
  - RAG por juego con diseño **proveedor-agnóstico**:
    - **Estrategia adoptada**: **File Search delegado a proveedores** (OpenAI File API, Gemini File API, Claude).
    - Los documentos se suben a los servicios de vectorización nativos de cada proveedor.
    - El backend actúa como orquestador y abstracción entre la app y los diferentes proveedores de IA.

**Escala inicial del MVP:**

- ~100 usuarios testers.
- **10–50 juegos** en MVP (diseñado para escalar a **500–1000 juegos**).
- Idiomas soportados desde el MVP: **ES / EN**.
- Entornos separados: **dev** y **prod**.

---

## 1. Objetivo y contexto
- Crear una app que actúe como **asistente para juegos de mesa**, centrada inicialmente en una sección de ayuda por juego.
- Arquitectura **modular**:
  - Secciones que se puedan activar/desactivar.
  - Juegos como “subsecciones” configurables.
  - Features (FAQ, chat IA, score helpers, etc.) controlados por configuración (**feature flags**), no quemados en la app.
- Todo el contenido (textos, FAQs, documentos para RAG) se gestiona desde un **Portal de Administración de Juegos**, accesible vía web solo para roles internos.

---

## 2. Alcance funcional del MVP

### 2.1. Funcionalidades principales

1. **Login y gestión de usuarios**
   
   - Registro / login con email + password.
   - Roles de usuario: `admin`, `developer`, `basic`, `premium`, `tester`.
   - MVP sin pagos reales, pero con roles y estructura listos para diferenciar features.

2. **Sección Board Game Companion (BGC)**

   - Home de la sección con lista de juegos disponibles.
   - Entre 10 y 50 juegos en el MVP (pensado para escalar a 500–1000).

3. **Detalle de juego (subsección por juego)**

    - **Home del juego**:
       - Información general del juego (nombre, sinopsis limpia, nº de jugadores, tiempo, rating, portada, etc.).
       - Datos sincronizados desde **BoardGameGeek (BGG)** y cacheados en la BD propia (el texto largo vive en `games.description`, totalmente saneado para evitar entidades HTML).
   - **FAQs**:
     - Lista de preguntas y respuestas por juego.
     - Multi-idioma ES/EN (al menos un idioma seguro).
   - **Enlace a BGG**:
     - Link a la página oficial del juego en BGG.
   - **Helper GenAI (chat)**:
     - Interfaz tipo chat donde el usuario hace preguntas sobre el juego.
     - El backend llama al servicio GenAI (RAG por juego) y devuelve las respuestas.
     - Historial de conversación guardado por usuario/juego/sesión.

4. **Monetización (estructura, no cobro real)**

   - Diferenciación conceptual entre `basic`, `premium` y `tester` mediante:
     - Acceso a juegos.
     - Acceso a ciertas features (por ej., helpers avanzados).
     - Límites de uso (número de preguntas al día).

5. **Sin modo offline en el MVP**, pero sin cerrarse puertas para añadirlo después (modelo de datos y llamadas pensado para ello).

6. **Localización completa (ES/EN)**

   - Selector de idioma persistente dentro de la app.
   - Toda la UI soporta español e inglés y cambia dinámicamente.
   - Las consultas a FAQs y chat usan el idioma elegido.

7. **Portal de Administración de Juegos (web, solo internos)**

   - Onboarding de juegos a partir de su **ID de BGG**.
   - Configuración de datos básicos y estado de publicación del juego.
   - Definición de la **página inicial** del juego por idioma (textos, imagen principal, enlace BGG).
   - Gestión de **FAQs** por juego e idioma.
   - Subida y gestión de **documentos de conocimiento** (reglamentos, ayudas, expansiones, etc.).
   - Botón de **“Procesar conocimiento”** que dispara en el backend la ingestión RAG para ese juego.
---

## 3. Usuarios, roles y diferencias iniciales

Roles definidos en el MVP:

- **admin**
  - Acceso total a todas las secciones y juegos.
  - Puede gestionar configuración, features, juegos, FAQs, documentación.
  - Acceso completo al Portal de Administración.

- **developer**
  - Similar a admin en entorno dev (tests y pruebas).
  - Pensado para pruebas técnicas y debugging.

- **basic**
  - Acceso a juegos “free”.
  - Acceso a FAQs completas.
  - Chat IA con límite diario de preguntas (por definir, p. ej. 20 preguntas/día).
  - Sin acceso a helpers avanzados (score helper, meta features) en primera instancia.

- **premium**
  - Acceso a todos los juegos actuales.
  - Chat IA con límite más alto o prácticamente sin límite (para el MVP).
  - Acceso a helpers avanzados (score helper, meta games cuando se creen).
  - Posible acceso anticipado a nuevas secciones.

- **tester**
  - Rol de prueba interna:
    - Acceso a todos los juegos.
    - Todas las features activas, incluidas las marcadas como beta.
    - Sin límites de uso estrictos (o límites muy altos).

La activación efectiva de features se modela con **feature flags**, no con lógica quemada en la app.

---

## 4. Arquitectura técnica adoptada

### 4.1. Visión general

- **App móvil (React Native + Expo)**
  - UI, navegación, estado de la app.
  - No contiene lógica de negocio compleja; se limita a consumir APIs y mostrar datos.
  - Modulada por secciones:
    - Módulo Auth.
    - Módulo Navegación.
    - Módulo “Board Game Companion”.
    - Módulo “Juego” que se configura dinámicamente según la info que llega del backend.

- **Supabase (backend principal)**
  - Autenticación (email/password, con opción de social login futuro como Google).
  - Base de datos Postgres para:
    - Usuarios y roles.
    - Secciones.
    - Juegos.
    - FAQs.
    - Feature flags.
    - Historial de chat.
    - Analítica de uso.
    - Referencias a documentos subidos a proveedores de IA.
  - Storage para PDFs (reglamentos, ayudas, expansiones).

- **Backend fino propio (API REST + GenAI Adapter)**
  - **Stack:** Python 3.13+ con FastAPI (completamente async en todas las rutas y servicios).
  - Gestiona dependencias con Poetry.
  - Expuesto como API REST.
  - Faz de la app hacia:
    - Supabase (datos y storage).
    - Proveedores de IA (OpenAI/Gemini/Claude, etc.).
    - BoardGameGeek para sincronización de datos (solo backend, nunca móvil).
  - Encapsula:
    - Autorización (roles, feature flags, límites).
    - RAG (búsqueda de contexto + llamada al modelo de IA).
    - Lógica de negocio (qué features tiene cada usuario/juego).
    - Registro de analítica y usage events.
  - Expone dos “frentes” claros:
    - API pública para app móvil (`/games`, `/games/{id}`, `/games/{id}/faqs`, `/genai/query`, etc.).
    - API admin para el portal (`/admin/games`, `/admin/games/import-bgg`, `/admin/games/{id}/faqs`, `/admin/games/{id}/documents`, `/admin/games/{id}/process-knowledge`, etc.).

- **Portal de Administración (Next.js + Supabase)**
  - Web interna, no forma parte de la app móvil.
  - Autenticación via Supabase Auth.
  - Consume la API admin de FastAPI para todas las operaciones de negocio.
  - Puede usar lecturas directas a Supabase con RLS para listados simples cuando tenga sentido.
  - Permite a admins y content editors gestionar juegos, FAQs y documentos.

- **BoardGameGeek (BGG)**
  - Solo se usa desde backend para sincronizarevisa r datos de juegos.
  - Datos (nombre, jugadores, rating, imágenes, etc.) se guardan en la tabla `games` y/o `bgg_cache`.
  - La app y el portal nunca llaman a BGG directamente.

- **Proveedor de GenAI/RAG**
  - Diseñado como componente intercambiable:
    - **OpenAI File Search** (Files API + Vector Stores + Assistants API).
    - **Gemini File Search** (File API + Grounding con Google Search).
    - **Claude** (Prompt Caching + context injection).
  - El GenAI Adapter se implementa contra una interfaz común para poder cambiar el proveedor sin tocar la app ni el portal.
  - Los documentos se suben directamente a los vector stores de cada proveedor.
  - La tabla `game_documents` almacena referencias (file IDs, vector store IDs) para tracking y gestión.
  - **Actualización Nov 2024**: El campo `provider_name` fue eliminado de `game_documents`. El proveedor ahora se selecciona durante el procesamiento de conocimiento. El `file_path` se auto-genera con el patrón `game_documents/{game_id}/{document_uuid}`.

### 4.2. Entornos

- **Entorno dev**
  - App dev configurada para backend dev y Supabase dev.
  - Portal admin dev apuntando a backend dev y Supabase dev.
  - Datos de prueba, juegos de test, usuarios fake.

- **Entorno prod**
  - App prod (la que verá el usuario final) conectada a backend prod y Supabase prod.
  - Portal admin prod (dominio restringido / protegido) conectado a backend prod y Supabase prod.

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
   * description     → sinopsis almacenada directamente desde BGG (texto limpio listo para frontend)
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

8. **`game_documents`** (Referencias a documentos en proveedores de IA)

   * id
   * game_id
   * language          → `es` / `en`
   * source_type       → `rulebook`, `faq`, `bgg`, `house_rules`, `expansion`, etc.
   * file_name         → nombre original del archivo
   * file_path         → ruta auto-generada en Supabase Storage: `game_documents/{game_id}/{document_uuid}`
   * file_size         → tamaño en bytes
   * file_type         → mime type (`application/pdf`, `text/markdown`, etc.)
   * provider_file_id  → ID del archivo en el proveedor (ej: OpenAI File ID), asignado durante procesamiento
   * vector_store_id   → ID del vector store en el proveedor (si aplica), asignado durante procesamiento
   * status            → `uploaded`, `ready`, `error`
   * error_message     → mensaje de error si `status = error`
   * processed_at      → timestamp de procesamiento exitoso
   * metadata          → JSON con información adicional (página, sección del manual, etc.)
   * uploaded_at       → timestamp de subida inicial
   * updated_at        → timestamp de última actualización

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

### 6.1. RAG por juego (concepto)

- Cada juego tiene su propia base de conocimiento, construida a partir de:
  - Documentos originales subidos por administradores (PDFs de reglamentos, ayudas, expansiones).
  - FAQs extendidas.
  - Información relevante de BGG u otras fuentes.

- **Estrategia de vectorización delegada a proveedores:**
  - Los documentos se suben directamente a los servicios de File Search de cada proveedor de IA.
  - **OpenAI**: Files API + Vector Stores + Assistants API.
  - **Gemini**: File API + Grounding.
  - **Claude**: Context injection directo (sin vector store nativo, se usa prompt caching).
  - La tabla `game_documents` almacena referencias (`provider_file_id`, `vector_store_id`) para tracking.

Pipeline RAG (actualizado):

1. Pregunta del usuario llega con `game_id` y `language`.
2. El GenAI Adapter consulta la configuración de RAG para ese juego:
   - Proveedor activo (OpenAI, Gemini, Claude).
   - Obtiene los `provider_file_id` y `vector_store_id` desde `game_documents` filtrando por `game_id`, `language` y `status = 'ready'`.
3. El GenAI Adapter delega la búsqueda semántica al proveedor:
   - **OpenAI**: usa Assistants API con el `vector_store_id` asociado.
   - **Gemini**: usa File API + grounding con los `provider_file_id`.
   - **Claude**: inyecta el contexto directamente en el prompt (requiere pre-carga del contenido).
4. El proveedor devuelve la respuesta con referencias/citaciones de los documentos relevantes.
5. Se recibe la respuesta, se guarda en `chat_messages` y se devuelve al cliente con metadatos de citación.

#### Herramientas de depuración Gemini (nuevo)

- `backend/app/services/gemini_provider.py` ahora resuelve metadatos del juego desde cualquier identificador de store (display name `game-<uuid>`, `fileSearchStores/...` o la versión normalizada `file_search_stores/...`) gracias a `get_game_info_from_store_identifier()`.
- El CLI `_debug_cli` acepta display names, normaliza IDs y mantiene un loop de preguntas para `_debug_chat_flow`, lo que facilita validar respuestas de Gemini sin relanzar el script.
- Los errores de Supabase o IDs inválidos se imprimen de inmediato en la terminal para acelerar el diagnóstico de stores huérfanos o configuraciones incompletas.

### 6.2. Endpoint principal del GenAI Adapter

- **Endpoint:** `POST /genai/query` (opcional, puede variar en el desarrollo)

Entrada (conceptual):

- `game_id`
- `question`
- `language`      → `es` / `en`
- `session_id`    → opcional; si no se envía, se crea una nueva sesión
- (`user_id` se infiere del token de autenticación)

Salida (conceptual):

- `session_id`    → id de sesión usada/creada
- `answer`        → respuesta en texto
- `citations`     → referencias a trozos/documentos
- `model_info`    → `provider`, `model_name`
- `limits`        → información de límites de uso (por ejemplo “te quedan X preguntas hoy”)

**Lógica interna del endpoint:**

1. Valida token (de Supabase) y obtiene `user_id` y `role`.
2. 
3. Comprueba permisos mediante `feature_flags`:
   * ¿Tiene acceso al `chat` para ese `game_id` en ese entorno?

4. Resuelve `session_id`:
   * Si no llega, crea una nueva sesión en `chat_sessions`.
   * Si llega, verifica que pertenece a ese `user_id` y `game_id`.
 * 
5. Antes de la IA:
   * Registra un `usage_event` tipo `chat_question`.

6. Ejecuta pipeline RAG:
   * Captura el historial de la sesión y la pregunta actual.
   * Obtiene referencias a documentos desde `game_documents` (filtrado por `game_id`, `language`, `status = 'ready'`).
   * Delega la búsqueda al proveedor de IA configurado (OpenAI File Search, Gemini, Claude).
   * El proveedor ejecuta búsqueda semántica en su propio vector store y devuelve respuesta + citaciones.
   * (Opcional) Posible búsqueda en internet (foros, webs, etc) si el proveedor lo soporta (ej: Gemini Grounding).
   * (Opcional) Aplica post-procesamiento si es necesario (filtrado, formateo, etc.).
  
7. Al recibir la respuesta:
   * Inserta mensajes en `chat_messages` (pregunta + respuesta).
   * Actualiza `chat_sessions` (timestamps, contadores, token estimate).
   * Registra un `usage_event` tipo `chat_answer`.

8. Devuelve la respuesta al cliente.

Lógica interna resumida:

1. Validar token y obtener `user_id` y `role`.
2. Comprobar permisos mediante `feature_flags`.
3. Resolver/crear `session_id` en `chat_sessions`.
4. Registrar un `usage_event` tipo `chat_question`.
5. Ejecutar el flujo RAG con el proveedor activo.
6. Guardar mensajes en `chat_messages` y actualizar métricas.
7. Registrar `usage_event` tipo `chat_answer`.
8. Devolver respuesta al cliente.
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

---

## 8. BGG como fuente de datos

> ⚠️ **ESTADO ACTUAL (2025-11-25)**: La integración con la API de BoardGameGeek (`https://www.boardgamegeek.com/xmlapi2/thing`) está **en proceso de aplicación**. Actualmente **NO tenemos licencia oficial** y la funcionalidad **NO está en funcionamiento productivo**. El código está implementado para desarrollo y testing, pero requiere aprobación formal de BGG antes de ser utilizado en producción.

Flujo para BGG (desde backend / portal admin):

1. El admin identifica el juego y su `bgg_id`.
2. Desde el portal, se llama a `POST /admin/games/import-bgg`.
3. El backend llama a la API de BGG y parsea XML.
4. Se extraen:
   - nombre,
   - nº jugadores,
   - tiempo,
   - rating,
   - imágenes, etc.
5. Se guarda/actualiza en `games` y `bgg_cache`.
6. Campo `last_synced_from_bgg_at` registra la última sincronización.

Para el MVP:

- Basta con un proceso manual/semi-automático para los 10–50 juegos iniciales.
- No hace falta automatizar actualizaciones periódicas todavía.
- Gracias a **BGAI-0012** el portal admin ya cuenta con creación manual de juegos, selector dinámico de secciones (`/sections`) y modalidades de importación que funcionan aun cuando la licencia de BGG no esté aprobada.
- **Pendiente**: Obtener licencia/aprobación oficial de BoardGameGeek antes de uso en producción.
- **Credenciales**: `BGG_API_URL` y `BGG_API_TOKEN` viven en el `.env` del backend; el servicio agrega `/thing` si hace falta y firma todas las llamadas con el token entregado por BGG.

---

## 9. Multi-idioma (ES / EN)

- **Estado actual**
  - La UI ya es bilingüe gracias al `LanguageProvider`+`useLanguage` en el cliente móvil.
  - El usuario puede cambiar entre ES/EN desde el perfil; la preferencia se persiste en SecureStore/AsyncStorage.
  - Las pantallas Home, Auth, BGC, Chat/Historial y navegación actualizan textos en caliente al cambiar el selector.

- **Cobertura funcional**
  1. **UI de la app (front)**:
     - Traducciones centralizadas (`translations.ts`).
     - Componentes consumen `t(key)` para mantener consistencia.
  2. **Contenido dinámico**:
     - FAQs (`game_faqs.language`) y documentos (`game_documents.language`) sirven el idioma solicitado.
     - Hooks móviles reintentan la descarga cuando cambia el idioma.
  3. **Idioma de sesión/chat**:
     - `chat_sessions.language` mantiene el valor elegido.
     - El GenAI Adapter recibe el idioma para buscar documentos relevantes en el proveedor y generar respuestas coherentes.

- **Fallback actual**
  - Si el usuario selecciona ES, se buscan primero FAQs `language = 'es'`; si no existen, se usa EN y se indica el idioma en la UI.
  - RAG seguirá el mismo patrón: búsqueda de documentos en el idioma preferido con fallback a EN hasta que se suban más documentos multi-idioma.

---

## 10. Estado del proyecto (Progreso actual)

### 📊 Resumen General del MVP

| Componente                              | Estado        | Progreso | Última actualización |
|-----------------------------------------|--------------|----------|----------------------|
| Base de datos Supabase                  | ✅ Completado | 100%     | BGAI-0001            |
| Backend - Bootstrap + Auth              | ✅ Completado | 100%     | BGAI-0002, BGAI-0003 |
| Backend - Endpoints de Juegos/FAQs      | ✅ Completado | 100%     | BGAI-0006            |
| App Móvil - Shell                       | ✅ Completado | 100%     | BGAI-0004            |
| App Móvil - Auth real                   | ✅ Completado | 100%     | BGAI-0005            |
| App Móvil - Games UI                    | ✅ Completado | 100%     | BGAI-0007            |
| App Móvil - Localización (ES/EN)        | ✅ Completado | 100%     | BGAI-0008            |
| App Móvil - Historial (pre-chat IA)     | ✅ Completado | 100%     | BGAI-0009            |
| Backend - RAG + GenAI Adapter           | 🔄 En progreso | ~50%    | BGAI-0015            |
| Pipeline RAG (procesamiento docs)       | 🔄 En progreso | ~60%     | BGAI-0015            |
| Integración BGG (jobs/utilidades)       | 📋 Pendiente  | 0%       | -                    |
| Portal de Administración de Juegos      | ✅ Completado | 100%     | BGAI-0010, BGAI-0011, BGAI-0012, BGAI-0013 |
| **TOTAL MVP**                           | 🔄 En progreso | ~85%    | 2025-12-04           |

**Leyenda:**

- ✅ Completado (100%)
- 🔄 En progreso (1–99%)
- 📋 Pendiente (0%)

### ✅ Completado

#### **Base de datos Supabase (100%)**

1. **Esquema completo implementado** (baseline consolidado `supabase/migrations/20251205000000_baseline.sql`)
   * ✅ 9 tablas principales creadas:
     * `profiles` - Perfiles de usuario con roles
     * `app_sections` - Secciones modulares
     * `games` - Catálogo de juegos con integración BGG
     * `game_faqs` - FAQs multi-idioma (ES/EN)
     * `feature_flags` - Control granular de features
     * `chat_sessions` - Sesiones de conversación IA
     * `chat_messages` - Mensajes individuales
     * `game_documents` - Referencias a documentos en proveedores de IA (antes `game_docs_vectors`)
     * `usage_events` - Analítica
   * ✅ Row Level Security (RLS) configurado
   * ✅ Triggers automáticos (updated_at, creación de perfiles)
   * ✅ Tipos ENUM definidos (roles, idiomas, estados, etc.)
   * ✅ Índices optimizados para búsquedas por juego, idioma, estado
   * ✅ Tabla `game_documents` con rutas auto-generadas (migración 20241126)

2. **Datos semilla** (`supabase/seed.sql`)
   * ✅ Sección "Board Game Companion" configurada
   * ✅ 5 juegos de ejemplo con datos de BGG:
     * Gloomhaven, Terraforming Mars, Wingspan, Lost Ruins of Arnak, Carcassonne
   * ✅ FAQs multi-idioma de prueba (ES/EN)
   * ✅ Feature flags configurados por rol y entorno (dev/prod)
   * ✅ Documentos de muestra con estructura simplificada (sin `provider_name`, rutas auto-generadas)

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

**BGAI-0002_backend-bootstrap**

1. **Estructura FastAPI lista para escalar**
   * ✅ Proyecto `backend/` con routers, `run.py`, `app/config.py` y dependencias administradas por Poetry.
   * ✅ `pyproject.toml` y `poetry.lock` fijan FastAPI 0.115+, Supabase client 2.10+, LangChain, IA SDKs y stack pgvector.
   * ✅ Configuración compartida (`.env.example`, `.vscode/settings.json`, `.gitignore`) descrita en `docs/BGAI-0002_backend-bootstrap.md`.
   * ✅ Health checks (`/`, `/health`, `/health/ready`) y CORS dinámico listos para que la app Expo haga smoke tests.

2. **Tooling consolidado**
   * ✅ VS Code usa Ruff como formateador y pytest como runner; instrucciones centralizadas en `backend/README.md`.
   * ✅ Settings lee variables desde la raíz (`../../.env`), habilitando `poetry run uvicorn app.main:app --reload`.

**BGAI-0003_authentication**

1. **Autenticación Supabase**
   * ✅ Router `/auth` con endpoints `GET /auth/me`, `/auth/me/role`, `/auth/validate` y ejemplo `/auth/admin-only`.
   * ✅ `app/core/auth.py` decodifica JWT de Supabase, verifica `aud=authenticated`, obtiene perfiles vía `app/services/supabase.py` y expone `require_role`.
   * ✅ Modelos Pydantic (`UserProfile`, `AuthenticatedUser`, `TokenPayload`, `ErrorResponse`, etc.) documentan los contratos de respuesta.

2. **Cobertura automática**
   * ✅ `tests/test_auth_endpoints.py` ejecuta pruebas de integración contra usuarios seed (`admin@bgai.test`, `basic@bgai.test`) usando `TestClient`.
   * ✅ Flujos felices y de error (token faltante, expirado, rol insuficiente) probados antes de exponer la API al cliente móvil.

#### **App móvil - Shell Expo (BGAI-0004) (100%)**

1. **Proyecto Expo listo**
   * ✅ Carpeta `mobile/` con Expo SDK 51, TypeScript, Jest y React Navigation configurados (ver `docs/BGAI-0004_mobile-shell.md`).
   * ✅ Assets placeholder (`icon.png`, `splash.png`, `adaptive-icon.png`) y `mobile/app.json` con `scheme` + `extra.apiUrl`.
   * ✅ README específico (`mobile/README.md`) con comandos `npm run start|android|ios|test`.

2. **Shell funcional**
   * ✅ Contexto de autenticación con SecureStore + mock de Supabase (`mockSignIn/mockValidateToken`).
   * ✅ Navegación completa: stack de auth, tabs principales (Home, Games, Chat, Profile) y stack de juegos.
   * ✅ Pantallas base con datos mock (`src/data/mockGames.ts`) para probar UI y flujo de roles.
   * ✅ Prueba smoke con Testing Library (`mobile/__tests__/App.test.tsx`).

#### **App móvil - Integración Supabase Real (BGAI-0005) (100%)**

1. **Cliente Supabase configurado**
   * ✅ Dependencia `@supabase/supabase-js@^2.39.0` agregada al proyecto
   * ✅ Configuración de entorno (`mobile/src/config/env.ts`) con URLs y keys para dev/prod
   * ✅ Cliente Supabase singleton (`mobile/src/services/supabase.ts`) con persistencia AsyncStorage y auto-refresh

2. **Servicio de autenticación real**
   * ✅ Servicio completo (`mobile/src/services/auth.ts`) con métodos reales de Supabase:
     * `signIn(email, password)` - Login con integración backend `/auth/me`
     * `signUp(email, password, fullName)` - Registro con auto sign-in
     * `validateSession()` - Validación y refresh automático de token
     * `signOut()` - Cierre de sesión limpio
     * `getUserProfile()` - Obtención de perfil completo con rol desde backend

3. **Context de autenticación actualizado**
   * ✅ `AuthContext` refactorizado para usar servicio real en lugar de mocks
   * ✅ Método `signUp()` agregado al contexto
   * ✅ Validación de sesión en bootstrap con refresh automático
   * ✅ Persistencia de sesión via AsyncStorage integrada

4. **Pantallas de autenticación funcionales**
   * ✅ SignInScreen limpiado (sin credenciales de prueba hardcodeadas)
   * ✅ SignUpScreen completamente implementado con formulario (nombre, email, password)
   * ✅ Integración completa con Supabase local (http://127.0.0.1:54321)

5. **Flujo end-to-end operativo**
   * ✅ Registro → Creación en Supabase → Auto sign-in → Fetch de rol desde backend
   * ✅ Login → Validación → Fetch de perfil con rol
   * ✅ Persistencia → App cerrada/abierta → Usuario permanece autenticado
   * ✅ Logout → Limpieza de sesión → Vuelta a login
   * ✅ Token refresh automático cuando expira

#### **Backend API REST - Endpoints de Juegos, FAQs y Feature Flags (BGAI-0006) (100%)**

1. **Sistema de Feature Flags completo**
   * ✅ Servicio `app/services/feature_flags.py` con validación jerárquica de acceso
   * ✅ Evaluación por scopes: `user` → `game` → `section` → `global` (más específico a menos específico)
   * ✅ Roles especiales: Admin (acceso total), Developer+Tester en dev (acceso a beta)
   * ✅ Funciones: `check_feature_access()`, `check_game_access()`, `check_faq_access()`, `check_chat_access()`
   * ✅ Feature flags de `game_access` agregados a seed.sql para basic, premium, tester

2. **Servicios de datos con control de acceso**
   * ✅ `app/services/games.py` - Servicio de juegos con filtrado por feature flags
   * ✅ `get_games_list(user_id, user_role, status_filter)` - Lista filtrada por acceso
   * ✅ `get_game_by_id(game_id, user_id, user_role)` - Detalle con validación
   * ✅ `get_game_feature_access(game_id, user_id, user_role)` - Feature access flags
   * ✅ `app/services/game_faqs.py` - FAQs con soporte multi-idioma
   * ✅ `get_game_faqs(game_id, language, fallback_to_en)` - Fallback automático ES → EN

3. **Endpoints REST implementados**
   * ✅ `GET /games` - Lista de juegos accesibles según rol y feature flags
     * Filtrado por status (active, beta, hidden)
     * Solo muestra juegos a los que el usuario tiene acceso
     * Testers/admins ven juegos beta, basic/premium solo activos
   * ✅ `GET /games/{id}` - Detalle de juego con feature access flags
     * Validación de acceso via feature flags
     * Incluye `has_faq_access` y `has_chat_access` para UI
     * 404 si no existe o sin acceso (previene enumeración)
   * ✅ `GET /games/{id}/faqs?lang=es` - FAQs multi-idioma con fallback
     * Soporte ES/EN desde MVP
     * Fallback automático si idioma no disponible
     * Validación de acceso a FAQs via feature flags
     * Respuesta incluye idioma real usado

4. **Modelos Pydantic agregados** (`app/models/schemas.py`)
   * ✅ `Game` - Modelo completo de juego con datos BGG
   * ✅ `GameListItem` - Modelo simplificado para listas (optimizado)
   * ✅ `GameFAQ` - FAQ multi-idioma
   * ✅ `FeatureFlag` - Configuración de feature flag
   * ✅ `FeatureAccess` - Resultado de validación de acceso
   * ✅ `GamesListResponse`, `GameDetailResponse`, `GameFAQsResponse` - DTOs de API

5. **Testing completo**
   * ✅ `tests/test_games_endpoints.py` - 15 tests de integración (100% passed)
   * ✅ Tests de autenticación requerida en todos los endpoints
   * ✅ Tests de control de acceso por roles (basic, premium, tester)
   * ✅ Tests de multi-idioma con fallback
   * ✅ Tests de manejo de errores (404, 403, 422)
   * ✅ Cobertura 100% de lógica de endpoints

6. **Documentación técnica**
   * ✅ `docs/BGAI-0006_games-endpoints.md` - Documentación completa
   * ✅ Contratos de API, ejemplos de uso, arquitectura de feature flags
   * ✅ Instrucciones de testing, notas de migración, consideraciones de seguridad

#### **App móvil - Integración UI de juegos (BGAI-0007) (100%)**

1. **Consumo real de backend**
   * ✅ Servicios `gamesApi.getGames/getGameDetail/getGameFAQs` apuntan al FastAPI real con headers de Supabase.
   * ✅ Hooks `useGames` y `useGameDetail` manejan loading/error states, tokens y filtros por rol.
2. **Pantallas finalizadas**
   * ✅ `GameListScreen` usa datos reales, maneja pull-to-refresh y estados vacíos.
   * ✅ `GameDetailScreen` muestra métricas BGG, estado de features y FAQs dinámicas con fallback ES/EN.
3. **Acceso controlado**
   * ✅ UI respeta `has_faq_access`/`has_chat_access` y muestra mensajes según feature flags.
4. **Documentación**
   * ✅ `docs/BGAI-0007_mobile-games-integration.md` describe hooks, rutas y escenarios cubiertos.

#### **App móvil - Localización + selector de idioma (BGAI-0008) (100%)**

1. **Infraestructura i18n**
   * ✅ `LanguageProvider`, `useLanguage` y catálogo `translations.ts` cubren ES/EN.
   * ✅ Preferencia persistida en AsyncStorage y leída al boot.
2. **Cobertura de pantallas**
   * ✅ Auth, Home, BGC, Chat, Profile y navegación consumen `t(key)`.
   * ✅ `useGameDetail`/`useGames` relanzan fetch al cambiar el idioma.
3. **Selector visible**
   * ✅ Componente `LanguageSelector` disponible en el perfil; cambio inmediato en toda la app.
4. **QA**
   * ✅ `npm run lint` con ESLint de Expo y correcciones de estilo asociadas.

#### **App móvil - Historial "Chat" (BGAI-0009) (100%)**

1. **Renombrado del tab**
   * ✅ El tab inferior pasó de "Chat" a "Historial/History" en ambos idiomas.
   * ✅ `LanguageProvider` expone las nuevas claves `history.*`.
2. **Pantalla preparatoria**
   * ✅ `ChatScreen` ahora muestra un historial placeholder de sesiones por juego, en vez de un chat mock.
   * ✅ El mensaje comunica que el chat IA llegará pronto y servirá como hub de conversaciones.
3. **Documentación**
   * ✅ `docs/BGAI-0009_mobile-chat-history.md` explica el motivo y el plan previo a implementar `POST /genai/query`.

#### **Portal de Administración de Juegos (BGAI-0010, BGAI-0011) (100%)**

**BGAI-0010 — Backend Admin API**

1. **Endpoints administrativos completos** (`backend/app/api/routes/admin.py`)
   * ✅ `POST /admin/games` - Crear juego
   * ✅ `PATCH /admin/games/{id}` - Actualizar juego
   * ✅ `POST /admin/games/import-bgg` - Importar desde BoardGameGeek
   * ✅ `POST /admin/games/{id}/faqs` - Crear FAQ
   * ✅ `PATCH /admin/games/{id}/faqs/{faq_id}` - Actualizar FAQ
   * ✅ `DELETE /admin/games/{id}/faqs/{faq_id}` - Eliminar FAQ
   * ✅ `POST /admin/games/{id}/documents` - Crear documento
   * ✅ `POST /admin/games/{id}/process-knowledge` - Procesar conocimiento para RAG
   * ✅ Todos los endpoints protegidos con `require_role("admin", "developer")`

2. **Servicios de administración** (`backend/app/services/admin_games.py`)
   * ✅ Operaciones CRUD para juegos, FAQs y documentos
   * ✅ Integración con BGG API para importar juegos
   * ✅ Orquestación de procesamiento de conocimiento
   * ✅ Validación de permisos y manejo de errores

3. **Integración BGG** (`backend/app/services/bgg.py`)
   * ✅ Cliente XML para BoardGameGeek API
   * ✅ Parseo de metadatos (nombre, jugadores, tiempo, rating, imágenes)
   * ✅ Manejo de errores para juegos no encontrados
   * ✅ Tests unitarios completos

4. **Esquema de conocimiento** [DEPRECATED]
   * ~~`supabase/migrations/20241125000000_add_knowledge_documents.sql`~~ - Tabla removida en migración 20241127
   * ✅ **Nov 2024**: Migración `20241127000000_drop_knowledge_documents.sql` elimina tabla `knowledge_documents`
   * ✅ Metadata de procesamiento ahora se almacena directamente en `game_documents`

**BGAI-0011 — Frontend Next.js**

1. **Proyecto Next.js completo** (`admin-portal/`)
   * ✅ Next.js 16 (React 19) con App Router y TypeScript
   * ✅ Tailwind CSS para diseño profesional
   * ✅ 2,213+ líneas de código TypeScript/React
   * ✅ 35 archivos principales creados
   * ✅ 410 paquetes npm instalados

2. **Sistema de autenticación**
   * ✅ Login con Supabase Auth
   * ✅ Validación de roles (solo admin/developer)
   * ✅ Protección de rutas con middleware
   * ✅ Persistencia de sesión
   * ✅ Integración con backend `/auth/me`

3. **Gestión de juegos**
   * ✅ Lista de juegos con búsqueda y filtros por status
   * ✅ Modal de importación desde BGG
   * ✅ Detalle de juego con tabs (Home, FAQs, Documentos)
   * ✅ Edición inline de información
   * ✅ Botón "Sync from BGG"
   * ✅ Estados de carga y manejo de errores

4. **Gestión de FAQs (CRUD completo)**
   * ✅ Crear FAQs en Español e Inglés
   * ✅ Editar y eliminar FAQs
   * ✅ Filtrado por idioma
   * ✅ Control de visibilidad y orden
   * ✅ Validación con React Hook Form + Zod

5. **Gestión de documentos**
   * ✅ Crear referencias de documentos
   * ✅ Listar documentos con estado (pending, processing, ready)
   * ✅ Botón "Process Knowledge" con multi-selección
   * ✅ Tracking de estado de procesamiento
   * ✅ Filtrado por idioma y tipo de fuente

6. **UI/UX profesional**
   * ✅ Layout con sidebar y header
   * ✅ Componentes reutilizables (Button, Input, Modal, Tabs, etc.)
   * ✅ Loading states y spinners
   * ✅ Notificaciones de éxito/error
   * ✅ Confirmaciones para acciones destructivas
   * ✅ Diseño responsive

7. **Cliente API TypeScript** (`admin-portal/lib/api.ts`)
   * ✅ Axios configurado con interceptores
   * ✅ Headers de autenticación automáticos
   * ✅ Manejo de errores 401/403/404
   * ✅ Types completos para requests/responses
   * ✅ Integración con todos los endpoints admin

8. **Documentación completa**
   * ✅ `admin-portal/README.md` - Documentación funcional/técnica consolidada del portal
   * ✅ `admin-portal/SETUP.md` - Guía rápida (3 pasos)
   * ✅ `docs/BGAI-0011_admin-portal-frontend.md` - Documentación técnica oficial

#### **Portal de Administración - Creación manual de juegos y mejoras BGG (BGAI-0012) (100%)**

1. **Flujo de creación manual completo**
   * ✅ Nuevo modal `CreateGameModal` que permite capturar todos los metadatos (jugadores, duración, rating, imágenes) sin depender de BGG.
   * ✅ Endpoints existentes (`POST /admin/games`) ahora reciben los campos opcionales y los validan correctamente.

2. **Endpoint y servicio de secciones**
   * ✅ Servicio `app/services/sections.py` y endpoint público `GET /sections` alimentan los dropdowns del portal.
   * ✅ Tipos compartidos (`AppSection`) alineados entre backend y frontend; script SQL `insert_bgc_section.sql` garantiza la sección BGC.

3. **Hardening de la integración BGG**
   * ✅ Cliente httpx ahora usa `follow_redirects=True`, User-Agent descriptivo y manejo explícito de 401/errores.
   * ✅ Importador desde el portal muestra mensajes más claros cuando la licencia aún no existe.

4. **Documentación y avisos**
   * ✅ `MVP.md`, `README.md` y `docs/BGAI-0010` incluyen la advertencia de licencia pendiente y los pasos de fallback.

#### **Portal de Administración - Dark Mode y theming (BGAI-0013) (100%)**

1. **Infraestructura de temas**
   * ✅ `ThemeProvider` + `ThemeToggle` permiten elegir `light`, `dark` o `system`, persisten en `localStorage` y respetan `prefers-color-scheme`.
   * ✅ Layout (`app/layout.tsx`) envuelve toda la app y evita hydration warnings al cambiar clases `dark`.

2. **Tokens y componentes**
   * ✅ `app/globals.css` y `tailwind.config.ts` definen variables CSS para background/foreground y tokens semánticos (`success`, `warning`).
   * ✅ Componentes compartidos (badges, alerts, tabs, header, game tabs) migraron a los nuevos tokens evitando colores hardcodeados.

3. **Documentación actualizada**
   * ✅ README raíz, `admin-portal/README.md` y `docs/BGAI-0011` documentan el toggle, paleta y riesgos de regresiones visuales.
   * ⚠️ `next lint` sigue fallando en Windows por bug del wrapper; se recomienda correr ESLint directo o desde WSL/macOS hasta aplicar el workaround.

### 🔄 En progreso

#### **Backend API REST - RAG + GenAI Adapter (50%)**
- ✅ **Gemini Provider completado** (BGAI-0015):
  - File Search Store management (uno por juego, multilenguaje)
  - Document upload con retry logic y error handling
  - Integración con `process_game_knowledge()`
  - Type safety completo, 14 tests passing
- **Estrategia actualizada**: Delegar vectorización a proveedores (OpenAI, Gemini, Claude).
- Pendiente:
  - Implementar adaptadores para OpenAI (Files API + Vector Stores) y Claude (Context Injection).
  - Endpoint `POST /genai/query` completo con delegación a proveedores.
  - Usar File Search Store IDs almacenados para queries RAG.

### 📋 Pendiente

1. **Backend API REST - Pipeline RAG + GenAI Adapter**
   * ✅ ~~Servicio de subida de documentos a Gemini File Search~~ (BGAI-0015 completado)
   * ✅ Gemini File Search integration completo (BGAI-0016):
     - ✅ Endpoint `POST /genai/query` con query execution contra Gemini File Search
     - ✅ Uso de File Search Store IDs para ejecutar queries RAG con documentos
     - ✅ Registro en `chat_sessions`, `chat_messages`, `usage_events`
     - ✅ Rate limiting basado en metadata de feature flags
   * ⏳ Adaptadores adicionales por proveedor:
     - ✅ Gemini: File API + File Search Stores (BGAI-0015 + BGAI-0016)
     - OpenAI: Files API + Vector Stores + Assistants API (future)
     - Claude: Context injection + Prompt Caching (future)

2. **Backend API REST - Utilidades y Jobs**
   * ⏳ Webhooks / jobs para sincronizar juegos (BGG + ingestión de chunks)
   * ⏳ Script para sincronizar juegos desde BGG API
   * ⏳ Servicio para registrar eventos en `usage_events` (analítica)
   * ⏳ Integrar logging en todos los endpoints principales

3. **App Móvil (React Native + Expo) - Integración Backend**
   * ✅ ~~Integrar Supabase JS para login real~~ (BGAI-0005)
   * ✅ ~~Conectar `/games` + `/games/{id}` y FAQs reales~~ (BGAI-0007)
   * ✅ ~~Añadir selector de idioma y UI bilingüe~~ (BGAI-0008)
   * ✅ Chat IA integrado con backend (BGAI-0016):
     - ✅ Hooks y servicios para `POST /genai/query`
     - ✅ UI del chat: pantalla, componentes (MessageBubble, ChatInput, TypingIndicator)
     - ✅ Historiales reales, session persistence, error handling, usage limits display
   * ⏳ Actualizar assets definitivos antes de publicar builds

4. **Pipeline de procesamiento de documentos**
   * ⏳ Job/servicio para procesar documentos:
     - Subir PDF a proveedor de IA (OpenAI Files API, Gemini File API).
     - Crear/actualizar vector store (si aplica).
     - Guardar referencias (`provider_file_id`, `vector_store_id`) en `game_documents`.
     - Actualizar estado (`uploaded` → `processing` → `ready`) y manejar errores.
   * ⏳ Integrar el botón/endpoint `POST /admin/games/{id}/process-knowledge` con dicho job (hoy solo marca estados).

5. **Mejoras adicionales de app móvil**
   - Assets definitivos (iconos, splash, ilustraciones).
   - Ajustes visuales + soporte para modo oscuro antes de publicar en TestFlight/Play.

6. **Integración y testing end-to-end**
   - Smoke tests completos: login → lista → detalle → chat IA.
   - Validar límites por rol/feature flag.
   - Performance testing básico.

---

## 11. Próximos pasos inmediatos (checklist de trabajo)

### ✅ Completado Recientemente

1. **BGAI-0007 — App móvil conectada a los endpoints reales de juegos**
   * Hooks, pantallas y servicios consumen `GET /games`, `GET /games/{id}` y FAQs con control de acceso.
   * Estados de carga/errores, pull-to-refresh y fallback multi-idioma funcionando en Expo/Android.
2. **BGAI-0008 — Localización completa con selector de idioma**
   * `LanguageProvider` + `LanguageSelector` entregan UI bilingüe y FAQs según la preferencia persistida.
3. **BGAI-0010 — Portal de Administración - Backend API**
   * Endpoints `/admin/...` completos para gestión de juegos, FAQs, documentos y procesamiento de conocimiento.
   * Integración BGG API para importar juegos automáticamente.
   * Tracking de procesamiento RAG almacenado directamente en `game_documents` (tabla `knowledge_documents` removida en Nov 2024).
4. **BGAI-0011 — Portal de Administración - Frontend Next.js**
   * Portal web completo con Next.js 16, React 19, TypeScript y Tailwind CSS (2,213+ líneas de código).
   * Autenticación con Supabase Auth y validación de roles (admin/developer).
   * UI completa para gestión de juegos (importar desde BGG, editar, sincronizar).
   * CRUD completo de FAQs con soporte multi-idioma (ES/EN).
   * Gestión de documentos con botón "Process Knowledge" para RAG.
   * Documentación completa en `admin-portal/` y `docs/BGAI-0011_admin-portal-frontend.md`.
5. **BGAI-0012 — Creación manual de juegos + endpoint `/sections`**
   * Modal nuevo para crear juegos sin depender de BGG, con todos los metadatos disponibles.
   * Servicio/endpoint público `/sections` alimenta los formularios del portal y asegura consistencia con `app_sections`.
   * Cliente BGG endurecido (redirects, User-Agent, manejo de errores) y documentación con la advertencia de licencia pendiente.
6. **BGAI-0013 — Dark Mode en el portal admin**
   * `ThemeProvider` + `ThemeToggle` persistente habilitan light/dark/system en todo el portal.
   * Tailwind + CSS variables definen tokens semánticos para fondos, texto y estados; badges/alerts/tabs usan las nuevas clases.
   * README y documentos técnicos actualizados con guía de uso y riesgos conocidos (ej. bug de `next lint` en Windows).
7. **Nov 2024 — Simplificación de gestión de documentos**
   * Eliminado campo `provider_name` de la UI y tabla `game_documents` (migración 20241126).
   * Auto-generación de `file_path` usando UUID del documento: `game_documents/{game_id}/{document_uuid}`.
   * Proveedor IA ahora se selecciona solo durante el procesamiento de conocimiento (no al crear documento).
   * Frontend: Actualizados types, formularios y visualización en Admin Portal.
   * Backend: Actualizados schemas y lógica de creación de documentos con generación automática de rutas.
   * Documentación actualizada: README, MVP y BGAI-0001.

8. **Nov 2024 — Eliminación de tabla knowledge_documents**
   * Removida tabla `knowledge_documents` (migración 20241127).
   * Metadata de procesamiento RAG ahora se almacena directamente en `game_documents`.
   * Backend: Actualizado servicio `process_game_knowledge` para eliminar creación de registros en tabla eliminada.
   * Backend: Actualizado schema `KnowledgeProcessResponse` para retornar contadores en lugar de registros.
   * Frontend: Admin Portal actualizado para manejar nueva estructura de respuesta del endpoint de procesamiento.
   * Seed data actualizado para eliminar inserts a tabla eliminada.
   * Documentación actualizada: README, MVP, BGAI-0001.

9. **BGAI-0015 — Integración completa de Gemini File Search para RAG (Dic 2024)**
   * **Servicio Gemini Provider** (`app/services/gemini_provider.py`):
     - Cliente singleton con API key validation
     - Gestión de File Search Stores (uno por juego, multilenguaje)
     - Descarga de documentos desde Supabase Storage usando endpoint directo `/storage/v1/object/`
     - Upload a Gemini con retry logic (3 intentos, exponential backoff)
     - Manejo de errores con excepciones custom (`GeminiProviderError`, `GeminiFileUploadError`, `GeminiFileSearchStoreError`)
     - Type safety completo con validación explícita de None values
   * **Integración en `process_game_knowledge()`**:
     - Provider dispatch: `if request.provider_name == "gemini"` llama al servicio Gemini
     - Actualiza `game_documents` con `provider_file_id` (operation name) y `vector_store_id` (store ID)
     - Marca documentos como `ready` después de procesamiento exitoso
     - Manejo de errores: marca documentos como `error` y continúa con batch
     - Metadata de procesamiento: `processed_with_provider`, `notes`, `triggered_by`
   * **Corrección de bug crítico** en `upload_document()`:
     - Separación de `storage_path` (sin bucket) y `file_path` (con bucket)
     - Previene duplicación de nombre de bucket en URLs de Supabase Storage
   * **Admin Portal UX mejorado**:
     - Eliminado prompt de selección de provider (hardcoded a 'gemini' para MVP)
     - Botón "Procesar" individual por documento con loading state
     - Confirmación simplificada antes de procesamiento
     - Auto-refresh de lista después de completar
   * **API Signature fixes**:
     - Correcto uso de `from google import genai` (google-genai 1.53.0)
     - Parámetros via `config` dict: `{mime_type, display_name}`
     - Endpoint directo para descarga (no signed URLs)
   * **Testing completo**:
     - 14 tests unitarios con FakeGeminiClient (100% passing)
     - Cobertura: store creation, upload, error handling, deletion
     - Tests usan file:// storage para evitar llamadas API
   * **Data Flow completo**:
     - Admin Portal → Backend → Gemini Provider → File Search Store
     - Persistencia en DB: `provider_file_id`, `vector_store_id`, `status='ready'`
     - Backward compatible: provider_name=None mantiene comportamiento existente
   * **Documentación**:
     - Tests: `backend/tests/services/test_gemini_provider.py` (375 líneas)
     - Servicio: `backend/app/services/gemini_provider.py` (316 líneas)
     - Environment: Requiere `GOOGLE_API_KEY` en `.env`

10. **BGAI-0016 — Chat IA con RAG - Endpoint `/genai/query` + UI Móvil (Dic 2024)**
   * **Backend: Endpoint `POST /genai/query`** (`backend/app/api/routes/genai.py`):
     - Validación de autenticación (JWT Bearer token)
     - Validación de acceso al juego por rol
     - Validación de acceso a feature chat mediante feature flags
     - Enforcement de límites diarios extraídos de metadata de feature flags
     - Gestión de sesiones (crear nueva o reutilizar existente)
     - Recuperación de vector_store_id desde `game_documents` con fallback ES → EN
     - Recuperación de historial de conversación (últimos 10 mensajes)
     - Query a Gemini File Search con contexto multi-turn
     - Almacenamiento de pregunta y respuesta en `chat_messages` con metadata (citations)
     - Actualización de stats de sesión (message count, token estimates)
     - Logging de dos eventos: `chat_question` y `chat_answer` con contexto detallado
     - Response con session_id, answer, citations, model_info, limits
   * **Backend: Servicios de soporte**:
     - `chat_sessions.py`: `get_or_create_session()`, `add_message()`, `get_session_history()`, `update_session_stats()`
     - `usage_tracking.py`: `check_daily_limit()` para enforcement de cuota, `log_usage_event()` para analytics
     - `feature_flags.py` (extended): `check_chat_access()` con validación de scope/role/metadata
     - `gemini_provider.py` (extended): `query_gemini()` con grounding en File Search Stores
   * **Mobile: Tipos y API Client**:
     - Tipos TypeScript: `ChatMessage`, `ChatSession`, `ChatQueryRequest`, `ChatQueryResponse`, `Citation`, `ModelInfo`, `UsageLimits`
     - Cliente HTTP: `sendChatMessage()` con injection de token Bearer y manejo de errores
   * **Mobile: Hook y Componentes**:
     - Hook `useChatSession()`: manejo de estado (messages, sessionId, isLoading, error), `sendMessage()` y `clearChat()`
     - Componentes de UI:
       - `MessageBubble.tsx`: render de mensajes con role-based styling y citations
       - `ChatInput.tsx`: text input multiline con limit 1000 chars + send button
       - `TypingIndicator.tsx`: loading animation durante respuesta
       - `GameChatScreen.tsx`: orquestación completa con FlatList, error banner, usage limits display
   * **Mobile: Integración**:
     - Botón "Open AI Chat" visible en GameDetail si usuario tiene acceso
     - Deep linking: `bgai://game/:gameId/chat`
     - Soporte multi-idioma completo ES/EN en UI y requests
     - Session persistence en app instance (reutiliza session_id en misma conversación)
   * **Database (Existing, reused)**:
     - `chat_sessions`: campos model_provider, model_name, total_messages, total_token_estimate
     - `chat_messages`: metadata JSON con citations y model_info
     - `usage_events`: logging de chat_question y chat_answer con extra_info detallado
     - `game_documents`: vector_store_id usado para semantic search
     - `feature_flags`: scope, feature_key='chat', metadata con daily_limit por rol
   * **Testing**:
     - Backend: tests para happy path, session reuse, language fallback, daily limit enforcement, no knowledge base, unauthorized, feature flag disabled, multi-turn conversation
     - Mobile: tests para send message, session persistence, error handling, clear chat, loading state
     - Integration: E2E full flow, rate limiting validation, language switching
   * **Documentación**:
     - Documento técnico: `docs/BGAI-0016_ai-chat-implementation.md` (comprehensive API docs, integration flow, test scenarios)
     - Ejemplos de request/response, descripción de 12-step pipeline, multi-language strategy

### 🎯 Prioridad Alta (Siguientes tareas)

1. ✅ **COMPLETADO: Backend API REST - Endpoint `/genai/query` para RAG** (BGAI-0016)
   * ✅ Gemini File Search integration con query execution
   * ✅ Uso de File Search Store IDs almacenados
   * ✅ Registro en `chat_sessions`, `chat_messages`, `usage_events` y rate limiting

2. ✅ **COMPLETADO: App móvil - Integración del chat IA** (BGAI-0016)
   * ✅ Hooks y servicios para `POST /genai/query`
   * ✅ UI del chat conectada al backend con manejo de errores e historiales reales

3. **Backend API REST - Analítica y utilidades**
   * ⏳ Servicio dedicado para `usage_events`.
   * ⏳ Instrumentación de logging y métricas en endpoints críticos.

### 🔧 Prioridad Media

4. **Scripts de utilidad y pipeline de documentos**
   * ⏳ Procesar al menos 5–10 juegos reales (PDFs → subida a proveedores → referencias en BD).
   * ⏳ Automatizar el botón “Process Knowledge” para subir a OpenAI/Gemini/Claude y marcar `ready`.
   * ⏳ Job/botón para sincronizar juegos desde BGG.

6. Afinar analítica y logging en backend:
   * ⏳ Servicio de `usage_events` y dashboards básicos.
  
7. **App móvil - mejoras adicionales**
   * ⏳ Assets definitivos (iconos, splash, ilustraciones).
   * ⏳ Ajustes visuales + soporte para modo oscuro antes de publicar en TestFlight/Play.

### 🧪 Prioridad Baja

7. ✅ **COMPLETADO: Integración y testing end-to-end** (BGAI-0016)
   * ✅ Smoke tests: login → lista → detalle → chat IA
   * ✅ Validación de límites por rol/feature flag
   * ⏳ Performance testing y optimización (future)

