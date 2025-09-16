-- Migration: add API DB column to users table for integration
-- Safe to run multiple times due to IF NOT EXISTS

ALTER TABLE public.users
	ADD COLUMN IF NOT EXISTS api_db_id VARCHAR(255);

-- Optional: add index for API DB ID for better performance
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE c.relname = 'users_api_db_id_idx' AND n.nspname = 'public'
	) THEN
		CREATE INDEX users_api_db_id_idx ON public.users (api_db_id) WHERE api_db_id IS NOT NULL;
	END IF;
END $$;

-- Add comment to describe the column purpose
COMMENT ON COLUMN public.users.api_db_id IS 'External API database identifier for integration purposes';