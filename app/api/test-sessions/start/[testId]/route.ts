import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logTestStarted } from "@/lib/activityLogger";
import { randomUUID } from "crypto";

// POST /api/test-sessions/start/[testId]
export async function POST(request: Request, context: any) {
  try {
    const { testId } = await context.params;
    // Ambil user dari token atau fallback
    const user = (await getUserFromRequest(request)) || getFallbackUserInfo();

    if (!user || !user.userId) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      // Ambil info durasi dan maxAttempts tes
      const testResult = await client.query(
        `SELECT duration, "maxAttempts", "availableFrom", "availableUntil", "isActive" FROM tests WHERE id = $1`,
        [testId]
      );
      if (testResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }
      const duration = testResult.rows[0].duration; // dalam menit
      const maxAttempts = testResult.rows[0].maxAttempts ?? 1;
      // Validasi isActive dan periode di sisi database (WIB)
      const availCheck = await client.query(
        `SELECT 1 FROM tests t
         WHERE t.id = $1 AND t."isActive" = true
           AND (t."availableFrom" IS NULL OR (NOW() AT TIME ZONE 'Asia/Jakarta') >= t."availableFrom")
           AND (t."availableUntil" IS NULL OR (NOW() AT TIME ZONE 'Asia/Jakarta') <= t."availableUntil")
         LIMIT 1`,
        [testId]
      );
      if (availCheck.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak tersedia saat ini." },
          { status: 403 }
        );
      }

      // Hitung total percobaan tes user ini yang sudah selesai
      const countResult = await client.query(
        `SELECT COUNT(*) FROM test_sessions WHERE "userId" = $1 AND "testId" = $2 AND status = 'COMPLETED'`,
        [user.userId, testId]
      );
      const attemptCount = parseInt(countResult.rows[0].count, 10);
      if (maxAttempts > 0 && attemptCount >= maxAttempts) {
        return NextResponse.json(
          {
            error: `Anda hanya bisa melakukan tes ini maksimal ${maxAttempts} kali.`,
          },
          { status: 403 }
        );
      }

      // Cek apakah sudah ada sesi aktif
      const existing = await client.query(
        `SELECT * FROM test_sessions WHERE "userId" = $1 AND "testId" = $2 AND status = 'ONGOING'`,
        [user.userId, testId]
      );
      if (existing.rows.length > 0) {
        const session = existing.rows[0];
        const start = new Date(session.startTime).getTime();
        const now = Date.now();
        const durationMs = duration * 60 * 1000;
        const elapsed = now - start;
        if (elapsed < durationMs) {
          // Masih dalam waktu, kembalikan sesi lama
          return NextResponse.json({ session });
        } else {
          // Sudah habis waktunya, update status sesi lama ke 'EXPIRED'
          await client.query(
            `UPDATE test_sessions SET status = 'EXPIRED' WHERE id = $1`,
            [session.id]
          );
        }
      }
      // Buat sesi baru
      const sessionId = randomUUID();
      const res = await client.query(
        `INSERT INTO test_sessions (id, "userId", "testId", status, "startTime") VALUES ($1, $2, $3, 'ONGOING', NOW() AT TIME ZONE 'Asia/Jakarta') RETURNING *`,
        [sessionId, user.userId, testId]
      );

      // Log test started activity
      try {
        const testRes = await client.query(
          `SELECT name FROM tests WHERE id = $1`,
          [testId]
        );
        const testName = testRes.rows[0]?.name || "Unknown Test";

        await logTestStarted(
          user.userId,
          user.userName,
          user.userRole || "peserta",
          testId,
          testName
        );
      } catch (error) {
        console.error("Error logging test start activity:", error);
      }

      return NextResponse.json({ session: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error starting test session:", error);
    return NextResponse.json(
      { error: "Gagal memulai sesi tes" },
      { status: 500 }
    );
  }
}
