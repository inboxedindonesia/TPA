import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

// Endpoint: /api/test-sessions/[sessionId]/submit
export async function POST(request: Request, { params }: any) {
  try {
    const sessionId = params["sessionId"];
    const { answers } = await request.json();

    console.log("[DEBUG] sessionId:", sessionId);
    console.log("[DEBUG] answers:", answers);

    if (!sessionId || !answers || typeof answers !== "object") {
      console.error("[ERROR] Data tidak lengkap", { sessionId, answers });
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Cek status sesi
      const sessionRes = await client.query(
        "SELECT * FROM test_sessions WHERE id = $1",
        [sessionId]
      );
      if (sessionRes.rows.length === 0) {
        console.error("[ERROR] Sesi tes tidak ditemukan", sessionId);
        return NextResponse.json(
          { error: "Sesi tes tidak ditemukan" },
          { status: 404 }
        );
      }
      const session = sessionRes.rows[0];
      if (session.status !== "ONGOING") {
        console.error(
          "[ERROR] Tes sudah diselesaikan atau dibatalkan",
          session.status
        );
        return NextResponse.json(
          { error: "Tes sudah diselesaikan atau dibatalkan" },
          { status: 400 }
        );
      }

      // Simpan jawaban peserta
      for (const [questionId, answer] of Object.entries(answers)) {
        await client.query(
          `INSERT INTO test_answers ("sessionId", "questionId", answer)
           VALUES ($1, $2, $3)
           ON CONFLICT ("sessionId", "questionId") DO UPDATE SET answer = $3`,
          [sessionId, questionId, answer]
        );
      }

      // Penilaian: ambil semua soal untuk test ini

      const questionsRes = await client.query(
        `SELECT q.id, q."correctAnswer", q.points
         FROM questions q
         INNER JOIN test_questions tq ON q.id = tq.question_id
         WHERE tq.test_id = $1`,
        [session.testId]
      );
      const questions = questionsRes.rows;
      console.log("[DEBUG] questions:", questions);
      let score = 0;
      let maxScore = 0;
      for (const q of questions) {
        const userAnswer = answers[q.id];
        const point = typeof q.points === "number" ? q.points : 1;
        maxScore += point;
        // Jawaban benar bisa array/string, samakan format
        let correct = false;
        try {
          const correctAnswer =
            typeof q.correctAnswer === "string"
              ? JSON.parse(q.correctAnswer)
              : q.correctAnswer;
          if (Array.isArray(correctAnswer)) {
            correct = Array.isArray(userAnswer)
              ? JSON.stringify(userAnswer.sort()) ===
                JSON.stringify(correctAnswer.sort())
              : correctAnswer.includes(userAnswer);
          } else {
            correct = userAnswer == correctAnswer;
          }
        } catch (e) {
          console.error("[ERROR] Parsing correctAnswer", e, q);
          correct = userAnswer == q.correctAnswer;
        }
        if (correct) score += point;
      }

      // Update status sesi, skor, dan maxScore
      await client.query(
        'UPDATE test_sessions SET status = $1, "endTime" = NOW(), score = $2, "maxScore" = $3 WHERE id = $4',
        ["COMPLETED", score, maxScore, sessionId]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[ERROR SUBMIT TES]", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        detail:
          error && typeof error === "object" && "message" in error
            ? (error as any).message
            : String(error),
      },
      { status: 500 }
    );
  }
}
