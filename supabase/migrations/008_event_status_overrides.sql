-- Event status overrides for admin-managed homepage / event pages
-- Run after 007_homepage_announcements.sql

CREATE TABLE IF NOT EXISTS public.event_status_overrides (
  slug        TEXT PRIMARY KEY,
  status      TEXT NOT NULL CHECK (
    status IN ('招生中', '即將開始', '演出中', '已額滿', '已結束')
  ),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_status_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_status_select_public"
  ON public.event_status_overrides FOR SELECT
  USING (true);

CREATE POLICY "event_status_insert_authenticated"
  ON public.event_status_overrides FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "event_status_update_authenticated"
  ON public.event_status_overrides FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "event_status_delete_authenticated"
  ON public.event_status_overrides FOR DELETE
  TO authenticated
  USING (true);
