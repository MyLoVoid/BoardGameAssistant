-- =====================================================
-- BGAI - Migration: game_docs_vectors → game_documents
-- Date: 2024-11-24
--
-- Changes:
-- 1. Rename table from game_docs_vectors to game_documents
-- 2. Remove pgvector-specific columns (chunk_text, embedding)
-- 3. Add new columns for AI provider integration
-- 4. Update indexes for new structure
-- 5. Update RLS policies
-- 6. Update triggers
-- =====================================================

-- =====================================================
-- Step 1: Create new ENUM types
-- =====================================================

-- Document processing status
CREATE TYPE document_status AS ENUM ('pending', 'uploading', 'processing', 'ready', 'error');

-- Extend source_type to include 'expansion'
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'expansion';

-- =====================================================
-- Step 2: Rename table and drop old columns
-- =====================================================

-- Rename the table
ALTER TABLE public.game_docs_vectors RENAME TO game_documents;

-- Drop the pgvector extension columns (no longer needed)
ALTER TABLE public.game_documents DROP COLUMN IF EXISTS chunk_text;
ALTER TABLE public.game_documents DROP COLUMN IF EXISTS embedding;

-- =====================================================
-- Step 3: Add new columns for AI provider integration
-- =====================================================

ALTER TABLE public.game_documents
  ADD COLUMN file_name TEXT NOT NULL DEFAULT 'unknown.pdf',
  ADD COLUMN file_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN file_type TEXT NOT NULL DEFAULT 'application/pdf',
  ADD COLUMN provider_name TEXT, -- 'openai', 'gemini', 'claude', or null
  ADD COLUMN provider_file_id TEXT, -- File ID in the provider's system
  ADD COLUMN vector_store_id TEXT, -- Vector store ID (if applicable, e.g., OpenAI)
  ADD COLUMN status document_status NOT NULL DEFAULT 'pending',
  ADD COLUMN error_message TEXT,
  ADD COLUMN processed_at TIMESTAMPTZ,
  ADD COLUMN uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Remove defaults after adding columns (for future inserts)
ALTER TABLE public.game_documents
  ALTER COLUMN file_name DROP DEFAULT,
  ALTER COLUMN file_path DROP DEFAULT,
  ALTER COLUMN file_size DROP DEFAULT,
  ALTER COLUMN file_type DROP DEFAULT;

-- =====================================================
-- Step 4: Update indexes
-- =====================================================

-- Drop old vector index (HNSW)
DROP INDEX IF EXISTS idx_game_docs_embedding;

-- Rename existing indexes
ALTER INDEX IF EXISTS idx_game_docs_game RENAME TO idx_game_documents_game;
ALTER INDEX IF EXISTS idx_game_docs_language RENAME TO idx_game_documents_language;
ALTER INDEX IF EXISTS idx_game_docs_source RENAME TO idx_game_documents_source;

-- Add new indexes for the updated structure
CREATE INDEX idx_game_documents_status ON public.game_documents(status);
CREATE INDEX idx_game_documents_provider ON public.game_documents(provider_name);
CREATE INDEX idx_game_documents_provider_file ON public.game_documents(provider_name, provider_file_id);
CREATE INDEX idx_game_documents_game_language_status ON public.game_documents(game_id, language, status);

-- =====================================================
-- Step 5: Update RLS policies
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Authenticated users can view game docs" ON public.game_documents;

-- Create new policy with updated table name
CREATE POLICY "Authenticated users can view game documents" ON public.game_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add policy for admin operations (insert/update/delete)
CREATE POLICY "Admins can manage game documents" ON public.game_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );

-- =====================================================
-- Step 6: Update triggers
-- =====================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS update_game_docs_vectors_updated_at ON public.game_documents;

-- Create new trigger with updated name
CREATE TRIGGER update_game_documents_updated_at BEFORE UPDATE ON public.game_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Step 7: Update table comment
-- =====================================================

COMMENT ON TABLE public.game_documents IS 'Game documents uploaded to AI provider vector stores (OpenAI, Gemini, Claude) for RAG';
COMMENT ON COLUMN public.game_documents.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN public.game_documents.file_path IS 'Path in Supabase Storage';
COMMENT ON COLUMN public.game_documents.provider_name IS 'AI provider: openai, gemini, claude, or null if not yet uploaded';
COMMENT ON COLUMN public.game_documents.provider_file_id IS 'File ID in the provider system (e.g., OpenAI file-xxx)';
COMMENT ON COLUMN public.game_documents.vector_store_id IS 'Vector store ID in the provider system (e.g., OpenAI vs_xxx)';
COMMENT ON COLUMN public.game_documents.status IS 'Processing status: pending, uploading, processing, ready, error';
COMMENT ON COLUMN public.game_documents.metadata IS 'Additional metadata: page numbers, sections, source info, etc.';

-- =====================================================
-- Step 8: Data migration note
-- =====================================================

-- NOTE: Any existing data in the old structure will need manual migration
-- or can be considered as seed data to be recreated with the new structure.
-- For MVP, we recommend starting fresh with new document uploads.

-- If you need to preserve old data, you would need to:
-- 1. Extract relevant metadata from old chunk_text
-- 2. Map to new file-based structure
-- 3. Upload files to Supabase Storage
-- 4. Upload to AI provider vector stores
-- 5. Update records with provider IDs

-- =====================================================
-- Step 9: Remove pgvector extension (optional)
-- =====================================================

-- NOTE: Only uncomment this if you're sure no other tables use pgvector
-- DROP EXTENSION IF EXISTS vector;

-- =====================================================
-- Migration complete
-- =====================================================

-- Verification query (run after migration):
-- SELECT
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_name = 'game_documents'
-- ORDER BY ordinal_position;
