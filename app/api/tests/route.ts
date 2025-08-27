import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestCreated } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          t.*,
          u.name as "creatorName",
          u.email as "creatorEmail",
          COUNT(DISTINCT q.id) as "questionCount",
          COUNT(DISTINCT ts.id) as "sessionCount"
        FROM tests t
        LEFT JOIN users u ON t."creatorId" = u.id
        LEFT JOIN questions q ON t.id = q."testId"
        LEFT JOIN test_sessions ts ON t.id = ts."testId"
        WHERE 1=1
      `;

      const params: any[] = [];

      if (isActive !== null) {
        query += ` AND t."isActive" = $1`;
        params.push(isActive === "true");
      }

      query += ` GROUP BY t.id ORDER BY t."createdAt" DESC`;

      const result = await client.query(query, params);

      // Transform the data to match expected format
      const tests = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        duration: row.duration,
        totalQuestions: row.totalQuestions,
        isActive: Boolean(row.isActive),
        creatorId: row.creatorId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        creator: {
          id: row.creatorId,
          name: row.creatorName,
          email: row.creatorEmail,
        },
        questions: Array.from({ length: row.questionCount }, (_, i) => ({
          id: `q-${i}`,
        })),
        sessions: Array.from({ length: row.sessionCount }, (_, i) => ({
          id: `s-${i}`,
        })),
      }));

      return NextResponse.json(tests);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data tes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, duration, creatorId, maxAttempts, sections } =
      body;

    // Validasi input
    if (!name || !duration || !creatorId) {
      return NextResponse.json(
        { error: "Name, duration, dan creatorId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Generate unique ID
      const testId = `test-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Pastikan kolom maxAttempts sudah ada di tabel tests
      const insertQuery = `
        INSERT INTO tests (
          id, name, description, duration, "creatorId", "isActive", "maxAttempts"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const insertParams = [
        testId,
        name,
        description || null,
        parseInt(duration),
        creatorId,
        true,
        typeof maxAttempts === "number" ? maxAttempts : 1,
      ];

      await client.query(insertQuery, insertParams);

      // Insert sections dan relasi soal ke tes (test_questions)
      if (Array.isArray(sections)) {
        for (const [sectionOrder, section] of sections.entries()) {
          // Insert section
          const sectionInsert = await client.query(
            `INSERT INTO sections (testId, name, duration, "order") VALUES ($1, $2, $3, $4) RETURNING id`,
            [testId, section.name, section.duration, sectionOrder + 1]
          );
          const sectionId = sectionInsert.rows[0].id;
          // Insert ke test_questions untuk setiap soal di section
          if (
            Array.isArray(section.questionIds) &&
            section.questionIds.length > 0
          ) {
            for (const questionId of section.questionIds) {
              await client.query(
                `INSERT INTO test_questions (test_id, question_id, section_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                [testId, questionId, sectionId]
              );
            }
          }
        }
      }

      // Fetch the created test with creator data
      const result = await client.query(
        `
        SELECT 
          t.*,
          u.name as "creatorName",
          u.email as "creatorEmail"
        FROM tests t
        LEFT JOIN users u ON t."creatorId" = u.id
        WHERE t.id = $1
      `,
        [testId]
      );

      const newTest = result.rows[0];
      if (newTest) {
        newTest.isActive = Boolean(newTest.isActive);
        newTest.creator = {
          id: newTest.creatorId,
          name: newTest.creatorName,
          email: newTest.creatorEmail,
        };
      }

      // Get user info from request
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Log activity
      try {
        await logTestCreated(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          testId,
          name
        );
      } catch (error) {
        console.error("Error logging activity:", error);
      }

      return NextResponse.json(newTest, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat tes" },
      { status: 500 }
    );
  }
}
