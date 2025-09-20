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
          `SELECT ts.id, ts.status, ts."startTime", ts."endTime", ts.score, ts."maxScore", ts."testId", t.name as test_name, t.description as test_description, t."minimumScore"
           FROM test_sessions ts
           JOIN tests t ON ts."testId" = t.id
           WHERE ts."userId" = $1
           ORDER BY ts."startTime" DESC`,
          [id]
        );
        const testResults = testResultsRes.rows.map((row) => ({
          id: row.id,
          status: row.status,
          startTime: row.startTime,
          endTime: row.endTime,
          score: row.score,
          maxScore: row.maxScore,
          testId: row.testId,
          testName: row.test_name,
          testDescription: row.test_description,
          minimumScore: row.minimumScore || 60,
        }));

        return NextResponse.json({ peserta, testResults });
      }

      // Build search condition
      let searchCondition = "";
      let searchParams_array = [];
      let paramIndex = 1;

      if (search) {
        searchCondition = `AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.registration_id ILIKE $${paramIndex})`;
        searchParams_array.push(`%${search}%`);
        paramIndex++;
      }

      // Total peserta (users dengan role Peserta) with search filter
      const pesertaQuery = `
        SELECT COUNT(*) as count 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = $${paramIndex} ${searchCondition}
      `;
      const pesertaParams = search ? [...searchParams_array, "Peserta"] : ["Peserta"];
      const pesertaRes = await client.query(pesertaQuery, pesertaParams);
      const totalPeserta = parseInt(pesertaRes.rows[0].count);

      // Calculate total pages
      const totalPages = Math.ceil(totalPeserta / limit);

      // Get all users for debugging (with search filter)
      const allUsersQuery = `
        SELECT u.*, r.name as role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = $${search ? paramIndex + 1 : paramIndex} ${searchCondition}
      `;
      const allUsersParams = search ? [...searchParams_array, "Peserta"] : ["Peserta"];
      const allUsersResult = await client.query(allUsersQuery, allUsersParams);

      // Peserta aktif (yang sudah mengikuti tes) with search filter
      const pesertaAktifQuery = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN test_sessions ts ON u.id = ts."userId"
        WHERE r.name = $${search ? paramIndex + 1 : paramIndex} AND ts.status = $${search ? paramIndex + 2 : paramIndex + 1} ${searchCondition}
      `;
      const pesertaAktifParams = search ? [...searchParams_array, "Peserta", "COMPLETED"] : ["Peserta", "COMPLETED"];
      const pesertaAktifResult = await client.query(pesertaAktifQuery, pesertaAktifParams);
      const pesertaAktif = parseInt(pesertaAktifResult.rows[0].count);

      // Peserta baru bulan ini with search filter
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const pesertaBaruQuery = `
        SELECT COUNT(*) as total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = $${search ? paramIndex + 1 : paramIndex} AND u."createdAt" >= $${search ? paramIndex + 2 : paramIndex + 1} ${searchCondition}
      `;
      const pesertaBaruParams = search 
        ? [...searchParams_array, "Peserta", firstDayOfMonth.toISOString()]
        : ["Peserta", firstDayOfMonth.toISOString()];
      const pesertaBaruResult = await client.query(pesertaBaruQuery, pesertaBaruParams);
      const pesertaBaru = parseInt(pesertaBaruResult.rows[0].total);

      // Get average score (with search filter if needed)
      const rataRataSkorResult = await client.query(
        "SELECT AVG(score) as average FROM test_sessions WHERE status = 'COMPLETED' AND score IS NOT NULL"
      );
      const rataRataSkor = rataRataSkorResult.rows[0].average
        ? parseFloat(rataRataSkorResult.rows[0].average).toFixed(1)
        : "0.0";

      // Get recent participants list with search and pagination
      const daftarPesertaQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.registration_id,
          u.is_verified,
          u."createdAt",
          COUNT(ts.id) as total_tests,
          AVG(ts.score) as average_score
        FROM users u
        LEFT JOIN test_sessions ts ON u.id = ts."userId" AND ts.status = 'COMPLETED'
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Peserta' ${searchCondition}
        GROUP BY u.id, u.name, u.email, u.registration_id, u.is_verified, u."createdAt"
        ORDER BY u."createdAt" DESC
        LIMIT $${search ? paramIndex + 1 : paramIndex} OFFSET $${search ? paramIndex + 2 : paramIndex + 1}
      `;
      const daftarPesertaParams = search 
        ? [...searchParams_array, limit, offset]
        : [limit, offset];
      const daftarPesertaResult = await client.query(daftarPesertaQuery, daftarPesertaParams);

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
        status: parseInt(row.total_tests) > 0 ? "Aktif" : "Pending",
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
