-- =====================================================
-- BGAI - Board Game Assistant Intelligent
-- Seed Data for Development Environment
-- =====================================================

-- =====================================================
-- TEST USERS
-- =====================================================
-- Note: In local development, you can create test users via Supabase Studio
-- or use the auth.users table directly. The profile will be auto-created
-- via the handle_new_user() trigger.
--
-- For manual testing, create users with these emails:
-- - admin@bgai.test (role: admin)
-- - developer@bgai.test (role: developer)
-- - tester@bgai.test (role: tester)
-- - premium@bgai.test (role: premium)
-- - basic@bgai.test (role: basic)
--
-- Password for all test users: Test123456!
--
-- You can create them via Supabase Studio UI or API calls.

-- For demo purposes, we'll insert profiles assuming users exist
-- In production, these would be created via signup flow

-- Insert test user IDs (replace with actual UUIDs after creating users in auth)
-- This is just for reference structure

-- =====================================================
-- APP SECTIONS
-- =====================================================

INSERT INTO public.app_sections (key, name, description, display_order, enabled) VALUES
  ('BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true),
  ('FUTURE_SECTION', 'Future Feature', 'Placeholder for future sections', 2, false);

-- =====================================================
-- GAMES
-- =====================================================

-- Get the BGC section ID
DO $$
DECLARE
  bgc_section_id UUID;
BEGIN
  SELECT id INTO bgc_section_id FROM public.app_sections WHERE key = 'BGC';

  -- Insert test games
  INSERT INTO public.games (section_id, bgg_id, name_base, min_players, max_players, playing_time, rating, status) VALUES
    (bgc_section_id, 174430, 'Gloomhaven', 1, 4, 120, 8.70, 'active'),
    (bgc_section_id, 167791, 'Terraforming Mars', 1, 5, 120, 8.38, 'active'),
    (bgc_section_id, 266192, 'Wingspan', 1, 5, 70, 8.05, 'active'),
    (bgc_section_id, 312484, 'Lost Ruins of Arnak', 1, 4, 120, 8.15, 'active'),
    (bgc_section_id, 822, 'Carcassonne', 2, 5, 45, 7.41, 'active');
END $$;

-- =====================================================
-- GAME FAQs
-- =====================================================

DO $$
DECLARE
  gloomhaven_id UUID;
  terraforming_id UUID;
  wingspan_id UUID;
BEGIN
  SELECT id INTO gloomhaven_id FROM public.games WHERE bgg_id = 174430;
  SELECT id INTO terraforming_id FROM public.games WHERE bgg_id = 167791;
  SELECT id INTO wingspan_id FROM public.games WHERE bgg_id = 266192;

  -- Gloomhaven FAQs (Spanish)
  INSERT INTO public.game_faqs (game_id, language, question, answer, display_order, visible) VALUES
    (gloomhaven_id, 'es', '¿Cómo se gana experiencia?', 'Los personajes ganan experiencia al completar objetivos de batalla, realizar acciones específicas marcadas con símbolos de XP, y al usar ciertas habilidades. La experiencia acumulada permite subir de nivel y desbloquear nuevas habilidades.', 1, true),
    (gloomhaven_id, 'es', '¿Qué pasa si un personaje pierde toda su vida?', 'Si un personaje llega a 0 HP o menos, queda exhausto y debe retirarse del escenario. El escenario puede continuar con los personajes restantes, pero si todos quedan exhaustos, el escenario se pierde.', 2, true),
    (gloomhaven_id, 'es', '¿Puedo cambiar mis cartas entre escenarios?', 'Sí, entre escenarios puedes cambiar libremente las cartas de tu mano activa, tu equipamiento y tus objetivos personales. Solo durante un escenario activo debes mantener las cartas elegidas.', 3, true);

  -- Gloomhaven FAQs (English)
  INSERT INTO public.game_faqs (game_id, language, question, answer, display_order, visible) VALUES
    (gloomhaven_id, 'en', 'How do I gain experience?', 'Characters gain experience by completing battle goals, performing specific actions marked with XP symbols, and using certain abilities. Accumulated experience allows you to level up and unlock new abilities.', 1, true),
    (gloomhaven_id, 'en', 'What happens if a character loses all health?', 'If a character reaches 0 HP or less, they become exhausted and must retire from the scenario. The scenario can continue with remaining characters, but if all become exhausted, the scenario is lost.', 2, true),
    (gloomhaven_id, 'en', 'Can I change my cards between scenarios?', 'Yes, between scenarios you can freely change your active hand cards, equipment, and personal quests. Only during an active scenario must you keep your chosen cards.', 3, true);

  -- Terraforming Mars FAQs (Spanish)
  INSERT INTO public.game_faqs (game_id, language, question, answer, display_order, visible) VALUES
    (terraforming_id, 'es', '¿Cómo funcionan las acciones estándar?', 'Las acciones estándar están disponibles para todos los jugadores en cualquier momento durante su turno. Incluyen: vender cartas por créditos, usar proyectos azules, reclamar hitos, financiar premios, y convertir plantas en bosques o calor en temperatura.', 1, true),
    (terraforming_id, 'es', '¿Cuándo termina el juego?', 'El juego termina al final de la generación en la que se completan los tres parámetros globales: oxígeno al 14%, temperatura a +8°C, y 9 océanos colocados. Luego se cuenta la puntuación final.', 2, true);

  -- Wingspan FAQs (Spanish)
  INSERT INTO public.game_faqs (game_id, language, question, answer, display_order, visible) VALUES
    (wingspan_id, 'es', '¿Cuándo se activan los poderes marrones?', 'Los poderes marrones (cuando se activa) se activan una vez por ronda cuando realizas la acción correspondiente al hábitat donde está el ave. Se activan de derecha a izquierda en ese hábitat.', 1, true),
    (wingspan_id, 'es', '¿Puedo guardar comida entre turnos?', 'Sí, no hay límite de recursos (comida, huevos) que puedes tener almacenados. Los recursos se acumulan entre turnos y rondas.', 2, true);
END $$;

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

DO $$
DECLARE
  bgc_section_id UUID;
BEGIN
  SELECT id INTO bgc_section_id FROM public.app_sections WHERE key = 'BGC';

  -- Global features for dev environment
  INSERT INTO public.feature_flags (scope_type, scope_id, feature_key, role, environment, enabled, metadata) VALUES
    -- Game access (global access for all users to all active games)
    ('global', NULL, 'game_access', 'basic', 'dev', true, '{"description": "Access to games catalog"}'),
    ('global', NULL, 'game_access', 'basic', 'prod', true, '{"description": "Access to games catalog"}'),
    ('global', NULL, 'game_access', 'premium', 'dev', true, '{"description": "Access to all games"}'),
    ('global', NULL, 'game_access', 'premium', 'prod', true, '{"description": "Access to all games"}'),
    ('global', NULL, 'game_access', 'tester', 'dev', true, '{"description": "Access to all games including beta"}'),
    ('global', NULL, 'game_access', 'tester', 'prod', true, '{"description": "Access to all games including beta"}'),

    -- FAQ access (all roles in both environments)
    ('global', NULL, 'faq', NULL, 'dev', true, '{"description": "Access to game FAQs"}'),
    ('global', NULL, 'faq', NULL, 'prod', true, '{"description": "Access to game FAQs"}'),

    -- Chat AI access with limits by role
    ('global', NULL, 'chat', 'basic', 'dev', true, '{"daily_limit": 50, "description": "AI chat assistant"}'),
    ('global', NULL, 'chat', 'basic', 'prod', true, '{"daily_limit": 20, "description": "AI chat assistant"}'),
    ('global', NULL, 'chat', 'premium', 'dev', true, '{"daily_limit": 500, "description": "AI chat assistant"}'),
    ('global', NULL, 'chat', 'premium', 'prod', true, '{"daily_limit": 200, "description": "AI chat assistant"}'),
    ('global', NULL, 'chat', 'tester', 'dev', true, '{"daily_limit": 999999, "description": "AI chat assistant - unlimited for testers"}'),
    ('global', NULL, 'chat', 'tester', 'prod', true, '{"daily_limit": 999999, "description": "AI chat assistant - unlimited for testers"}'),

    -- Score helper (future feature, only for testers in dev)
    ('global', NULL, 'score_helper', 'tester', 'dev', true, '{"description": "Score calculation helper - BETA"}'),
    ('global', NULL, 'score_helper', 'premium', 'dev', false, '{"description": "Score calculation helper - coming soon"}'),

    -- Beta features flag
    ('global', NULL, 'beta_features', 'tester', 'dev', true, '{"description": "Access to beta/experimental features"}'),
    ('global', NULL, 'beta_features', 'developer', 'dev', true, '{"description": "Access to beta/experimental features"}'),

    -- Section-level flags for BGC
    ('section', bgc_section_id, 'enabled', NULL, 'dev', true, '{"description": "Board Game Companion section enabled"}'),
    ('section', bgc_section_id, 'enabled', NULL, 'prod', true, '{"description": "Board Game Companion section enabled"}');

END $$;

-- =====================================================
-- SAMPLE GAME DOCUMENTS
-- =====================================================

-- Note: In a real scenario, documents would be uploaded via the Admin Portal
-- and then processed by the backend to upload to AI provider vector stores.
-- These are placeholder examples showing the expected structure after documents
-- have been uploaded and processed.

DO $$
DECLARE
  gloomhaven_id UUID;
  wingspan_id UUID;
  terraforming_id UUID;
BEGIN
  SELECT id INTO gloomhaven_id FROM public.games WHERE bgg_id = 174430;
  SELECT id INTO wingspan_id FROM public.games WHERE bgg_id = 266192;
  SELECT id INTO terraforming_id FROM public.games WHERE bgg_id = 167791;

  -- Sample documents for Gloomhaven (Spanish)
  -- These represent documents that have been uploaded to Supabase Storage
  -- and then processed to OpenAI's vector store
  INSERT INTO public.game_documents (
    game_id, language, source_type, file_name, file_path, file_size, file_type,
    provider_name, provider_file_id, vector_store_id, status, processed_at, metadata
  ) VALUES
    (
      gloomhaven_id, 'es', 'rulebook',
      'gloomhaven_rulebook_es.pdf',
      'documents/gloomhaven/es/rulebook.pdf',
      2547891, -- ~2.5MB
      'application/pdf',
      'openai',
      'file-abc123def456', -- Example OpenAI file ID
      'vs_xyz789', -- Example OpenAI vector store ID
      'ready',
      NOW(),
      '{"pages": 52, "version": "1.0", "source": "Official Rulebook"}'
    ),
    (
      gloomhaven_id, 'es', 'faq',
      'gloomhaven_faq_es.pdf',
      'documents/gloomhaven/es/faq.pdf',
      487234,
      'application/pdf',
      'openai',
      'file-faq123abc456',
      'vs_xyz789', -- Same vector store as rulebook
      'ready',
      NOW(),
      '{"pages": 8, "version": "2.1", "source": "Official FAQ"}'
    );

  -- Sample documents for Gloomhaven (English)
  INSERT INTO public.game_documents (
    game_id, language, source_type, file_name, file_path, file_size, file_type,
    provider_name, provider_file_id, vector_store_id, status, processed_at, metadata
  ) VALUES
    (
      gloomhaven_id, 'en', 'rulebook',
      'gloomhaven_rulebook_en.pdf',
      'documents/gloomhaven/en/rulebook.pdf',
      2634512,
      'application/pdf',
      'openai',
      'file-en123xyz789',
      'vs_en456abc',
      'ready',
      NOW(),
      '{"pages": 52, "version": "1.0", "source": "Official Rulebook"}'
    );

  -- Sample documents for Wingspan (English) - using Gemini
  INSERT INTO public.game_documents (
    game_id, language, source_type, file_name, file_path, file_size, file_type,
    provider_name, provider_file_id, vector_store_id, status, processed_at, metadata
  ) VALUES
    (
      wingspan_id, 'en', 'rulebook',
      'wingspan_rulebook_en.pdf',
      'documents/wingspan/en/rulebook.pdf',
      3124567,
      'application/pdf',
      'gemini',
      'gemini-file-abc123xyz', -- Example Gemini file ID
      NULL, -- Gemini doesn't use separate vector store IDs
      'ready',
      NOW(),
      '{"pages": 18, "version": "2.0", "source": "Official Rulebook"}'
    ),
    (
      wingspan_id, 'en', 'expansion',
      'wingspan_european_expansion.pdf',
      'documents/wingspan/en/european_expansion.pdf',
      1847293,
      'application/pdf',
      'gemini',
      'gemini-file-euro456def',
      NULL,
      'ready',
      NOW(),
      '{"pages": 12, "expansion": "European Expansion", "version": "1.0"}'
    );

  -- Sample document pending processing (Terraforming Mars)
  INSERT INTO public.game_documents (
    game_id, language, source_type, file_name, file_path, file_size, file_type,
    status, metadata
  ) VALUES
    (
      terraforming_id, 'es', 'rulebook',
      'terraforming_mars_rulebook_es.pdf',
      'documents/terraforming/es/rulebook.pdf',
      4123456,
      'application/pdf',
      'pending',
      '{"pages": 28, "version": "1.0", "note": "Awaiting upload to AI provider"}'
    );

END $$;

-- =====================================================
-- ANALYTICS EVENTS (Sample)
-- =====================================================

-- Note: In production, events would be created by actual user interactions
-- These are just examples of the structure

-- INSERT INTO public.usage_events (user_id, game_id, feature_key, event_type, environment, extra_info)
-- VALUES (
--   'user-uuid-here',
--   'game-uuid-here',
--   'chat',
--   'chat_question',
--   'dev',
--   '{"question_length": 45, "language": "es"}'
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to verify seed data after running:

-- SELECT COUNT(*) as total_games FROM public.games;
-- SELECT COUNT(*) as total_faqs FROM public.game_faqs;
-- SELECT COUNT(*) as total_flags FROM public.feature_flags;
-- SELECT key, name, enabled FROM public.app_sections;
-- SELECT name_base, status FROM public.games;
