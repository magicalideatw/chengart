-- Early bird pricing
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS early_bird_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS early_bird_deadline DATE;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS early_bird_discount_type TEXT;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS early_bird_discount_value INT NOT NULL DEFAULT 0;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_early_bird_discount_type_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_early_bird_discount_type_check
  CHECK (
    early_bird_discount_type IS NULL
    OR early_bird_discount_type IN ('fixed', 'percent')
  );

-- Group (multi-student) pricing
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS group_discount_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS group_discount_min_students INT;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS group_discount_type TEXT;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS group_discount_value INT NOT NULL DEFAULT 0;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_group_discount_min_students_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_group_discount_min_students_check
  CHECK (
    group_discount_min_students IS NULL
    OR group_discount_min_students >= 2
  );

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_group_discount_type_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_group_discount_type_check
  CHECK (
    group_discount_type IS NULL
    OR group_discount_type IN ('fixed', 'percent')
  );

NOTIFY pgrst, 'reload schema';
