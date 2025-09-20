-- Migration: Add missing columns to sections table
-- This adds autoGrouping, category, and questionCount columns to support auto-grouping functionality

BEGIN;

-- Add autoGrouping column
ALTER TABLE sections ADD COLUMN IF NOT EXISTS autoGrouping BOOLEAN DEFAULT FALSE;

-- Add category column for auto-grouping
ALTER TABLE sections ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add questionCount column for auto-grouping
ALTER TABLE sections ADD COLUMN IF NOT EXISTS questionCount INTEGER DEFAULT 10;

COMMIT;