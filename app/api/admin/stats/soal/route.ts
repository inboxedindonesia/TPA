import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Total soal
    const totalSoalRes = await client.query(
      "SELECT COUNT(*) as count FROM questions"
    );
    const totalSoal = parseInt(totalSoalRes.rows[0].count);

    // Soal baru (dibuat dalam 30 hari terakhir)
    const soalBaruRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM questions 
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const soalBaru = parseInt(soalBaruRes.rows[0].count);

    // Soal aktif (yang digunakan dalam tes aktif)
    const soalAktifRes = await client.query(`
      SELECT COUNT(DISTINCT q.id) as count 
      FROM questions q 
      INNER JOIN tests t ON q."testId" = t.id 
      WHERE t."isActive" = true
    `);
    const soalAktif = parseInt(soalAktifRes.rows[0].count);

    // Rata-rata kesulitan (dummy data untuk contoh)
    const rataRataKesulitan = 6.5; // Ini bisa dihitung dari field difficulty jika ada

    // Daftar soal dengan statistik
    const daftarSoalRes = await client.query(
      `
      SELECT 
        q.id,
        q.question,
        q.category,
        COALESCE(q.difficulty, 'Sedang') as difficulty,
        q."createdAt",
        COUNT(ts.id) as "usageCount",
        COALESCE(AVG(ts.score), 0) as "successRate"
      FROM questions q
      LEFT JOIN tests t ON q."testId" = t.id
      LEFT JOIN test_sessions ts ON t.id = ts."testId" AND ts.status = $1
      GROUP BY q.id, q.question, q.category, q.difficulty, q."createdAt"
      ORDER BY q."createdAt" DESC
      LIMIT 20
    `,
      ["COMPLETED"]
    );

    const daftarSoal = daftarSoalRes.rows.map((row) => ({
      id: row.id,
      question: row.question,
      category: row.category || "Umum",
      difficulty: row.difficulty,
      createdAt: row.createdAt,
      usageCount: parseInt(row.usagecount) || 0,
      successRate: parseFloat(row.successrate).toFixed(1) || "0.0",
    }));

    return NextResponse.json({
      totalSoal,
      soalBaru,
      soalAktif,
      rataRataKesulitan,
      daftarSoal,
    });
  } catch (error) {
    console.error("Error fetching soal stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik soal" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
