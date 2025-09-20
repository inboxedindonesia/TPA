import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const type = searchParams.get("type") || "";

    const offset = (page - 1) * limit;

    const client = await pool.connect();

    try {
      // Build WHERE clause based on filters
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(
          `(q.question ILIKE $${paramIndex} OR q.category ILIKE $${paramIndex})`
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (category) {
        whereConditions.push(`q.category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (difficulty) {
        whereConditions.push(`q.difficulty = $${paramIndex}`);
        queryParams.push(difficulty);
        paramIndex++;
      }

      if (type) {
        whereConditions.push(`q.type = $${paramIndex}`);
        queryParams.push(type);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM questions q
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get questions with pagination
      const questionsQuery = `
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
          0 as usage_count,
          0 as avg_score
        FROM questions q
        ${whereClause}
        ORDER BY q."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const finalParams = [...queryParams, limit, offset];
      const questionsResult = await client.query(questionsQuery, finalParams);

      // Get unique categories and difficulties for filters
      const categoriesQuery = `
        SELECT DISTINCT category 
        FROM questions 
        WHERE category IS NOT NULL 
        ORDER BY category
      `;
      const categoriesResult = await client.query(categoriesQuery);

      const difficultiesQuery = `
        SELECT DISTINCT difficulty 
        FROM questions 
        WHERE difficulty IS NOT NULL 
        ORDER BY difficulty
      `;
      const difficultiesResult = await client.query(difficultiesQuery);

      const typesQuery = `
        SELECT DISTINCT type 
        FROM questions 
        WHERE type IS NOT NULL 
        ORDER BY type
      `;
      const typesResult = await client.query(typesQuery);

      // Process questions data
      const questions = questionsResult.rows.map((row) => ({
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
        usageCount: parseInt(row.usage_count),
        avgScore: parseFloat(row.avg_score || 0),
      }));

      return NextResponse.json({
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          categories: categoriesResult.rows.map((row) => row.category),
          difficulties: difficultiesResult.rows.map((row) => row.difficulty),
          types: typesResult.rows.map((row) => row.type),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching bank soal:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data bank soal" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testId, questionIds } = await request.json();

    if (!testId || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: "testId dan questionIds array diperlukan" },
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

      // Add questions to test
      const insertQuery = `
        INSERT INTO test_questions (test_id, question_id, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (test_id, question_id) DO NOTHING
      `;

      let addedCount = 0;
      for (const questionId of questionIds) {
        try {
          await client.query(insertQuery, [testId, questionId]);
          addedCount++;
        } catch (error) {
          // Skip if already exists
          console.log(
            `Question ${questionId} already exists in test ${testId}`
          );
        }
      }

      // No need to update totalQuestions - we calculate it dynamically from test_questions table

      return NextResponse.json({
        message: "Soal berhasil ditambahkan ke tes",
        addedCount,
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
