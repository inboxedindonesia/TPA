-- Cek data kolom options pada tabel questions untuk soal yang aktif/test tertentu
SELECT id, question, options FROM questions WHERE options IS NULL OR options = 'null' OR options = '' OR options = '[]';

-- Jika ingin cek untuk test tertentu, tambahkan:
-- AND "testId" = 'ID_TEST_KAMU';

-- Untuk cek semua soal dan lihat format options:
SELECT id, question, options FROM questions LIMIT 20;
