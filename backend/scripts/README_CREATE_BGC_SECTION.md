# Crear Sección BGC (Board Game Companion)

Este script crea la sección "Board Game Companion" necesaria para que el botón "Import from BGG" funcione correctamente en el admin portal.

## Opción 1: Ejecutar SQL en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `insert_bgc_section.sql`
5. Haz clic en **Run** para ejecutar la query
6. Deberías ver el resultado mostrando la sección BGC creada

## Opción 2: Usando Python (requiere dependencias instaladas)

```bash
# Asegúrate de estar en el directorio backend
cd backend

# Activa tu entorno virtual (si tienes uno)
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Ejecuta el script
python scripts/create_bgc_section.py
```

## Verificar que funcionó

Ejecuta esta query en el SQL Editor de Supabase:

```sql
SELECT id, key, name, description, display_order, enabled
FROM public.app_sections
WHERE key = 'BGC';
```

Deberías ver una fila con:
- **key**: `BGC`
- **name**: `Board Game Companion`
- **enabled**: `true`

## Siguiente Paso

Una vez creada la sección, el dropdown "Section" en el modal "Import from BGG" debería mostrar "Board Game Companion" automáticamente.
