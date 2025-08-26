-- Migration: Remove testId from questions table (and its foreign key)
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_testId_fkey;
ALTER TABLE questions DROP COLUMN IF EXISTS "testId";
