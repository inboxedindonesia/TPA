-- Seed RIASEC untuk Supabase (tanpa DO $$, cukup satu INSERT dengan ON CONFLICT)
-- Ganti ADMIN_ID jika berbeda.
-- OPTIONAL: pastikan user admin ada
-- INSERT INTO users (id, name, email, password, role) SELECT 'admin-1','Admin','admin@example.com','dummyhash','ADMIN' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id='admin-1');

WITH src(id, category, question, type, options, difficulty, points) AS (
  VALUES
  ('RIASEC_R_01','TES_REALISTIC','Saya senang memperbaiki atau merakit benda secara langsung.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_R_02','TES_REALISTIC','Saya menikmati kegiatan di luar ruangan yang melibatkan aktivitas fisik.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_R_03','TES_REALISTIC','Saya tertarik mengoperasikan peralatan, mesin, atau alat kerja teknis.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_R_04','TES_REALISTIC','Saya lebih suka praktik langsung dibanding membaca teori panjang.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_R_05','TES_REALISTIC','Saya merasa nyaman bekerja dengan alat atau bahan teknis.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_R_06','TES_REALISTIC','Saya suka pekerjaan yang hasilnya bisa dilihat secara nyata.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_R_07','TES_REALISTIC','Saya lebih memilih bergerak aktif daripada duduk lama di depan komputer.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_R_08','TES_REALISTIC','Saya tertarik pada bidang seperti otomotif, konstruksi, atau mekanik.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_R_09','TES_REALISTIC','Saya menikmati membuat sesuatu dengan tangan sendiri (misal rak, model, alat sederhana).','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_R_10','TES_REALISTIC','Saya nyaman mengikuti instruksi teknis untuk menggunakan perangkat baru.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_01','TES_INVESTIGATIVE','Saya suka memecahkan masalah yang membutuhkan analisis mendalam.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_02','TES_INVESTIGATIVE','Saya menikmati membaca atau menonton konten ilmiah dan eksperimen.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_I_03','TES_INVESTIGATIVE','Saya tertarik mencari jawaban atas pertanyaan ''mengapa'' sesuatu terjadi.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_I_04','TES_INVESTIGATIVE','Saya suka mengumpulkan dan membandingkan data sebelum mengambil keputusan.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_05','TES_INVESTIGATIVE','Saya menikmati tugas yang melibatkan penelitian atau pengamatan mendetail.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_06','TES_INVESTIGATIVE','Saya sering penasaran dengan cara kerja sistem atau fenomena tertentu.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_I_07','TES_INVESTIGATIVE','Saya suka menelusuri sumber informasi untuk memastikan kebenaran suatu hal.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_08','TES_INVESTIGATIVE','Saya menikmati teka-teki logis atau permainan analitis.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_I_09','TES_INVESTIGATIVE','Saya tertarik mempelajari bidang seperti sains, teknologi, atau riset akademik.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_I_10','TES_INVESTIGATIVE','Saya cenderung menganalisa masalah sebelum mencoba solusi praktis.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_A_01','TES_ARTISTIC','Saya menikmati kegiatan yang melibatkan kreativitas seperti menggambar atau menulis.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_A_02','TES_ARTISTIC','Saya merasa nyaman mengekspresikan ide melalui karya visual atau tulisan.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_A_03','TES_ARTISTIC','Saya suka mencoba gaya baru dalam desain, dekorasi, atau presentasi.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_A_04','TES_ARTISTIC','Saya lebih suka tugas terbuka yang memberi kebebasan bereksperimen daripada instruksi kaku.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_A_05','TES_ARTISTIC','Saya terinspirasi oleh warna, bentuk, ritme, atau cerita yang kuat.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_A_06','TES_ARTISTIC','Saya menikmati membuat sesuatu yang unik dibanding menyalin contoh yang ada.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_A_07','TES_ARTISTIC','Saya merasa terdorong untuk mencurahkan emosi ke dalam karya atau ekspresi saya.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_A_08','TES_ARTISTIC','Saya menikmati kegiatan seperti musik, teater, desain, fotografi, atau sastra.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_A_09','TES_ARTISTIC','Saya tertarik membuat karya yang bisa menginspirasi atau menyentuh orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_A_10','TES_ARTISTIC','Saya sering mendapat ide-ide kreatif di luar rutinitas sehari-hari.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_01','TES_SOCIAL','Saya senang membantu orang memahami sesuatu yang sulit.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_S_02','TES_SOCIAL','Saya merasa puas ketika dapat mendukung atau menguatkan orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_S_03','TES_SOCIAL','Saya peka terhadap kebutuhan atau perasaan orang di sekitar saya.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_04','TES_SOCIAL','Saya menikmati bekerja dalam tim untuk mencapai tujuan bersama.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_05','TES_SOCIAL','Saya tertarik pada bidang seperti pendidikan, konseling, atau layanan sosial.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_S_06','TES_SOCIAL','Saya sering menjadi tempat curhat atau dimintai pendapat oleh orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_07','TES_SOCIAL','Saya menikmati mengarahkan atau memfasilitasi diskusi kelompok.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_08','TES_SOCIAL','Saya peduli pada dampak sosial dari keputusan atau tindakan.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_S_09','TES_SOCIAL','Saya termotivasi ketika bisa membuat perbedaan positif bagi orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_S_10','TES_SOCIAL','Saya menikmati kegiatan seperti mentoring, mengajar, atau membimbing.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_01','TES_ENTERPRISING','Saya bersemangat ketika bisa memimpin atau mengarahkan orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_02','TES_ENTERPRISING','Saya menikmati menantang diri mencapai target yang ambisius.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_03','TES_ENTERPRISING','Saya tertarik pada dunia bisnis, pemasaran, atau negosiasi.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_E_04','TES_ENTERPRISING','Saya percaya diri mempresentasikan ide kepada orang lain.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_E_05','TES_ENTERPRISING','Saya suka mengambil keputusan di situasi yang dinamis atau menantang.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_06','TES_ENTERPRISING','Saya nyaman berbicara di depan banyak orang atau audiens baru.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_07','TES_ENTERPRISING','Saya menikmati memotivasi orang lain mencapai hasil yang lebih baik.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_E_08','TES_ENTERPRISING','Saya tertarik membuat atau mengembangkan peluang usaha baru.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_E_09','TES_ENTERPRISING','Saya terdorong oleh tantangan kompetitif dan target terukur.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_E_10','TES_ENTERPRISING','Saya menikmati memengaruhi keputusan orang lain melalui ide atau argumen.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_C_01','TES_CONVENTIONAL','Saya suka tugas yang membutuhkan ketelitian dalam pencatatan atau pengarsipan.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_02','TES_CONVENTIONAL','Saya menikmati mengorganisir data, dokumen, atau informasi agar rapi.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_03','TES_CONVENTIONAL','Saya merasa nyaman mengikuti prosedur atau format yang sudah ditetapkan.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_04','TES_CONVENTIONAL','Saya teliti dalam memeriksa kesalahan angka atau detail kecil.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_C_05','TES_CONVENTIONAL','Saya menikmati membuat daftar, tabel, atau struktur yang membantu pekerjaan teratur.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_C_06','TES_CONVENTIONAL','Saya suka menyelesaikan tugas administratif dengan akurat dan tepat waktu.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_07','TES_CONVENTIONAL','Saya nyaman bekerja dengan spreadsheet, form, atau sistem terstruktur.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1),
  ('RIASEC_C_08','TES_CONVENTIONAL','Saya merasa tenang ketika segala sesuatunya terdokumentasi dengan baik.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_09','TES_CONVENTIONAL','Saya menyukai pekerjaan yang konsisten, stabil, dan prosedural.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','MUDAH',1),
  ('RIASEC_C_10','TES_CONVENTIONAL','Saya terorganisir dalam mengelola waktu, tugas, dan dokumen kerja.','MULTIPLE_CHOICE_SINGLE','["Sangat Tidak Setuju","Tidak Setuju","Netral","Setuju","Sangat Setuju"]','SEDANG',1)
)
INSERT INTO questions (id, question, type, options, "correctAnswer", category, difficulty, "order", points, "creatorId")
SELECT id, question, type, options, '', category, difficulty, 1, points, 'admin-1'
FROM src
ON CONFLICT (id) DO NOTHING;

-- Ringkasan setelah seed
SELECT category, COUNT(*) AS jumlah FROM questions WHERE id LIKE 'RIASEC_%' GROUP BY category ORDER BY category;

-- Kaitkan ke test (contoh):
-- INSERT INTO test_questions (test_id, question_id)
-- SELECT 'riasec_basic', id FROM questions WHERE id LIKE 'RIASEC_%';

-- Selesai.
