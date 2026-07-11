-- Per-course enrollment, payment, and display settings

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_details TEXT NOT NULL DEFAULT '';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS registration_deadline DATE;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS show_remaining_capacity BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS transfer_deadline_days INT;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_transfer_deadline_days_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_transfer_deadline_days_check
  CHECK (transfer_deadline_days IS NULL OR transfer_deadline_days > 0);

NOTIFY pgrst, 'reload schema';
