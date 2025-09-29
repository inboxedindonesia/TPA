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

      // Get test type
      const testTypeRes = await client.query(
        "SELECT test_type FROM tests WHERE id = $1",
        [session.testId]
      );
      const testType = testTypeRes.rows[0]?.test_type || "TPA";

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

      const scoreTpaAptitude = async () => {
        const questionsRes = await client.query(
          `SELECT q.id, q."correctAnswer", q.points, q.category
           FROM questions q
           INNER JOIN test_questions tq ON q.id = tq.question_id
           WHERE tq.test_id = $1`,
          [session.testId]
        );
        const questions = questionsRes.rows;

        let score = 0,
          maxScore = 0;
        let scoreVerbal = 0,
          maxScoreVerbal = 0;
        let scoreAngka = 0,
          maxScoreAngka = 0;
        let scoreLogika = 0,
          maxScoreLogika = 0;
        let scoreGambar = 0,
          maxScoreGambar = 0;

        for (const q of questions) {
          const userAnswer = answers[q.id];
          const point = typeof q.points === "number" ? q.points : 1;
          const category = q.category || "";

          maxScore += point;
          if (category === "TES_VERBAL") maxScoreVerbal += point;
          else if (category === "TES_ANGKA") maxScoreAngka += point;
          else if (category === "TES_LOGIKA") maxScoreLogika += point;
          else if (category === "TES_GAMBAR") maxScoreGambar += point;

          let correct = false;
          let correctAnswer = q.correctAnswer;
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
              }
            }
          }

          if (Array.isArray(correctAnswer)) {
            correct = Array.isArray(userAnswer)
              ? JSON.stringify(userAnswer.sort()) ===
                JSON.stringify(correctAnswer.sort())
              : correctAnswer.includes(userAnswer);
          } else {
            correct = userAnswer == correctAnswer;
          }

          const pointsEarned = correct ? point : 0;
          await client.query(
            `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2 
             WHERE "sessionId" = $3 AND "questionId" = $4`,
            [correct, pointsEarned, sessionId, q.id]
          );

          if (correct) {
            score += point;
            if (category === "TES_VERBAL") scoreVerbal += point;
            else if (category === "TES_ANGKA") scoreAngka += point;
            else if (category === "TES_LOGIKA") scoreLogika += point;
            else if (category === "TES_GAMBAR") scoreGambar += point;
          }
        }

        await client.query(
          `UPDATE test_sessions SET 
           status = 'COMPLETED', "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'), 
           score = $1, "maxScore" = $2,
           score_verbal = $3, max_score_verbal = $4,
           score_angka = $5, max_score_angka = $6,
           score_logika = $7, max_score_logika = $8,
           score_gambar = $9, max_score_gambar = $10
           WHERE id = $11`,
          [
            score,
            maxScore,
            scoreVerbal,
            maxScoreVerbal,
            scoreAngka,
            maxScoreAngka,
            scoreLogika,
            maxScoreLogika,
            scoreGambar,
            maxScoreGambar,
            sessionId,
          ]
        );
      };

      const scoreRiasec = async () => {
        const questionsRes = await client.query(
          `SELECT q.id, q.points, q.category
           FROM questions q
           INNER JOIN test_questions tq ON q.id = tq.question_id
           WHERE tq.test_id = $1`,
          [session.testId]
        );
        const questions = questionsRes.rows;

        let scoreRealistic = 0,
          maxScoreRealistic = 0;
        let scoreInvestigative = 0,
          maxScoreInvestigative = 0;
        let scoreArtistic = 0,
          maxScoreArtistic = 0;
        let scoreSocial = 0,
          maxScoreSocial = 0;
        let scoreEnterprising = 0,
          maxScoreEnterprising = 0;
        let scoreConventional = 0,
          maxScoreConventional = 0;

        for (const q of questions) {
          const userAnswer = answers[q.id];
          const point = typeof q.points === "number" ? q.points : 1;
          const category = q.category || "";

          // Accumulate max scores
          if (category === "TES_REALISTIC") maxScoreRealistic += point;
          else if (category === "TES_INVESTIGATIVE")
            maxScoreInvestigative += point;
          else if (category === "TES_ARTISTIC") maxScoreArtistic += point;
          else if (category === "TES_SOCIAL") maxScoreSocial += point;
          else if (category === "TES_ENTERPRISING")
            maxScoreEnterprising += point;
          else if (category === "TES_CONVENTIONAL")
            maxScoreConventional += point;

          // If answered, add to score and mark as correct
          if (userAnswer !== undefined && userAnswer !== null) {
            await client.query(
              `UPDATE answers SET "isCorrect" = $1, "pointsEarned" = $2
               WHERE "sessionId" = $3 AND "questionId" = $4`,
              [true, point, sessionId, q.id]
            );

            if (category === "TES_REALISTIC") scoreRealistic += point;
            else if (category === "TES_INVESTIGATIVE")
              scoreInvestigative += point;
            else if (category === "TES_ARTISTIC") scoreArtistic += point;
            else if (category === "TES_SOCIAL") scoreSocial += point;
            else if (category === "TES_ENTERPRISING")
              scoreEnterprising += point;
            else if (category === "TES_CONVENTIONAL")
              scoreConventional += point;
          }
        }

        // Calculate Holland Code
        const riasecScores = [
          { code: "R", score: scoreRealistic },
          { code: "I", score: scoreInvestigative },
          { code: "A", score: scoreArtistic },
          { code: "S", score: scoreSocial },
          { code: "E", score: scoreEnterprising },
          { code: "C", score: scoreConventional },
        ];
        riasecScores.sort((a, b) => b.score - a.score);
        const hollandCode = riasecScores
          .slice(0, 3)
          .map((item) => item.code)
          .join("");

        // Calculate total score for RIASEC (sum of all scores)
        const totalScore =
          scoreRealistic +
          scoreInvestigative +
          scoreArtistic +
          scoreSocial +
          scoreEnterprising +
          scoreConventional;
        const maxTotalScore =
          maxScoreRealistic +
          maxScoreInvestigative +
          maxScoreArtistic +
          maxScoreSocial +
          maxScoreEnterprising +
          maxScoreConventional;

        await client.query(
          `UPDATE test_sessions SET
           status = 'COMPLETED', "endTime" = (NOW() AT TIME ZONE 'Asia/Jakarta'),
           score = $1, "maxScore" = $2,
           score_realistic = $3, max_score_realistic = $4,
           score_investigative = $5, max_score_investigative = $6,
           score_artistic = $7, max_score_artistic = $8,
           score_social = $9, max_score_social = $10,
           score_enterprising = $11, max_score_enterprising = $12,
           score_conventional = $13, max_score_conventional = $14,
           holland_code = $15
           WHERE id = $16`,
          [
            totalScore,
            maxTotalScore,
            scoreRealistic,
            maxScoreRealistic,
            scoreInvestigative,
            maxScoreInvestigative,
            scoreArtistic,
            maxScoreArtistic,
            scoreSocial,
            maxScoreSocial,
            scoreEnterprising,
            maxScoreEnterprising,
            scoreConventional,
            maxScoreConventional,
            hollandCode,
            sessionId,
          ]
        );
      };

      if (testType === "RIASEC") {
        await scoreRiasec();
      } else {
        await scoreTpaAptitude();
      }

      // Get user info and test name for notification
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Get test name
      const testRes = await client.query(
        `SELECT name FROM tests WHERE id = $1`,
        [session.testId]
      );
      const testName = testRes.rows[0]?.name || "Unknown Test";

      const finalScoreRes = await client.query(
        "SELECT score FROM test_sessions WHERE id = $1",
        [sessionId]
      );
      const finalScore = finalScoreRes.rows[0]?.score || 0;

      // Log test completed activity
      try {
        await logTestCompleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole || "peserta",
          session.testId,
          testName,
          finalScore
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
