import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestStarted } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const testId = searchParams.get("testId");
    const status = searchParams.get("status");
    const testType = searchParams.get("testType");

    const client = await pool.connect();

    try {
      let query = `
        SELECT
          ts.*,
          u.name as "userName",
          u.email as "userEmail",
          t.name as "testName",
          t.duration as "testDuration",
          t.test_type as "testType"
        FROM test_sessions ts
        LEFT JOIN users u ON ts."userId" = u.id
        LEFT JOIN tests t ON ts."testId" = t.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND ts."userId" = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (testId) {
        query += ` AND ts."testId" = $${paramIndex}`;
        params.push(testId);
        paramIndex++;
      }

      if (status) {
        query += ` AND ts.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (testType) {
        query += ` AND t.test_type = $${paramIndex}`;
        params.push(testType);
        paramIndex++;
      }

      query += ` ORDER BY ts."createdAt" DESC`;

      const result = await client.query(query, params);

      // Transform the data to match expected format
      const sessions = result.rows.map((row: any) => ({
        id: row.id,
        status: row.status,
        startTime: row.startTime,
        endTime: row.endTime,
        score: row.score,
        maxScore: row.maxScore,
        userId: row.userId,
        testId: row.testId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
        },
        test: {
          id: row.testId,
          name: row.testName,
          duration: row.testDuration,
        },
      }));

      return NextResponse.json(sessions);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching test sessions:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data sesi tes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, testId } = await request.json();

    // Validasi input
    if (!userId || !testId) {
      return NextResponse.json(
        { error: "UserId dan testId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Cek apakah user sudah memiliki sesi aktif untuk tes ini
      const existingResult = await client.query(
        'SELECT id FROM test_sessions WHERE "userId" = $1 AND "testId" = $2 AND status = \'ONGOING\'',
        [userId, testId]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { error: "Anda sudah memiliki sesi aktif untuk tes ini" },
          { status: 400 }
        );
      }

      // Generate unique ID
      const sessionId = `session-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const insertQuery = `
        INSERT INTO test_sessions (
          id, "userId", "testId", status, "startTime"
        ) VALUES ($1, $2, $3, $4, (NOW() AT TIME ZONE 'Asia/Jakarta'))
      `;

      const insertParams = [sessionId, userId, testId, "ONGOING"];

      await client.query(insertQuery, insertParams);

      // Fetch the created session with related data
      const result = await client.query(
        `
        SELECT 
          ts.*,
          u.name as "userName",
          u.email as "userEmail",
          t.name as "testName",
          t.duration as "testDuration"
        FROM test_sessions ts
        LEFT JOIN users u ON ts."userId" = u.id
        LEFT JOIN tests t ON ts."testId" = t.id
        WHERE ts.id = $1
      `,
        [sessionId]
      );

      const newSession = result.rows[0];
      if (newSession) {
        newSession.user = {
          id: newSession.userId,
          name: newSession.userName,
          email: newSession.userEmail,
        };
        newSession.test = {
          id: newSession.testId,
          name: newSession.testName,
          duration: newSession.testDuration,
        };
      }

      // Get user info from request
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Log activity
      try {
        await logTestStarted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          testId,
          newSession.testName || "Unknown Test"
        );
      } catch (error) {
        console.error("Error logging activity:", error);
      }

      return NextResponse.json(newSession, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating test session:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat sesi tes" },
      { status: 500 }
    );
  }
}
