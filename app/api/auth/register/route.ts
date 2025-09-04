import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/database";
import { sendOtpEmail } from "@/lib/email";
import fs from "fs";
import path from "path";
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Support multipart/form-data for photo upload
    const contentType = request.headers.get("content-type") || "";
    let name = "";
    let email = "";
    let password = "";
    let tempat_lahir = "";
    let tanggal_lahir = "";
    let jenis_kelamin = "";
    let alamat = "";
    let asal_sekolah = "";
    let provinsi_sekolah = "";
    let jurusan = "";
    let nik = "";
    let jenjang = "";
    let fotoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = String(form.get("name") || "").trim();
      email = String(form.get("email") || "").trim();
      password = String(form.get("password") || "").trim();
      tempat_lahir = String(form.get("tempat_lahir") || "").trim();
      tanggal_lahir = String(form.get("tanggal_lahir") || "").trim();
      jenis_kelamin = String(form.get("jenis_kelamin") || "").trim();
      alamat = String(form.get("alamat") || "").trim();
      asal_sekolah = String(form.get("asal_sekolah") || "").trim();
      provinsi_sekolah = String(form.get("provinsi_sekolah") || "").trim();
      jurusan = String(form.get("jurusan") || "").trim();
      nik = String(form.get("nik") || "").trim();
      jenjang = String(form.get("jenjang") || "").trim();
      const f = form.get("foto");
      if (f && typeof f === "object" && "arrayBuffer" in f) {
        fotoFile = f as unknown as File;
      }
    } else {
      const body = await request.json();
      name = body.name || "";
      email = body.email || "";
      password = body.password || "";
      tempat_lahir = body.tempat_lahir || "";
      tanggal_lahir = body.tanggal_lahir || "";
      jenis_kelamin = body.jenis_kelamin || "";
      alamat = body.alamat || "";
      asal_sekolah = body.asal_sekolah || "";
      provinsi_sekolah = body.provinsi_sekolah || "";
      jurusan = body.jurusan || "";
      nik = body.nik || "";
      jenjang = body.jenjang || "";
    }

    // OTP-first flow: allow missing name initially; default to email prefix
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }
    if (!name || name.trim() === "") {
      name = (email.split("@")[0] || "Pengguna").slice(0, 100);
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Cek email sudah terdaftar
      const existingResult = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existingResult.rows.length > 0) {
        await client.query("ROLLBACK");
        client.release();
        return NextResponse.json(
          { error: "Email sudah terdaftar" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user-${Date.now()}`;
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      // Cari registration_id terbesar (tidak reset harian)
      const maxResult = await client.query(
        "SELECT registration_id FROM users WHERE registration_id LIKE 'UMB-%' ORDER BY registration_id DESC LIMIT 1"
      );
      let nextNumber = 1;
      if (maxResult.rows.length > 0) {
        const lastId = maxResult.rows[0].registration_id;
        const lastNum = parseInt(lastId.split("-").pop() || "0", 10);
        nextNumber = lastNum + 1;
      }
      const regId = `UMB-${yyyymmdd}-${String(nextNumber).padStart(4, "0")}`;

      // Save photo if provided
      let fotoPath: string | null = null;
      if (fotoFile) {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "users"
        );
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const originalName = (fotoFile as any).name || "foto";
        const extFromName = path.extname(originalName);
        const fallbackExt = ((): string => {
          const type = (fotoFile as any).type || "";
          if (type.includes("png")) return ".png";
          if (type.includes("webp")) return ".webp";
          return ".jpg";
        })();
        const ext = extFromName || fallbackExt;
        const fileName = `${userId}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await (fotoFile as any).arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);
        fotoPath = path.posix.join("uploads", "users", fileName);
      }

      // Insert user status belum aktif beserta biodata
      await client.query(
        `INSERT INTO users (
          id, name, email, password, role_id, registration_id,
          tempat_lahir, tanggal_lahir, jenis_kelamin, alamat,
          asal_sekolah, provinsi_sekolah, jurusan, foto, nik, jenjang
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16
        )`,
        [
          userId,
          name,
          email,
          hashedPassword,
          "role-peserta",
          regId,
          tempat_lahir || null,
          tanggal_lahir || null,
          jenis_kelamin || null,
          alamat || null,
          asal_sekolah || null,
          provinsi_sekolah || null,
          jurusan || null,
          fotoPath,
          nik || null,
          jenjang || null,
        ]
      );

      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await client.query(
        "INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)",
        [userId, otp, expiresAt]
      );

      // Kirim email OTP
      try {
        await sendOtpEmail(email, otp);
      } catch (e: any) {
        // Rollback DB changes to avoid orphan user and allow retry
        await client.query("ROLLBACK");
        try {
          if (fotoPath) {
            const filePath = path.join(process.cwd(), "public", fotoPath);
            await fs.promises.unlink(filePath).catch(() => {});
          }
        } catch {}
        client.release();
        console.error("OTP email send failed:", e?.message || e);
        return NextResponse.json(
          {
            error:
              "Gagal mengirim OTP ke email. Mohon periksa konfigurasi email/server.",
          },
          { status: 500 }
        );
      }

      await client.query("COMMIT");
      client.release();
      return NextResponse.json({
        message: "OTP telah dikirim ke email Anda. Silakan verifikasi.",
        user: { id: userId, email, registration_id: regId },
      });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      client.release();
      console.error("Register error:", err);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
