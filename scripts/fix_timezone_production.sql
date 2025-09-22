-- Script untuk memperbaiki timezone di production database
-- PENTING: Backup database sebelum menjalankan script ini!

-- 1. Set timezone database ke Asia/Jakarta
SET timezone = 'Asia/Jakarta';

-- 2. Update default values untuk semua tabel timestamp
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

-- test_sessions (PENTING: ini yang paling berpengaruh pada timer)
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

-- 3. OPSIONAL: Konversi data existing jika diperlukan
-- HATI-HATI: Hanya jalankan jika yakin data saat ini dalam UTC
-- UPDATE test_sessions 
-- SET "startTime" = "startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE "startTime" IS NOT NULL;

-- 4. Verifikasi hasil
SELECT 
    'timezone_setting' as check_type,
    current_setting('timezone') as value
UNION ALL
SELECT 
    'test_sessions_default' as check_type,
    column_default as value
FROM information_schema.columns 
WHERE table_name = 'test_sessions' 
  AND column_name = 'startTime';

-- 5. Test dengan data sample
SELECT 
    NOW() as current_time_wib,
    NOW() AT TIME ZONE 'UTC' as current_time_utc,
    'Perbedaan harus 7 jam (WIB = UTC+7)' as note;