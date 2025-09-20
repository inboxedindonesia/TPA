import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request, { params }: any) {
  try {
    const resolvedParams = await params;
    const questionId = resolvedParams["id"];

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT * FROM questions WHERE id = $1",
        [questionId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      const question = result.rows[0];
      return NextResponse.json(question);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil soal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: any) {
  try {
    const resolvedParams = await params;
    const questionId = resolvedParams["id"];
    const formData = await request.formData();

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if question exists
      const checkResult = await client.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Extract form data
      const kategori = formData.get("kategori") as string;
      const subkategori = formData.get("subkategori") as string;
      const pertanyaan = formData.get("pertanyaan") as string;
      const tipeSoal = formData.get("tipeSoal") as string;
      const tipeJawaban = formData.get("tipeJawaban") as string;
      const levelKesulitan = formData.get("levelKesulitan") as string;
      const deskripsi = formData.get("deskripsi") as string;
      const allowMultipleAnswers =
        formData.get("allowMultipleAnswers") === "true";

      // Debug: log received form data
      console.log("API received form data:", {
        kategori,
        subkategori,
        pertanyaan,
        tipeSoal,
        tipeJawaban,
        levelKesulitan,
        deskripsi,
        allowMultipleAnswers
      });

      // Validate required fields
      if (!kategori || !subkategori || !pertanyaan || !tipeSoal || !tipeJawaban || !levelKesulitan) {
        return NextResponse.json(
          { error: "Missing required fields: kategori, subkategori, pertanyaan, tipeSoal, tipeJawaban, levelKesulitan" },
          { status: 400 }
        );
      }

      // Handle file uploads
      const gambar = formData.get("gambar") as File | null;
      let gambarPath = null;

      if (gambar && gambar.size > 0) {
        const bytes = await gambar.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `gambar_${Date.now()}_${gambar.name}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        gambarPath = `/uploads/${fileName}`;
      }

      // Handle answer options
      let options = null;
      const gambarJawabanPaths = [];

      console.log("Processing answers for tipeSoal:", tipeSoal, "tipeJawaban:", tipeJawaban);

      if (tipeSoal === "PILIHAN_GANDA") {
        if (tipeJawaban === "TEXT") {
          const pilihanJawabanStr = formData.get("pilihanJawaban") as string;
          console.log("Raw pilihanJawaban string:", pilihanJawabanStr);
          
          if (pilihanJawabanStr) {
            try {
              const pilihanJawaban = JSON.parse(pilihanJawabanStr);
              options = pilihanJawaban;
              console.log("Parsed pilihanJawaban:", options);
            } catch (e) {
              console.error("Error parsing pilihanJawaban:", e);
              return NextResponse.json(
                { error: "Invalid pilihanJawaban format" },
                { status: 400 }
              );
            }
          }
        } else {
          // Handle image answers - check for existing images
          const existingGambarJawaban = formData.get(
            "existingGambarJawaban"
          ) as string;
          let existingImages = [];

          console.log("Raw existingGambarJawaban:", existingGambarJawaban);

          if (existingGambarJawaban) {
            try {
              existingImages = JSON.parse(existingGambarJawaban);
              console.log("Parsed existingImages:", existingImages);
            } catch (e) {
              console.error("Error parsing existing images:", e);
              existingImages = [];
            }
          }

          for (let i = 0; i < 4; i++) {
            const imageFile = formData.get(`gambarJawaban_${i}`) as File | null;
            if (imageFile && imageFile.size > 0) {
              // New image uploaded
              const bytes = await imageFile.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const fileName = `gambar_jawaban_${Date.now()}_${i}_${
                imageFile.name
              }`;

              const uploadDir = path.join(process.cwd(), "public", "uploads");
              await fs.mkdir(uploadDir, { recursive: true });

              const filePath = path.join(uploadDir, fileName);
              await fs.writeFile(filePath, buffer);
              gambarJawabanPaths.push(`/uploads/${fileName}`);
            } else if (existingImages[i]) {
              // Keep existing image
              gambarJawabanPaths.push(existingImages[i]);
            } else {
              // No image
              gambarJawabanPaths.push("");
            }
          }
          options = gambarJawabanPaths;
          console.log("Final gambarJawabanPaths:", gambarJawabanPaths);
        }
      }

      // Handle correct answer
      const jawabanBenarStr = formData.get("jawabanBenar") as string;
      console.log("Raw jawabanBenar string:", jawabanBenarStr);
      
      let jawabanBenar;
      if (jawabanBenarStr) {
        try {
          jawabanBenar = JSON.parse(jawabanBenarStr);
          console.log("Parsed jawabanBenar:", jawabanBenar);
        } catch (e) {
          console.error("Error parsing jawabanBenar:", e);
          return NextResponse.json(
            { error: "Invalid jawabanBenar format" },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "jawabanBenar is required" },
          { status: 400 }
        );
      }

      // Update the question
      const updateQuery = `
        UPDATE questions 
        SET 
          question = $1,
          kategori = $2,
          subkategori = $3,
          options = $4,
          "correctAnswer" = $5,
          tipeSoal = $6,
          tipeJawaban = $7,
          levelKesulitan = $8,
          deskripsi = $9,
          allowMultipleAnswers = $10,
          gambar = COALESCE($11, gambar),
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $12
      `;

      await client.query(updateQuery, [
        pertanyaan,
        kategori,
        subkategori,
        options ? JSON.stringify(options) : null,
        Array.isArray(jawabanBenar)
          ? JSON.stringify(jawabanBenar)
          : jawabanBenar,
        tipeSoal,
        tipeJawaban,
        levelKesulitan,
        deskripsi,
        allowMultipleAnswers,
        gambarPath,
        questionId,
      ]);

      console.log(`Question ${questionId} updated successfully`);
      return NextResponse.json(
        { message: "Question updated successfully" },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui soal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const resolvedParams = await params;
    const questionId = resolvedParams["id"];

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if question exists
      const checkResult = await client.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Get all tests that contain this question before deletion
      const testsQuery = `
        SELECT DISTINCT test_id FROM test_questions WHERE question_id = $1
      `;
      const testsResult = await client.query(testsQuery, [questionId]);
      const affectedTestIds = testsResult.rows.map(row => row.test_id);

      // Delete the question (CASCADE will delete from test_questions)
      await client.query("DELETE FROM questions WHERE id = $1", [questionId]);

      // No need to update totalQuestions - we calculate it dynamically from test_questions table

      console.log(`Question ${questionId} deleted successfully`);
      return NextResponse.json(
        { message: "Question deleted successfully" },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus soal" },
      { status: 500 }
    );
  }
}
