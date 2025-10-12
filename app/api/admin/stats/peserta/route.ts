import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  if (user.userRole !== "Administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    try {
      // Get search parameters
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";
      const statusFilter = searchParams.get("status"); // 'lolos' | 'tidak-lolos' | 'belum-tes'
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;

      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (id) {
        // Fetch all user fields
        const pesertaRes = await client.query(
          `SELECT * FROM users WHERE id = $1`,
          [id]
        );
        if (pesertaRes.rows.length === 0) {
          return NextResponse.json({ peserta: null }, { status: 404 });
        }
        const peserta = pesertaRes.rows[0];

        // Fetch test results for this peserta
        const testResultsRes = await client.query(
          `SELECT 
             ts.id,
             ts.status,
             ts."startTime",
             ts."endTime",
             ts."createdAt",
             ts.score,
             ts."maxScore",
             ts."testId",
             t.name as test_name,
             t.description as test_description,
             t."minimumScore",
             t.duration as "testDuration",
             CASE 
               WHEN ts."endTime" > COALESCE(ts."startTime", ts."createdAt")
                 THEN CEIL(EXTRACT(EPOCH FROM (ts."endTime" - COALESCE(ts."startTime", ts."createdAt"))))::int
               ELSE 0
             END as "durationSpentSecSql"
           FROM test_sessions ts
           JOIN tests t ON ts."testId" = t.id
           WHERE ts."userId" = $1
           ORDER BY ts."startTime" DESC`,
          [id]
        );

        const rows = testResultsRes.rows;

        // Kumpulkan id session & test untuk query tambahan
        const sessionIds: string[] = rows.map((r: any) => String(r.id));
        const testIds: string[] = Array.from(
          new Set(rows.map((r: any) => String(r.testId)))
        );

        // Hitung total pertanyaan per test
        const totalByTest = new Map<string, number>();
        if (testIds.length > 0) {
          const tqRes = await client.query(
            `SELECT CAST(tq.test_id AS text) as "testId", COUNT(*)::int as "totalQuestions"
             FROM test_questions tq
             WHERE CAST(tq.test_id AS text) = ANY($1::text[])
             GROUP BY tq.test_id`,
            [testIds]
          );
          for (const row of tqRes.rows) {
            totalByTest.set(row.testId, row.totalQuestions);
          }
        }

        // Ambil seluruh jawaban user untuk hitung benar/salah
        const correctCountBySession = new Map<string, number>();
        if (sessionIds.length > 0) {
          const ansRes = await client.query(
            `SELECT 
               ta."sessionId" as "sessionId",
               ta."questionId" as "questionId",
               ta.answer as "answer",
               q."correctAnswer" as "correctAnswer"
             FROM test_answers ta
             JOIN questions q ON q.id = ta."questionId"
             WHERE ta."sessionId" = ANY($1)`,
            [sessionIds]
          );

          // Helpers untuk normalisasi jawaban
          const normalize = (val: any) => {
            if (typeof val === "string") {
              const trimmed = val.trim();
              if (
                (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                (trimmed.startsWith("{") && trimmed.endsWith("}"))
              ) {
                try {
                  return JSON.parse(trimmed);
                } catch {
                  return trimmed;
                }
              }
              return trimmed;
            }
            return val;
          };
          const isEqualArray = (a: any[], b: any[]) => {
            try {
              const sa = [...a].sort();
              const sb = [...b].sort();
              return JSON.stringify(sa) === JSON.stringify(sb);
            } catch {
              return false;
            }
          };

          for (const r of ansRes.rows) {
            const sid: string = r.sessionId;
            const userAns = normalize(r.answer);
            const corr = normalize(r.correctAnswer);
            let correct = false;
            if (Array.isArray(corr)) {
              correct = Array.isArray(userAns)
                ? isEqualArray(userAns, corr)
                : corr.includes(userAns);
            } else {
              correct = Array.isArray(userAns)
                ? userAns.includes(corr)
                : userAns == corr;
            }
            if (correct) {
              correctCountBySession.set(
                sid,
                (correctCountBySession.get(sid) || 0) + 1
              );
            }
          }
        }

        const testResults = rows.map((row: any) => {
          const totalQuestions = totalByTest.get(String(row.testId)) || 0;
          const correctAnswers = correctCountBySession.get(String(row.id)) || 0;
          const start = row.startTime
            ? new Date(row.startTime)
            : row.createdAt
            ? new Date(row.createdAt)
            : null;
          const end = row.endTime ? new Date(row.endTime) : null;
          let durationSpentSec: number | null = null;
          if (start && end) {
            const diffMs = end.getTime() - start.getTime();
            durationSpentSec = diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
          }
          if (
            (!durationSpentSec || durationSpentSec < 1) &&
            Number.isFinite(row.durationSpentSecSql)
          ) {
            durationSpentSec = Math.max(1, Number(row.durationSpentSecSql));
          }

          return {
            id: row.id,
            status: row.status,
            startTime: row.startTime,
            endTime: row.endTime,
            createdAt: row.createdAt,
            score: row.score,
            maxScore: row.maxScore,
            testId: row.testId,
            testName: row.test_name,
            testDescription: row.test_description,
            minimumScore: row.minimumScore || 60,
            testDuration: row.testDuration,
            totalQuestions,
            correctAnswers,
            durationSpentSec,
          };
        });

        return NextResponse.json({ peserta, testResults });
      }

      // Build search condition
      let searchCondition = "";
      let searchParams_array: any[] = [];
      let paramIndex = 1;

      if (search) {
        searchCondition = `AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.registration_id ILIKE $${paramIndex})`;
        searchParams_array.push(`%${search}%`);
        paramIndex++;
      }

      // Total peserta (users dengan role Peserta) with search filter (global, not filtered by kelulusan)
      const pesertaQuery = `
        SELECT COUNT(*) as count 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = $${paramIndex} ${searchCondition}
      `;
      const pesertaParams = search
        ? [...searchParams_array, "Peserta"]
        : ["Peserta"];
      const pesertaRes = await client.query(pesertaQuery, pesertaParams);
      const totalPeserta = parseInt(pesertaRes.rows[0].count);

      // Get all users for debugging (with search filter)
      const allUsersQuery = `
        SELECT u.*, r.name as role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = $${
          search ? paramIndex + 1 : paramIndex
        } ${searchCondition}
      `;
      const allUsersParams = search
        ? [...searchParams_array, "Peserta"]
        : ["Peserta"];
      const allUsersResult = await client.query(allUsersQuery, allUsersParams);

      // Peserta aktif (yang sudah mengikuti tes) with search filter
      const pesertaAktifQuery = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN test_sessions ts ON u.id = ts."userId"
        WHERE r.name = $${
          search ? paramIndex + 1 : paramIndex
        } AND ts.status = $${
        search ? paramIndex + 2 : paramIndex + 1
      } ${searchCondition}
      `;
      const pesertaAktifParams = search
        ? [...searchParams_array, "Peserta", "COMPLETED"]
        : ["Peserta", "COMPLETED"];
      const pesertaAktifResult = await client.query(
        pesertaAktifQuery,
        pesertaAktifParams
      );
      const pesertaAktif = parseInt(pesertaAktifResult.rows[0].count);

      // Peserta baru bulan ini with search filter
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const pesertaBaruQuery = `
        SELECT COUNT(*) as total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = $${
          search ? paramIndex + 1 : paramIndex
        } AND u."createdAt" >= $${
        search ? paramIndex + 2 : paramIndex + 1
      } ${searchCondition}
      `;
      const pesertaBaruParams = search
        ? [...searchParams_array, "Peserta", firstDayOfMonth.toISOString()]
        : ["Peserta", firstDayOfMonth.toISOString()];
      const pesertaBaruResult = await client.query(
        pesertaBaruQuery,
        pesertaBaruParams
      );
      const pesertaBaru = parseInt(pesertaBaruResult.rows[0].total);

      // Get average score (with search filter if needed)
      const rataRataSkorResult = await client.query(
        "SELECT AVG(score) as average FROM test_sessions WHERE status = 'COMPLETED' AND score IS NOT NULL"
      );
      const rataRataSkor = rataRataSkorResult.rows[0].average
        ? parseFloat(rataRataSkorResult.rows[0].average).toFixed(1)
        : "0.0";

      // Build a base query (without limit/offset) that computes kelulusan per peserta based on latest completed TPA test
      const basePesertaQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.registration_id,
          u.is_verified,
          u."createdAt",
          COUNT(ts.id) FILTER (WHERE ts.status = 'COMPLETED') as total_tests,
          AVG(ts.score) FILTER (WHERE ts.status = 'COMPLETED') as average_score,
          CASE 
            WHEN COUNT(ts.id) FILTER (
              WHERE ts.status = 'COMPLETED' 
                AND (t_all.name IS NULL OR t_all.name NOT ILIKE '%RIASEC%')
            ) = 0 THEN 'belum-tes'
            WHEN COUNT(ts.id) FILTER (
              WHERE ts.status = 'COMPLETED'
                AND (t_all.name IS NULL OR t_all.name NOT ILIKE '%RIASEC%')
                AND ts.score IS NOT NULL
                AND (
                  ROUND(ts.score * 100.0 / NULLIF(ts."maxScore", 0)) >= COALESCE(t_all."minimumScore", 60)
                  OR ((ts."maxScore" IS NULL OR ts."maxScore" = 0) AND ts.score >= COALESCE(t_all."minimumScore", 60))
                )
            ) > 0 THEN 'lolos'
            ELSE 'tidak-lolos'
          END as kelulusan
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN test_sessions ts ON u.id = ts."userId"
        LEFT JOIN tests t_all ON t_all.id = ts."testId"
        WHERE r.name = 'Peserta' ${searchCondition}
        GROUP BY u.id, u.name, u.email, u.registration_id, u.is_verified, u."createdAt"
      `;

      // Now wrap the base query to apply status filter and pagination
      const wrapperParams: any[] = [...searchParams_array];
      let wrapperIndex = wrapperParams.length + 1;
      let statusWhereClause = "";
      if (
        statusFilter === "lolos" ||
        statusFilter === "tidak-lolos" ||
        statusFilter === "belum-tes"
      ) {
        statusWhereClause = `WHERE kelulusan = $${wrapperIndex}`;
        wrapperParams.push(statusFilter);
        wrapperIndex++;
      }

      // Count for pagination based on applied filters
      const countWrappedQuery = `SELECT COUNT(*) as count FROM (${basePesertaQuery}) AS sub ${statusWhereClause}`;
      const countRes = await client.query(countWrappedQuery, wrapperParams);
      const filteredCount = parseInt(countRes.rows[0]?.count || "0");
      const totalPages = Math.max(1, Math.ceil(filteredCount / limit));

      // Data query with limit/offset
      const listWrappedQuery = `
        SELECT * FROM (${basePesertaQuery}) AS sub
        ${statusWhereClause}
        ORDER BY "createdAt" DESC
        LIMIT $${wrapperIndex} OFFSET $${wrapperIndex + 1}
      `;
      const daftarPesertaParams = [...wrapperParams, limit, offset];
      const daftarPesertaResult = await client.query(
        listWrappedQuery,
        daftarPesertaParams
      );

      const daftarPeserta = daftarPesertaResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        registration_id: row.registration_id,
        is_verified: row.is_verified,
        createdAt: row.createdAt,
        totalTests: parseInt(row.total_tests) || 0,
        averageScore: row.average_score
          ? parseFloat(row.average_score).toFixed(1)
          : "0.0",
        status: (parseInt(row.total_tests) || 0) > 0 ? "Aktif" : "Pending",
        kelulusan: row.kelulusan,
      }));

      // Get participant statistics by status
      const statusStatsResult = await client.query(`
        SELECT 
          CASE 
            WHEN COUNT(ts.id) > 0 THEN 'Aktif'
            ELSE 'Pending'
          END as status,
          COUNT(*) as count
        FROM users u
        LEFT JOIN test_sessions ts ON u.id = ts."userId" AND ts.status = 'COMPLETED'
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Peserta'
        GROUP BY u.id
      `);

      const statusStats = statusStatsResult.rows.reduce(
        (acc: any, row: any) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        },
        {} as { [key: string]: number }
      );

      const responseData = {
        totalPeserta,
        pesertaAktif,
        pesertaBaru,
        rataRataSkor,
        daftarPeserta,
        statusStats,
        totalPages,
        currentPage: page,
        debug: {
          allUsers: allUsersResult.rows,
        },
      };

      return NextResponse.json(responseData);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in peserta API:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data statistik peserta",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
