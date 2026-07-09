-- Restructure courses into full offerings & link registrations by course_id
-- Run after 001_create_courses_and_registrations.sql

BEGIN;

-- ── tear down old constraints ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS enforce_class_capacity ON public.registrations;

ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_course_slug_fkey;

DROP POLICY IF EXISTS "courses_select_public" ON public.courses;

-- ── replace courses catalog with course offerings ────────────────────────────
ALTER TABLE IF EXISTS public.courses RENAME TO courses_catalog_legacy;

CREATE TABLE public.courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL,
  capacity     INT  NOT NULL DEFAULT 5 CHECK (capacity > 0),
  fee          INT  NOT NULL DEFAULT 0 CHECK (fee >= 0),
  cover_image  TEXT NOT NULL,
  is_open      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX courses_session_date_idx ON public.courses (session_date);
CREATE INDEX courses_is_open_idx ON public.courses (is_open);

-- ── seed initial offerings (from原首頁課程) ───────────────────────────────────
INSERT INTO public.courses (
  title, category, description, session_date, session_time,
  capacity, fee, cover_image, is_open
)
VALUES
  (
    '冬／夏令營',
    '冬夏令營',
    '假期密集體驗，融合魔術、戲劇與舞蹈的跨域藝術探索。',
    (CURRENT_DATE + INTERVAL '14 days')::DATE,
    '09:30–16:30',
    5,
    8800,
    'https://images.unsplash.com/photo-1503099229945-8938207465c0?w=900&q=80',
    TRUE
  ),
  (
    '魔術課',
    '魔術',
    '從基礎手法到舞台呈現，培養觀察力、創意與表演自信。',
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    '10:00–11:30',
    5,
    1200,
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80',
    TRUE
  ),
  (
    '戲劇課',
    '戲劇',
    '透過角色與故事，鍛鍊表達、聆聽與舞台存在感。',
    (CURRENT_DATE + INTERVAL '10 days')::DATE,
    '16:00–17:30',
    5,
    1200,
    'https://images.unsplash.com/photo-1507676184292-758854542ecc?w=900&q=80',
    TRUE
  ),
  (
    '舞蹈課',
    '舞蹈',
    '以身體探索節奏與情感，建立肢體語言與舞台魅力。',
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    '14:00–15:00',
    5,
    1200,
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80',
    TRUE
  );

-- ── migrate registrations ────────────────────────────────────────────────────
ALTER TABLE public.registrations ADD COLUMN course_id UUID;

DELETE FROM public.registrations;

ALTER TABLE public.registrations DROP COLUMN IF EXISTS course_slug;
ALTER TABLE public.registrations DROP COLUMN IF EXISTS session_date;
ALTER TABLE public.registrations DROP COLUMN IF EXISTS class_id;
ALTER TABLE public.registrations DROP COLUMN IF EXISTS class_name;
ALTER TABLE public.registrations DROP COLUMN IF EXISTS class_time;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses (id) ON DELETE RESTRICT;

ALTER TABLE public.registrations
  ALTER COLUMN course_id SET NOT NULL;

DROP INDEX IF EXISTS registrations_class_slot_idx;
CREATE INDEX registrations_course_id_idx ON public.registrations (course_id);

-- ── capacity enforcement per course offering ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_course_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_cap       INT;
BEGIN
  SELECT capacity
    INTO max_cap
    FROM public.courses
   WHERE id = NEW.course_id;

  IF max_cap IS NULL THEN
    RAISE EXCEPTION 'COURSE_NOT_FOUND';
  END IF;

  SELECT COUNT(*)
    INTO current_count
    FROM public.registrations
   WHERE course_id = NEW.course_id;

  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'CLASS_FULL';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_course_capacity ON public.registrations;

CREATE TRIGGER enforce_course_capacity
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_course_capacity();

-- ── updated_at helper ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (true);

-- ── cleanup legacy catalog ───────────────────────────────────────────────────
DROP TABLE IF EXISTS public.courses_catalog_legacy;

COMMIT;
