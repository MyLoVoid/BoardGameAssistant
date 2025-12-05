-- =====================================================
-- Create Test Users for Local Development
-- =====================================================
-- This script creates 5 test users with different roles
-- for local development and testing.
--
-- IMPORTANT: This only works in local development.
-- For production, users should be created via signup flow.
--
-- Usage:
-- 1. Open Supabase Studio: http://127.0.0.1:54323
-- 2. Go to SQL Editor
-- 3. Paste and run this script
-- =====================================================

-- Insert test users into auth.users
-- Note: Using crypt() from pgcrypto extension for password hashing

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

  -- The profiles will be created automatically by the handle_new_user() trigger
  -- But we need to update the roles since the trigger sets them from raw_user_meta_data

  -- Update roles in profiles table
  UPDATE public.profiles SET role = 'admin' WHERE id = admin_id;
  UPDATE public.profiles SET role = 'developer' WHERE id = dev_id;
  UPDATE public.profiles SET role = 'tester' WHERE id = tester_id;
  UPDATE public.profiles SET role = 'premium' WHERE id = premium_id;
  UPDATE public.profiles SET role = 'basic' WHERE id = basic_id;

  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE 'Admin: admin@bgai.test (password: Admin123!)';
  RAISE NOTICE 'Developer: developer@bgai.test (password: Dev123!)';
  RAISE NOTICE 'Tester: tester@bgai.test (password: Test123!)';
  RAISE NOTICE 'Premium: premium@bgai.test (password: Premium123!)';
  RAISE NOTICE 'Basic: basic@bgai.test (password: Basic123!)';

END $$;

-- Verify users were created
SELECT
  u.email,
  p.display_name,
  p.role,
  u.email_confirmed_at IS NOT NULL as confirmed
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@bgai.test'
ORDER BY p.role;
