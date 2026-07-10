-- Class sessions (每次上課日期) — one class, many session dates
-- Prerequisite: public.classes must exist (011_create_classes.sql)
-- Does NOT modify courses, registrations, or orders

-- ── updated_at helper (safe if already created by 011) ───────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── sessions table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id            UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  start_time          TEXT NOT NULL,
  end_time            TEXT NOT NULL,
  capacity            INT NOT NULL DEFAULT 5 CHECK (capacity > 0),
  remaining_capacity  INT NOT NULL DEFAULT 5 CHECK (remaining_capacity >= 0),
  status              TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'closed', 'cancelled', 'full')
  ),
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sessions_remaining_lte_capacity
    CHECK (remaining_capacity <= capacity),
  CONSTRAINT sessions_class_date_unique
    UNIQUE (class_id, date)
);

CREATE INDEX IF NOT EXISTS sessions_class_id_date_idx
  ON public.sessions (class_id, date);

DROP TRIGGER IF EXISTS sessions_set_updated_at ON public.sessions;

CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_public" ON public.sessions;
CREATE POLICY "sessions_select_public"
  ON public.sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "sessions_insert_authenticated" ON public.sessions;
CREATE POLICY "sessions_insert_authenticated"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_update_authenticated" ON public.sessions;
CREATE POLICY "sessions_update_authenticated"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_delete_authenticated" ON public.sessions;
CREATE POLICY "sessions_delete_authenticated"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (true);
