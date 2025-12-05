-- =====================================================
-- BGAI - Migration: Drop knowledge_documents table
-- Date: 2024-11-27
--
-- Context:
--   * knowledge_documents table is no longer needed
--   * Processing metadata is now tracked directly in game_documents
--   * Simplifies the architecture by removing redundant tracking
-- =====================================================

-- Drop the knowledge_documents table
-- This will automatically drop all associated indexes, triggers, and RLS policies
DROP TABLE IF EXISTS public.knowledge_documents CASCADE;

-- Update game_documents table comment to reflect that it now handles all processing tracking
COMMENT ON TABLE public.game_documents IS
  'Game documents uploaded to Supabase Storage for RAG processing. Provider selection and processing metadata tracked here.';
