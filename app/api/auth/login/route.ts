import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/database";
import { logUserLogin } from "@/lib/activityLogger";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    // Use shared pool from lib/database

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
        return NextResponse.json(
          { error: "Email atau password salah" },
          { status: 401 }
        );
      }

      const user = users[0];
      // Validasi: hanya user yang sudah verifikasi OTP (is_verified = TRUE) yang bisa login
      if (!user.is_verified) {
        client.release();
        return NextResponse.json(
          {
            error:
              "Akun belum diverifikasi. Silakan cek email Anda untuk verifikasi OTP.",
          },
          { status: 403 }
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        client.release();
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

      // Log login activity
      try {
        const ipAddress =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        await logUserLogin(
          user.id,
          user.name,
          user.role_name || "USER",
          ipAddress,
          userAgent
        );
      } catch (error) {
        console.error("Error logging login activity:", error);
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      client.release();

      // Set JWT as HttpOnly cookie
      const response = NextResponse.json({
        message: "Login berhasil",
        user: userWithoutPassword,
        token,
      });
      response.cookies.set({
        name: "token",
        value: token,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
      });
      return response;
    } catch (dbError) {
      console.error("Database error:", dbError);
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
