import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import bcrypt from "bcryptjs";
import { getUserFromRequest, getFallbackUserInfo } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    const usersRes = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role_id,
        r.name as role_name,
        u."createdAt"
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u."createdAt" DESC
    `);

    const users = usersRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role_id || row.role, // Fallback ke role lama jika role_id null
      roleName: row.role_name,
      createdAt: row.createdAt,
      lastLogin: null, // Tidak ada kolom lastLogin
      status: "active", // Default status
    }));

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data users" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { name, email, password, role } = await request.json();

    // Validasi input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Validasi password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Validasi role
    if (!role) {
      return NextResponse.json(
        { error: "Role harus dipilih" },
        { status: 400 }
      );
    }

    // Cek apakah role ada dan aktif
    const roleCheck = await client.query(
      "SELECT id, name, status FROM roles WHERE id = $1",
      [role]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 400 }
      );
    }

    if (roleCheck.rows[0].status !== "active") {
      return NextResponse.json({ error: "Role tidak aktif" }, { status: 400 });
    }

    // Cek apakah email sudah ada
    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `user-${Date.now()}`;

    // Insert user baru
    await client.query(
      `
      INSERT INTO users (id, name, email, password, role_id, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `,
      [userId, name, email, hashedPassword, role]
    );

    // Server-side activity log (CREATE USER)
    try {
      const actor =
        (await getUserFromRequest(request)) || getFallbackUserInfo();
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      await logActivity({
        user_id: actor.userId,
        user_name: actor.userName,
        user_role: actor.userRole,
        action: "CREATE",
        entity_type: "USER",
        entity_id: userId,
        entity_name: name,
        details: { email },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (e) {
      console.error("Failed to log activity (create user):", e);
    }

    return NextResponse.json({
      message: "User berhasil ditambahkan",
      userId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
