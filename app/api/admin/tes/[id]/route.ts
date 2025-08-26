import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestDeleted } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if test exists
      const checkQuery = "SELECT id FROM tests WHERE id = $1";
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }

      // Delete test questions first (foreign key constraint)
      const deleteTestQuestionsQuery =
        "DELETE FROM test_questions WHERE test_id = $1";
      await client.query(deleteTestQuestionsQuery, [id]);

      // Get test details before deletion for logging
      const testQuery = "SELECT name FROM tests WHERE id = $1";
      const testResult = await client.query(testQuery, [id]);
      const testName = testResult.rows[0]?.name || "Unknown Test";

      // Delete test
      const deleteQuery = "DELETE FROM tests WHERE id = $1";
      await client.query(deleteQuery, [id]);

      // Get user info from request
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Log activity
      try {
        await logTestDeleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          id,
          testName
        );
      } catch (error) {
        console.error("Error logging activity:", error);
      }

      return NextResponse.json(
        { message: "Tes berhasil dihapus" },
        { status: 200 }
      );
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
