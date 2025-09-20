import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestCreated } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const now = searchParams.get("now"); // optional override for testing

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          t.*,
          u.name as "creatorName",
          u.email as "creatorEmail",
          COUNT(DISTINCT q.id) as "questionCount",
          COUNT(DISTINCT ts.id) as "sessionCount",
          (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) as "totalQuestions"
        FROM tests t
        LEFT JOIN users u ON t."creatorId" = u.id
        LEFT JOIN test_questions tq ON t.id = tq.test_id
        LEFT JOIN questions q ON tq.question_id = q.id
        LEFT JOIN test_sessions ts ON t.id = ts."testId"
        WHERE 1=1
      `;

      const params: any[] = [];

      if (isActive !== null) {
        query += ` AND t."isActive" = $1`;
        params.push(isActive === "true");
      }

      // Filter by availability window if requested via isActive=true implicitly for peserta
      // We won't change default behavior here; consumers can filter themselves.

      query += ` GROUP BY t.id ORDER BY t."createdAt" DESC`;

      const result = await client.query(query, params);

      // Transform the data to match expected format
      const tests = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        duration: row.duration,
        totalQuestions: parseInt(row.totalQuestions) || 0,
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
        availableFrom: row.availableFrom,
        availableUntil: row.availableUntil,
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
    const {
      name,
      description,
      duration,
      maxAttempts,
      tabLeaveLimit,
      minimumScore,
      sections,
      availableFrom,
      availableUntil,
    } = body;

    // Ambil user dari request (lebih aman daripada mengandalkan body)
    const userInfo = (await getUserFromRequest(request)) || null;
    if (!userInfo || !userInfo.userId) {
      return NextResponse.json(
        { error: "Unauthorized: user tidak ditemukan" },
        { status: 401 }
      );
    }

    // Validasi input
    if (!name || !duration) {
      return NextResponse.json(
        { error: "Name dan duration harus diisi" },
        { status: 400 }
      );
    }

    // Periode wajib diisi dan valid
    if (!availableFrom || !availableUntil) {
      return NextResponse.json(
        { error: "Periode tes (mulai & berakhir) wajib diisi" },
        { status: 400 }
      );
    }
    const fromISO = ((): string | null => {
      const m =
        typeof availableFrom === "string" &&
        availableFrom.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      return m ? `${m[1]}T${m[2]}:00+07:00` : null;
    })();
    const untilISO = ((): string | null => {
      const m =
        typeof availableUntil === "string" &&
        availableUntil.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      return m ? `${m[1]}T${m[2]}:00+07:00` : null;
    })();
    if (!fromISO || !untilISO) {
      return NextResponse.json(
        { error: "Format periode tidak valid" },
        { status: 400 }
      );
    }
    if (new Date(fromISO).getTime() > new Date(untilISO).getTime()) {
      return NextResponse.json(
        {
          error:
            "Periode mulai harus sebelum atau sama dengan periode berakhir",
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      // Soft-migration: ensure required schema parts exist for older DBs
      await client.query(
        `ALTER TABLE tests ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER DEFAULT 1`
      );
      await client.query(
        `ALTER TABLE tests ADD COLUMN IF NOT EXISTS "tabLeaveLimit" INTEGER DEFAULT 3`
      );
      await client.query(
        `ALTER TABLE tests ADD COLUMN IF NOT EXISTS "availableFrom" TIMESTAMP NULL`
      );
      await client.query(
        `ALTER TABLE tests ADD COLUMN IF NOT EXISTS "availableUntil" TIMESTAMP NULL`
      );
      await client.query(
        `ALTER TABLE tests ADD COLUMN IF NOT EXISTS "minimumScore" INTEGER DEFAULT 60`
      );
      await client.query(`
        CREATE TABLE IF NOT EXISTS sections (
          id SERIAL PRIMARY KEY,
          testId VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          duration INTEGER NOT NULL,
          "order" INTEGER NOT NULL,
          "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
          "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
          CONSTRAINT fk_sections_test FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
        )
      `);
      await client.query(
        `ALTER TABLE test_questions ADD COLUMN IF NOT EXISTS section_id INTEGER`
      );
      await client.query(`
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE test_questions
              ADD CONSTRAINT fk_tq_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE;
          EXCEPTION WHEN duplicate_object THEN
            -- constraint already exists
            NULL;
          END;
        END $$;
      `);

      // Generate unique ID
      const testId = `test-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Pastikan kolom maxAttempts sudah ada di tabel tests
      const insertQuery = `
        INSERT INTO tests (
          id, name, description, duration, "creatorId", "isActive", "maxAttempts", "tabLeaveLimit", "minimumScore", "availableFrom", "availableUntil"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          ($10::timestamptz AT TIME ZONE 'Asia/Jakarta'),
          ($11::timestamptz AT TIME ZONE 'Asia/Jakarta')
        )
      `;

      // Normalize incoming datetime-local strings to timestamp in WIB by assuming input is local time
      // and converting to Asia/Jakarta. If values are empty/invalid, store nulls.
      const parseToISO = (value: any) => {
        if (!value || typeof value !== "string") return null;
        // Expect value like 'YYYY-MM-DDTHH:mm' from input type=datetime-local
        const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (!m) return null;
        // Treat as Asia/Jakarta local time by appending +07:00 offset
        return `${m[1]}T${m[2]}:00+07:00`;
      };

      const insertParams = [
        testId,
        name,
        description || null,
        parseInt(duration),
        userInfo.userId,
        true,
        typeof maxAttempts === "number" ? maxAttempts : 1,
        typeof tabLeaveLimit === "number" ? tabLeaveLimit : 3,
        typeof minimumScore === "number" ? minimumScore : 60,
        fromISO || null,
        untilISO || null,
      ];

      await client.query(insertQuery, insertParams);

      // Insert sections dan relasi soal ke tes (test_questions)
      if (Array.isArray(sections)) {
        for (const [sectionOrder, section] of sections.entries()) {
          // Insert section with auto-grouping configuration
          const sectionInsert = await client.query(
            `INSERT INTO sections (testId, name, duration, "order", autoGrouping, category, questionCount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [testId, section.name, section.duration, sectionOrder + 1, section.autoGrouping || false, section.category || null, section.questionCount || 10]
          );
          const sectionId = sectionInsert.rows[0].id;
          
          // Handle auto-grouping: if enabled, fetch questions by category
          let questionIds = section.questionIds || [];
          if (section.autoGrouping && section.category && questionIds.length === 0) {
            // Fetch questions from the specified category
            // Get a reasonable number of questions (default 10, but can be adjusted)
            const questionCount = section.questionCount || 10;
            const categoryQuestions = await client.query(
              `SELECT id FROM questions WHERE category = $1 ORDER BY RANDOM() LIMIT $2`,
              [section.category, questionCount]
            );
            questionIds = categoryQuestions.rows.map(row => row.id);
            
            // Log if not enough questions found
            if (questionIds.length < questionCount) {
              console.warn(`Only ${questionIds.length} questions found for category ${section.category}, requested ${questionCount}`);
            }
          }
          
          // Insert ke test_questions untuk setiap soal di section
          if (Array.isArray(questionIds) && questionIds.length > 0) {
            for (const questionId of questionIds) {
              await client.query(
                `INSERT INTO test_questions (test_id, question_id, section_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                [testId, questionId, sectionId]
              );
            }
          }
        }
      }
      
      // No need to update totalQuestions - we calculate it dynamically from test_questions table

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
        newTest.tabLeaveLimit = newTest.tabLeaveLimit;
        newTest.availableFrom = newTest.availableFrom;
        newTest.availableUntil = newTest.availableUntil;
      }

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

      await client.query("COMMIT");
      return NextResponse.json(newTest, { status: 201 });
    } finally {
      try {
        await client.query("ROLLBACK");
      } catch {}
      client.release();
    }
  } catch (error) {
    // Log detail error postgres jika ada
    const e: any = error;
    console.error("Error creating test:", e?.message || e, e?.code, e?.detail);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat tes" },
      { status: 500 }
    );
  }
}
