## 0. Resumen ejecutivo del MVP

* **Producto:** App móvil “Board Game Assitant Inteligent” (BGAI), asistente modular para juegos de mesa.
* **Plataformas:** Android e iOS.
* **Arquitectura elegida:**

  * App móvil multiplataforma (React Native + Expo).
  * Backend principal en **Supabase** (Auth, Postgres, vectores con pgvector).
  * **Backend fino propio** (API REST) como fachada + **GenAI Adapter** (RAG por juego, integraciones IA).
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

  * Expuesto como API REST.
  * Faz de la app hacia:

    * Supabase (para datos).
    * Proveedores de IA (OpenAI/Gemini/Claude, etc.).
    * Posible n8n u orquestador en el futuro.
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

## 10. Próximos pasos (checklist de trabajo)

1. **Especificar el modelo de datos final**

   * Escribir un documento con:

     * todas las tablas (las listadas arriba),
     * campos y tipos,
     * relaciones (keys y foreign keys),
     * notas sobre índices para búsquedas por `game_id` y `language`.

2. **Diseñar la API del backend fino**

   * Mínimo:

     * `/app/login` / `/app/me` (o directamente usar el SDK de Supabase desde la app para auth).
     * `/app/games` (lista de juegos visibles para el usuario según rol y flags).
     * `/app/games/{id}` (detalle de juego + FAQs filtradas por idioma).
     * `/app/chat/session` (crear/recuperar sesión si decides separarlo de `query`).
     * `/genai/query` (endpoint de IA).
   * Definir para cada uno:

     * parámetros,
     * estructura de respuesta,
     * errores esperables.

3. **Definir reglas iniciales de feature flags**

   * Crear una lista inicial de flags:

     * `faq`, `chat`, `score_helper`, `meta_games`, `beta_features`, etc.
   * Configurar:

     * qué flags están activos por rol, entorno y juego.
     * por ejemplo:

       * `chat` habilitado global para basic/premium/tester en BGC en prod.
       * `score_helper` solo habilitado para tester y solo en dev.

4. **Planear el pipeline RAG inicial**

   * Elegir un flujo mínimo:

     * manual PDF o texto → chunking → embeddings → insert en `game_docs_vectors`.
   * Definir:

     * tamaño de chunk,
     * número de chunks recuperados,
     * filtros por `language` y `source_type`.

5. **Configurar entornos Supabase**

   * Crear proyecto Supabase dev y prod con el mismo esquema.
   * Documentar qué credenciales usa el backend fino en cada entorno.
   * Decidir cómo vas a configurar la app para apuntar a dev/prod (variables, builds separados, etc.).

6. **Analítica básica**

   * Establecer qué eventos vas a registrar en `usage_events` desde el primer build:

     * `game_open`, `faq_view`, `chat_question`, `chat_answer`.
   * Añadir en la app llamadas al backend que disparen esos registros (o que el backend los dispare en endpoints clave).

