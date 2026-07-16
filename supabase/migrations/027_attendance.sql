-- Attendance tracking per session per student

CREATE TABLE IF NOT EXISTS public.attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.students (id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations (id) ON DELETE SET NULL,
  status          TEXT NOT NULL CHECK (
    status IN ('present', 'absent', 'excused', 'late', 'early_leave')
  ),
  note            TEXT,
  marked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_session_student_unique UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS attendance_session_id_idx
  ON public.attendance (session_id);

CREATE INDEX IF NOT EXISTS attendance_student_id_idx
  ON public.attendance (student_id);

CREATE INDEX IF NOT EXISTS attendance_marked_at_idx
  ON public.attendance (marked_at DESC);

DROP TRIGGER IF EXISTS attendance_set_updated_at ON public.attendance;

CREATE TRIGGER attendance_set_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_public" ON public.attendance;
CREATE POLICY "attendance_select_public"
  ON public.attendance FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "attendance_insert_authenticated" ON public.attendance;
CREATE POLICY "attendance_insert_authenticated"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_update_authenticated" ON public.attendance;
CREATE POLICY "attendance_update_authenticated"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_delete_authenticated" ON public.attendance;
CREATE POLICY "attendance_delete_authenticated"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (true);
