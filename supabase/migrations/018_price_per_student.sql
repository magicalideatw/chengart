-- Per-student pricing for course registration

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS price_per_student INT;

UPDATE public.courses
SET price_per_student = COALESCE(fee, 0)
WHERE price_per_student IS NULL;

ALTER TABLE public.courses
  ALTER COLUMN price_per_student SET DEFAULT 0;

ALTER TABLE public.courses
  ALTER COLUMN price_per_student SET NOT NULL;

NOTIFY pgrst, 'reload schema';
