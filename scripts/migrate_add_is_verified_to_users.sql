-- Migration: add is_verified to users table
ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
