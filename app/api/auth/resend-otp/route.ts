import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { sendOtpEmail } from "@/lib/email";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
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
      // Generate OTP baru
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
      // Tandai semua OTP lama sebagai is_used
      await client.query(
        "UPDATE user_otps SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE",
        [userId]
      );
      // Insert OTP baru
      await client.query(
        "INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
        [userId, otp, expiresAt]
      );
      // Kirim email OTP
      try {
        await sendOtpEmail(email, otp);
      } catch (e: any) {
        client.release();
        console.error("Resend OTP email failed:", e?.message || e);
        return NextResponse.json(
          {
            error:
              "Gagal mengirim OTP ke email. Mohon periksa konfigurasi email/server.",
          },
          { status: 500 }
        );
      }
      client.release();
      return NextResponse.json({
        message: "OTP baru telah dikirim ke email Anda.",
      });
    } catch (err) {
      client.release();
      return NextResponse.json(
        { error: "Gagal mengirim OTP baru" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
