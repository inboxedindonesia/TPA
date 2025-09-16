import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Total tes
    const totalTesRes = await client.query(
      "SELECT COUNT(*) as count FROM tests"
    );
    const totalTes = parseInt(totalTesRes.rows[0].count);

    // Tes aktif
    const tesAktifRes = await client.query(
      'SELECT COUNT(*) as count FROM tests WHERE "isActive" = true'
    );
    const tesAktif = parseInt(tesAktifRes.rows[0].count);

    // Tes selesai (yang memiliki sesi selesai)
    const tesSelesaiRes = await client.query(
      `
      SELECT COUNT(DISTINCT t.id) as count 
      FROM tests t 
      INNER JOIN test_sessions ts ON t.id = ts."testId" 
      WHERE ts.status = $1
    `,
      ["COMPLETED"]
    );
    const tesSelesai = parseInt(tesSelesaiRes.rows[0].count);

    // Rata-rata durasi
    const rataRataDurasiRes = await client.query(
      "SELECT AVG(duration) as avg FROM tests"
    );
    const rataRataDurasi = rataRataDurasiRes.rows[0].avg
      ? Math.round(parseFloat(rataRataDurasiRes.rows[0].avg))
      : 0;

    // Daftar tes dengan statistik
    const daftarTesRes = await client.query(
      `
      SELECT 
        t.id,
        t.name,
        t.duration,
        t."isActive",
        t."createdAt",
        COUNT(DISTINCT ts."userId") as "participantCount",
        COALESCE(AVG(ts.score), 0) as "averageScore",
        COUNT(DISTINCT tq.question_id) as "questionCount"
      FROM tests t
      LEFT JOIN test_sessions ts ON t.id = ts."testId" AND ts.status = $1
      LEFT JOIN test_questions tq ON t.id = tq.test_id
      GROUP BY t.id, t.name, t.duration, t."isActive", t."createdAt"
      ORDER BY t."createdAt" DESC
      LIMIT 20
    `,
      ["COMPLETED"]
    );

    const daftarTes =
      daftarTesRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        duration: row.duration,
        isActive: row.isactive,
        createdAt: row.createdAt,
        participantCount: parseInt(row.participantcount) || 0,
        averageScore: parseFloat(row.averagescore).toFixed(1) || "0.0",
        questionCount: parseInt(row.questioncount) || 0,
      })) || [];

    return NextResponse.json({
      totalTes,
      tesAktif,
      tesSelesai,
      rataRataDurasi,
      daftarTes,
    });
  } catch (error) {
    console.error("Error fetching tes stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik tes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
