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
  ts."endTime" as "completedAt",
        ts."startTime" as "startTime",
        ts."testId" as "testId",
  t.duration as "testDuration",
  ts."createdAt" as "createdAt",
  CASE 
    WHEN ts."endTime" > COALESCE(ts."startTime", ts."createdAt")
      THEN CEIL(EXTRACT(EPOCH FROM (ts."endTime" - COALESCE(ts."startTime", ts."createdAt"))))::int
    ELSE 0
  END as "durationSpentSecSql"
      FROM test_sessions ts
      JOIN tests t ON ts."testId" = t.id
      WHERE ts.status IN ('COMPLETED', 'FINISHED')
        AND ts."userId" = $1
        AND ts."endTime" IS NOT NULL
      ORDER BY ts."endTime" DESC`,
      [user.userId]
    );

    const rows = resultsRes.rows;

    // Kumpulkan testId dan sessionId untuk batch-query tambahan
    const sessionIds: string[] = rows.map((r: any) => String(r.id));
    const testIds: string[] = Array.from(
      new Set(rows.map((r: any) => String(r.testId)))
    );

    // Total pertanyaan per test (gunakan cast ke text untuk aman terhadap tipe kolom)
    let totalByTest = new Map<string, number>();
    if (testIds.length > 0) {
      const tqRes = await client.query(
        `SELECT CAST(tq.test_id AS text) as "testId", COUNT(*)::int as "totalQuestions"
         FROM test_questions tq
         WHERE CAST(tq.test_id AS text) = ANY($1::text[])
         GROUP BY tq.test_id`,
        [testIds]
      );
      for (const row of tqRes.rows) {
        totalByTest.set(row.testId, row.totalQuestions);
      }
    }

    // Ambil semua jawaban peserta (untuk hitung benar/salah)
    // dan bandingkan dengan correctAnswer dari tabel questions
    let correctCountBySession = new Map<string, number>();
    if (sessionIds.length > 0) {
      const ansRes = await client.query(
        `SELECT 
           ta."sessionId" as "sessionId",
           ta."questionId" as "questionId",
           ta.answer as "answer",
           q."correctAnswer" as "correctAnswer",
           q.points as points
         FROM test_answers ta
         JOIN questions q ON q.id = ta."questionId"
         WHERE ta."sessionId" = ANY($1)`,
        [sessionIds]
      );

      // Helper untuk normalize correctAnswer seperti di endpoint submit
      const normalizeCorrectAnswer = (val: any) => {
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))
          ) {
            try {
              return JSON.parse(trimmed);
            } catch {
              return trimmed;
            }
          }
          return trimmed;
        }
        return val;
      };

      // Helper untuk normalize jawaban user dari tabel test_answers
      const normalizeUserAnswer = (val: any) => {
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))
          ) {
            try {
              return JSON.parse(trimmed);
            } catch {
              return trimmed;
            }
          }
          return trimmed;
        }
        return val;
      };

      const isEqualArray = (a: any[], b: any[]) => {
        try {
          const sa = [...a].sort();
          const sb = [...b].sort();
          return JSON.stringify(sa) === JSON.stringify(sb);
        } catch {
          return false;
        }
      };

      for (const r of ansRes.rows) {
        const sessionId: string = r.sessionId;
        const userAnswer = normalizeUserAnswer(r.answer);
        let correctAnswer: any = normalizeCorrectAnswer(r.correctAnswer);
        let correct = false;
        if (Array.isArray(correctAnswer)) {
          correct = Array.isArray(userAnswer)
            ? isEqualArray(userAnswer, correctAnswer)
            : correctAnswer.includes(userAnswer);
        } else {
          correct = Array.isArray(userAnswer)
            ? userAnswer.includes(correctAnswer)
            : userAnswer == correctAnswer;
        }
        if (correct) {
          correctCountBySession.set(
            sessionId,
            (correctCountBySession.get(sessionId) || 0) + 1
          );
        }
      }
    }

    const results = rows.map((row: any) => {
      const totalQuestions = totalByTest.get(row.testId) || 0;
      const correctAnswers = correctCountBySession.get(row.id) || 0;
      const start = row.startTime
        ? new Date(row.startTime)
        : row.createdAt
        ? new Date(row.createdAt)
        : null;
      const end = row.completedAt ? new Date(row.completedAt) : null;
      let durationSpentSec: number | null = null;
      if (start && end) {
        const diffMs = end.getTime() - start.getTime();
        durationSpentSec = diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
      }
      if (!durationSpentSec || durationSpentSec < 1) {
        if (
          row.durationSpentSecSql &&
          Number.isFinite(row.durationSpentSecSql)
        ) {
          durationSpentSec = Math.max(1, Number(row.durationSpentSecSql));
        }
      }

      return {
        id: row.id,
        testName: row.testName,
        score: row.score,
        maxScore: row.maxScore,
        completedAt: row.completedAt,
        date: row.completedAt,
        createdAt: row.createdAt,
        percentage:
          row.maxScore && row.maxScore > 0
            ? Math.round((row.score / row.maxScore) * 100)
            : 0,
        totalQuestions,
        correctAnswers,
        testDuration: row.testDuration, // dalam menit (sesuai kolom tests)
        durationSpentSec, // detik yang dihabiskan
      };
    });

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
