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
    // ...log dihapus...

    // Total soal
    // ...log dihapus...
    const totalSoalRes = await client.query(
      "SELECT COUNT(*) as count FROM questions"
    );
    const totalSoal = parseInt(totalSoalRes.rows[0].count);
    // ...log dihapus...

    // Soal baru (dibuat dalam 30 hari terakhir)
    // ...log dihapus...
    const soalBaruRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM questions 
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `);
    const soalBaru = parseInt(soalBaruRes.rows[0].count);
    // ...log dihapus...

    // Soal aktif (yang digunakan dalam tes aktif)
    // ...log dihapus...
    const soalAktifRes = await client.query(`
      SELECT COUNT(*) as count
      FROM test_questions tq
      INNER JOIN questions q ON tq.question_id = q.id
      INNER JOIN tests t ON tq.test_id = t.id
      WHERE t."isActive" = true
    `);
    const soalAktif = parseInt(soalAktifRes.rows[0].count);
    // ...log dihapus...

    // Rata-rata kesulitan (dummy data untuk contoh)
    const rataRataKesulitan = 6.5; // Ini bisa dihitung dari field difficulty jika ada

    // Pagination and search
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build WHERE clause for search
    let whereClause = "";
    let queryParams: any[] = [limit, offset];
    let paramIndex = 3;

    if (search) {
      whereClause = `WHERE (question ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR subkategori ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count with search filter
    const totalCountQuery = search 
      ? `SELECT COUNT(*) as count FROM questions WHERE (question ILIKE $1 OR category ILIKE $1 OR subkategori ILIKE $1)`
      : `SELECT COUNT(*) as count FROM questions`;
    
    const totalCountParams = search ? [`%${search}%`] : [];
    const totalSoalWithSearchRes = await client.query(totalCountQuery, totalCountParams);
    const totalSoalWithSearch = parseInt(totalSoalWithSearchRes.rows[0].count);

    // ...log dihapus...
    // Daftar soal dengan statistik - paginated and searchable
    const daftarSoalRes = await client.query(
      `
      SELECT 
        id,
        question,
        category,
        COALESCE(difficulty, 'Sedang') as difficulty,
        "createdAt",
        options,
        "correctAnswer",
        kategori,
        subkategori,
        tipejawaban,
        gambar,
        gambarjawaban,
        tipesoal,
        levelkesulitan,
        deskripsi,
        COALESCE(points, 1) as points
      FROM questions
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $1 OFFSET $2
    `,
      queryParams
    );
    // ...log dihapus...

    const daftarSoal = daftarSoalRes.rows.map((row) => {
      let options = null;
      let gambarJawaban = null;

      try {
        if (row.options) {
          options = JSON.parse(row.options);
        }
      } catch (error) {
        console.error("Error parsing options for question", row.id, error);
        options = null;
      }

      try {
        if (row.gambarJawaban) {
          gambarJawaban = JSON.parse(row.gambarJawaban);
        }
      } catch (error) {
        console.error(
          "Error parsing gambarJawaban for question",
          row.id,
          error
        );
        gambarJawaban = null;
      }

      return {
        id: row.id,
        question: row.question,
        category: row.category || "Umum",
        difficulty: row.difficulty,
        createdAt: row.createdAt,
        usageCount: 0,
        successRate: "0.0",
        options: options,
        correctAnswer: (() => {
          try {
            // Try to parse as JSON for multiple answers
            const parsed = JSON.parse(row.correctAnswer);
            return Array.isArray(parsed) ? parsed : row.correctAnswer;
          } catch {
            // If parsing fails, return as string
            return row.correctAnswer;
          }
        })(),
        kategori: row.kategori,
        subkategori: row.subkategori,
        tipeJawaban: row.tipejawaban,
        gambar: row.gambar,
        gambarJawaban: gambarJawaban,
        tipeSoal: row.tipesoal,
        levelKesulitan: row.levelkesulitan,
        deskripsi: row.deskripsi,
        points: row.points || 1,
        allowMultipleAnswers: false, // Default value for now
      };
    });

    // ...log dihapus...
    return NextResponse.json({
      totalSoal,
      soalBaru,
      soalAktif,
      rataRataKesulitan,
      daftarSoal,
      page,
      limit,
      totalPages: Math.ceil(totalSoalWithSearch / limit),
      totalResults: totalSoalWithSearch,
      hasSearch: !!search,
    });
  } catch (error) {
    console.error("Error fetching soal stats:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });
    return NextResponse.json(
      { error: "Gagal mengambil data statistik soal" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
