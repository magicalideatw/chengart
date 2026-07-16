ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'course';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS activity_rules TEXT NOT NULL DEFAULT '';

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_activity_type_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_activity_type_check
  CHECK (activity_type IN ('course', 'performance'));

CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_types_course_id_idx
  ON public.ticket_types (course_id);

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active ticket types" ON public.ticket_types;
CREATE POLICY "Public can read active ticket types"
  ON public.ticket_types FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage ticket types" ON public.ticket_types;
CREATE POLICY "Authenticated can manage ticket types"
  ON public.ticket_types FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
