import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Supabase/PostgreSQL configuration using DATABASE_URL
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced max connections for better stability
  idleTimeoutMillis: 60000, // Increased idle timeout to 60 seconds
  connectionTimeoutMillis: 10000, // Increased connection timeout to 10 seconds
  acquireTimeoutMillis: 10000, // Added acquire timeout
  createTimeoutMillis: 10000, // Added create timeout
  destroyTimeoutMillis: 5000, // Added destroy timeout
  reapIntervalMillis: 1000, // Added reap interval
  createRetryIntervalMillis: 200, // Added retry interval
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection with better error handling
export async function testConnection() {
  let client;
  try {
    console.log("🔄 Testing database connection...");
    client = await pool.connect();
    
    // Test with a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log("✅ Database connected successfully!", result.rows[0]);
    
    return true;
  } catch (error: any) {
    console.error("❌ Database connection failed:", error);
    
    // Log more specific error information
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    const client = await pool.connect();
    // Create password_resets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'PESERTA',
  "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
    `);

    // Create tests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
        "creatorId" VARCHAR(255) NOT NULL,
        "maxAttempts" INTEGER DEFAULT 1,
        "tabLeaveLimit" INTEGER DEFAULT 3,
        "minimumScore" INTEGER DEFAULT 60,
  "availableFrom" TIMESTAMP NOT NULL,
  "availableUntil" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        FOREIGN KEY ("creatorId") REFERENCES users(id)
      )
    `);

    // Create sections table (for grouping questions per test)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        testId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration INTEGER NOT NULL,
        "order" INTEGER NOT NULL,
        autoGrouping BOOLEAN DEFAULT FALSE,
        category VARCHAR(100),
        questionCount INTEGER DEFAULT 10,
        "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        CONSTRAINT fk_sections_test FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        question TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        options TEXT, -- Changed to nullable
        "correctAnswer" VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        explanation TEXT,
        "order" INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,
        "creatorId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        -- TPA specific fields
        kategori VARCHAR(100),
        subkategori VARCHAR(100),
        tipeJawaban VARCHAR(50) DEFAULT 'TEXT',
        gambar VARCHAR(500),
        gambarJawaban TEXT,
        tipeSoal VARCHAR(50) DEFAULT 'PILIHAN_GANDA',
        levelKesulitan VARCHAR(50) DEFAULT 'SEDANG',
        deskripsi TEXT,
        allowMultipleAnswers BOOLEAN DEFAULT FALSE,
        FOREIGN KEY ("creatorId") REFERENCES users(id)
      )
    `);

  // Create test_questions table (junction table for many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_questions (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(255) NOT NULL,
        question_id VARCHAR(255) NOT NULL,
    section_id INTEGER NULL,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        UNIQUE(test_id, question_id),
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      )
    `);

    // Create test_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sessions (
        id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'ONGOING',
  "startTime" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        "endTime" TIMESTAMP NULL,
        score INTEGER DEFAULT 0,
        "maxScore" INTEGER DEFAULT 0,
        "userId" VARCHAR(255) NOT NULL,
        "testId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
  "updatedAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("testId") REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create answers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR(255) PRIMARY KEY,
        "selectedAnswer" VARCHAR(255) NOT NULL,
        "isCorrect" BOOLEAN DEFAULT FALSE,
  "pointsEarned" INTEGER DEFAULT 0,
  "answeredAt" TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        "sessionId" VARCHAR(255) NOT NULL,
        "questionId" VARCHAR(255) NOT NULL,
        FOREIGN KEY ("sessionId") REFERENCES test_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY ("questionId") REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255),
        entity_name VARCHAR(255),
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    client.release();
    console.log("✅ Database tables created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    return false;
  }
}

