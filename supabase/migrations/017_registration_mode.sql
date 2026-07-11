-- Course registration mode: adult, parent, or both

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS registration_mode TEXT NOT NULL DEFAULT 'adult';

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_registration_mode_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_registration_mode_check
  CHECK (registration_mode IN ('adult', 'parent', 'both'));

NOTIFY pgrst, 'reload schema';
