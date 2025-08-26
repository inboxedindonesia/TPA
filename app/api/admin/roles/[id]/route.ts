import { NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(request: Request, { params }: any) {
  try {
    const { name, description, permissions, status } = await request.json();
    const roleId = params["id"]; // Memperbaiki akses id dari params

    // Validasi input
    if (!name || !description) {
      return NextResponse.json(
        { error: "Nama dan deskripsi role harus diisi" },
        { status: 400 }
      );
    }

    if (name.length < 3) {
      return NextResponse.json(
        { error: "Nama role minimal 3 karakter" },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: "Deskripsi role minimal 10 karakter" },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions harus berupa array" },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Cek apakah role ada
    const existingRole = await client.query(
      "SELECT id FROM roles WHERE id = $1",
      [roleId]
    );

    if (existingRole.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah nama role sudah ada (kecuali role yang sedang diupdate)
    const duplicateName = await client.query(
      "SELECT id FROM roles WHERE name = $1 AND id != $2",
      [name, roleId]
    );

    if (duplicateName.rows.length > 0) {
      client.release();
      return NextResponse.json(
        { error: "Nama role sudah ada" },
        { status: 400 }
      );
    }

    // Update role
    const result = await client.query(
      `UPDATE roles 
       SET name = $1, description = $2, permissions = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, JSON.stringify(permissions), status, roleId]
    );

    client.release();

    // Log UPDATE ROLE activity
    try {
      const actor =
        (await getUserFromRequest(request)) || getFallbackUserInfo();
      await logActivity({
        user_id: actor.userId,
        user_name: actor.userName,
        user_role: actor.userRole,
        action: "UPDATE",
        entity_type: "ROLE",
        entity_id: roleId,
        entity_name: name,
      });
    } catch (e) {
      console.error("Failed to log activity (update role):", e);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate role" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const roleId = params["id"]; // Memperbaiki akses id dari params
    const client = await pool.connect();

    // Cek apakah role ada
    const existingRole = await client.query(
      "SELECT id FROM roles WHERE id = $1",
      [roleId]
    );

    if (existingRole.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah ada user yang menggunakan role ini
    const usersWithRole = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE role_id = $1",
      [roleId]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      client.release();
      return NextResponse.json(
        { error: "Tidak dapat menghapus role yang sedang digunakan oleh user" },
        { status: 400 }
      );
    }

    // Hapus role
    await client.query("DELETE FROM roles WHERE id = $1", [roleId]);

    client.release();

    // Log DELETE ROLE activity
    try {
      const actor =
        (await getUserFromRequest(request)) || getFallbackUserInfo();
      await logActivity({
        user_id: actor.userId,
        user_name: actor.userName,
        user_role: actor.userRole,
        action: "DELETE",
        entity_type: "ROLE",
        entity_id: roleId,
        entity_name: roleId,
      });
    } catch (e) {
      console.error("Failed to log activity (delete role):", e);
    }

    return NextResponse.json({ message: "Role berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Gagal menghapus role" },
      { status: 500 }
    );
  }
}
