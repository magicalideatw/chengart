-- Unified Session model: sessions link directly to courses (shared by courses & performances)
-- Backfill from classes; class_id kept nullable for backward compatibility

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS price INT NOT NULL DEFAULT 0 CHECK (price >= 0),
  ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill course_id and class-level fields from classes
UPDATE public.sessions AS s
SET
  course_id = c.course_id,
  name = COALESCE(NULLIF(s.name, ''), c.name),
  price = COALESCE(
    CASE WHEN s.price > 0 THEN s.price ELSE NULL END,
    c.fee,
    0
  ),
  is_open = c.is_open AND s.status = 'open',
  sort_order = c.sort_order
FROM public.classes AS c
WHERE s.class_id = c.id
  AND s.course_id IS NULL;

-- Fallback price from course fee when class fee was null
UPDATE public.sessions AS s
SET price = co.fee
FROM public.courses AS co
WHERE s.course_id = co.id
  AND s.price = 0
  AND co.fee > 0;

ALTER TABLE public.sessions
  ALTER COLUMN class_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS sessions_course_id_sort_idx
  ON public.sessions (course_id, sort_order, date);

-- Replace class-scoped unique with course-scoped (date + start time)
ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_class_date_unique;

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_course_slot_unique;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_course_slot_unique
  UNIQUE (course_id, date, start_time);

NOTIFY pgrst, 'reload schema';
