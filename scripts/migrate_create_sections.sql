-- Migration: create sections table and add sectionId to questions

-- 1. Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  testId VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  "order" INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_test FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
);

-- 2. Add sectionId to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS "sectionId" INTEGER REFERENCES sections(id) ON DELETE SET NULL;

-- 3. (Optional) If you want to backfill existing questions, you can update sectionId manually after migration.
