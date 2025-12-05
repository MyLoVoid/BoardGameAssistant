# BGAI-0015 – Finalizar estrategia File Search (Gemini)

## Overview
- **Objetivo:** cerrar la tarea BGAI-0015 habilitando el flujo “Process Knowledge” contra Gemini File Search.
- **Alcance:** frontend del portal admin, tipos compartidos, configuración/env vars, servicio `process_game_knowledge`, cliente Gemini y suite de tests.
- **Contexto:** era necesario conectar Supabase Storage ↔ Gemini, exponer `provider_name` desde el portal y registrar resultados/unhandled errors de forma consistente.

## Summary
- Portal admin ahora solicita el proveedor (`gemini`/`openai`) antes de disparar el procesamiento y muestra los contadores `success_count`/`error_count` que devuelve el backend.
- Los tipos compartidos (`ProcessKnowledgeRequest/Response`) se alinearon con el esquema FastAPI, permitiendo portar `provider_name`, `processed_document_ids` y los contadores sin adapters locales.
- El backend añade `supabase_project_id` y `google_api_key` a `Settings`, habilitando la firma de URLs y la autenticación frente a Gemini.
- `process_game_knowledge` orquesta a Gemini: descarga el documento desde Supabase Storage mediante URLs firmadas, sube el archivo a File Search y actualiza `provider_file_id`, `vector_store_id`, metadatos y errores por documento.
- Se incorporó el módulo `app/services/gemini_provider.py` con manejo de stores, descarga de archivos (`file://` o Supabase Storage), reintentos y excepciones específicas.
- La suite `backend/tests/services/test_gemini_provider.py` utiliza un cliente en memoria + archivos reales en `tmp_path` para cubrir éxito, errores de firma/descarga y operaciones de borrado.

## Modified Files
- `admin-portal/components/games/documents-tab.tsx` – Prompt al seleccionar proveedor, paso de `provider_name` y uso de `success_count`/`error_count` en los mensajes de éxito.
- `admin-portal/lib/types.ts` – Nuevos campos para `ProcessKnowledgeRequest` y estructura real de `ProcessKnowledgeResponse`.
- `backend/app/config.py` – Campos `supabase_project_id` y `google_api_key` para inyectar la configuración necesaria en servicios Gemini/Storage.
- `backend/app/services/admin_games.py` – Generación de `storage_path`, dispatch según proveedor, persistencia de metadata de procesamiento y manejo de `GeminiProviderError` sin romper el batch.
- `backend/app/services/gemini_provider.py` – Nuevo servicio con creación de stores, descarga firmada desde Supabase Storage, subida con reintentos y helpers de borrado.
- `backend/tests/services/test_gemini_provider.py` – Suite de pruebas con cliente falso + fixtures que suben archivos reales al flujo Gemini.
- `.env.example` – Documenta `SUPABASE_PROJECT_ID` (necesario para firmar URLs desde dev).

## Detailed Changes

### Admin Portal
- Botón “Process Knowledge” solicita proveedor via `window.prompt`, valida valores permitidos y envía `provider_name` al backend.
- El resultado del endpoint ya no se reduce sobre un arreglo `results`; ahora usa directamente `success_count` y `error_count` para ofrecer feedback inmediato.

### Backend Configuración
- `Settings` incluye `supabase_project_id` y `google_api_key`, con soporte para `None` → detección automática leyendo `supabase/config.toml`.
- `.env.example` documenta la variable `SUPABASE_PROJECT_ID=boardgameassistant-dev` para alinear CLI ↔ backend.

### Servicio admin (process_game_knowledge)
- Los documentos generan `storage_path` relativo al bucket y se suben usando `upload_file_to_bucket(bucket, storage_path, ...)`.
- Al procesar: casos `gemini`, `openai` (placeholder) y fallback sin proveedor. Gemini devuelve `file_uri` y `file_search_store_id` que se persisten como `provider_file_id` y `vector_store_id` respectivamente.
- Metadata enriquecida con `processed_with_provider`, `processed_at_timestamp`, `notes` y `triggered_by`. En errores de Gemini se marca `status = error` y se persiste `error_message` sin abortar el resto del lote.

### Gemini Provider
- `_download_file_from_storage` soporta rutas `file://` (tests) y Supabase Storage firmando URLs (`/object/sign/...`) con `x-project-ref` + claves de servicio. Expone errores diferenciados (sign/download) con el código HTTP.
- `_get_or_create_file_search_store` lista/crea stores con `display_name = game-{game_id}`.
- `upload_document_to_gemini` descarga desde Storage, crea un `BytesIO`, reintenta la carga (Tenacity) y devuelve `GeminiUploadResult` con `file_uri` + `file_search_store_id`.
- `delete_document_from_gemini` encapsula la llamada `file_search_stores.documents.delete` con manejo uniforme de excepciones.

### Testing
- `backend/tests/services/test_gemini_provider.py` define un cliente en memoria (`FakeGeminiClient`) y usa `tmp_path` para simular storage local (`file://`).
- Casos cubiertos: stores existentes/nuevos, errores al listar/crear, subida exitosa, archivos vacíos, fallos durante la carga, operaciones sin `operation.name`, firma/descarga fallida, borrado exitoso/erróneo.

## API / Config Notes
- Endpoint `POST /admin/games/{id}/process-knowledge` ahora espera/retorna `provider_name`, `success_count`, `error_count` y `processed_document_ids` según `schemas.KnowledgeProcessResponse`.
- Nuevas env vars: `SUPABASE_PROJECT_ID` (opcional, autodetectable en dev) y `GOOGLE_API_KEY` (para el cliente Gemini).
- No se agregaron migraciones; la ruta de almacenamiento sigue usando el bucket `game_documents` con claves auto-generadas.
