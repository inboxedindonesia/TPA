#!/usr/bin/env node

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tpa_universitas",
};

const pool = new Pool(dbConfig);

async function updateDatabaseSchema() {
  try {
    const client = await pool.connect();

    // Create uploads directory structure
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const questionsDir = path.join(uploadsDir, "questions");
    const answersDir = path.join(uploadsDir, "answers");

    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("✅ Created uploads directory");
    }

    if (!fs.existsSync(questionsDir)) {
      fs.mkdirSync(questionsDir, { recursive: true });
      console.log("✅ Created questions upload directory");
    }

    if (!fs.existsSync(answersDir)) {
      fs.mkdirSync(answersDir, { recursive: true });
      console.log("✅ Created answers upload directory");
    }

    // Update database schema
    console.log("🔧 Updating database schema...");

    // Add new TPA-specific columns to questions table
    const alterQueries = [
      // Add new columns if they don't exist
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS kategori VARCHAR(100)`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS subkategori VARCHAR(100)`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS tipeJawaban VARCHAR(50) DEFAULT 'TEXT'`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS gambar VARCHAR(500)`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS gambarJawaban TEXT`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS tipeSoal VARCHAR(50) DEFAULT 'PILIHAN_GANDA'`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS levelKesulitan VARCHAR(50) DEFAULT 'SEDANG'`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS deskripsi TEXT`,

      // Make options nullable (for TPA questions that might not have text options)
      `ALTER TABLE questions ALTER COLUMN options DROP NOT NULL`,
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS allowMultipleAnswers BOOLEAN DEFAULT FALSE`,
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Skipped (column might already exist): ${query}`);
      }
    }

    client.release();
    console.log("✅ Database schema updated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error updating database schema:", error);
    return false;
  }
}

// Run the update
updateDatabaseSchema()
  .then((success) => {
    if (success) {
      console.log("🎉 Database setup completed successfully!");
    } else {
      console.log("💥 Database setup failed!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
