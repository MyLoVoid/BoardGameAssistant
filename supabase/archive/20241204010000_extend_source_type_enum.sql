-- =====================================================
-- BGAI - Migration: Extend source_type enum for documents
-- Date: 2024-12-04
--
-- Adds the missing document categories required by the admin
-- portal (quickstart + reference) so uploads no longer fail
-- when operators pick those source types.
-- =====================================================

ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'quickstart';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'reference';

-- =====================================================
-- Migration complete
-- =====================================================
