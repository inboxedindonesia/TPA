import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
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

      if (tipeSoal === "PILIHAN_GANDA") {
        if (tipeJawaban === "TEXT") {
          const pilihanJawaban = JSON.parse(
            formData.get("pilihanJawaban") as string
          );
          options = pilihanJawaban;
        } else {
          // Handle image answers - check for existing images
          const existingGambarJawaban = formData.get(
            "existingGambarJawaban"
          ) as string;
          let existingImages = [];

          if (existingGambarJawaban) {
            try {
              existingImages = JSON.parse(existingGambarJawaban);
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
        }
      }

      // Handle correct answer
      const jawabanBenar = JSON.parse(formData.get("jawabanBenar") as string);

      // Update the question
      const updateQuery = `
        UPDATE questions 
        SET 
          question = $1,
          kategori = $2,
          subkategori = $3,
          options = $4,
          correctAnswer = $5,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

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

      // Delete the question
      await client.query("DELETE FROM questions WHERE id = $1", [questionId]);

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
