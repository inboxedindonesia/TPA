import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/auth";

export async function GET(req: Request) {
  try {
    // Next.js API route: req is a Request, but getUserFromRequest expects NextRequest
    // Cast to NextRequest for compatibility
    const user = await getUserFromRequest(req as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
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

    const body = await req.json();
    // Ambil field yang boleh diupdate
    const allowedFields = [
      "name",
      "email",
      "nim",
      "fakultas",
      "prodi",
      "tempat_lahir",
      "tanggal_lahir",
      "jenis_kelamin",
      "phone",
      "alamat",
      "agama",
      "angkatan",
      "tahun_masuk",
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
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
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        nim: updatedUser.nim,
        fakultas: updatedUser.fakultas,
        prodi: updatedUser.prodi,
        tempat_lahir: updatedUser.tempat_lahir,
        tanggal_lahir: updatedUser.tanggal_lahir,
        jenis_kelamin: updatedUser.jenis_kelamin,
        phone: updatedUser.phone,
        alamat: updatedUser.alamat,
        agama: updatedUser.agama,
        angkatan: updatedUser.angkatan,
        tahun_masuk: updatedUser.tahun_masuk,
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
