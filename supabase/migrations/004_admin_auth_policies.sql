-- Restrict admin mutations to authenticated users (Supabase Auth)
-- Run after 003_courses_admin_policies.sql

DROP POLICY IF EXISTS "courses_insert_public" ON public.courses;
DROP POLICY IF EXISTS "courses_update_public" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_public" ON public.courses;

CREATE POLICY "courses_insert_authenticated"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "courses_update_authenticated"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "courses_delete_authenticated"
  ON public.courses FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "registrations_update_authenticated"
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "registrations_delete_authenticated"
  ON public.registrations FOR DELETE
  TO authenticated
  USING (true);
