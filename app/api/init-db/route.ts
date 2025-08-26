import { NextRequest, NextResponse } from "next/server";
import { initDatabase, seedDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Initializing MySQL database...");

    // Initialize database tables
    const initSuccess = await initDatabase();
    if (!initSuccess) {
      return NextResponse.json(
        { error: "Gagal menginisialisasi database" },
        { status: 500 }
      );
    }

    // Seed database with initial data
    const seedSuccess = await seedDatabase();
    if (!seedSuccess) {
      return NextResponse.json(
        { error: "Gagal menambahkan data awal" },
        { status: 500 }
      );
    }

    console.log("✅ Database initialization completed successfully!");
    return NextResponse.json({
      message: "Database berhasil diinisialisasi",
      status: "success",
    });
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat inisialisasi database" },
      { status: 500 }
    );
  }
}
