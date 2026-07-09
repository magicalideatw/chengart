-- Allow server-side admin course management via Server Actions (anon key)
-- Run after 002_restructure_courses.sql

CREATE POLICY "courses_insert_public"
  ON public.courses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "courses_update_public"
  ON public.courses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "courses_delete_public"
  ON public.courses FOR DELETE
  USING (true);
