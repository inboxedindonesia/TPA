import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: Request, { params }: any) {
  try {
    const testId = params["id"];
    const client = await pool.connect();

    try {
      // Create test_questions table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_questions (
          id SERIAL PRIMARY KEY,
          test_id VARCHAR(255) NOT NULL,
          question_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(test_id, question_id),
          FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Get questions for this test
      const query = `
        SELECT 
          q.id,
          q.question,
          q.category,
          q.difficulty,
          q.type,
          q.options,
          q."correctAnswer",
          q.gambarJawaban,
          q.tipeJawaban,
          q.allowMultipleAnswers as multiple_answer,
          q."createdAt",
          q."updatedAt",
          tq.created_at as added_at
        FROM questions q
        INNER JOIN test_questions tq ON q.id = tq.question_id
        WHERE tq.test_id = $1
        ORDER BY tq.created_at ASC
      `;

      const result = await client.query(query, [testId]);

      const questions = result.rows.map((row) => ({
        id: row.id,
        question: row.question,
        category: row.category,
        difficulty: row.difficulty,
        type: row.type,
        options: row.options ? JSON.parse(row.options) : [],
        correctAnswer: row.correctAnswer,
        gambarJawaban: row.gambarJawaban ? JSON.parse(row.gambarJawaban) : [],
        tipeJawaban: row.tipeJawaban,
        multipleAnswer: row.multiple_answer,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        addedAt: row.added_at,
      }));

      return NextResponse.json({ questions });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching test questions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil soal tes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const { questionIds } = await request.json();

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: "questionIds array diperlukan" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if test exists
      const testQuery = "SELECT id FROM tests WHERE id = $1";
      const testResult = await client.query(testQuery, [testId]);

      if (testResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }

      // Check if questions exist
      const questionsQuery = "SELECT id FROM questions WHERE id = ANY($1)";
      const questionsResult = await client.query(questionsQuery, [questionIds]);

      if (questionsResult.rows.length !== questionIds.length) {
        return NextResponse.json(
          { error: "Beberapa soal tidak ditemukan" },
          { status: 404 }
        );
      }

      // Check if questions are already in this test
      const existingQuery = `
        SELECT question_id FROM test_questions 
        WHERE test_id = $1 AND question_id = ANY($2)
      `;
      const existingResult = await client.query(existingQuery, [
        testId,
        questionIds,
      ]);

      if (existingResult.rows.length > 0) {
        const existingIds = existingResult.rows.map((row) => row.question_id);
        return NextResponse.json(
          {
            error: `Soal dengan ID ${existingIds.join(
              ", "
            )} sudah ada di tes ini`,
          },
          { status: 400 }
        );
      }

      // Add questions to test
      const insertQuery = `
        INSERT INTO test_questions (test_id, question_id, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `;

      for (const questionId of questionIds) {
        await client.query(insertQuery, [testId, questionId]);
      }

      // Update test total questions
      const updateTestQuery = `
        UPDATE tests 
        SET total_questions = (
          SELECT COUNT(*) FROM test_questions WHERE test_id = $1
        )
        WHERE id = $1
      `;
      await client.query(updateTestQuery, [testId]);

      return NextResponse.json({
        message: "Soal berhasil ditambahkan ke tes",
        addedCount: questionIds.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error adding questions to test:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan soal ke tes" },
      { status: 500 }
    );
  }
}
