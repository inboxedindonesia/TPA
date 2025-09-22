import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logTestCompleted } from "@/lib/activityLogger";

// Endpoint: /api/test-sessions/[sessionId]/submit
export async function POST(request: Request, context: any) {
  try {
    const { sessionId } = await context.params;
    const { answers } = await request.json();

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

      // Simpan jawaban peserta ke tabel answers
      for (const [questionId, answer] of Object.entries(answers)) {
        // Generate unique ID untuk answer
        const answerId = `ans_${sessionId}_${questionId}_${Date.now()}`;
        
        // Check if answer already exists
        const existingAnswer = await client.query(
          `SELECT id FROM answers WHERE "sessionId" = $1 AND "questionId" = $2`,
          [sessionId, questionId]
        );
        
        if (existingAnswer.rows.length > 0) {
          // Update existing answer
          await client.query(
            `UPDATE answers SET "selectedAnswer" = $1, "answeredAt" = NOW() AT TIME ZONE 'Asia/Jakarta'
             WHERE "sessionId" = $2 AND "questionId" = $3`,
            [answer, sessionId, questionId]
          );
        } else {
          // Insert new answer
          await client.query(
            `INSERT INTO answers (id, "sessionId", "questionId", "selectedAnswer", "isCorrect", "pointsEarned", "answeredAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE 'Asia/Jakarta')`,
            [answerId, sessionId, questionId, answer, false, 0]
          );
        }
      }

      // Penilaian: ambil semua soal untuk test ini dengan kategori

      const questionsRes = await client.query(
        `SELECT q.id, q."correctAnswer", q.points, q.category
         FROM questions q
         INNER JOIN test_questions tq ON q.id = tq.question_id
         WHERE tq.test_id = $1`,
        [session.testId]
      );
      const questions = questionsRes.rows;
      
      // Initialize scores per category
      let score = 0;
      let maxScore = 0;
      let scoreVerbal = 0;
      let scoreAngka = 0;
      let scoreLogika = 0;
      let scoreGambar = 0;
      let maxScoreVerbal = 0;
      let maxScoreAngka = 0;
      let maxScoreLogika = 0;
      let maxScoreGambar = 0;
      
      for (const q of questions) {
        const userAnswer = answers[q.id];
        const point = typeof q.points === "number" ? q.points : 1;
        const category = q.category || "";
        
        maxScore += point;
        
        // Add to category max score
        if (category === "TES_VERBAL") {
          maxScoreVerbal += point;
        } else if (category === "TES_ANGKA") {
          maxScoreAngka += point;
        } else if (category === "TES_LOGIKA") {
          maxScoreLogika += point;
        } else if (category === "TES_GAMBAR") {
          maxScoreGambar += point;
        }
        
        // Jawaban benar bisa array/string, samakan format
        let correct = false;
        let correctAnswer = q.correctAnswer;
        
        // Parse correctAnswer if it's a JSON string
        if (typeof correctAnswer === "string") {
          const trimmed = correctAnswer.trim();
          if (
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"))
          ) {
            try {
              correctAnswer = JSON.parse(trimmed);
            } catch (e) {
              console.error("[ERROR] Gagal parse correctAnswer:", trimmed, e);
              correctAnswer = trimmed;
            }
          } else {
            correctAnswer = trimmed;
          }
        }
        
        // Check if answer is correct
        if (Array.isArray(correctAnswer)) {
          correct = Array.isArray(userAnswer)
            ? JSON.stringify(userAnswer.sort()) ===
              JSON.stringify(correctAnswer.sort())
            : correctAnswer.includes(userAnswer);
        } else {
          correct = userAnswer == correctAnswer;
        }
        
        const pointsEarned = correct ? point : 0;
        
        // Update answer record with correct status and points
        await client.query(
          `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 
           WHERE "sessionId" = $3 AND "questionId" = $4`,
          [correct, pointsEarned, sessionId, q.id]
        );
        
        if (correct) {
          score += point;
          
          // Add to category score
          if (category === "TES_VERBAL") {
            scoreVerbal += point;
          } else if (category === "TES_ANGKA") {
            scoreAngka += point;
          } else if (category === "TES_LOGIKA") {
            scoreLogika += point;
          } else if (category === "TES_GAMBAR") {
            scoreGambar += point;
          }
        }
      }

      // Update status sesi, skor total dan skor per kategori
      await client.query(
        `UPDATE test_sessions SET 
         status = $1, 
         "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'), 
         score = $2, 
         "maxScore" = $3,
         score_verbal = $4,
         score_angka = $5,
         score_logika = $6,
         score_gambar = $7,
         max_score_verbal = $8,
         max_score_angka = $9,
         max_score_logika = $10,
         max_score_gambar = $11
         WHERE id = $12`,
        ["COMPLETED", score, maxScore, scoreVerbal, scoreAngka, scoreLogika, scoreGambar, 
         maxScoreVerbal, maxScoreAngka, maxScoreLogika, maxScoreGambar, sessionId]
      );

      // Get user info and test name for notification
      const userInfo = (await getUserFromRequest(request)) || getFallbackUserInfo();
      
      // Get test name
      const testRes = await client.query(
        `SELECT name FROM tests WHERE id = $1`,
        [session.testId]
      );
      const testName = testRes.rows[0]?.name || "Unknown Test";

      // Log test completed activity
      try {
        await logTestCompleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole || "peserta",
          session.testId,
          testName,
          score
        );
      } catch (error) {
        console.error("Error logging test completion activity:", error);
      }

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
