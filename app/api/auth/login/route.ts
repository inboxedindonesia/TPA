import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
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

      // Find user by email with role information
      const result = await client.query(
        `
        SELECT u.*, r.name as role_name 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1
      `,
        [email]
      );

      const users = result.rows;
      if (users.length === 0) {
        client.release();
        await pool.end();
        return NextResponse.json(
          { error: "Email atau password salah" },
          { status: 401 }
        );
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        client.release();
        await pool.end();
        return NextResponse.json(
          { error: "Email atau password salah" },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role_name },
        "your-super-secret-jwt-key-for-development",
        { expiresIn: "24h" }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      client.release();
      await pool.end();

      return NextResponse.json({
        message: "Login berhasil",
        user: userWithoutPassword,
        token,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      await pool.end();
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
