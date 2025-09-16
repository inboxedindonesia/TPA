-- Migration: add test availability period (availableFrom, availableUntil)
-- Idempotent-ish: will error if columns already exist; run once.

ALTER TABLE public.tests
  ADD COLUMN "availableFrom" timestamp without time zone NULL,
  ADD COLUMN "availableUntil" timestamp without time zone NULL;

-- Backfill existing rows to avoid NOT NULL violation (use createdAt as baseline)
UPDATE public.tests
SET "availableFrom" = COALESCE("availableFrom", COALESCE("createdAt", (NOW() AT TIME ZONE 'Asia/Jakarta')));

UPDATE public.tests
SET "availableUntil" = COALESCE(
  "availableUntil",
  (COALESCE("availableFrom", COALESCE("createdAt", (NOW() AT TIME ZONE 'Asia/Jakarta'))) + INTERVAL '365 days')
);

-- Enforce NOT NULL constraints
ALTER TABLE public.tests
  ALTER COLUMN "availableFrom" SET NOT NULL,
  ALTER COLUMN "availableUntil" SET NOT NULL;

-- Optional helpful index for filtering available tests by time window
CREATE INDEX IF NOT EXISTS idx_tests_available_window
  ON public.tests ("availableFrom", "availableUntil");
