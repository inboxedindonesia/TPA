-- Migration: Remove redundant totalQuestions column from tests table
-- This column is redundant because we can calculate total questions from test_questions table
-- Date: 2024-01-XX
-- Description: Simplify database design by removing duplicate data storage

-- Remove totalQuestions column from tests table
ALTER TABLE tests DROP COLUMN IF EXISTS "totalQuestions";

-- Verify the column has been removed
-- You can run: \d tests to check the table structure after migration