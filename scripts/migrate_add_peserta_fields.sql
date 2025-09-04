-- Migration: add peserta biodata fields to users table
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE public.users
	ADD COLUMN IF NOT EXISTS asal_sekolah VARCHAR(255),
	ADD COLUMN IF NOT EXISTS provinsi_sekolah VARCHAR(100),
	ADD COLUMN IF NOT EXISTS jurusan VARCHAR(100),
	ADD COLUMN IF NOT EXISTS foto VARCHAR(255),
	ADD COLUMN IF NOT EXISTS nik VARCHAR(32),
	ADD COLUMN IF NOT EXISTS jenjang VARCHAR(50);

-- Optional: add unique index for NIK if desired (comment out if duplicates are allowed)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE c.relname = 'users_nik_unique_idx' AND n.nspname = 'public'
	) THEN
		CREATE UNIQUE INDEX users_nik_unique_idx ON public.users (nik) WHERE nik IS NOT NULL;
	END IF;
END $$;

