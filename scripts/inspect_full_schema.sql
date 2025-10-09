-- =============================================================
-- inspect_full_schema.sql
-- Menyajikan ringkasan komprehensif struktur & isi (ringkas) database public.
-- Aman: tidak menampilkan data sensitif (hanya sample beberapa baris per tabel).
-- Jalankan di Supabase SQL Editor / psql, lalu salin bagian yang diminta.
-- =============================================================

-- 1. Daftar tabel + jumlah baris
-- Catatan: Pendekatan lama memakai xpath/query_to_xml menimbulkan error pada beberapa
-- lingkungan (termasuk SQL editor Supabase). Diganti dengan dua opsi:
-- (A) Estimasi cepat dari pg_stat_user_tables (n_live_tup, tidak 100% akurat)
-- (B) Hitung pasti (loop) via DO + temp table (lebih lambat tapi akurat)

-- (A) ESTIMASI CEPAT
SELECT relname AS table_name, n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
ORDER BY estimated_row_count DESC, relname;

-- (B) HITUNG PASTI (aktifkan jika butuh angka akurat)
-- DROP TABLE IF EXISTS _exact_counts;  -- aman jika mau rerun
-- CREATE TEMP TABLE _exact_counts(table_name text primary key, row_count bigint);
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--   FOR r IN SELECT relname AS table_name FROM pg_stat_user_tables LOOP
--     EXECUTE format('INSERT INTO _exact_counts VALUES (%L,(SELECT COUNT(*) FROM %I)) ON CONFLICT (table_name) DO UPDATE SET row_count=EXCLUDED.row_count;', r.table_name, r.table_name);
--   END LOOP;
-- END $$;
-- SELECT * FROM _exact_counts ORDER BY row_count DESC, table_name;

-- 2. Struktur kolom semua tabel (public)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public'
ORDER BY table_name, ordinal_position;

-- 3. Constraints
SELECT tc.table_name, tc.constraint_name, tc.constraint_type, pg_get_constraintdef(c.oid) AS definition
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE tc.table_schema='public'
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Indexes
SELECT t.relname AS table_name, i.relname AS index_name, pg_get_indexdef(ix.indexrelid) AS index_def, ix.indisunique AS is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname='public'
ORDER BY t.relname, i.relname;

-- 5. Sample rows (maks 5) tiap tabel utama (skip jika tabel besar tak penting, modifikasi sesuai kebutuhan)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name LOOP
    RAISE NOTICE 'TABLE: %', r.table_name;
    EXECUTE format('SELECT * FROM %I ORDER BY 1 LIMIT 5;', r.table_name);
  END LOOP;
END $$;

-- 6. Snapshot JSON struktur terbatas (tabel inti)
WITH cols AS (
  SELECT table_name,
         json_agg(json_build_object(
           'name', column_name,
           'type', data_type,
           'nullable', (is_nullable='YES'),
           'default', column_default
         ) ORDER BY ordinal_position) AS columns
  FROM information_schema.columns
  WHERE table_schema='public'
    AND table_name IN ('tests','questions','test_questions','test_sessions','answers','sections')
  GROUP BY table_name
)
SELECT json_object_agg(table_name, columns) AS schema_snapshot
FROM cols;

-- 7. Distribusi kategori soal
SELECT category, COUNT(*) FROM questions GROUP BY category ORDER BY category;

-- 8. Mapping soal per test
SELECT t.id, t.name, t.test_type, COUNT(tq.question_id) AS question_count
FROM tests t
LEFT JOIN test_questions tq ON t.id = tq.test_id
GROUP BY t.id, t.name, t.test_type
ORDER BY t.createdAt DESC NULLS LAST;

-- 9. Kolom RIASEC di test_sessions
SELECT column_name FROM information_schema.columns
WHERE table_name='test_sessions'
  AND (column_name LIKE 'score_%' OR column_name LIKE 'max_score_%' OR column_name='holland_code')
ORDER BY column_name;

-- 10. Status session per test_type
SELECT t.test_type, s.status, COUNT(*)
FROM test_sessions s
JOIN tests t ON t.id = s."testId"
GROUP BY t.test_type, s.status
ORDER BY t.test_type, s.status;

-- 11. Orphan mapping / referential checks
SELECT 'test_questions.question_id orphan' AS issue, tq.question_id
FROM test_questions tq LEFT JOIN questions q ON q.id = tq.question_id
WHERE q.id IS NULL
UNION ALL
SELECT 'test_questions.test_id orphan', tq.test_id
FROM test_questions tq LEFT JOIN tests t ON t.id = tq.test_id
WHERE t.id IS NULL
UNION ALL
SELECT 'answers.sessionId orphan', a."sessionId"
FROM answers a LEFT JOIN test_sessions s ON s.id = a."sessionId"
WHERE s.id IS NULL
UNION ALL
SELECT 'test_sessions.testId orphan', s."testId"
FROM test_sessions s LEFT JOIN tests t2 ON t2.id = s."testId"
WHERE t2.id IS NULL;


-- Selesai.
