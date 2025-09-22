-- Script untuk mengecek apakah migrasi timezone sudah berjalan
-- Jalankan script ini di database production untuk memverifikasi

-- 1. Cek timezone database saat ini
SELECT current_setting('timezone') as current_timezone;

-- 2. Cek default value untuk kolom timestamp di tabel test_sessions
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('test_sessions', 'tests', 'users', 'questions')
  AND column_name IN ('startTime', 'createdAt', 'updatedAt')
  AND column_default IS NOT NULL
ORDER BY table_name, column_name;

-- 3. Cek sample data untuk memastikan timezone
SELECT 
    id,
    "startTime",
    "startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as startTime_WIB,
    "testId"
FROM test_sessions 
WHERE "testId" = 'test-1758270515591-ivqqvwu2q'
ORDER BY "startTime" DESC
LIMIT 5;

-- 4. Cek apakah ada perbedaan waktu yang signifikan
SELECT 
    COUNT(*) as total_sessions,
    MIN("startTime") as earliest_session,
    MAX("startTime") as latest_session,
    AVG(EXTRACT(EPOCH FROM ("startTime" - LAG("startTime") OVER (ORDER BY "startTime")))) as avg_gap_seconds
FROM test_sessions
WHERE "startTime" IS NOT NULL;