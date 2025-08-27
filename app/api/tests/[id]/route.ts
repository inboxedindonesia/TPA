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
