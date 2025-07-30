#!/usr/bin/env node

const {
  initDatabase,
  seedDatabase,
  testConnection,
} = require("./lib/database.ts");

async function setupDatabase() {
  console.log("🚀 Setting up TPA Universitas Database...\n");

  try {
    // Test connection
    console.log("1. Testing database connection...");
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log(
        "❌ Database connection failed. Please check your MySQL setup."
      );
      console.log("\n💡 Troubleshooting:");
      console.log("   1. Install XAMPP: https://www.apachefriends.org/");
      console.log("   2. Start MySQL in XAMPP Control Panel");
      console.log("   3. Create database 'tpa_universitas' in phpMyAdmin");
      console.log("   4. Make sure MySQL is running on localhost:3306");
      process.exit(1);
    }

    // Initialize tables
    console.log("2. Creating database tables...");
    const tablesCreated = await initDatabase();
    if (!tablesCreated) {
      console.log("❌ Failed to create tables.");
      process.exit(1);
    }

    // Seed data
    console.log("3. Seeding initial data...");
    const dataSeeded = await seedDatabase();
    if (!dataSeeded) {
      console.log("❌ Failed to seed data.");
      process.exit(1);
    }

    console.log("\n✅ Database setup completed successfully!");
    console.log("\n📊 Database Info:");
    console.log("   Host: localhost");
    console.log("   Port: 3306");
    console.log("   Database: tpa_universitas");
    console.log("   Username: root");
    console.log("   Password: (empty)");

    console.log("\n🔐 Login Credentials:");
    console.log("   Admin: admin@tpa.com / admin123");
    console.log("   User: user@tpa.com / user123");

    console.log("\n🌐 Access Points:");
    console.log("   Application: http://localhost:3000");
    console.log("   phpMyAdmin: http://localhost/phpmyadmin");

    console.log("\n🚀 Next steps:");
    console.log("   1. Start development server: npm run dev");
    console.log("   2. Open: http://localhost:3000");
    console.log("   3. Login with admin credentials");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
