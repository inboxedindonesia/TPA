import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");
    const type = searchParams.get("type");

    const client = await pool.connect();

    try {
      let query = "";
      const params: any[] = [];
      let paramIndex = 1;

      if (testId) {
        // Ambil soal yang terhubung ke testId lewat test_questions
        query = `
          SELECT 
            q.*,
            u.name as "creatorName",
            s.id as "sectionId",
            s.name as "sectionName",
            s."order" as "sectionOrder",
            s.duration as "sectionDuration"
          FROM test_questions tq
          INNER JOIN questions q ON tq.question_id = q.id
          LEFT JOIN users u ON q."creatorId" = u.id
          LEFT JOIN sections s ON q."sectionId" = s.id
          WHERE tq.test_id = $${paramIndex}
        `;
        params.push(testId);
        paramIndex++;
      } else {
        // Ambil semua soal
        query = `
          SELECT 
            q.*,
            u.name as "creatorName",
            s.id as "sectionId",
            s.name as "sectionName",
            s."order" as "sectionOrder",
            s.duration as "sectionDuration"
          FROM questions q
          LEFT JOIN users u ON q."creatorId" = u.id
          LEFT JOIN sections s ON q."sectionId" = s.id
          WHERE 1=1
        `;
      }

      if (type && type !== "all") {
        query += ` AND q.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      query += ` ORDER BY s."order" ASC NULLS LAST, q."order" ASC`;

      const result = await client.query(query, params);

      // Parse options JSON for each question, and group section info
      const questions = result.rows.map((row: any) => ({
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
        gambarJawaban: row.gambarJawaban ? JSON.parse(row.gambarJawaban) : null,
        section: row.sectionId
          ? {
              id: row.sectionId,
              name: row.sectionName,
              order: row.sectionOrder,
              duration: row.sectionDuration,
            }
          : null,
      }));

      return NextResponse.json({ questions });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data soal" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request is FormData
    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle FormData (TPA questions with file uploads)
      return await handleFormDataRequest(request);
    } else {
      // Handle JSON request (legacy format)
      return await handleJsonRequest(request);
    }
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat soal" },
      { status: 500 }
    );
  }
}

async function handleFormDataRequest(request: NextRequest) {
  try {
    console.log("Starting FormData request handling...");

    const formData = await request.formData();
    console.log("FormData parsed successfully");

    // Extract text fields
    const kategori = formData.get("kategori") as string;
    const subkategori = formData.get("subkategori") as string;
    const pertanyaan = formData.get("pertanyaan") as string;
    const tipeSoal = formData.get("tipeSoal") as string;
    const tipeJawaban = formData.get("tipeJawaban") as string;
    const levelKesulitan = formData.get("levelKesulitan") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const jawabanBenarStr = formData.get("jawabanBenar") as string;
    const allowMultipleAnswers = formData.get("allowMultipleAnswers") as string;

    // Parse jawabanBenar as JSON for multiple answers support
    let jawabanBenar: string | string[] = "";
    try {
      if (jawabanBenarStr) {
        const parsed = JSON.parse(jawabanBenarStr);
        if (Array.isArray(parsed)) {
          jawabanBenar = parsed;
        } else {
          jawabanBenar = parsed;
        }
      }
    } catch (error) {
      console.error("Error parsing jawabanBenar:", error);
      jawabanBenar = jawabanBenarStr;
    }

    console.log("Received form data:", {
      kategori,
      subkategori,
      pertanyaan,
      tipeSoal,
      tipeJawaban,
      levelKesulitan,
      deskripsi,
      jawabanBenar,
      allowMultipleAnswers,
    });

    // Validate required fields
    if (!kategori || !subkategori || !pertanyaan || !tipeSoal) {
      console.log("Validation failed - missing required fields");
      return NextResponse.json(
        {
          error: "Kategori, subkategori, pertanyaan, dan tipe soal harus diisi",
        },
        { status: 400 }
      );
    }

    // Handle file uploads
    const gambar = formData.get("gambar") as File | null;
    const gambarJawaban: (File | null)[] = [];

    // Extract image answers
    for (let i = 0; i < 4; i++) {
      const imageFile = formData.get(`gambarJawaban_${i}`) as File | null;
      gambarJawaban.push(imageFile);
    }

    console.log("File handling completed");

    // Extract text answers
    let pilihanJawaban: string[] = [];
    if (tipeJawaban === "TEXT") {
      const pilihanJawabanStr = formData.get("pilihanJawaban") as string;
      if (pilihanJawabanStr) {
        try {
          pilihanJawaban = JSON.parse(pilihanJawabanStr);
          console.log("Parsed pilihanJawaban:", pilihanJawaban);
        } catch (error) {
          console.error("Error parsing pilihanJawaban:", error);
          return NextResponse.json(
            { error: "Format pilihan jawaban tidak valid" },
            { status: 400 }
          );
        }
      }
    }

    // Get creator ID from token (you'll need to implement this based on your auth system)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authentication failed - no valid token");
      return NextResponse.json(
        { error: "Token autentikasi diperlukan" },
        { status: 401 }
      );
    }

    // For now, we'll use a default creator ID - you should implement proper token validation
    const creatorId = "admin-1"; // This should come from token validation

    console.log("Connecting to database...");
    const client = await pool.connect();
    console.log("Database connected successfully");

    try {
      // Generate unique ID
      const questionId = `q-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log("Generated question ID:", questionId);

      // Handle file uploads
      let gambarPath = null;
      const gambarJawabanPaths: string[] = [];

      // Upload question image if provided
      if (gambar && gambar.size > 0) {
        try {
          console.log("Uploading question image...");
          gambarPath = await uploadFile(gambar, "questions");
          console.log("Question image uploaded:", gambarPath);
        } catch (error) {
          console.error("Error uploading question image:", error);
          return NextResponse.json(
            { error: "Gagal mengupload gambar soal" },
            { status: 500 }
          );
        }
      }

      // Upload answer images if provided
      if (tipeJawaban === "IMAGE") {
        console.log("Processing image answers...");
        for (let i = 0; i < gambarJawaban.length; i++) {
          const imageFile = gambarJawaban[i];
          if (imageFile && imageFile.size > 0) {
            try {
              const imagePath = await uploadFile(imageFile, "answers");
              gambarJawabanPaths.push(imagePath);
              console.log(`Answer image ${i} uploaded:`, imagePath);
            } catch (error) {
              console.error(`Error uploading answer image ${i}:`, error);
              return NextResponse.json(
                { error: `Gagal mengupload gambar jawaban ${i + 1}` },
                { status: 500 }
              );
            }
          } else {
            gambarJawabanPaths.push("");
          }
        }
      }

      // Prepare options based on answer type
      let options = null;
      if (tipeJawaban === "TEXT") {
        options = JSON.stringify(pilihanJawaban);
      } else if (tipeJawaban === "IMAGE") {
        options = JSON.stringify(gambarJawabanPaths);
      }

      console.log("Prepared data for database:", {
        questionId,
        pertanyaan,
        tipeSoal,
        options,
        jawabanBenar,
        kategori,
        levelKesulitan,
        deskripsi,
        creatorId,
        gambarPath,
        gambarJawabanPaths,
      });

      const insertQuery = `
        INSERT INTO questions (
          id, question, type, options, "correctAnswer", category, 
          difficulty, explanation, "order", points, "testId", "creatorId",
          kategori, subkategori, tipeJawaban, gambar, gambarJawaban,
          tipeSoal, levelKesulitan, deskripsi
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `;

      const insertParams = [
        questionId,
        pertanyaan,
        tipeSoal,
        options,
        Array.isArray(jawabanBenar)
          ? JSON.stringify(jawabanBenar)
          : jawabanBenar || "",
        kategori, // Use kategori as category
        levelKesulitan, // Use levelKesulitan as difficulty
        deskripsi || null,
        1, // Default order
        1, // Default points
        "test-1", // Default test ID - you might want to make this configurable
        creatorId,
        kategori,
        subkategori,
        tipeJawaban,
        gambarPath,
        tipeJawaban === "IMAGE" ? JSON.stringify(gambarJawabanPaths) : null,
        tipeSoal,
        levelKesulitan,
        deskripsi,
      ];

      console.log("Executing database insert...");
      console.log("SQL Query:", insertQuery);
      console.log("Parameters:", insertParams);

      await client.query(insertQuery, insertParams);
      console.log("Database insert successful");

      // Fetch the created question
      const result = await client.query(
        `
        SELECT 
          q.*,
          t.name as "testName",
          u.name as "creatorName"
        FROM questions q
        LEFT JOIN tests t ON q."testId" = t.id
        LEFT JOIN users u ON q."creatorId" = u.id
        WHERE q.id = $1
      `,
        [questionId]
      );

      const newQuestion = result.rows[0];
      if (newQuestion) {
        newQuestion.options = newQuestion.options
          ? JSON.parse(newQuestion.options)
          : null;
        newQuestion.gambarJawaban = newQuestion.gambarJawaban
          ? JSON.parse(newQuestion.gambarJawaban)
          : null;
      }

      console.log("Question created successfully:", newQuestion);
      return NextResponse.json(newQuestion, { status: 201 });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan database: " + (error as Error).message },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating TPA question:", error);
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan saat membuat soal TPA: " +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleJsonRequest(request: NextRequest) {
  try {
    const {
      testId,
      type,
      question,
      options,
      correctAnswer,
      category,
      difficulty,
      explanation,
      points,
      order,
      creatorId,
    } = await request.json();

    // Validasi input
    if (!testId || !type || !question || !creatorId) {
      return NextResponse.json(
        { error: "TestId, type, question, dan creatorId harus diisi" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Generate unique ID
      const questionId = `q-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const insertQuery = `
        INSERT INTO questions (
          id, question, type, options, correctAnswer, category, 
          difficulty, explanation, \`order\`, points, testId, creatorId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        questionId,
        question,
        type,
        options ? JSON.stringify(options) : null,
        correctAnswer,
        category,
        difficulty,
        explanation,
        order || 1,
        points || 1,
        testId,
        creatorId,
      ];

      await client.query(insertQuery, insertParams);

      // Fetch the created question
      const result = await client.query(
        `
        SELECT 
          q.*,
          t.name as "testName",
          u.name as "creatorName"
        FROM questions q
        LEFT JOIN tests t ON q.testId = t.id
        LEFT JOIN users u ON q.creatorId = u.id
        WHERE q.id = ?
      `,
        [questionId]
      );

      const newQuestion = result.rows[0];
      if (newQuestion) {
        newQuestion.options = newQuestion.options
          ? JSON.parse(newQuestion.options)
          : null;
      }

      return NextResponse.json(newQuestion, { status: 201 });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan database: " + (error as Error).message },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat soal" },
      { status: 500 }
    );
  }
}

async function uploadFile(file: File, folder: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name);
    const filename = `${timestamp}-${randomString}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await fs.writeFile(filepath, buffer);

    // Return the public URL
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
