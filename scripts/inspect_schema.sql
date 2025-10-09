-- =============================================================
-- inspect_schema.sql
-- Skrip utilitas untuk memeriksa struktur tabel inti aplikasi:
--   tests, questions, test_questions, test_sessions, answers, sections
-- Menampilkan: daftar kolom, constraints, index, serta snapshot JSON.
-- Jalankan di Supabase SQL Editor / psql. Aman (read-only).
-- =============================================================
\echo '== 1. Kolom per tabel =='
WITH target AS (
  SELECT unnest(ARRAY['tests','questions','test_questions','test_sessions','answers','sections']) AS table_name
)
SELECT t.table_name,
       c.column_name,
       c.data_type,
       c.is_nullable,
       c.column_default
FROM target t
LEFT JOIN information_schema.columns c
  ON c.table_name = t.table_name
 AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

\echo '== 2. Constraints =='
SELECT tc.table_name,
       tc.constraint_name,
       tc.constraint_type,
       pg_get_constraintdef(c.oid) AS definition
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE tc.table_schema='public'
  AND tc.table_name IN ('tests','questions','test_questions','test_sessions','answers','sections')
ORDER BY tc.table_name, tc.constraint_name;

\echo '== 3. Indexes =='
SELECT t.relname AS table_name,
       i.relname AS index_name,
       pg_get_indexdef(ix.indexrelid) AS index_def,
       ix.indisunique AS is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname='public'
  AND t.relname IN ('tests','questions','test_questions','test_sessions','answers','sections')
ORDER BY t.relname, i.relname;

\echo '== 4. Snapshot JSON struktur (satu baris) =='
WITH cols AS (
  SELECT table_name,
         json_agg(
           json_build_object(
             'name', column_name,
             'type', data_type,
             'nullable', (is_nullable='YES'),
             'default', column_default
           ) ORDER BY ordinal_position
         ) AS columns
  FROM information_schema.columns
  WHERE table_schema='public'
    AND table_name IN ('tests','questions','test_questions','test_sessions','answers','sections')
  GROUP BY table_name
)
SELECT json_object_agg(table_name, columns) AS schema_snapshot
FROM cols;

\echo '== 5. (Opsional) Verifikasi kolom RIASEC di test_sessions =='
SELECT column_name FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='test_sessions'
  AND column_name IN (
    'score_realistic','score_investigative','score_artistic','score_social',
    'score_enterprising','score_conventional','max_score_realistic','max_score_investigative',
    'max_score_artistic','max_score_social','max_score_enterprising','max_score_conventional','holland_code'
  )
ORDER BY column_name;

\echo '== 6. (Opsional) Cek test_type pada tests =='
SELECT DISTINCT test_type FROM tests ORDER BY 1;

\echo '== 7. (Opsional) Hitung jumlah soal per kategori RIASEC (jika sudah seed) =='
SELECT q.category, COUNT(*)
FROM questions q
JOIN test_questions tq ON q.id = tq.question_id
WHERE tq.test_id = 'riasec_basic'
GROUP BY q.category
ORDER BY q.category;

-- Selesai