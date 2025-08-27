import { NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json(
      { error: "Token dan password wajib diisi" },
      { status: 400 }
    );
  }
  const client = await pool.connect();
  try {
    // Cek token valid dan belum expired/terpakai
    const resetRes = await client.query(
      "SELECT user_id, expires_at, used FROM password_resets WHERE token = $1",
      [token]
    );
    if (resetRes.rows.length === 0) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }
    const reset = resetRes.rows[0];
    if (reset.used || new Date(reset.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Token sudah kadaluarsa atau sudah digunakan" },
        { status: 400 }
      );
    }
    // Update password user
    const hash = await bcrypt.hash(password, 10);
    await client.query("UPDATE users SET password = $1 WHERE id = $2", [
      hash,
      reset.user_id,
    ]);
    // Tandai token sudah digunakan
    await client.query(
      "UPDATE password_resets SET used = TRUE WHERE token = $1",
      [token]
    );
    return NextResponse.json({ message: "Password berhasil direset" });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
