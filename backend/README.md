# BGAI Backend API

Backend API REST para Board Game Assistant Intelligent (BGAI).

## Stack Tecnológico

- **Python 3.13+** (Soporta 3.13.x y 3.14+ cuando esté disponible)
- **Poetry** - Gestión de dependencias moderno
- **FastAPI 0.115+** - Framework web asíncrono de alto rendimiento
- **Uvicorn** - Servidor ASGI con hot reload
- **Pydantic v2** - Validación de datos con máximo rendimiento
- **Supabase** - BaaS (Auth, PostgreSQL, Storage)
- **OpenAI / Google Gemini / Anthropic Claude** - Proveedores de IA
- **LangChain** - Framework para aplicaciones LLM
- **pgvector** - Extensión PostgreSQL para búsqueda vectorial

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py              # Aplicación FastAPI principal
│   ├── config.py            # Configuración y variables de entorno
│   ├── api/
│   │   ├── routes/          # Endpoints organizados por dominio
│   │   │   ├── health.py    # Health checks
│   │   │   ├── auth.py      # Autenticación (pendiente)
│   │   │   ├── games.py     # Juegos y FAQs (pendiente)
│   │   │   └── genai.py     # Pipeline RAG (pendiente)
│   │   └── dependencies.py  # Dependencias compartidas
│   ├── core/
│   │   ├── auth.py          # JWT validation, middleware (pendiente)
│   │   └── feature_flags.py # Feature flags (pendiente)
│   ├── services/
│   │   ├── supabase.py      # Cliente Supabase (pendiente)
│   │   ├── rag.py           # Pipeline RAG (pendiente)
│   │   └── analytics.py     # Analytics (pendiente)
│   ├── models/
│   │   └── schemas.py       # Modelos Pydantic (pendiente)
│   └── utils/
│       └── logger.py        # Logging (pendiente)
├── pyproject.toml          # ✅ Dependencias y configuración Poetry
├── poetry.lock             # Lock file (generado por Poetry)
├── .gitignore              # Git ignore
├── run.py                  # Script para ejecutar el servidor
└── README.md               # Esta documentación
```

**Notas importantes:**
- Variables de entorno (`.env` y `.env.example`) están en la **raíz del proyecto**, no en `backend/`
- Dependencias gestionadas con **Poetry** (no pip/requirements.txt)
- **Python 3.13+** requerido (soporta 3.14 cuando esté disponible)
- Linting con **Ruff** (reemplazo moderno de flake8)

## Requisitos Previos

- **Python 3.13+** (verificar con `python --version`)
  - Versión mínima: 3.13.0
  - Soporta Python 3.14 cuando esté disponible
- **Poetry 1.8+** - Gestor de dependencias moderno

## Instalación

### 1. Instalar Poetry

Si no tienes Poetry instalado:

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

**Linux/Mac:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Verifica la instalación:
```bash
poetry --version
```

### 2. Instalar dependencias

```bash
cd backend
poetry install
```

Esto creará automáticamente un entorno virtual y instalará todas las dependencias definidas en `pyproject.toml`.

### 3. Activar el entorno (opcional)

```bash
poetry shell
```

O ejecutar comandos directamente sin activar:
```bash
poetry run python run.py
```

## Configuración

### Variables de entorno

El backend lee las variables de entorno desde el archivo `.env` en **la raíz del proyecto** (no dentro de `backend/`).

Si no existe, copia el archivo `.env.example` a `.env` desde la raíz del proyecto:

```bash
# Desde la raíz del proyecto:
cp .env.example .env
```

Edita `.env` y configura:
- Claves de Supabase (ya configuradas para desarrollo local)
- Claves de AI providers (OpenAI, Gemini, Claude)
- Otras configuraciones según necesites

**Nota**: El archivo `backend/app/config.py` está configurado para leer automáticamente desde `../../.env`

## Ejecución

### Modo desarrollo (con hot reload)

```bash
cd backend
poetry run python run.py
```

O si ya activaste el entorno con `poetry shell`:

```bash
python run.py
```

### Alternativa: Directamente con uvicorn

**Desarrollo:**
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Producción:**
```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Endpoints Disponibles

### Health Checks

