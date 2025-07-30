import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Total peserta
    const totalPesertaRes = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE role = $1",
      ["PESERTA"]
    );
    const totalPeserta = parseInt(totalPesertaRes.rows[0].count);

    // Peserta aktif (yang pernah mengikuti tes)
    const pesertaAktifRes = await client.query(
      `
      SELECT COUNT(DISTINCT u.id) as count 
      FROM users u 
      INNER JOIN test_sessions ts ON u.id = ts."userId" 
      WHERE u.role = $1
    `,
      ["PESERTA"]
    );
    const pesertaAktif = parseInt(pesertaAktifRes.rows[0].count);

    // Peserta baru (dibuat dalam 30 hari terakhir)
    const pesertaBaruRes = await client.query(
      `
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = $1 AND "createdAt" >= NOW() - INTERVAL '30 days'
    `,
      ["PESERTA"]
    );
    const pesertaBaru = parseInt(pesertaBaruRes.rows[0].count);

    // Rata-rata skor
    const rataRataSkorRes = await client.query(
      `
      SELECT AVG(score) as avg FROM test_sessions WHERE status = $1
    `,
      ["COMPLETED"]
    );
    const rataRataSkor = rataRataSkorRes.rows[0].avg
      ? parseFloat(rataRataSkorRes.rows[0].avg).toFixed(1)
      : "0.0";

    // Daftar peserta dengan statistik
    const daftarPesertaRes = await client.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u."createdAt",
        COUNT(ts.id) as "totalTests",
        COALESCE(AVG(ts.score), 0) as "averageScore"
      FROM users u
      LEFT JOIN test_sessions ts ON u.id = ts."userId" AND ts.status = $1
      WHERE u.role = $2
      GROUP BY u.id, u.name, u.email, u."createdAt"
      ORDER BY u."createdAt" DESC
      LIMIT 20
    `,
      ["COMPLETED", "PESERTA"]
    );

    const daftarPeserta = daftarPesertaRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      totalTests: parseInt(row.totaltests) || 0,
      averageScore: parseFloat(row.averagescore).toFixed(1) || "0.0",
    }));

    return NextResponse.json({
      totalPeserta,
      pesertaAktif,
      pesertaBaru,
      rataRataSkor,
      daftarPeserta,
    });
  } catch (error) {
    console.error("Error fetching peserta stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik peserta" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
