-- Migration: drop legacy columns from users table no longer used by the new profile UI
-- Safe to run multiple times due to IF EXISTS; wrapped in a transaction

BEGIN;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS nim,
  DROP COLUMN IF EXISTS fakultas,
  DROP COLUMN IF EXISTS prodi,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS agama,
  DROP COLUMN IF EXISTS angkatan,
  DROP COLUMN IF EXISTS tahun_masuk;

COMMIT;

-- Notes:
-- - Columns retained by the profile UI and system: id, name, email, password, createdAt, updatedAt,
--   role_id, is_verified, registration_id, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat,
--   asal_sekolah, provinsi_sekolah, jurusan, foto, nik, jenjang
-- - If your code references any of the dropped columns, update API handlers and types accordingly
--   (e.g., remove them from allowedFields and response payloads in app/api/auth/profile/route.ts).
