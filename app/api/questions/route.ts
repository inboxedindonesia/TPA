import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");
    const type = searchParams.get("type");

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          q.*,
          t.name as "testName",
          u.name as "creatorName"
        FROM questions q
        LEFT JOIN tests t ON q."testId" = t.id
        LEFT JOIN users u ON q."creatorId" = u.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (testId) {
        query += ` AND q."testId" = $${paramIndex}`;
        params.push(testId);
        paramIndex++;
      }

      if (type && type !== "all") {
        query += ` AND q.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      query += ` ORDER BY q."order" ASC`;

      const result = await client.query(query, params);

      // Parse options JSON for each question
      const questions = result.rows.map((row: any) => ({
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
      }));

      return NextResponse.json(questions);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data soal" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      testId,
      type,
      question,
      options,
      correctAnswer,
      category,
      difficulty,
      explanation,
      points,
      order,
      creatorId,
    } = await request.json();

    // Validasi input
    if (!testId || !type || !question || !creatorId) {
      return NextResponse.json(
        { error: "TestId, type, question, dan creatorId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Generate unique ID
      const questionId = `q-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const insertQuery = `
        INSERT INTO questions (
          id, question, type, options, "correctAnswer", category, 
          difficulty, explanation, "order", points, "testId", "creatorId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const insertParams = [
        questionId,
        question,
        type,
        options ? JSON.stringify(options) : null,
        correctAnswer || "",
        category || "GENERAL",
        difficulty || "SEDANG",
        explanation || null,
        order || 1,
        points || 1,
        testId,
        creatorId,
      ];

      await client.query(insertQuery, insertParams);

      // Fetch the created question with related data
      const result = await client.query(
        `
        SELECT 
          q.*,
          t.name as "testName",
          u.name as "creatorName"
        FROM questions q
        LEFT JOIN tests t ON q."testId" = t.id
        LEFT JOIN users u ON q."creatorId" = u.id
        WHERE q.id = $1
      `,
        [questionId]
      );

      const newQuestion = result.rows[0];
      if (newQuestion) {
        newQuestion.options = newQuestion.options
          ? JSON.parse(newQuestion.options)
          : null;
      }

      return NextResponse.json(newQuestion, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat soal" },
      { status: 500 }
    );
  }
}
