import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Ambil semua tes yang aktif dengan statistik sederhana
    const testsRes = await client.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.duration,
        t."totalQuestions",
        t."isActive",
        t."createdAt"
      FROM tests t
      WHERE t."isActive" = true
      ORDER BY t."createdAt" DESC
    `);

    const tests = testsRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      totalQuestions: row.totalquestions,
      isActive: row.isactive,
      createdAt: row.createdAt,
      participantCount: 0, // Default karena tidak ada data
      averageScore: "0.0", // Default karena tidak ada data
    }));

    return NextResponse.json({
      tests,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
