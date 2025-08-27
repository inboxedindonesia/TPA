import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
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
          `SELECT ts.id, ts.status, ts."startTime", ts."endTime", ts.score, ts."maxScore", ts."testId", t.name as test_name, t.description as test_description
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
        }));

        return NextResponse.json({ peserta, testResults });
      }
      // Debug: Check all users and their roles
      const allUsersResult = await client.query(
        'SELECT u.id, u.name, u.email, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u."createdAt" DESC'
      );
      // ...log dihapus...

      // Get total participants (only users with role = 'Peserta')
      const totalPesertaResult = await client.query(`
        SELECT COUNT(*) as total 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Peserta'
      `);
      const totalPeserta = parseInt(totalPesertaResult.rows[0].total);

      // Get active participants (those who have taken tests)
      const pesertaAktifResult = await client.query(
        "SELECT COUNT(DISTINCT \"userId\") as total FROM test_sessions WHERE status = 'COMPLETED'"
      );
      const pesertaAktif = parseInt(pesertaAktifResult.rows[0].total);

      // Get new participants this month
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const pesertaBaruResult = await client.query(
        `
        SELECT COUNT(*) as total 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Peserta' AND u."createdAt" >= $1
      `,
        [firstDayOfMonth.toISOString()]
      );
      const pesertaBaru = parseInt(pesertaBaruResult.rows[0].total);

      // Get average score
      const rataRataSkorResult = await client.query(
        "SELECT AVG(score) as average FROM test_sessions WHERE status = 'COMPLETED' AND score IS NOT NULL"
      );
      const rataRataSkor = rataRataSkorResult.rows[0].average
        ? parseFloat(rataRataSkorResult.rows[0].average).toFixed(1)
        : "0.0";

      // Get recent participants list

      const daftarPesertaResult = await client.query(`
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
        WHERE r.name = 'Peserta'
        GROUP BY u.id, u.name, u.email, u.registration_id, u.is_verified, u."createdAt"
        ORDER BY u."createdAt" DESC
        LIMIT 10
      `);

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
