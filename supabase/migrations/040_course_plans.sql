-- Course plans for self-scheduled courses (package name, session count, price)

CREATE TABLE IF NOT EXISTS public.course_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  session_count INT NOT NULL CHECK (session_count > 0),
  price INT NOT NULL DEFAULT 0 CHECK (price >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_plans_course_id_sort_idx
  ON public.course_plans (course_id, sort_order);

DROP TRIGGER IF EXISTS course_plans_set_updated_at ON public.course_plans;
CREATE TRIGGER course_plans_set_updated_at
  BEFORE UPDATE ON public.course_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.course_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active course plans" ON public.course_plans;
CREATE POLICY "Public can read active course plans"
  ON public.course_plans FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage course plans" ON public.course_plans;
CREATE POLICY "Authenticated can manage course plans"
  ON public.course_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
