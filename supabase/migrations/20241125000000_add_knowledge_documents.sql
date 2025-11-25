-- =====================================================
-- BGAI - Migration: Add knowledge_documents table
-- Date: 2024-11-25
--
-- Context:
--   * Portal de Administración needs to track knowledge-processing runs
--   * Knowledge artifacts reference uploaded game documents
--   * Table stores provider job info plus processing status metadata
-- =====================================================

CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  game_document_id UUID REFERENCES public.game_documents(id) ON DELETE SET NULL,
  language language_code NOT NULL,
  source_type source_type NOT NULL DEFAULT 'other',
  provider_name TEXT,
  provider_file_id TEXT,
  vector_store_id TEXT,
  status document_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_documents_game ON public.knowledge_documents(game_id);
CREATE INDEX idx_knowledge_documents_doc ON public.knowledge_documents(game_document_id);
CREATE INDEX idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX idx_knowledge_documents_provider ON public.knowledge_documents(provider_name);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view knowledge documents" ON public.knowledge_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage knowledge documents" ON public.knowledge_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );

CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.knowledge_documents IS 'Knowledge processing records linked to uploaded game documents (provider jobs, status, metadata)';
COMMENT ON COLUMN public.knowledge_documents.provider_name IS 'AI provider handling the knowledge ingestion (openai, gemini, claude, other)';
COMMENT ON COLUMN public.knowledge_documents.metadata IS 'JSON metadata describing processing context, e.g., trigger info, batch id, chunk counts';
