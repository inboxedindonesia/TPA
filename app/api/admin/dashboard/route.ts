import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  if (user.userRole !== "Administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await pool.connect();

  // Daftar peserta lengkap
  const daftarPesertaRes = await client.query(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.registration_id, 
          u.is_verified, 
          u."createdAt",
          COUNT(ts.id) as total_tests,
          AVG(ts.score) as average_score
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN test_sessions ts ON u.id = ts."userId" AND ts.status = 'COMPLETED'
        WHERE r.name = 'Peserta'
        GROUP BY u.id, u.name, u.email, u.registration_id, u.is_verified, u."createdAt"
        ORDER BY u."createdAt" DESC
        LIMIT 100
      `);
  const daftarPeserta = daftarPesertaRes.rows.map((row) => ({
    ...row,
    totalTests: parseInt(row.total_tests) || 0,
    averageScore: row.average_score ? parseFloat(row.average_score).toFixed(1) : "0.0"
  }));

  try {
    // Total peserta (users dengan role Peserta)
    const pesertaRes = await client.query(
      `
      SELECT COUNT(*) as count 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = $1
    `,
      ["Peserta"]
    );
    const totalPeserta = parseInt(pesertaRes.rows[0].count);

    // Total soal
    const soalRes = await client.query(
      "SELECT COUNT(*) as count FROM questions"
    );
    const totalSoal = parseInt(soalRes.rows[0].count);

    // Tes aktif
    const tesAktifRes = await client.query(
      'SELECT COUNT(*) as count FROM tests WHERE "isActive" = true'
    );
    const tesAktif = parseInt(tesAktifRes.rows[0].count) || 0;

    // Daftar tes dengan statistik menggunakan test_questions dan sections
    const tesListRes = await client.query(`
      SELECT 
        t.id, 
        t.name, 
        t.duration, 
        t."isActive" as status,
        t."createdAt",
        COALESCE((SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.id), 0) as "jumlahSoal",
        COALESCE((SELECT COUNT(*) FROM test_sessions ts WHERE ts."testId" = t.id), 0) as "peserta"
      FROM tests t
      ORDER BY t."createdAt" DESC
    `);

    const tesList =
      tesListRes.rows.map((row) => ({
        id: row.id,
        nama: row.name,
        jumlahSoal: parseInt(row.jumlahSoal ?? row.jumlahsoal) || 0,
        durasi: row.duration,
        status: row.status ? "aktif" : "nonaktif",
        peserta: parseInt(row.peserta) || 0,
        createdAt: row.createdAt,
      })) || [];

    // Statistik tambahan
    const totalSessions = await client.query(
      "SELECT COUNT(*) as count FROM test_sessions WHERE status = $1",
      ["COMPLETED"]
    );
    const totalSessionsCount = parseInt(totalSessions.rows[0].count);

    const activeSessions = await client.query(
      "SELECT COUNT(*) as count FROM test_sessions WHERE status = $1",
      ["ONGOING"]
    );
    const activeSessionsCount = parseInt(activeSessions.rows[0].count);

    // Rata-rata skor dan durasi
    const avgScoreRes = await client.query(`
      SELECT COALESCE(AVG(score), 0) as avg_score
      FROM test_sessions 
      WHERE status = 'COMPLETED'
    `);
    const avgScore = parseFloat(avgScoreRes.rows[0].avg_score).toFixed(1);

    const avgDurationRes = await client.query(`
      SELECT COALESCE(AVG(duration), 0) as avg_duration
      FROM tests
    `);
    const avgDuration = parseInt(avgDurationRes.rows[0].avg_duration) || 0;

    // Statistik soal
    const soalBaru = await client.query(`
      SELECT COUNT(*) as count 
      FROM questions 
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const soalBaruCount = parseInt(soalBaru.rows[0].count);

    const soalCategories = await client.query(`
      SELECT COUNT(DISTINCT category) as count 
      FROM questions 
      WHERE category IS NOT NULL
    `);
    const soalCategoriesCount = parseInt(soalCategories.rows[0].count);

    const soalCategoryList = await client.query(`
      SELECT DISTINCT category 
      FROM questions 
      WHERE category IS NOT NULL 
      LIMIT 5
    `);
    const soalCategoryListText =
      soalCategoryList.rows.map((row) => row.category).join(", ") ||
      "Belum ada kategori";

    const soalDifficulties = await client.query(`
      SELECT COUNT(DISTINCT difficulty) as count 
      FROM questions 
      WHERE difficulty IS NOT NULL
    `);
    const soalDifficultiesCount = parseInt(soalDifficulties.rows[0].count);

    const soalDifficultyList = await client.query(`
      SELECT DISTINCT difficulty 
      FROM questions 
      WHERE difficulty IS NOT NULL 
      LIMIT 5
    `);
    const soalDifficultyListText =
      soalDifficultyList.rows.map((row) => row.difficulty).join(", ") ||
      "Belum ada tingkat kesulitan";

    // Statistik tes
    const tesBaru = await client.query(`
      SELECT COUNT(*) as count 
      FROM tests 
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const tesBaruCount = parseInt(tesBaru.rows[0].count);

    const tesNonaktif = await client.query(`
      SELECT COUNT(*) as count 
      FROM tests 
      WHERE "isActive" = false
    `);
    const tesNonaktifCount = parseInt(tesNonaktif.rows[0].count);

    const pesertaBaru = await client.query(`
      SELECT COUNT(*) as count 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'Peserta' AND u."createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const pesertaBaruCount = parseInt(pesertaBaru.rows[0].count);

    // Statistik peserta aktif (yang sudah mengikuti tes)
    const pesertaAktif = await client.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN test_sessions ts ON u.id = ts."userId"
      WHERE r.name = 'Peserta'
    `);
    const pesertaAktifCount = parseInt(pesertaAktif.rows[0].count);

    // Hitung rata-rata kesulitan soal
    const avgDifficultyRes = await client.query(`
      SELECT 
        CASE 
          WHEN difficulty = 'MUDAH' THEN 1
          WHEN difficulty = 'SEDANG' THEN 2
          WHEN difficulty = 'SULIT' THEN 3
          ELSE 2
        END as difficulty_value
      FROM questions
    `);

    let avgDifficulty = "SEDANG";
    if (avgDifficultyRes.rows.length > 0) {
      const avgValue =
        avgDifficultyRes.rows.reduce(
          (sum, row) => sum + row.difficulty_value,
          0
        ) / avgDifficultyRes.rows.length;
      if (avgValue < 1.5) avgDifficulty = "MUDAH";
      else if (avgValue > 2.5) avgDifficulty = "SULIT";
    }

    // Hitung total peserta yang melakukan tes
    const totalPesertaTesRes = await client.query(`
      SELECT COUNT(DISTINCT "userId") as total_peserta_tes
      FROM test_sessions
      WHERE status = 'COMPLETED'
    `);
    const totalPesertaTes =
      parseInt(totalPesertaTesRes.rows[0]?.total_peserta_tes) || 0;

    return NextResponse.json({
      totalPeserta,
      totalSoal,
      tesAktif,
      tesList,
      totalSessions: totalSessionsCount,
      activeSessions: activeSessionsCount,
      soalBaru: soalBaruCount,
      soalCategories: soalCategoriesCount,
      soalCategoryList: soalCategoryListText,
      soalDifficulties: soalDifficultiesCount,
      soalDifficultyList: soalDifficultyListText,
      tesBaru: tesBaruCount,
      tesNonaktif: tesNonaktifCount,
      pesertaBaru: pesertaBaruCount,
      pesertaAktif: pesertaAktifCount,
      rataRataSkor: avgScore,
      rataRataDurasi: avgDuration.toString(),
      rataRataKesulitan: avgDifficulty,
      soalAktif: totalSoal, // Semua soal dianggap aktif
      totalPesertaTes,
      daftarPeserta,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    console.error("Error details:", error?.message);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard", details: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
