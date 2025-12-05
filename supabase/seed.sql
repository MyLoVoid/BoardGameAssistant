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
  ('BGC', 'Board Game Companion', 'Your intelligent assistant for board games', 1, true);

-- =====================================================
-- GAMES
-- =====================================================

-- Get the BGC section ID
DO $$
DECLARE
  bgc_section_id UUID;
BEGIN
  SELECT id INTO bgc_section_id FROM public.app_sections WHERE key = 'BGC';

  -- Insert test games (only Wingspan retained for streamlined demo state)
  INSERT INTO public.games (
    section_id,
    bgg_id,
    name_base,
    description,
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
      266192,
      'Wingspan',
      'Card-driven engine builder about attracting birds to your wildlife preserves.',
      1,
      5,
      70,
      8.05,
      'active',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Wingspan-box-500-sp-300x300.png',
      'https://boardgamechamps.com/wp-content/uploads/2025/02/Wingspan-box-500-sp-300x300.png'
    );
END $$;

-- =====================================================
-- GAME FAQs
-- =====================================================

-- No seeded FAQs to keep the database minimal after reset.

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