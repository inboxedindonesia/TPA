-- Migration: add registration_id to users table
ALTER TABLE public.users ADD COLUMN registration_id character varying(30) UNIQUE;
