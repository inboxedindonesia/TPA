export async function GET(request: Request, { params }: any) {
  try {
    const awaitedParams = await params;
    const id = awaitedParams["id"];
    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const url = new URL(request.url);
      const withSections = url.searchParams.get("withSections") === "true";
      const testQuery = `SELECT * FROM tests WHERE id = $1`;
      const testResult = await client.query(testQuery, [id]);
      if (testResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }
      const test = testResult.rows[0];
      if (!withSections) {
        return NextResponse.json(test);
      }
      // Ambil sections dan soal per section (Supabase: kolom testId, bukan test_id)
      const sectionQuery = `SELECT * FROM sections WHERE testid = $1 ORDER BY "order" ASC, createdat ASC`;
      const sectionResult = await client.query(sectionQuery, [id]);
      const sections = [];
      for (const section of sectionResult.rows) {
        // Ambil soal untuk section ini (pakai sectionId di tabel questions)
        const questionsQuery = `
          SELECT q.* FROM test_questions tq
          INNER JOIN questions q ON tq.question_id = q.id
          WHERE tq.test_id = $1 AND tq.section_id = $2
          ORDER BY q."order" ASC, q."createdAt" ASC
        `;
        const questionsResult = await client.query(questionsQuery, [
          id,
          section.id,
        ]);
        sections.push({
          id: section.id,
          name: section.name,
          duration: section.duration,
          questions: questionsResult.rows,
          autoGrouping: section.autogrouping || false,
          category: section.category || null,
          questionCount: section.questioncount || null,
        });
      }
      return NextResponse.json({ ...test, sections });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data tes" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logTestDeleted, logTestUpdated } from "@/lib/activityLogger";

export async function PATCH(request: Request, { params }: any) {
  try {
    const id = params["id"];

    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { isActive } = body as { isActive?: boolean };

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: 'Field "isActive" harus berupa boolean' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Pastikan tes ada dan ambil namanya untuk logging
      const getQuery = `SELECT name FROM tests WHERE id = $1`;
      const getResult = await client.query(getQuery, [id]);
      if (getResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }

      const testName: string = getResult.rows[0].name;

      const updateQuery = `
        UPDATE tests
        SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await client.query(updateQuery, [isActive, id]);

      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      try {
        await logTestUpdated(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          id,
          testName
        );
      } catch (error) {
        console.error("Error logging activity (update test):", error);
      }

      return NextResponse.json({ message: "Tes berhasil diperbarui" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui tes" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Cek keberadaan tes dan ambil nama untuk logging
      const checkQuery = `SELECT name FROM tests WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [id]);
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }
      const testName: string = checkResult.rows[0].name;

      // Hapus tes; relasi ber-ON DELETE CASCADE akan menangani child rows
      const deleteQuery = `DELETE FROM tests WHERE id = $1`;
      await client.query(deleteQuery, [id]);

      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      try {
        await logTestDeleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          id,
          testName
        );
      } catch (error) {
        console.error("Error logging activity (delete test):", error);
      }

      return NextResponse.json({ message: "Tes berhasil dihapus" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus tes" },
      { status: 500 }
    );
  }
}

// PUT /api/tests/[id] - Update test detail termasuk periode & sections
export async function PUT(request: Request, { params }: any) {
  try {
    const id = params["id"];
    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      description,
      isActive,
      maxAttempts,
      tabLeaveLimit,
      duration,
      sections,
      availableFrom,
      availableUntil,
      minimumScore,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nama tes wajib diisi" },
        { status: 400 }
      );
    }

    // Periode wajib & valid
    if (!availableFrom || !availableUntil) {
      return NextResponse.json(
        { error: "Periode tes (mulai & berakhir) wajib diisi" },
        { status: 400 }
      );
    }
    const toISOWithWIB = (value: any): string | null => {
      if (!value || typeof value !== "string") return null;
      const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      return m ? `${m[1]}T${m[2]}:00+07:00` : null;
    };
    const fromISO = toISOWithWIB(availableFrom);
    const untilISO = toISOWithWIB(availableUntil);
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

      // Pastikan tes ada dan ambil nama untuk logging
      const exists = await client.query(
        `SELECT name FROM tests WHERE id = $1`,
        [id]
      );
      if (exists.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }

      // Update kolom dasar di tests (termasuk periode WIB)
      await client.query(
        `UPDATE tests SET 
          name = $1,
          description = $2,
          "isActive" = COALESCE($3, "isActive"),
          "maxAttempts" = COALESCE($4, "maxAttempts"),
          "tabLeaveLimit" = COALESCE($5, "tabLeaveLimit"),
          duration = COALESCE($6, duration),
          "availableFrom" = ($7::timestamptz AT TIME ZONE 'Asia/Jakarta'),
          "availableUntil" = ($8::timestamptz AT TIME ZONE 'Asia/Jakarta'),
          "minimumScore" = COALESCE($9, "minimumScore"),
          "updatedAt" = (NOW() AT TIME ZONE 'Asia/Jakarta')
        WHERE id = $10`,
        [
          name,
          description || null,
          typeof isActive === "boolean" ? isActive : null,
          typeof maxAttempts === "number" ? maxAttempts : null,
          typeof tabLeaveLimit === "number" ? tabLeaveLimit : null,
          typeof duration === "number" ? duration : null,
          fromISO,
          untilISO,
          typeof minimumScore === "number" ? minimumScore : null,
          id,
        ]
      );

      // Replace sections jika dikirim
      if (Array.isArray(sections)) {
        // Hapus relasi & sections lama
        await client.query(`DELETE FROM test_questions WHERE test_id = $1`, [
          id,
        ]);
        await client.query(`DELETE FROM sections WHERE testId = $1`, [id]);

        // Insert ulang sections dan test_questions
        for (const [order, s] of sections.entries()) {
          const sec = await client.query(
            `INSERT INTO sections (testId, name, duration, "order", autoGrouping, category, questionCount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [id, s.name, s.duration, order + 1, s.autoGrouping || false, s.category || null, s.questionCount || 10]
          );
          const sectionId = sec.rows[0].id;
          
          // Handle questions based on section type
          if (s.autoGrouping && s.category) {
            // Auto-grouping: select random questions from category
            const questionCount = s.questionCount || 10;
            const categoryQuestions = await client.query(
              `SELECT id FROM questions WHERE category = $1 ORDER BY RANDOM() LIMIT $2`,
              [s.category, questionCount]
            );
            const questionIds = categoryQuestions.rows.map(row => row.id);
            
            // Log if not enough questions found
            if (questionIds.length < questionCount) {
              console.warn(`Only ${questionIds.length} questions found for category ${s.category}, requested ${questionCount}`);
            }
            
            // Insert selected questions
            for (const questionId of questionIds) {
              await client.query(
                `INSERT INTO test_questions (test_id, question_id, section_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                [id, questionId, sectionId]
              );
            }
          } else if (Array.isArray(s.questionIds) && s.questionIds.length > 0) {
            // Manual selection: use provided question IDs
            for (const qid of s.questionIds) {
              await client.query(
                `INSERT INTO test_questions (test_id, question_id, section_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                [id, qid, sectionId]
              );
            }
          }
        }

        // No need to update totalQuestions - we calculate it dynamically from test_questions table
      }

      await client.query("COMMIT");

      // Ambil data terbaru
      const res = await client.query(`SELECT * FROM tests WHERE id = $1`, [id]);
      return NextResponse.json(res.rows[0] || { id });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating test (PUT):", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui tes" },
      { status: 500 }
    );
  }
}
