-- Migration: standardize default timestamps to Asia/Jakarta (WIB)
-- Idempotent: uses IF EXISTS / checks to avoid errors if rerun

-- users
ALTER TABLE users
  ALTER COLUMN "createdAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
ALTER TABLE users
  ALTER COLUMN "updatedAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- tests
ALTER TABLE tests
  ALTER COLUMN "createdAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
ALTER TABLE tests
  ALTER COLUMN "updatedAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- questions
ALTER TABLE questions
  ALTER COLUMN "createdAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
ALTER TABLE questions
  ALTER COLUMN "updatedAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- test_questions
ALTER TABLE IF EXISTS test_questions
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- test_sessions
ALTER TABLE test_sessions
  ALTER COLUMN "startTime" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
ALTER TABLE test_sessions
  ALTER COLUMN "createdAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
ALTER TABLE test_sessions
  ALTER COLUMN "updatedAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- answers
ALTER TABLE IF EXISTS answers
  ALTER COLUMN "answeredAt" SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- activity_logs
ALTER TABLE IF EXISTS activity_logs
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- password_resets
ALTER TABLE IF EXISTS password_resets
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