- `GET /` - Root endpoint con información del servicio
- `GET /health` - Health check básico
- `GET /health/ready` - Readiness check

### Documentación API

Cuando el servidor está en modo debug (desarrollo):

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuración

La configuración se maneja a través de variables de entorno definidas en `.env`:

### Environment
- `ENVIRONMENT` - Entorno (dev/prod)
- `DEBUG` - Modo debug (true/false)

### Server
- `HOST` - Host del servidor (default: 0.0.0.0)
- `PORT` - Puerto del servidor (default: 8000)
- `RELOAD` - Hot reload (true/false)

### Supabase
- `SUPABASE_URL` - URL de Supabase
- `SUPABASE_ANON_KEY` - Clave anónima
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio
- `SUPABASE_JWT_SECRET` - Secreto JWT

### AI Providers
- `OPENAI_API_KEY` - Clave de OpenAI
- `GOOGLE_API_KEY` - Clave de Google (Gemini)
- `ANTHROPIC_API_KEY` - Clave de Anthropic (Claude)

### RAG Configuration
- `RAG_TOP_K` - Número de chunks a recuperar (default: 5)
- `RAG_SIMILARITY_THRESHOLD` - Umbral de similitud (default: 0.7)

## Desarrollo

### Tests

```bash
poetry run pytest
```

Con cobertura:
```bash
poetry run pytest --cov=app --cov-report=html
```

### Formateo de código

```bash
poetry run black app/
```

### Linting (Ruff - Moderno y rápido)

```bash
poetry run ruff check app/
```

Formatear con Ruff:
```bash
poetry run ruff check --fix app/
```

### Type checking

```bash
poetry run mypy app/
```

### Agregar nuevas dependencias

**Dependencia de producción:**
```bash
poetry add nombre-paquete
```

**Dependencia de desarrollo:**
```bash
poetry add --group dev nombre-paquete
```

### Exportar requirements.txt (si es necesario)

Para entornos que requieren `requirements.txt`:
```bash
poetry export -f requirements.txt --output requirements.txt --without-hashes
```

## Próximos Pasos

### Fase 1: Autenticación
- [ ] Middleware de validación JWT
- [ ] Endpoint `GET /auth/me`
- [ ] Extracción de user_id y role del token

### Fase 2: Juegos y FAQs
- [ ] `GET /games` - Lista filtrada por rol
- [ ] `GET /games/{id}` - Detalle del juego
- [ ] `GET /games/{id}/faqs` - FAQs por idioma

### Fase 3: Feature Flags
- [ ] Servicio de validación de acceso a features
- [ ] Rate limiting por rol
- [ ] Límites de uso

### Fase 4: Pipeline RAG
- [ ] Búsqueda vectorial en game_docs_vectors
- [ ] Integración con OpenAI/Gemini/Claude
- [ ] Endpoint `POST /genai/query`

### Fase 5: Analytics
- [ ] Registro de eventos en usage_events
- [ ] Tracking de uso por usuario/juego/feature

## Troubleshooting

### Error: Poetry command not found

Asegúrate de que Poetry está instalado y en tu PATH:

```bash
poetry --version
```

Si no está instalado, sigue las instrucciones de instalación arriba.

### Error: ModuleNotFoundError

Asegúrate de que las dependencias están instaladas:

```bash
poetry install
```

### Error: Connection to Supabase failed

Verifica que Supabase local está corriendo:

```bash
npx supabase status
```

Si no está corriendo:

```bash
npx supabase start
```

### Error: Python version incompatible

Este proyecto requiere **Python 3.13+**. Verifica tu versión:

```bash
python --version
```

Si tienes múltiples versiones de Python instaladas:

```bash
# Usar Python 3.13
poetry env use python3.13

# O especificar la ruta completa
poetry env use /path/to/python3.13
```

**Nota**: Python 3.14 será soportado automáticamente cuando esté disponible.

### Error: poetry.lock desactualizado

Si `poetry.lock` está desincronizado con `pyproject.toml`:

```bash
poetry lock --no-update
poetry install
```

## Recursos

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [OpenAI API](https://platform.openai.com/docs/)
- [pgvector](https://github.com/pgvector/pgvector)
