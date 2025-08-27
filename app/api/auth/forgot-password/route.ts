import { NextResponse } from "next/server";
import { sendResetPasswordEmail } from "@/lib/sendResetPasswordEmail";
import { randomBytes } from "crypto";
import pool from "@/lib/database";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }
  const client = await pool.connect();
  try {
    const userRes = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 404 });
    }
    const userId = userRes.rows[0].id;
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 menit
    await client.query(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [userId, token, expiresAt]
    );
    await sendResetPasswordEmail(email, token);
    return NextResponse.json({ message: "Link reset password telah dikirim ke email Anda." });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  } finally {
    client.release();
  }
}
