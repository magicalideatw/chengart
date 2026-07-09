-- Courses catalog & registration records
-- Run this in Supabase SQL Editor or via Supabase CLI

-- ── courses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  slug                   TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  subtitle               TEXT NOT NULL,
  location               TEXT NOT NULL,
  cover_image            TEXT NOT NULL,
  max_capacity_per_class INT  NOT NULL DEFAULT 5,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── registrations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug   TEXT NOT NULL REFERENCES public.courses (slug) ON DELETE RESTRICT,
  session_date  DATE NOT NULL,
  class_id      TEXT NOT NULL,
  class_name    TEXT NOT NULL,
  class_time    TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  student_name  TEXT NOT NULL,
  student_age   TEXT NOT NULL,
  is_first_time BOOLEAN NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registrations_class_slot_idx
  ON public.registrations (course_slug, session_date, class_id);

-- ── capacity enforcement (max 5 per class slot) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_cap       INT;
BEGIN
  SELECT max_capacity_per_class
    INTO max_cap
    FROM public.courses
   WHERE slug = NEW.course_slug;

  IF max_cap IS NULL THEN
    RAISE EXCEPTION 'COURSE_NOT_FOUND';
  END IF;

  SELECT COUNT(*)
    INTO current_count
    FROM public.registrations
   WHERE course_slug  = NEW.course_slug
     AND session_date = NEW.session_date
     AND class_id     = NEW.class_id;

  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'CLASS_FULL';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_class_capacity ON public.registrations;

CREATE TRIGGER enforce_class_capacity
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_class_capacity();

-- ── seed course catalog ──────────────────────────────────────────────────────
INSERT INTO public.courses (slug, title, subtitle, location, cover_image)
VALUES
  (
    'dance',
    '常態舞蹈課',
    '讓藝術成為生活的一部分，建立自信、律動與舞台魅力。',
    '二階藝術空間',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80'
  ),
  (
    'magic',
    '常態魔術課程',
    '從近景到舞台，用魔術開啟觀察力、創意與表演自信。',
    '二階藝術空間',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80'
  ),
  (
    'drama',
    '常態戲劇課程',
    '透過角色與即興，鍛鍊表達、聆聽與舞台存在感。',
    '二階藝術空間',
    'https://images.unsplash.com/photo-1507676184292-758854542ecc?w=1600&q=80'
  ),
  (
    'camp',
    '2026 夏日魔法營',
    '五天密集體驗，融合魔術、戲劇與舞蹈的跨域藝術探索。',
    '晟心誠藝劇團 台北工作室',
    'https://images.unsplash.com/photo-1503099229945-8938207465c0?w=1600&q=80'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can read courses
CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (true);

-- Anyone can read registration counts (needed for availability)
CREATE POLICY "registrations_select_public"
  ON public.registrations FOR SELECT
  USING (true);

-- Anyone can insert registrations (public signup form)
CREATE POLICY "registrations_insert_public"
  ON public.registrations FOR INSERT
  WITH CHECK (true);
