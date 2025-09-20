import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: Request, { params }: any) {
  try {
    const id = params["id"];

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: "ID soal tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get question details
      const query = `
        SELECT 
          id, question, category, difficulty, options, "correctAnswer",
          tipeSoal, tipeJawaban, gambar, gambarJawaban, subkategori,
          levelKesulitan, deskripsi, allowMultipleAnswers, "createdAt"
        FROM questions 
        WHERE id = $1
      `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Soal tidak ditemukan" },
          { status: 404 }
        );
      }

      const question = result.rows[0];

      // Parse JSON fields
      const parsedQuestion = {
        ...question,
        options: question.options ? JSON.parse(question.options) : [],
        correctAnswer: question.correctAnswer
          ? JSON.parse(question.correctAnswer)
          : [],
        gambarJawaban: (() => {
          try {
            if (question.gambarJawaban) {
              return JSON.parse(question.gambarJawaban);
            }
            if (question.gambarjawaban) {
              // Handle different JSON formats
              const raw = question.gambarjawaban;

              if (raw.startsWith("{") && raw.endsWith("}")) {
                // Try to parse as JSON object
                const parsed = JSON.parse(raw);
                // If it's an object with numeric keys, convert to array
                if (typeof parsed === "object" && !Array.isArray(parsed)) {
                  return Object.values(parsed);
                }
                return parsed;
              } else if (raw.startsWith("[") && raw.endsWith("]")) {
                // Parse as JSON array
                return JSON.parse(raw);
              } else {
                // Try to parse as PostgreSQL array format
                const cleaned = raw.replace(/[{}"]/g, "");
                return cleaned
                  .split(",")
                  .filter((item: string) => item.trim())
                  .map((item: string) => item.trim());
              }
            }
            return [];
          } catch (error) {
            console.error("Error parsing gambarJawaban:", error);
            return [];
          }
        })(),
      };

      return NextResponse.json(parsedQuestion);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil soal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const id = params["id"];

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: "ID soal tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if question exists
      const checkQuery = "SELECT id FROM questions WHERE id = $1";
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Soal tidak ditemukan" },
          { status: 404 }
        );
      }

      // Get question details before deletion for logging
      const questionQuery = "SELECT question FROM questions WHERE id = $1";
      const questionResult = await client.query(questionQuery, [id]);
      const questionText =
        questionResult.rows[0]?.question || "Unknown Question";

      // Get all tests that contain this question before deletion
      const testsQuery = `
        SELECT DISTINCT test_id FROM test_questions WHERE question_id = $1
      `;
      const testsResult = await client.query(testsQuery, [id]);
      const affectedTestIds = testsResult.rows.map(row => row.test_id);

      // Delete question (CASCADE will delete from test_questions)
      const deleteQuery = "DELETE FROM questions WHERE id = $1";
      await client.query(deleteQuery, [id]);

      // No need to update totalQuestions - we calculate it dynamically from test_questions table

      return NextResponse.json(
        { message: "Soal berhasil dihapus" },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus soal" },
      { status: 500 }
    );
  }
}
