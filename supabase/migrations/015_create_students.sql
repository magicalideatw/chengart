-- Students table: one order can have many students
-- Run after 014_registration_session_capacity.sql

CREATE TABLE IF NOT EXISTS public.students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  student_name  TEXT NOT NULL,
  student_age   TEXT NOT NULL,
  gender        TEXT,
  is_first_time BOOLEAN NOT NULL DEFAULT false,
  note          TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_order_id_idx ON public.students (order_id);

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_student_id_idx
  ON public.registrations (student_id);

-- Migrate legacy: Order -> Registration(s) becomes Order -> Student -> Registration(s)
INSERT INTO public.students (
  order_id,
  student_name,
  student_age,
  is_first_time,
  note,
  sort_order,
  created_at
)
SELECT DISTINCT ON (r.order_id)
  r.order_id,
  r.student_name,
  r.student_age,
  r.is_first_time,
  r.note,
  0,
  r.created_at
FROM public.registrations r
WHERE r.order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.order_id = r.order_id
  )
ORDER BY r.order_id, r.created_at ASC;

UPDATE public.registrations r
SET student_id = s.id
FROM public.students s
WHERE r.order_id = s.order_id
  AND r.student_id IS NULL;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_public"
  ON public.students FOR SELECT
  USING (true);

CREATE POLICY "students_insert_public"
  ON public.students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "students_update_authenticated"
  ON public.students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "students_delete_authenticated"
  ON public.students FOR DELETE
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
