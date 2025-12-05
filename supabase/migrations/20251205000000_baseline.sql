-- =====================================================
-- BGAI - Board Game Assistant Intelligent
-- Baseline Database Schema (Consolidated)
-- Date: 2024-12-05
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
-- Note: Supabase Cloud already has these extensions enabled
-- Using IF NOT EXISTS to avoid conflicts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'developer', 'basic', 'premium', 'tester');

-- Environment type
CREATE TYPE environment_type AS ENUM ('dev', 'prod');

-- Game status
CREATE TYPE game_status AS ENUM ('active', 'beta', 'hidden', 'archived');

-- Language codes
CREATE TYPE language_code AS ENUM ('es', 'en');

-- Scope types for feature flags
CREATE TYPE scope_type AS ENUM ('global', 'section', 'game', 'user');

-- Chat session status
CREATE TYPE session_status AS ENUM ('active', 'closed', 'archived');

-- AI providers
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini', 'claude', 'other');

-- Message sender types
CREATE TYPE message_sender AS ENUM ('user', 'assistant', 'system');

-- Document source types (final state with all values)
CREATE TYPE source_type AS ENUM ('rulebook', 'faq', 'bgg', 'house_rules', 'expansion', 'quickstart', 'reference', 'other');

-- Document processing status
CREATE TYPE document_status AS ENUM ('uploaded', 'ready', 'error');

-- Analytics event types
CREATE TYPE event_type AS ENUM (
  'game_open',
  'faq_view',
  'chat_question',
  'chat_answer',
  'session_start',
  'session_end',
  'feature_access',
  'other'
);

-- =====================================================
-- USERS & PROFILES
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'basic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 'Extended user profile data for app-specific fields';

-- =====================================================
-- APP SECTIONS
-- =====================================================

CREATE TABLE public.app_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_sections_enabled ON public.app_sections(enabled);
CREATE INDEX idx_app_sections_order ON public.app_sections(display_order);

COMMENT ON TABLE public.app_sections IS 'Modular sections of the app (e.g., Board Game Companion)';

-- =====================================================
-- GAMES
-- =====================================================

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.app_sections(id) ON DELETE CASCADE,
  bgg_id INTEGER UNIQUE,
  name_base TEXT NOT NULL,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  rating DECIMAL(3,2),
  thumbnail_url TEXT,
  image_url TEXT,
  status game_status NOT NULL DEFAULT 'active',
  description TEXT,
  last_synced_from_bgg_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_section ON public.games(section_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_bgg_id ON public.games(bgg_id);

COMMENT ON TABLE public.games IS 'Game catalog with BGG integration';
COMMENT ON COLUMN public.games.description IS 'Localized description or summary for display in clients (populated via BGG sync or manual edits)';

-- =====================================================
-- GAME FAQs
-- =====================================================

CREATE TABLE public.game_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  language language_code NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_faqs_game ON public.game_faqs(game_id);
CREATE INDEX idx_game_faqs_language ON public.game_faqs(language);
CREATE INDEX idx_game_faqs_visible ON public.game_faqs(visible);
CREATE INDEX idx_game_faqs_order ON public.game_faqs(game_id, display_order);

COMMENT ON TABLE public.game_faqs IS 'Multi-language FAQs per game';

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type scope_type NOT NULL,
  scope_id UUID,
  feature_key TEXT NOT NULL,
  role user_role,
  environment environment_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_scope ON public.feature_flags(scope_type, scope_id);
CREATE INDEX idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX idx_feature_flags_role ON public.feature_flags(role);
CREATE INDEX idx_feature_flags_environment ON public.feature_flags(environment);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);

COMMENT ON TABLE public.feature_flags IS 'Granular feature access control by scope, role, and environment';

