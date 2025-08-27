import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/database";
import { sendOtpEmail } from "@/lib/email";
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    const client = await pool.connect();
    try {
      // Cek email sudah terdaftar
      const existingResult = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existingResult.rows.length > 0) {
        client.release();
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user-${Date.now()}`;
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      // Cari registration_id terbesar (tidak reset harian)
      const maxResult = await client.query(
        "SELECT registration_id FROM users WHERE registration_id LIKE 'UMB-%' ORDER BY registration_id DESC LIMIT 1"
      );
      let nextNumber = 1;
      if (maxResult.rows.length > 0) {
        const lastId = maxResult.rows[0].registration_id;
        const lastNum = parseInt(lastId.split("-").pop() || "0", 10);
        nextNumber = lastNum + 1;
      }
      const regId = `UMB-${yyyymmdd}-${String(nextNumber).padStart(4, "0")}`;

      // Insert user status belum aktif
      await client.query(
        "INSERT INTO users (id, name, email, password, role_id, registration_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, name, email, hashedPassword, "role-peserta", regId]
      );

      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await client.query(
        "INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
        [userId, otp, expiresAt]
      );

      // Kirim email OTP
      await sendOtpEmail(email, otp);

      client.release();
      return NextResponse.json({
        message: "OTP telah dikirim ke email Anda. Silakan verifikasi.",
        user: { id: userId, email, registration_id: regId },
      });
    } catch (err) {
      client.release();
      console.error("Register error:", err);
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
