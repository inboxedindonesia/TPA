import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/auth";
import { logUserProfileUpdated } from "../../../../lib/activityLogger";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    // Next.js API route: req is a Request, but getUserFromRequest expects NextRequest
    // Cast to NextRequest for compatibility
    const user = await getUserFromRequest(req as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Normalize keys for client consumption
    return NextResponse.json({
      user: {
        id: user.userId,
        name: user.userName,
        email: user.userEmail,
        role: user.userRole,
        createdAt: user.createdAt,
        tempat_lahir: user.tempat_lahir,
        tanggal_lahir: user.tanggal_lahir,
        jenis_kelamin: user.jenis_kelamin,
        alamat: user.alamat,
        asal_sekolah: user.asal_sekolah,
        provinsi_sekolah: user.provinsi_sekolah,
        jurusan: user.jurusan,
        foto: user.foto,
        nik: user.nik,
        jenjang: user.jenjang,
        registration_id: user.registration_id,
        is_verified: user.is_verified,
        nationality: user.nationality,
        passport: user.passport,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    // Ambil user dari token
    const user = await getUserFromRequest(req as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    // Ambil field yang boleh diupdate
    const allowedFields = [
      "name",
      "email",
      "tempat_lahir",
      "tanggal_lahir",
      "jenis_kelamin",
      "alamat",
      "asal_sekolah",
      "provinsi_sekolah",
      "jurusan",
      "nik",
      "jenjang",
      "nationality",
      "passport",
    ];
    const updates: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await (req as any).formData();
      for (const field of allowedFields) {
        if (field === "foto") continue; // tangani terpisah
        const val = form.get(field);
        if (val !== null && val !== undefined && String(val) !== "") {
          updates[field] = String(val);
        }
      }

      // Foto upload
      const f = form.get("foto");
      if (f && typeof f === "object" && "arrayBuffer" in f) {
        try {
          const file = f as unknown as File;
          const uploadDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            "users"
          );
          await fs.promises.mkdir(uploadDir, { recursive: true });
          const originalName = (file as any).name || "foto";
          const extFromName = path.extname(originalName);
          const type = (file as any).type || "";
          const fallbackExt = type.includes("png")
            ? ".png"
            : type.includes("webp")
            ? ".webp"
            : ".jpg";
          const ext = extFromName || fallbackExt;
          const fileName = `${user.userId}${ext}`;
          const filePath = path.join(uploadDir, fileName);
          const buffer = Buffer.from(await (file as any).arrayBuffer());
          await fs.promises.writeFile(filePath, buffer);
          updates["foto"] = path.posix.join("uploads", "users", fileName);
        } catch (e) {
          console.error("Gagal menyimpan foto:", e);
        }
      }
    } else {
      const body = await req.json();
      for (const field of allowedFields) {
        if ((body as any)[field] !== undefined) {
          updates[field] = (body as any)[field];
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }

    // Update database
    const setClause = Object.keys(updates)
      .map((key, idx) => `"${key}" = $${idx + 1}`)
      .join(", ");
    const values = Object.values(updates);
    values.push(user.userId); // id di parameter terakhir

    const query = `UPDATE users SET ${setClause}, "updatedAt" = NOW() WHERE id = $${values.length} RETURNING *`;
    const { rows } = await (
      await import("../../../../lib/database")
    ).default.query(query, values);
    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Kembalikan data user terbaru
    const updatedUser = rows[0];

    // Log activity
    await logUserProfileUpdated(user.userId, user.userName, user.userRole);

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        tempat_lahir: updatedUser.tempat_lahir,
        tanggal_lahir: updatedUser.tanggal_lahir,
        jenis_kelamin: updatedUser.jenis_kelamin,
        alamat: updatedUser.alamat,
        asal_sekolah: updatedUser.asal_sekolah,
        provinsi_sekolah: updatedUser.provinsi_sekolah,
        jurusan: updatedUser.jurusan,
        foto: updatedUser.foto,
        nik: updatedUser.nik,
        jenjang: updatedUser.jenjang,
        registration_id: updatedUser.registration_id,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