-- =====================================================
-- CHAT SESSIONS
-- =====================================================

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  language language_code NOT NULL,
  model_provider ai_provider NOT NULL,
  model_name TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'active',
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_token_estimate INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_game ON public.chat_sessions(game_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_activity ON public.chat_sessions(last_activity_at DESC);

COMMENT ON TABLE public.chat_sessions IS 'AI chat conversation sessions per user and game';

-- =====================================================
-- CHAT MESSAGES
-- =====================================================

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);

COMMENT ON TABLE public.chat_messages IS 'Individual messages within chat sessions';

-- =====================================================
-- GAME DOCUMENTS (RAG)
-- =====================================================

CREATE TABLE public.game_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  language language_code NOT NULL,
  source_type source_type NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  provider_file_id TEXT,
  vector_store_id TEXT,
  status document_status NOT NULL DEFAULT 'uploaded',
  error_message TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_documents_game ON public.game_documents(game_id);
CREATE INDEX idx_game_documents_language ON public.game_documents(language);
CREATE INDEX idx_game_documents_source ON public.game_documents(source_type);
CREATE INDEX idx_game_documents_status ON public.game_documents(status);
CREATE INDEX idx_game_documents_provider_file_id ON public.game_documents(provider_file_id) WHERE provider_file_id IS NOT NULL;
CREATE INDEX idx_game_documents_game_language_status ON public.game_documents(game_id, language, status);

COMMENT ON TABLE public.game_documents IS 'Game documents uploaded to Supabase Storage for RAG processing. Provider selection and processing metadata tracked here.';
COMMENT ON COLUMN public.game_documents.title IS 'Human-readable title supplied by admins when uploading documents.';
COMMENT ON COLUMN public.game_documents.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN public.game_documents.file_path IS 'Auto-generated path in Supabase Storage using document UUID';
COMMENT ON COLUMN public.game_documents.provider_file_id IS 'File ID in the AI provider system (e.g., OpenAI file-xxx), set during knowledge processing';
COMMENT ON COLUMN public.game_documents.vector_store_id IS 'Vector store ID in the AI provider system (e.g., OpenAI vs_xxx), set during knowledge processing';
COMMENT ON COLUMN public.game_documents.status IS 'Processing status: uploaded, ready, or error';
COMMENT ON COLUMN public.game_documents.metadata IS 'Additional metadata: page numbers, sections, source info, etc.';

-- =====================================================
-- USAGE EVENTS (Analytics)
-- =====================================================

CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  feature_key TEXT,
  event_type event_type NOT NULL,
  environment environment_type NOT NULL,
  extra_info JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_game ON public.usage_events(game_id);
CREATE INDEX idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX idx_usage_events_timestamp ON public.usage_events(timestamp DESC);
CREATE INDEX idx_usage_events_environment ON public.usage_events(environment);

COMMENT ON TABLE public.usage_events IS 'Analytics and usage tracking events';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- App sections policies
CREATE POLICY "Anyone can view enabled sections" ON public.app_sections
  FOR SELECT USING (enabled = true);

-- Games policies
CREATE POLICY "Anyone can view active games" ON public.games
  FOR SELECT USING (status = 'active');

-- Game FAQs policies
CREATE POLICY "Anyone can view visible FAQs" ON public.game_faqs
  FOR SELECT USING (visible = true);

-- Feature flags policies
CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Chat sessions policies
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat messages in own sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Game documents policies
CREATE POLICY "Authenticated users can view game documents" ON public.game_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage game documents" ON public.game_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );

-- Usage events policies
CREATE POLICY "Users can view own usage events" ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create usage events" ON public.usage_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_sections_updated_at BEFORE UPDATE ON public.app_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_faqs_updated_at BEFORE UPDATE ON public.game_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_documents_updated_at BEFORE UPDATE ON public.game_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'basic')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKET FOR GAME DOCUMENTS
-- =====================================================

-- Create the private bucket for game documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('game_documents', 'game_documents', false)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Allow admin/developer roles to read objects for signed URLs
CREATE POLICY "Admin portal can read game documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'game_documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'developer')
    )
  );

-- =====================================================
-- BASELINE COMPLETE
-- =====================================================
