-- Insert Board Game Companion section
-- This script creates the BGC section if it doesn't already exist

-- Check if BGC section exists and insert only if it doesn't
INSERT INTO public.app_sections (key, name, description, display_order, enabled)
SELECT 'BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.app_sections WHERE key = 'BGC'
);

-- Display the BGC section
SELECT id, key, name, description, display_order, enabled, created_at
FROM public.app_sections
WHERE key = 'BGC';
