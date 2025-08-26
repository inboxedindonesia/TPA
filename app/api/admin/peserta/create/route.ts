import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Cek apakah email sudah ada
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Dapatkan role_id untuk Peserta
      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = 'Peserta'"
      );

      if (roleResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Role Peserta tidak ditemukan" },
          { status: 500 }
        );
      }

      const roleId = roleResult.rows[0].id;

      // Generate user ID
      const userId = `user-${Date.now()}`;

      // Insert user baru
      const insertResult = await client.query(
        `INSERT INTO users (id, name, email, password, role_id, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, name, email, "createdAt"`,
        [userId, name, email, hashedPassword, roleId]
      );

      const newUser = insertResult.rows[0];

      return NextResponse.json({
        message: "Peserta berhasil ditambahkan",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating peserta:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan peserta" },
      { status: 500 }
    );
  }
}
