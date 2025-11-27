-- =====================================================
-- BGAI - Board Game Assistant Intelligent
-- Seed Data for Development Environment
-- =====================================================

-- =====================================================
-- TEST USERS
-- =====================================================
-- Create 5 test users with different roles for local development.
-- Users are inserted into auth.users with encrypted passwords.
-- Profiles are auto-created by handle_new_user() trigger.
--
-- Available test users:
-- - admin@bgai.test (Admin123!)
-- - developer@bgai.test (Dev123!)
-- - tester@bgai.test (Test123!)
-- - premium@bgai.test (Premium123!)
-- - basic@bgai.test (Basic123!)
-- =====================================================

DO $$
DECLARE
  admin_id UUID;
  dev_id UUID;
  tester_id UUID;
  premium_id UUID;
  basic_id UUID;
BEGIN
  -- Create Admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@bgai.test',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Admin User","role":"admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_id;

  -- Create Developer user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'developer@bgai.test',
    crypt('Dev123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Developer User","role":"developer"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO dev_id;

  -- Create Tester user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'tester@bgai.test',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Tester User","role":"tester"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO tester_id;

  -- Create Premium user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'premium@bgai.test',
    crypt('Premium123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Premium User","role":"premium"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO premium_id;

  -- Create Basic user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'basic@bgai.test',
    crypt('Basic123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Basic User","role":"basic"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO basic_id;

  -- Update roles in profiles table (after trigger creates them)
  UPDATE public.profiles SET role = 'admin' WHERE id = admin_id;
  UPDATE public.profiles SET role = 'developer' WHERE id = dev_id;
  UPDATE public.profiles SET role = 'tester' WHERE id = tester_id;
  UPDATE public.profiles SET role = 'premium' WHERE id = premium_id;
  UPDATE public.profiles SET role = 'basic' WHERE id = basic_id;

  RAISE NOTICE 'Test users created successfully!';
END $$;

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
  INSERT INTO public.games (
    section_id,
    bgg_id,
    name_base,
    min_players,
    max_players,
    playing_time,
    rating,
    status,
    thumbnail_url,
    image_url
  ) VALUES
    (
      bgc_section_id,
      174430,
      'Gloomhaven',
      1,
      4,
      120,
      8.70,
      'active',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Gloomhaven-box-500-sp-300x300.png',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Gloomhaven-box-500-sp-300x300.png'
    ),
    (
      bgc_section_id,
      167791,
      'Terraforming Mars',
      1,
      5,
      120,
      8.38,
      'active',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Terraforming-Mars-box-500-sp-300x300.png',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Terraforming-Mars-box-500-sp-300x300.png'
    ),
    (
      bgc_section_id,
      266192,
      'Wingspan',
      1,
      5,
      70,
      8.05,
      'active',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Wingspan-box-500-sp-300x300.png',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Wingspan-box-500-sp-300x300.png'
    ),
    (
      bgc_section_id,
      312484,
      'Lost Ruins of Arnak',
      1,
      4,
      120,
      8.15,
      'active',
      'https://cdn11.bigcommerce.com/s-285hkc2e8r/images/stencil/1280x1280/products/13163/15120/image__40577.1655083076.png?c=2',
      'https://cdn11.bigcommerce.com/s-285hkc2e8r/images/stencil/1280x1280/products/13163/15120/image__40577.1655083076.png?c=2'
    ),
    (
      bgc_section_id,
      822,
      'Carcassonne',
      2,
      5,
      45,
      7.41,
      'active',
      'https://m.media-amazon.com/images/I/81Eo1BkSTGL._AC_SX300_SY300_QL70_ML2_.jpg',
      'https://m.media-amazon.com/images/I/81Eo1BkSTGL._AC_SX300_SY300_QL70_ML2_.jpg'
    );
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
  gloomhaven_rulebook_es_id UUID;
  gloomhaven_rulebook_en_id UUID;
  wingspan_rulebook_en_id UUID;
  terraforming_pending_id UUID;
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

  SELECT id INTO gloomhaven_rulebook_es_id
    FROM public.game_documents
    WHERE game_id = gloomhaven_id AND language = 'es' AND source_type = 'rulebook'
    ORDER BY created_at DESC
    LIMIT 1;

  SELECT id INTO gloomhaven_rulebook_en_id
    FROM public.game_documents
    WHERE game_id = gloomhaven_id AND language = 'en' AND source_type = 'rulebook'
    ORDER BY created_at DESC
    LIMIT 1;

  SELECT id INTO wingspan_rulebook_en_id
    FROM public.game_documents
    WHERE game_id = wingspan_id AND language = 'en' AND source_type = 'rulebook'
    ORDER BY created_at DESC
    LIMIT 1;

  SELECT id INTO terraforming_pending_id
    FROM public.game_documents
    WHERE game_id = terraforming_id AND language = 'es' AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

  -- knowledge_documents table removed - processing metadata now tracked in game_documents

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
