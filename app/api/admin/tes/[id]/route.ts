import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { logTestDeleted } from "@/lib/activityLogger";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";

// GET /api/admin/tes/[id]
export async function GET(request: NextRequest, context: any) {
  // Auth check
  const user = await getUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userRole !== "Administrator")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = (await context?.params) || {};
  if (!id)
    return NextResponse.json({ error: "ID tes tidak valid" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    // Detail dasar tes + jumlah soal
    const testDetailRes = await client.query(
      `SELECT 
         t.id,
         t.name,
         t.description,
         t.duration,
         t."minimumScore",
         t."isActive",
         t."availableFrom",
         t."availableUntil",
         t."createdAt",
         t."updatedAt",
         t.test_type,
         COUNT(DISTINCT tq.question_id) AS question_count
       FROM tests t
       LEFT JOIN test_questions tq ON tq.test_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );

    if (testDetailRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Tes tidak ditemukan" },
        { status: 404 }
      );
    }

    // Statistik agregat untuk tes ini
    const statsRes = await client.query(
      `WITH test_max AS (
         SELECT COALESCE(SUM(COALESCE(q.points,1)), 0)::int AS max_points
         FROM test_questions tq
         JOIN questions q ON q.id = tq.question_id
         WHERE tq.test_id = $1
       )
       SELECT 
         COUNT(*)::int AS total_sessions,
         COUNT(*) FILTER (WHERE ts.status = 'COMPLETED')::int AS completed_sessions,
         COUNT(DISTINCT ts."userId")::int AS participant_count,
         COUNT(DISTINCT ts."userId") FILTER (WHERE ts.status = 'COMPLETED')::int AS participant_completed_count,
         COALESCE(ROUND(AVG(ts.score)::numeric, 1), 0) AS average_score,
         COALESCE(
           ROUND(
             AVG(
               CASE 
                 WHEN ts.status = 'COMPLETED' AND ts.score IS NOT NULL THEN 
                   GREATEST(
                     0,
                     LEAST(
                       100,
                       ROUND((ts.score * 100.0) / NULLIF(CASE WHEN NULLIF(ts."maxScore", 0) IS NOT NULL THEN ts."maxScore" ELSE (SELECT max_points FROM test_max) END, 0))
                     )
                   )
                 ELSE NULL
               END
             )::numeric,
             1
           ),
           0
         ) AS average_percentage
       FROM test_sessions ts
       WHERE ts."testId" = $1`,
      [id]
    );

    // Daftar peserta (semua, latest session per user) dengan search + pagination
    const participantsCountRes = await client.query(
      `WITH last_sessions AS (
         SELECT DISTINCT ON (ts."userId") ts.*
         FROM test_sessions ts
         WHERE ts."testId" = $1
         ORDER BY ts."userId", ts."endTime" DESC NULLS LAST, ts."startTime" DESC NULLS LAST, ts."createdAt" DESC
       )
       SELECT COUNT(*)::int AS total
       FROM last_sessions ls
       JOIN users u ON u.id = ls."userId"
       ${
         search
           ? `WHERE (u.name ILIKE $2 OR u.email ILIKE $2 OR u.registration_id ILIKE $2)`
           : ``
       }
      `,
      search ? [id, `%${search}%`] : [id]
    );

    const filteredParticipantsTotal = participantsCountRes.rows[0]?.total || 0;
    const participantsTotalPages = Math.max(
      1,
      Math.ceil(filteredParticipantsTotal / limit)
    );

    const participantsRes = await client.query(
      `WITH test_max AS (
         SELECT COALESCE(SUM(COALESCE(q.points,1)), 0)::int AS max_points
         FROM test_questions tq
         JOIN questions q ON q.id = tq.question_id
         WHERE tq.test_id = $1
       ), last_sessions AS (
         SELECT DISTINCT ON (ts."userId") ts.*
         FROM test_sessions ts
         WHERE ts."testId" = $1
         ORDER BY ts."userId", ts."endTime" DESC NULLS LAST, ts."startTime" DESC NULLS LAST, ts."createdAt" DESC
       )
       SELECT 
         u.id AS user_id,
         u.name AS user_name,
         u.email AS user_email,
         u.registration_id,
         ls.id AS session_id,
         ls.status AS session_status,
         ls.score,
         ls."maxScore",
         ls."startTime",
         ls."endTime",
          (CASE 
            WHEN ls.score IS NULL THEN NULL
            ELSE GREATEST(
              0,
              LEAST(
                100,
                ROUND(
                  (ls.score * 100.0) / NULLIF(
                    CASE WHEN NULLIF(ls."maxScore", 0) IS NOT NULL THEN ls."maxScore" ELSE (SELECT max_points FROM test_max) END,
                    0
                  )
                )
              )
            )
          END)::int AS percentage,
         CASE 
            WHEN ls.status = 'COMPLETED' AND 
              GREATEST(
                0,
                LEAST(
                  100,
                  ROUND(
                    (ls.score * 100.0) / NULLIF(
                      CASE WHEN NULLIF(ls."maxScore", 0) IS NOT NULL THEN ls."maxScore" ELSE (SELECT max_points FROM test_max) END,
                      0
                    )
                  )
                )
              ) >= COALESCE(t."minimumScore", 60)
            THEN 'lolos'
           WHEN ls.status = 'COMPLETED' THEN 'tidak-lolos'
           ELSE 'belum-tes'
         END AS kelulusan,
         CASE 
           WHEN ls."startTime" IS NOT NULL AND ls."endTime" IS NOT NULL AND ls."endTime" > ls."startTime" 
           THEN CEIL(EXTRACT(EPOCH FROM (ls."endTime" - ls."startTime")) / 60.0)::int
           ELSE NULL
         END AS duration_minutes
       FROM last_sessions ls
       JOIN users u ON u.id = ls."userId"
       JOIN tests t ON t.id = $1
       ${
         search
           ? `WHERE (u.name ILIKE $2 OR u.email ILIKE $2 OR u.registration_id ILIKE $2)`
           : ``
       }
       ORDER BY ls."endTime" DESC NULLS LAST, u."createdAt" DESC
       LIMIT $${search ? 3 : 2} OFFSET $${search ? 4 : 3}`,
      search ? [id, `%${search}%`, limit, offset] : [id, limit, offset]
    );

    // Breakdown jumlah soal per kategori
    const categoriesRes = await client.query(
      `SELECT q.category, COUNT(*)::int AS total
       FROM test_questions tq
       JOIN questions q ON q.id = tq.question_id
       WHERE tq.test_id = $1
       GROUP BY q.category
       ORDER BY q.category`,
      [id]
    );

    const test = testDetailRes.rows[0];
    const stats = statsRes.rows[0] || {};
    const participants = participantsRes.rows || [];
    const categories = categoriesRes.rows || [];

    return NextResponse.json({
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        duration: test.duration,
        minimumScore: test.minimumScore,
        isActive: test.isActive,
        availableFrom: test.availableFrom,
        availableUntil: test.availableUntil,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        test_type: test.test_type,
        questionCount: Number(test.question_count) || 0,
        participantCount: Number(stats.participant_count) || 0,
        participantCompletedCount:
          Number(stats.participant_completed_count) || 0,
        averageScore: Number(stats.average_score) || 0,
        averagePercentage: Number(stats.average_percentage) || 0,
        completionRate:
          Number(stats.participant_count) > 0
            ? Math.round(
                (Number(stats.participant_completed_count) /
                  Number(stats.participant_count)) *
                  100
              )
            : 0,
        categories,
        totalSessions: Number(stats.total_sessions) || 0,
        completedSessions: Number(stats.completed_sessions) || 0,
      },
      participants: participants.map((p) => ({
        userId: p.user_id,
        name: p.user_name,
        email: p.user_email,
        registration_id: p.registration_id,
        sessionId: p.session_id,
        status: p.session_status,
        score: p.score,
        maxScore: p.maxScore,
        percentage: p.percentage,
        startTime: p.startTime,
        endTime: p.endTime,
        kelulusan: p.kelulusan,
        durationMinutes: p.duration_minutes,
      })),
      participantsTotal: filteredParticipantsTotal,
      participantsTotalPages: participantsTotalPages,
      participantsPage: page,
    });
  } catch (error) {
    console.error("Error fetching test detail:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail tes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, context: any) {
  try {
  const { id } = (await context?.params) || {};

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: "ID tes tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if test exists
      const checkQuery = "SELECT id FROM tests WHERE id = $1";
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Tes tidak ditemukan" },
          { status: 404 }
        );
      }

      // Delete test questions first (foreign key constraint)
      const deleteTestQuestionsQuery =
        "DELETE FROM test_questions WHERE test_id = $1";
      await client.query(deleteTestQuestionsQuery, [id]);

      // Get test details before deletion for logging
      const testQuery = "SELECT name FROM tests WHERE id = $1";
      const testResult = await client.query(testQuery, [id]);
      const testName = testResult.rows[0]?.name || "Unknown Test";

      // Delete test
      const deleteQuery = "DELETE FROM tests WHERE id = $1";
      await client.query(deleteQuery, [id]);

      // Get user info from request
      const userInfo =
        (await getUserFromRequest(request)) || getFallbackUserInfo();

      // Log activity
      try {
        await logTestDeleted(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          id,
          testName
        );
      } catch (error) {
        console.error("Error logging activity:", error);
      }

      return NextResponse.json(
        { message: "Tes berhasil dihapus" },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus tes" },
      { status: 500 }
    );
  }
}
