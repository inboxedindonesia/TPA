import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email dan OTP diperlukan" },
        { status: 400 }
      );
    }
    const client = await pool.connect();
    try {
      // Cari user
      const userRes = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (userRes.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: "User tidak ditemukan" },
          { status: 404 }
        );
      }
      const userId = userRes.rows[0].id;
      // Cari OTP aktif
      const otpRes = await client.query(
        `SELECT * FROM user_otps WHERE user_id = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
        [userId, otp]
      );
      if (otpRes.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { error: "OTP salah atau sudah kadaluarsa" },
          { status: 400 }
        );
      }
      // Tandai OTP sudah digunakan
      await client.query(`UPDATE user_otps SET is_used = TRUE WHERE id = $1`, [
        otpRes.rows[0].id,
      ]);
      // Aktifkan user (set is_verified = TRUE)
      await client.query(`UPDATE users SET is_verified = TRUE WHERE id = $1`, [
        userId,
      ]);
      client.release();
      return NextResponse.json({ message: "Verifikasi berhasil" });
    } catch (err) {
      client.release();
      console.error("OTP verify error:", err);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
