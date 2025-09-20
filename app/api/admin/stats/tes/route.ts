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

  const client = await pool.connect();

  try {
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition = "";
    let searchParams_array = [];
    let paramIndex = 1;

    if (search) {
      searchCondition = `WHERE t.name ILIKE $${paramIndex}`;
      searchParams_array.push(`%${search}%`);
      paramIndex++;
    }

    // Total tes (with search filter)
    const totalTesQuery = search 
      ? `SELECT COUNT(*) as count FROM tests t ${searchCondition}`
      : "SELECT COUNT(*) as count FROM tests";
    const totalTesRes = await client.query(totalTesQuery, searchParams_array);
    const totalTes = parseInt(totalTesRes.rows[0].count);

    // Tes aktif (with search filter)
    const tesAktifQuery = search
      ? `SELECT COUNT(*) as count FROM tests t ${searchCondition} AND t."isActive" = true`
      : 'SELECT COUNT(*) as count FROM tests WHERE "isActive" = true';
    const tesAktifParams = search ? [...searchParams_array] : [];
    const tesAktifRes = await client.query(tesAktifQuery, tesAktifParams);
    const tesAktif = parseInt(tesAktifRes.rows[0].count);

    // Tes selesai (yang memiliki sesi selesai) with search filter
    const tesSelesaiQuery = search
      ? `SELECT COUNT(DISTINCT t.id) as count 
         FROM tests t 
         INNER JOIN test_sessions ts ON t.id = ts."testId" 
         ${searchCondition} AND ts.status = $${paramIndex}`
      : `SELECT COUNT(DISTINCT t.id) as count 
         FROM tests t 
         INNER JOIN test_sessions ts ON t.id = ts."testId" 
         WHERE ts.status = $1`;
    const tesSelesaiParams = search ? [...searchParams_array, "COMPLETED"] : ["COMPLETED"];
    const tesSelesaiRes = await client.query(tesSelesaiQuery, tesSelesaiParams);
    const tesSelesai = parseInt(tesSelesaiRes.rows[0].count);

    // Rata-rata durasi (with search filter)
    const rataRataDurasiQuery = search
      ? `SELECT AVG(duration) as avg FROM tests t ${searchCondition}`
      : "SELECT AVG(duration) as avg FROM tests";
    const rataRataDurasiRes = await client.query(rataRataDurasiQuery, search ? searchParams_array : []);
    const rataRataDurasi = rataRataDurasiRes.rows[0].avg
      ? Math.round(parseFloat(rataRataDurasiRes.rows[0].avg))
      : 0;

    // Calculate total pages
    const totalPages = Math.ceil(totalTes / limit);

    // Daftar tes dengan statistik (with search and pagination)
    const daftarTesQuery = `
      SELECT 
        t.id,
        t.name,
        t.duration,
        t."isActive",
        t."createdAt",
        COUNT(DISTINCT ts."userId") as "participantCount",
        COALESCE(AVG(ts.score), 0) as "averageScore",
        COUNT(DISTINCT tq.question_id) as "questionCount"
      FROM tests t
      LEFT JOIN test_sessions ts ON t.id = ts."testId" AND ts.status = $${search ? paramIndex + 1 : 1}
      LEFT JOIN test_questions tq ON t.id = tq.test_id
      ${searchCondition}
      GROUP BY t.id, t.name, t.duration, t."isActive", t."createdAt"
      ORDER BY t."createdAt" DESC
      LIMIT $${search ? paramIndex + 2 : 2} OFFSET $${search ? paramIndex + 3 : 3}
    `;
    const daftarTesParams = search 
      ? [...searchParams_array, "COMPLETED", limit, offset]
      : ["COMPLETED", limit, offset];
    const daftarTesRes = await client.query(daftarTesQuery, daftarTesParams);

    const daftarTes =
      daftarTesRes.rows.map((row) => ({
        id: row.id,
        name: row.name,
        duration: row.duration,
        isActive: row.isactive,
        createdAt: row.createdAt,
        participantCount: parseInt(row.participantcount) || 0,
        averageScore: parseFloat(row.averagescore).toFixed(1) || "0.0",
        questionCount: parseInt(row.questioncount) || 0,
      })) || [];

    return NextResponse.json({
      totalTes,
      tesAktif,
      tesSelesai,
      rataRataDurasi,
      daftarTes,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching tes stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik tes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
