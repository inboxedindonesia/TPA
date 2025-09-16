-- Migration: Add RIASEC support to existing tables following TPA category pattern
-- This extends the current TPA system to support RIASEC personality assessment

-- Add test_type column to tests table to differentiate between TPA and RIASEC
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS test_type VARCHAR(50) DEFAULT 'TPA';

-- RIASEC will use the existing category system like TPA categories:
-- TES_REALISTIC, TES_INVESTIGATIVE, TES_ARTISTIC, TES_SOCIAL, TES_ENTERPRISING, TES_CONVENTIONAL

-- Add RIASEC score columns to test_sessions table (following TPA pattern)
ALTER TABLE test_sessions 
ADD COLUMN IF NOT EXISTS score_realistic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_investigative INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_artistic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_social INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_enterprising INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_conventional INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_realistic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_investigative INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_artistic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_social INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_enterprising INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score_conventional INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS holland_code VARCHAR(3);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_test_sessions_riasec_scores ON test_sessions(score_realistic, score_investigative, score_artistic, score_social, score_enterprising, score_conventional);
CREATE INDEX IF NOT EXISTS idx_test_sessions_holland_code ON test_sessions(holland_code);

-- Add comments for documentation
COMMENT ON COLUMN tests.test_type IS 'Type of test: TPA or RIASEC';
COMMENT ON COLUMN test_sessions.holland_code IS 'Three-letter Holland Code based on top RIASEC scores (e.g., RIA, SEC)';

-- Note: RIASEC questions will use existing category field with values:
-- TES_REALISTIC, TES_INVESTIGATIVE, TES_ARTISTIC, TES_SOCIAL, TES_ENTERPRISING, TES_CONVENTIONAL
-- Career recommendations will be generated dynamically in React components, following TPA pattern