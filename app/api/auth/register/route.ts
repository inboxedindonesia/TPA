import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password diperlukan" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Create database connection
    const pool = new Pool({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "",
      database: "tpa_universitas",
    });

    try {
      const client = await pool.connect();

      // Check if email already exists
      const existingResult = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingResult.rows.length > 0) {
        client.release();
        await pool.end();
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate user ID
      const userId = `user-${Date.now()}`;

      // Insert new user
      await client.query(
        "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
        [userId, name, email, hashedPassword, "PESERTA"]
      );

      client.release();
      await pool.end();

      return NextResponse.json({
        message: "Registrasi berhasil",
        user: {
          id: userId,
          name,
          email,
          role: "PESERTA",
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      await pool.end();
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
