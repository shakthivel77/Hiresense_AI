-- ============================================================================
-- Hiresense_AI Schema Alignment & Diagnostic Proof Fix
-- Migration: 003_verification_proofs_attempt_id.sql
-- ============================================================================

-- Alter attempt_id in verification_proofs from UUID to TEXT
-- This allows both standard single-skill test attempt UUIDs and multi-skill
-- domain diagnostic session IDs (e.g. 'diag-36e59eec-...') to be persisted cleanly.
ALTER TABLE public.verification_proofs ALTER COLUMN attempt_id TYPE TEXT;
