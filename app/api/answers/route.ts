import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestCompleted } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, selectedAnswer } = await request.json();

    // Validasi input
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: "SessionId dan questionId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Ambil data soal untuk mengecek jawaban benar
      const questionResult = await client.query(
        "SELECT * FROM questions WHERE id = $1",
        [questionId]
      );

      const questions = questionResult.rows;
      if (questions.length === 0) {
        return NextResponse.json(
          { error: "Soal tidak ditemukan" },
          { status: 404 }
        );
      }

      const question = questions[0];

      // Cek apakah sudah ada jawaban untuk soal ini
      const existingResult = await client.query(
        'SELECT * FROM answers WHERE "sessionId" = $1 AND "questionId" = $2',
        [sessionId, questionId]
      );

      const existingAnswers = existingResult.rows;
      const isCorrect = selectedAnswer === question.correctAnswer;
      const pointsEarned = isCorrect ? question.points : 0;

      let savedAnswer;

      if (existingAnswers.length > 0) {
        // Update jawaban yang sudah ada
        const existingAnswer = existingAnswers[0];
        await client.query(
          `UPDATE answers 
           SET "selectedAnswer" = $1, "isCorrect" = $2, "pointsEarned" = $3, "answeredAt" = NOW()
           WHERE id = $4`,
          [selectedAnswer, isCorrect, pointsEarned, existingAnswer.id]
        );

        // Fetch updated answer
        const updatedResult = await client.query(
          "SELECT * FROM answers WHERE id = $1",
          [existingAnswer.id]
        );
        savedAnswer = updatedResult.rows[0];
      } else {
        // Buat jawaban baru
        const answerId = `answer-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        await client.query(
          `INSERT INTO answers (
            id, "sessionId", "questionId", "selectedAnswer", "isCorrect", "pointsEarned", "answeredAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            answerId,
            sessionId,
            questionId,
            selectedAnswer,
            isCorrect,
            pointsEarned,
          ]
        );

        // Fetch created answer
        const newAnswerResult = await client.query(
          "SELECT * FROM answers WHERE id = $1",
          [answerId]
        );
        savedAnswer = newAnswerResult.rows[0];
      }

      return NextResponse.json(savedAnswer, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving answer:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan jawaban" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Hitung total skor
      const answerResult = await client.query(
        `SELECT a.*, q.points as "questionPoints"
         FROM answers a
         LEFT JOIN questions q ON a."questionId" = q.id
         WHERE a."sessionId" = $1`,
        [sessionId]
      );

      const answers = answerResult.rows;
      const totalScore = answers.reduce(
        (sum: number, answer: any) => sum + answer.pointsEarned,
        0
      );

      // Update sesi tes
      await client.query(
        `UPDATE test_sessions 
         SET status = 'COMPLETED', "endTime" = NOW(), score = $1
         WHERE id = $2`,
        [totalScore, sessionId]
      );

      // Fetch updated session with related data
      const result = await client.query(
        `
        SELECT 
          ts.*,
          u.name as "userName",
          u.email as "userEmail",
          t.name as "testName"
        FROM test_sessions ts
        LEFT JOIN users u ON ts."userId" = u.id
        LEFT JOIN tests t ON ts."testId" = t.id
        WHERE ts.id = $1
      `,
        [sessionId]
      );

      const updatedSession = result.rows[0];
      if (updatedSession) {
        updatedSession.user = {
          id: updatedSession.userId,
          name: updatedSession.userName,
          email: updatedSession.userEmail,
        };
        updatedSession.test = {
          id: updatedSession.testId,
          name: updatedSession.testName,
        };
      }

      // Get user info from request
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Log activity
      try {
        await logTestCompleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          updatedSession.testId,
          updatedSession.testName || "Unknown Test",
          totalScore
        );
      } catch (error) {
        console.error("Error logging activity:", error);
      }

      return NextResponse.json(updatedSession);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error completing test session:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyelesaikan tes" },
      { status: 500 }
    );
  }
}
