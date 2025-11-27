-- =====================================================
-- BGAI - Migration: Remove provider_name from game_documents
-- Date: 2024-11-26
--
-- Context:
--   * provider_name is no longer needed in game_documents table
--   * Provider selection is now handled at the knowledge processing level
--   * This simplifies the document reference model
-- =====================================================

-- Remove provider_name column from game_documents
ALTER TABLE public.game_documents DROP COLUMN IF EXISTS provider_name;

-- Drop the index on provider_name if it exists
DROP INDEX IF EXISTS idx_game_documents_provider;
DROP INDEX IF EXISTS idx_game_documents_provider_file;

-- Recreate the provider_file index without provider_name
CREATE INDEX IF NOT EXISTS idx_game_documents_provider_file_id
  ON public.game_documents(provider_file_id)
  WHERE provider_file_id IS NOT NULL;

-- Update table comment
COMMENT ON TABLE public.game_documents IS
  'Game documents uploaded to Supabase Storage for RAG processing. Provider selection happens during knowledge processing.';

-- Update column comments
COMMENT ON COLUMN public.game_documents.file_path IS
  'Auto-generated path in Supabase Storage using document UUID';
COMMENT ON COLUMN public.game_documents.provider_file_id IS
  'File ID in the AI provider system (e.g., OpenAI file-xxx), set during knowledge processing';
COMMENT ON COLUMN public.game_documents.vector_store_id IS
  'Vector store ID in the AI provider system (e.g., OpenAI vs_xxx), set during knowledge processing';

-- =====================================================
-- Migration complete
-- =====================================================
