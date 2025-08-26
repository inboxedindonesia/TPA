import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    const user = (await getUserFromRequest(request)) || getFallbackUserInfo();
    if (!user || !user.userId) {
      return NextResponse.json({ results: [] });
    }
    // Ambil hasil tes yang sudah selesai untuk user ini
    const resultsRes = await client.query(
      `SELECT 
        ts.id,
        t.name as "testName",
        ts.score,
        ts."maxScore",
        ts."endTime" as "completedAt"
      FROM test_sessions ts
      JOIN tests t ON ts."testId" = t.id
  WHERE ts.status = 'FINISHED' AND ts."userId" = $1
      ORDER BY ts."endTime" DESC`,
      [user.userId]
    );

    const results = resultsRes.rows.map((row) => ({
      id: row.id,
      testName: row.testName,
      score: row.score,
      maxScore: row.maxscore,
      duration: 0, // Default karena tidak ada data
      completedAt: row.completedAt,
      totalQuestions: 0, // Default karena tidak ada data
      correctAnswers: 0, // Default karena tidak ada data
      percentage:
        row.maxscore > 0 ? Math.round((row.score / row.maxscore) * 100) : 0,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching test results:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data hasil tes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
