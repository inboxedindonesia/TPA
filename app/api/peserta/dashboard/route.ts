import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  // Ambil user dari token atau fallback
  let userId = null;
  try {
    const user = (await getUserFromRequest(request)) || getFallbackUserInfo();
    userId = user?.userId || null;
  } catch {
    userId = null;
  }
  // Production: userId hanya dari autentikasi, tidak ada fallback

  try {
    // Statistik dashboard - sederhana untuk menangani tabel kosong
    const totalTestsRes = await client.query(`
      SELECT COUNT(*) as count FROM tests WHERE "isActive" = true
    `);
    const totalTests = parseInt(totalTestsRes.rows[0].count);

    let completedTests = 0;
    let averageScore = 0;
    if (userId) {
      const completedTestsRes = await client.query(
        "SELECT COUNT(*) as count FROM test_sessions WHERE status = 'COMPLETED' AND \"userId\" = $1",
        [userId]
      );
      completedTests = parseInt(completedTestsRes.rows[0].count);

      const averageScoreRes = await client.query(
        "SELECT COALESCE(AVG(score), 0) as average FROM test_sessions WHERE status = 'COMPLETED' AND \"userId\" = $1",
        [userId]
      );
      averageScore = parseFloat(averageScoreRes.rows[0].average);
    }

    // Tes yang tersedia - query yang lebih sederhana
    const availableTestsRes = await client.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.duration,
        t."totalQuestions",
        t."isActive",
        t."createdAt",
        t."maxAttempts",
        t."availableFrom",
        t."availableUntil"
      FROM tests t
      WHERE t."isActive" = true
        AND (NOW() AT TIME ZONE 'Asia/Jakarta') >= t."availableFrom"
        AND (NOW() AT TIME ZONE 'Asia/Jakarta') <= t."availableUntil"
      ORDER BY t."createdAt" DESC
    `);

    // Untuk setiap tes, hitung jumlah attempt user
    const availableTests = [];
    for (const row of availableTestsRes.rows) {
      let attemptCount = 0;
      if (userId) {
        const attemptRes = await client.query(
          'SELECT COUNT(*) FROM test_sessions WHERE "userId" = $1 AND "testId" = $2 AND status = \'COMPLETED\'',
          [userId, row.id]
        );
        attemptCount = parseInt(attemptRes.rows[0].count, 10);
      }
      // Gunakan case yang konsisten: maxAttempts
      availableTests.push({
        id: row.id,
        name: row.name,
        description: row.description,
        duration: row.duration,
        totalQuestions: row.totalquestions,
        isActive: row.isactive,
        createdAt: row.createdAt,
        participantCount: 0,
        averageScore: "0.0",
        attemptCount,
        maxAttempts: row.maxAttempts ?? row.maxattempts ?? 1,
        availableFrom: row.availableFrom ?? row.availablefrom,
        availableUntil: row.availableUntil ?? row.availableuntil,
      });
    }

    // Hasil tes - query yang lebih sederhana

    let testResults: any[] = [];
    if (userId) {
      const testResultsRes = await client.query(
        `SELECT 
          ts.id,
          t.name as "testName",
          ts.score,
          ts."maxScore",
          ts."endTime" as "completedAt"
        FROM test_sessions ts
        JOIN tests t ON ts."testId" = t.id
        WHERE ts.status = 'COMPLETED' AND ts."userId" = $1
        ORDER BY ts."endTime" DESC`,
        [userId]
      );
      testResults = testResultsRes.rows.map((row) => ({
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
    }

    return NextResponse.json({
      totalTests,
      completedTests,
      averageScore,
      targetScore: 85,
      availableTests,
      testResults,
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
