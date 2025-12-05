-- =====================================================
-- BGAI - Migration: Add description column to games
-- Date: 2024-12-04
--
-- Context:
--   * BoardGameGeek sync now provides a summary/description for each game
--   * Persist this metadata directly on public.games so both mobile and
--     admin clients can display richer context without re-fetching BGG
-- =====================================================

-- Add the nullable description column for game summaries
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.games.description IS
  'Localized description or summary for display in clients (populated via BGG sync or manual edits).';

-- =====================================================
-- Migration complete
-- =====================================================
