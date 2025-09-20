import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs soal tidak valid" },
        { status: 400 }
      );
    }

    // Process IDs - keep them as original strings since database stores them as strings
    // Frontend sends IDs as strings with various formats like "q43", "q-1757656912904-s29uz0qwz", etc.
    const validIds = ids
      .filter((id: any) => {
        // Keep non-empty strings
        return typeof id === 'string' && id.length > 0;
      });
    
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada ID yang valid untuk dihapus" },
        { status: 400 }
      );
    }

    // Get all tests that contain these questions before deletion
    const testsQuery = `
      SELECT DISTINCT test_id FROM test_questions WHERE question_id = ANY($1)
    `;
    const testsResult = await client.query(testsQuery, [validIds]);
    const affectedTestIds = testsResult.rows.map(row => row.test_id);

    // Delete multiple questions using PostgreSQL (CASCADE will delete from test_questions)
    const deleteQuery = "DELETE FROM questions WHERE id = ANY($1)";
    const deleteResult = await client.query(deleteQuery, [validIds]);
    const totalDeleted = deleteResult.rowCount || 0;

    // No need to update totalQuestions - we calculate it dynamically from test_questions table

    // Commit transaction
    await client.query('COMMIT');
    
    return NextResponse.json(
      {
        message: `${totalDeleted} soal berhasil dihapus`,
        deletedCount: totalDeleted,
      },
      { status: 200 }
    );
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error("Error deleting questions:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus soal" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}