// Seed initial data
export async function seedDatabase() {
  try {
    const client = await pool.connect();

    // Check if admin user exists
    const adminResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@tpa.com"]
    );

    if (adminResult.rows.length === 0) {
      // Create admin user
      const adminPassword = await bcrypt.hash("admin123", 10);

      await client.query(
        "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
        ["admin-1", "Admin TPA", "admin@tpa.com", adminPassword, "ADMIN"]
      );

      // Create user
      const userPassword = await bcrypt.hash("user123", 10);
      await client.query(
        `INSERT INTO users (
          id, name, email, password, role, nim, fakultas, prodi, tempat_lahir, tanggal_lahir, jenis_kelamin, phone, alamat, agama, angkatan, tahun_masuk
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )`,
        [
          "user-1",
          "Ahmad Fauzi",
          "user@tpa.com",
          userPassword,
          "PESERTA",
          "12345678",
          "Fakultas Teknik",
          "Teknik Informatika",
          "Bandung",
          "2002-01-15",
          "Laki-laki",
          "08123456789",
          "Jl. Merdeka No. 1, Bandung",
          "Islam",
          "2021",
          "2021",
        ]
      );

      // Create test
      await client.query(
        'INSERT INTO tests (id, name, description, duration, "creatorId") VALUES ($1, $2, $3, $4, $5)',
        [
          "test-1",
          "TPA Matematika Dasar",
          "Tes kemampuan matematika dasar untuk masuk universitas",
          60,
          "admin-1",
        ]
      );

      // Create questions
      const questions = [
        {
          id: "q-1",
          question: "Jika 2x + 3 = 11, maka nilai x adalah...",
          type: "MULTIPLE_CHOICE",
          options: JSON.stringify(["3", "4", "5", "6"]),
          correctAnswer: "4",
          category: "MATEMATIKA",
          difficulty: "SEDANG",
          explanation: "2x + 3 = 11 → 2x = 8 → x = 4",
          order: 1,
          points: 1,
          testId: "test-1",
          creatorId: "admin-1",
        },
        {
          id: "q-2",
          question: "Manakah yang merupakan bilangan prima?",
          type: "MULTIPLE_CHOICE",
          options: JSON.stringify(["4", "6", "7", "8"]),
          correctAnswer: "7",
          category: "MATEMATIKA",
          difficulty: "MUDAH",
          explanation:
            "Bilangan prima adalah bilangan yang hanya habis dibagi 1 dan dirinya sendiri. 7 adalah bilangan prima.",
          order: 2,
          points: 1,
          testId: "test-1",
          creatorId: "admin-1",
        },
        {
          id: "q-3",
          question: "Sinonim dari kata 'Cerdas' adalah...",
          type: "MULTIPLE_CHOICE",
          options: JSON.stringify(["Bodoh", "Pintar", "Lambat", "Lemah"]),
          correctAnswer: "Pintar",
          category: "BAHASA_INDONESIA",
          difficulty: "MUDAH",
          explanation: "Cerdas dan pintar memiliki makna yang sama.",
          order: 3,
          points: 1,
          testId: "test-1",
          creatorId: "admin-1",
        },
        {
          id: "q-4",
          question: "Apakah Jakarta adalah ibu kota Indonesia?",
          type: "TRUE_FALSE",
          options: JSON.stringify(["Benar", "Salah"]),
          correctAnswer: "Benar",
          category: "GENERAL_KNOWLEDGE",
          difficulty: "MUDAH",
          explanation: "Jakarta adalah ibu kota Indonesia.",
          order: 4,
          points: 1,
          testId: "test-1",
          creatorId: "admin-1",
        },
        {
          id: "q-5",
          question: "Berapakah akar kuadrat dari 64?",
          type: "MULTIPLE_CHOICE",
          options: JSON.stringify(["6", "7", "8", "9"]),
          correctAnswer: "8",
          category: "MATEMATIKA",
          difficulty: "SEDANG",
          explanation: "8 × 8 = 64, jadi akar kuadrat dari 64 adalah 8.",
          order: 5,
          points: 1,
          testId: "test-1",
          creatorId: "admin-1",
        },
      ];

      for (const question of questions) {
        await client.query(
          'INSERT INTO questions (id, question, type, options, "correctAnswer", category, difficulty, explanation, "order", points, "testId", "creatorId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
          [
            question.id,
            question.question,
            question.type,
            question.options,
            question.correctAnswer,
            question.category,
            question.difficulty,
            question.explanation,
            question.order,
            question.points,
            question.testId,
            question.creatorId,
          ]
        );
      }

      console.log("✅ Database seeded successfully!");
    } else {
      console.log("✅ Database already seeded!");
    }

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return false;
  }
}
export default pool;
