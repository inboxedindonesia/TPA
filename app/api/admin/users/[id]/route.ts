import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    const { name, email, password, role } = await request.json();
    const userId = params.id;

    // Validasi input
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Nama, email, dan role harus diisi" },
        { status: 400 }
      );
    }

    // Validasi role
    if (!role) {
      return NextResponse.json(
        { error: "Role harus dipilih" },
        { status: 400 }
      );
    }

    // Cek apakah role ada dan aktif
    const roleCheck = await client.query(
      "SELECT id, name, status FROM roles WHERE id = $1",
      [role]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 400 }
      );
    }

    if (roleCheck.rows[0].status !== "active") {
      return NextResponse.json({ error: "Role tidak aktif" }, { status: 400 });
    }

    // Cek apakah user ada
    const existingUser = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah email sudah ada (kecuali user yang sedang diupdate)
    const existingEmail = await client.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, userId]
    );

    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Update user
    if (password) {
      // Jika ada password baru, hash dan update
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        `
        UPDATE users 
        SET name = $1, email = $2, password = $3, role_id = $4, "updatedAt" = NOW()
        WHERE id = $5
      `,
        [name, email, hashedPassword, role, userId]
      );
    } else {
      // Jika tidak ada password baru, update tanpa password
      await client.query(
        `
        UPDATE users 
        SET name = $1, email = $2, role_id = $3, "updatedAt" = NOW()
        WHERE id = $4
      `,
        [name, email, role, userId]
      );
    }

    return NextResponse.json({
      message: "User berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    const userId = params.id;

    // Cek apakah user ada
    const existingUser = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah user adalah admin utama (tidak boleh dihapus)
    if (userId === "admin-1") {
      return NextResponse.json(
        { error: "Admin utama tidak boleh dihapus" },
        { status: 400 }
      );
    }

    // Delete user
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    return NextResponse.json({
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
