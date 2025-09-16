import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

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
    const gambarJawabanFiles = formData.getAll("gambarJawaban") as File[];

    // Generate unique question ID
    const questionId = `question-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Process main question image
    let gambarUrl = "";
    if (gambar && gambar.size > 0) {
      const bytes = await gambar.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${gambar.name}`;
      const filePath = `public/uploads/questions/${fileName}`;

      // Save file (you might want to use a proper file storage service)
      const fs = require("fs");
      const path = require("path");

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      gambarUrl = `/uploads/questions/${fileName}`;
    }

    // Process answer images
    const gambarJawabanUrls: string[] = [];
    for (const file of gambarJawabanFiles) {
      if (file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${file.name}`;
        const filePath = `public/uploads/answers/${fileName}`;

        const fs = require("fs");
        const path = require("path");

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);
        gambarJawabanUrls.push(`/uploads/answers/${fileName}`);
      }
    }

    // Create database connection
    const pool = require("@/lib/database").default;
    const client = await pool.connect();

    try {
      // Insert question into database
      const insertQuery = `
        INSERT INTO questions (
          id, question, category, difficulty, options, "correctAnswer",
          tipeSoal, tipeJawaban, gambar, gambarJawaban, subkategori,
          levelKesulitan, deskripsi, allowMultipleAnswers, "creatorId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      const values = [
        questionId,
        pertanyaan,
        kategori,
        levelKesulitan,
        JSON.stringify([]), // Empty options for now
        JSON.stringify(jawabanBenar),
        tipeSoal,
        tipeJawaban,
        gambarUrl,
        JSON.stringify(gambarJawabanUrls),
        subkategori,
        levelKesulitan,
        deskripsi,
        allowMultipleAnswers === "true",
        "admin-user-id", // You might want to get this from the authenticated user
      ];

      await client.query(insertQuery, values);

      client.release();

      return NextResponse.json({
        message: "Soal berhasil dibuat",
        questionId,
        gambarUrl,
        gambarJawabanUrls,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      client.release();
      return NextResponse.json(
        { error: "Terjadi kesalahan database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in handleFormDataRequest:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses data" },
      { status: 500 }
    );
  }
}

async function handleJsonRequest(request: NextRequest) {
  try {
    const questionData = await request.json();

    // Validate required fields
    if (
      !questionData.question ||
      !questionData.category ||
      !questionData.difficulty
    ) {
      return NextResponse.json(
        { error: "Pertanyaan, kategori, dan tingkat kesulitan harus diisi" },
        { status: 400 }
      );
    }

    // Generate unique question ID
    const questionId = `question-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create database connection
    const pool = require("@/lib/database").default;
    const client = await pool.connect();

    try {
      // Insert question into database
      const insertQuery = `
        INSERT INTO questions (
          id, question, type, category, difficulty, options, "correctAnswer",
          "creatorId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const values = [
        questionId,
        questionData.question,
        questionData.type || "MULTIPLE_CHOICE",
        questionData.category,
        questionData.difficulty,
        JSON.stringify(questionData.options || []),
        JSON.stringify(questionData.correctAnswer),
        "admin-user-id", // You might want to get this from the authenticated user
      ];

      await client.query(insertQuery, values);

      client.release();

      return NextResponse.json({
        message: "Soal berhasil dibuat",
        questionId,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      client.release();
      return NextResponse.json(
        { error: "Terjadi kesalahan database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in handleJsonRequest:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses data" },
      { status: 500 }
    );
  }
}
