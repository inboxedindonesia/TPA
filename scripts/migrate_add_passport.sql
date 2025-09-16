-- Migration: add passport column to users table
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE public.users
	ADD COLUMN IF NOT EXISTS passport VARCHAR(50);

-- Add comment to describe the column purpose
COMMENT ON COLUMN public.users.passport IS 'User passport number for foreign nationals (WNA)';