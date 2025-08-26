-- Migration: add maxAttempts to tests table
ALTER TABLE public.tests ADD COLUMN "maxAttempts" integer DEFAULT 1;
