-- =====================================================
-- BGAI - Board Game Assistant Intelligent
-- Initial Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- USERS & ROLES
-- =====================================================
-- Supabase Auth handles the main users table (auth.users)
-- We extend it with a custom profiles table for app-specific data

CREATE TYPE user_role AS ENUM ('admin', 'developer', 'basic', 'premium', 'tester');
CREATE TYPE environment_type AS ENUM ('dev', 'prod');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'basic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =====================================================
-- APP SECTIONS
-- =====================================================

CREATE TABLE public.app_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =====================================================
-- GAMES
-- =====================================================

CREATE TYPE game_status AS ENUM ('active', 'beta', 'hidden', 'archived');

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.app_sections(id) ON DELETE CASCADE,
  bgg_id INTEGER UNIQUE,
  name_base TEXT NOT NULL,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER, -- in minutes
  rating DECIMAL(3,2),
  thumbnail_url TEXT,
  image_url TEXT,
  status game_status NOT NULL DEFAULT 'active',
  last_synced_from_bgg_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_section ON public.games(section_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_bgg_id ON public.games(bgg_id);

-- =====================================================
-- GAME FAQs
-- =====================================================

CREATE TYPE language_code AS ENUM ('es', 'en');

CREATE TABLE public.game_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TYPE scope_type AS ENUM ('global', 'section', 'game', 'user');

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_type scope_type NOT NULL,
  scope_id UUID, -- references section_id, game_id, or user_id depending on scope_type
  feature_key TEXT NOT NULL,
  role user_role, -- NULL means applies to all roles
  environment environment_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB, -- for configuration like daily limits, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_scope ON public.feature_flags(scope_type, scope_id);
CREATE INDEX idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX idx_feature_flags_role ON public.feature_flags(role);
CREATE INDEX idx_feature_flags_environment ON public.feature_flags(environment);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);

-- =====================================================
-- CHAT SESSIONS
-- =====================================================

CREATE TYPE session_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini', 'claude', 'other');

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =====================================================
-- CHAT MESSAGES
-- =====================================================

CREATE TYPE message_sender AS ENUM ('user', 'assistant', 'system');

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- for citations, sources, model info, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);

-- =====================================================
-- GAME DOCS VECTORS (RAG)
-- =====================================================

CREATE TYPE source_type AS ENUM ('rulebook', 'faq', 'bgg', 'house_rules', 'other');

CREATE TABLE public.game_docs_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  language language_code NOT NULL,
  source_type source_type NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension, adjust if using other models
  metadata JSONB, -- page number, section, source document name, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_docs_game ON public.game_docs_vectors(game_id);
CREATE INDEX idx_game_docs_language ON public.game_docs_vectors(language);
CREATE INDEX idx_game_docs_source ON public.game_docs_vectors(source_type);
-- Vector similarity search index (HNSW for better performance)
CREATE INDEX idx_game_docs_embedding ON public.game_docs_vectors
  USING hnsw (embedding vector_cosine_ops);

-- =====================================================
-- USAGE EVENTS (Analytics)
-- =====================================================

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

CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  feature_key TEXT,
  event_type event_type NOT NULL,
  environment environment_type NOT NULL,
  extra_info JSONB, -- flexible field for event-specific data
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_game ON public.usage_events(game_id);
CREATE INDEX idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX idx_usage_events_timestamp ON public.usage_events(timestamp DESC);
CREATE INDEX idx_usage_events_environment ON public.usage_events(environment);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_docs_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- App sections: everyone can read enabled sections
CREATE POLICY "Anyone can view enabled sections" ON public.app_sections
  FOR SELECT USING (enabled = true);

-- Games: everyone can read active games
CREATE POLICY "Anyone can view active games" ON public.games
  FOR SELECT USING (status = 'active');

-- Game FAQs: everyone can read visible FAQs
CREATE POLICY "Anyone can view visible FAQs" ON public.game_faqs
  FOR SELECT USING (visible = true);

-- Feature flags: read-only for authenticated users (authorization logic in backend)
CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Chat sessions: users can only access their own sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages: users can only access messages from their sessions
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

-- Game docs vectors: read-only for authenticated users
CREATE POLICY "Authenticated users can view game docs" ON public.game_docs_vectors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usage events: users can create events, only view their own
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

-- Apply trigger to relevant tables
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

CREATE TRIGGER update_game_docs_vectors_updated_at BEFORE UPDATE ON public.game_docs_vectors
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
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Extended user profile data for app-specific fields';
COMMENT ON TABLE public.app_sections IS 'Modular sections of the app (e.g., Board Game Companion)';
COMMENT ON TABLE public.games IS 'Game catalog with BGG integration';
COMMENT ON TABLE public.game_faqs IS 'Multi-language FAQs per game';
COMMENT ON TABLE public.feature_flags IS 'Granular feature access control by scope, role, and environment';
COMMENT ON TABLE public.chat_sessions IS 'AI chat conversation sessions per user and game';
COMMENT ON TABLE public.chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE public.game_docs_vectors IS 'Vectorized game documentation for RAG (Retrieval Augmented Generation)';
COMMENT ON TABLE public.usage_events IS 'Analytics and usage tracking events';
