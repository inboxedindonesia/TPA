-- Migration: add nationality column to users table
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE public.users
	ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);

-- Add comment to describe the column purpose
COMMENT ON COLUMN public.users.nationality IS 'User nationality (WNI/WNA)';