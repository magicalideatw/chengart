-- Homepage announcements for admin-managed site notices
-- Run after 004_admin_auth_policies.sql

CREATE TABLE IF NOT EXISTS public.homepage_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS homepage_announcements_active_idx
  ON public.homepage_announcements (is_active, sort_order);

ALTER TABLE public.homepage_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_public"
  ON public.homepage_announcements FOR SELECT
  USING (true);

CREATE POLICY "announcements_insert_authenticated"
  ON public.homepage_announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "announcements_update_authenticated"
  ON public.homepage_announcements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "announcements_delete_authenticated"
  ON public.homepage_announcements FOR DELETE
  TO authenticated
  USING (true);
