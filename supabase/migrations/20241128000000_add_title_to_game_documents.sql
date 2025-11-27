-- =====================================================
-- BGAI - Migration: Add title column to game_documents
-- Date: 2024-11-28
--
-- Context:
--   * Admin Portal now collects a human-readable title for each document upload
--   * Store this display title directly on game_documents so it can be returned via API
-- =====================================================

-- Add the title column if it is missing
ALTER TABLE public.game_documents
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Populate existing records using the original file_name as a best-effort default
UPDATE public.game_documents
SET title = COALESCE(NULLIF(title, ''), file_name, 'Document')
WHERE title IS NULL OR title = '';

-- Enforce NOT NULL to guarantee every document has a title
ALTER TABLE public.game_documents
  ALTER COLUMN title SET NOT NULL;

-- Document the new column
COMMENT ON COLUMN public.game_documents.title IS
  'Human-readable title supplied by admins when uploading documents.';

-- =====================================================
-- Migration complete
-- =====================================================
