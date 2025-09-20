import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest } from "@/lib/auth";

// Endpoint: GET /api/test-sessions/[sessionId]
export async function GET(request: NextRequest, context: any) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID diperlukan" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Get session details with breakdown scores
      const sessionRes = await client.query(
        `SELECT 
          ts.id,
          ts.status,
          ts."startTime",
          ts."endTime",
          ts.score,
          ts."maxScore",
          ts.score_verbal,
          ts.score_angka,
          ts.score_logika,
          ts.score_gambar,
          ts.max_score_verbal,
          ts.max_score_angka,
          ts.max_score_logika,
          ts.max_score_gambar,
          ts."userId",
          ts."testId",
          ts."createdAt",
          ts."updatedAt",
          u.name as user_name,
          u.email as user_email,
          u.registration_id as user_registration_id,
          t.name as test_name,
          t.description as test_description,
          t.duration as test_duration,
          t."minimumScore" as minimum_score
        FROM test_sessions ts
        LEFT JOIN users u ON ts."userId" = u.id
        LEFT JOIN tests t ON ts."testId" = t.id
        WHERE ts.id = $1`,
        [sessionId]
      );

      if (sessionRes.rows.length === 0) {
        return NextResponse.json(
          { error: "Sesi tes tidak ditemukan" },
          { status: 404 }
        );
      }

      const session = sessionRes.rows[0];

      // Get answers with question details
      const answersRes = await client.query(
        `SELECT 
          a.id,
          a."selectedAnswer",
          a."isCorrect",
          a."pointsEarned",
          a."answeredAt",
          a."questionId",
          q.question,
          q.type,
          q.options,
          q."correctAnswer",
          q.category,
          q.difficulty,
          q.explanation,
          q.points
        FROM answers a
        LEFT JOIN questions q ON a."questionId" = q.id
        WHERE a."sessionId" = $1
        ORDER BY q."order" ASC`,
        [sessionId]
      );

      // Calculate category percentages
      const categoryBreakdown = {
        TES_VERBAL: {
          score: session.score_verbal || 0,
          maxScore: session.max_score_verbal || 0,
          percentage: session.max_score_verbal > 0 
            ? Math.round((session.score_verbal / session.max_score_verbal) * 100) 
            : 0
        },
        TES_ANGKA: {
          score: session.score_angka || 0,
          maxScore: session.max_score_angka || 0,
          percentage: session.max_score_angka > 0 
            ? Math.round((session.score_angka / session.max_score_angka) * 100) 
            : 0
        },
        TES_LOGIKA: {
          score: session.score_logika || 0,
          maxScore: session.max_score_logika || 0,
          percentage: session.max_score_logika > 0 
            ? Math.round((session.score_logika / session.max_score_logika) * 100) 
            : 0
        },
        TES_GAMBAR: {
          score: session.score_gambar || 0,
          maxScore: session.max_score_gambar || 0,
          percentage: session.max_score_gambar > 0 
            ? Math.round((session.score_gambar / session.max_score_gambar) * 100) 
            : 0
        }
      };

      // Calculate overall percentage
      const overallPercentage = session.maxScore > 0 
        ? Math.round((session.score / session.maxScore) * 100) 
        : 0;

      const response = {
        session: {
          ...session,
          overallPercentage,
          categoryBreakdown
        },
        answers: answersRes.rows
      };

      return NextResponse.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching test session:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data sesi tes" },
      { status: 500 }
    );
  }
}
