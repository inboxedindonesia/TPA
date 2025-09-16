-- Migration: Add category score breakdown columns to test_sessions table
-- This allows storing individual scores for each TPA category

ALTER TABLE test_sessions 
ADD COLUMN IF NOT EXISTS score_verbal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_angka INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_logika INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_gambar INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_verbal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_angka INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_logika INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_gambar INTEGER DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_sessions_scores ON test_sessions(score_verbal, score_angka, score_logika, score_gambar);

-- Update existing records to have proper max scores based on category
-- This will be handled by the application logic during score calculation