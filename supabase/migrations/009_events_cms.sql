-- Full events CMS table (replaces event_status_overrides)
-- Run after 008_event_status_overrides.sql

DROP TABLE IF EXISTS public.event_status_overrides;

CREATE TABLE IF NOT EXISTS public.events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     TEXT NOT NULL UNIQUE,
  title                    TEXT NOT NULL,
  subtitle                 TEXT NOT NULL DEFAULT '',
  cover_image              TEXT NOT NULL DEFAULT '',
  event_type               TEXT NOT NULL DEFAULT '活動',
  status                   TEXT NOT NULL DEFAULT '招生中' CHECK (
    status IN ('招生中', '即將開始', '演出中', '已額滿', '已結束')
  ),
  start_date               DATE NOT NULL,
  end_date                 DATE,
  intro                    TEXT NOT NULL DEFAULT '',
  content                  TEXT NOT NULL DEFAULT '',
  show_on_homepage         BOOLEAN NOT NULL DEFAULT false,
  is_featured              BOOLEAN NOT NULL DEFAULT false,
  sort_order               INT NOT NULL DEFAULT 0,
  registration_button_text TEXT NOT NULL DEFAULT '立即報名',
  registration_url         TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_homepage_idx
  ON public.events (show_on_homepage, sort_order);

CREATE INDEX IF NOT EXISTS events_featured_idx
  ON public.events (is_featured, sort_order);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "events_insert_authenticated"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "events_update_authenticated"
  ON public.events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "events_delete_authenticated"
  ON public.events FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO public.events (
  slug,
  title,
  subtitle,
  cover_image,
  event_type,
  status,
  start_date,
  end_date,
  intro,
  show_on_homepage,
  is_featured,
  sort_order
) VALUES
  (
    'magic-kids-2026',
    '2026 魔術小演員兒童成長班',
    '從自信開始，讓孩子勇敢站上舞台。',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80',
    '招生',
    '招生中',
    '2026-09-05',
    NULL,
    '從自信開始，讓孩子勇敢站上舞台。',
    true,
    true,
    1
  ),
  (
    'summer-camp-2026',
    '2026 夏日魔法營',
    '五天密集體驗，探索魔術、戲劇與舞蹈的創意世界。',
    'https://images.unsplash.com/photo-1503099229945-8938207465c0?w=1600&q=80',
    '招生',
    '即將開始',
    '2026-07-15',
    '2026-07-19',
    '五天密集體驗，探索魔術、戲劇與舞蹈的創意世界。',
    true,
    true,
    2
  ),
  (
    'dance-rhythm-2026',
    '舞蹈律動成長班',
    '從身體出發，找到屬於你的節奏與舞台魅力。',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80',
    '招生',
    '招生中',
    '2026-09-10',
    NULL,
    '從身體出發，找到屬於你的節奏與舞台魅力。',
    true,
    false,
    3
  ),
  (
    'adult-improv-2026',
    '成人即興劇場工作坊',
    '釋放創意，在即興中找到屬於你的舞台語言。',
    'https://images.unsplash.com/photo-1507676184292-758854542ecc?w=1600&q=80',
    '工作坊',
    '已結束',
    '2026-06-01',
    '2026-06-30',
    '釋放創意，在即興中找到屬於你的舞台語言。',
    false,
    false,
    4
  )
ON CONFLICT (slug) DO NOTHING;
