-- =====================================================
-- BGAI - Migration: Ensure game_documents storage bucket exists
-- Date: 2024-12-03
--
-- Purpose:
--   * Guarantee the private Supabase Storage bucket used for admin document uploads
--   * Allow admin/developer roles to generate signed download URLs via Supabase Auth
-- =====================================================

-- Create (or update) the bucket metadata
INSERT INTO storage.buckets (id, name, public)
VALUES ('game_documents', 'game_documents', false)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Allow admin/developer roles (via Supabase Auth) to read objects so they can request signed URLs
DROP POLICY IF EXISTS "Admin portal can read game documents" ON storage.objects;

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
