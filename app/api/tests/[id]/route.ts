export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      const query = `SELECT * FROM tests WHERE id = $1`;
      const result = await client.query(query, [id]);
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json(result.rows[0]);
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

export async function PATCH(
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
