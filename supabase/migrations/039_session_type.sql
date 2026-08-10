-- Session scheduling type: fixed date vs self-scheduled (coordinate after registration)

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'fixed'
    CHECK (session_type IN ('fixed', 'self_scheduled'));

ALTER TABLE public.sessions
  ALTER COLUMN date DROP NOT NULL;

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_course_slot_unique;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_course_fixed_slot_unique
  ON public.sessions (course_id, date, start_time)
  WHERE session_type = 'fixed' AND course_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
