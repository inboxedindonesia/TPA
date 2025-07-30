import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

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
    const tesAktif = parseInt(tesAktifRes.rows[0].count);

    // Daftar tes dengan statistik
    const tesListRes = await client.query(`
      SELECT 
        t.id, 
        t.name, 
        t.duration, 
        t."isActive" as status,
        t."createdAt",
        (SELECT COUNT(*) FROM questions q WHERE q."testId" = t.id) as "jumlahSoal",
        (SELECT COUNT(*) FROM test_sessions ts WHERE ts."testId" = t.id) as "peserta"
      FROM tests t
      ORDER BY t."createdAt" DESC
    `);

    const tesList =
      tesListRes.rows.map((row) => ({
        id: row.id,
        nama: row.name,
        jumlahSoal: parseInt(row.jumlahsoal) || 0,
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
      FROM users 
      WHERE role = 'PESERTA' AND "createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const pesertaBaruCount = parseInt(pesertaBaru.rows[0].count);

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
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
