// Simple CLI to run seedDatabase from database.ts
import { seedDatabase } from "./database";

(async () => {
  await seedDatabase();
  process.exit(0);
})();
