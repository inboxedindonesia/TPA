import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Statistik dashboard - sederhana untuk menangani tabel kosong
    const totalTestsRes = await client.query(`
      SELECT COUNT(*) as count FROM tests WHERE "isActive" = true
    `);
    const totalTests = parseInt(totalTestsRes.rows[0].count);

    const completedTestsRes = await client.query(`
      SELECT COUNT(*) as count FROM test_sessions WHERE status = 'COMPLETED'
    `);
    const completedTests = parseInt(completedTestsRes.rows[0].count);

    const averageScoreRes = await client.query(`
      SELECT COALESCE(AVG(score), 0) as average FROM test_sessions WHERE status = 'COMPLETED'
    `);
    const averageScore = parseFloat(averageScoreRes.rows[0].average);

    // Tes yang tersedia - query yang lebih sederhana
    const availableTestsRes = await client.query(`
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

    const availableTests = availableTestsRes.rows.map((row) => ({
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

    // Hasil tes - query yang lebih sederhana
    const testResultsRes = await client.query(`
      SELECT 
        ts.id,
        t.name as "testName",
        ts.score,
        ts."maxScore",
        ts."endTime" as "completedAt"
      FROM test_sessions ts
      JOIN tests t ON ts."testId" = t.id
      WHERE ts.status = 'COMPLETED'
      ORDER BY ts."endTime" DESC
    `);

    const testResults = testResultsRes.rows.map((row) => ({
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
