import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.permissions,
        r.status,
        r.created_at as "createdAt",
        COUNT(u.id) as "userCount"
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id, r.name, r.description, r.permissions, r.status, r.created_at
      ORDER BY r.created_at DESC
    `);

    client.release();

    // Convert userCount from string to number
    const roles = result.rows.map((role) => ({
      ...role,
      userCount: parseInt(role.userCount) || 0,
    }));

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, permissions, status } = await request.json();

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

    // Cek apakah nama role sudah ada
    const existingRole = await client.query(
      "SELECT id FROM roles WHERE name = $1",
      [name]
    );

    if (existingRole.rows.length > 0) {
      client.release();
      return NextResponse.json(
        { error: "Nama role sudah ada" },
        { status: 400 }
      );
    }

    // Insert role baru
    const result = await client.query(
      `INSERT INTO roles (id, name, description, permissions, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        `role-${Date.now()}`,
        name,
        description,
        JSON.stringify(permissions),
        status,
      ]
    );

    client.release();

    // Log CREATE ROLE activity
    try {
      const actor =
        (await getUserFromRequest(request)) || getFallbackUserInfo();
      await logActivity({
        user_id: actor.userId,
        user_name: actor.userName,
        user_role: actor.userRole,
        action: "CREATE",
        entity_type: "ROLE",
        entity_id: result.rows[0].id,
        entity_name: result.rows[0].name,
      });
    } catch (e) {
      console.error("Failed to log activity (create role):", e);
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Gagal membuat role" }, { status: 500 });
  }
}
