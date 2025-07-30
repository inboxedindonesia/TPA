import { Pool } from "pg";

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tpa_universitas",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    const client = await pool.connect();

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'PESERTA',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        "totalQuestions" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT TRUE,
        "creatorId" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("creatorId") REFERENCES users(id)
      )
    `);

    // Create questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        question TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        options TEXT NOT NULL,
        "correctAnswer" VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        explanation TEXT,
        "order" INTEGER DEFAULT 0,
        points INTEGER DEFAULT 1,
        "testId" VARCHAR(255) NOT NULL,
        "creatorId" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("testId") REFERENCES tests(id) ON DELETE CASCADE,
        FOREIGN KEY ("creatorId") REFERENCES users(id)
      )
    `);

    // Create test_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sessions (
        id VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'ONGOING',
        "startTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "endTime" TIMESTAMP NULL,
        score INTEGER DEFAULT 0,
        "maxScore" INTEGER DEFAULT 0,
        "userId" VARCHAR(255) NOT NULL,
        "testId" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
        "answeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "sessionId" VARCHAR(255) NOT NULL,
        "questionId" VARCHAR(255) NOT NULL,
        FOREIGN KEY ("sessionId") REFERENCES test_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY ("questionId") REFERENCES questions(id) ON DELETE CASCADE
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
      const bcrypt = require("bcryptjs");
      const adminPassword = await bcrypt.hash("admin123", 10);

      await client.query(
        "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
        ["admin-1", "Admin TPA", "admin@tpa.com", adminPassword, "ADMIN"]
      );

      // Create user
      const userPassword = await bcrypt.hash("user123", 10);
      await client.query(
        "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
        ["user-1", "Ahmad Fauzi", "user@tpa.com", userPassword, "PESERTA"]
      );

      // Create test
      await client.query(
        'INSERT INTO tests (id, name, description, duration, "totalQuestions", "creatorId") VALUES ($1, $2, $3, $4, $5, $6)',
        [
          "test-1",
          "TPA Matematika Dasar",
          "Tes kemampuan matematika dasar untuk masuk universitas",
          60,
          5,
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
