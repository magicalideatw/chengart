-- Course classes (班別) — one course, many classes
-- Prerequisite: public.courses must exist
-- Run in Supabase SQL Editor BEFORE any sessions migration

-- ── updated_at helper (safe if already created by 002) ───────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── classes table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                          -- 班別名稱，例如 A班、B班
  teacher     TEXT NOT NULL DEFAULT '',               -- 授課老師（選填）
  weekday     TEXT NOT NULL,                          -- 星期，例如 星期二
  start_time  TEXT NOT NULL,                          -- 開始時間，例如 14:00
  end_time    TEXT NOT NULL,                          -- 結束時間，例如 15:30
  capacity    INT NOT NULL DEFAULT 5 CHECK (capacity > 0),  -- 名額
  fee         INT CHECK (fee IS NULL OR fee >= 0),    -- 可覆蓋課程價格（選填）
  is_open     BOOLEAN NOT NULL DEFAULT TRUE,          -- 是否開放
  sort_order  INT NOT NULL DEFAULT 0,                 -- 排序
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS classes_course_id_idx
  ON public.classes (course_id, sort_order);

DROP TRIGGER IF EXISTS classes_set_updated_at ON public.classes;

CREATE TRIGGER classes_set_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_select_public" ON public.classes;
CREATE POLICY "classes_select_public"
  ON public.classes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "classes_insert_authenticated" ON public.classes;
CREATE POLICY "classes_insert_authenticated"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "classes_update_authenticated" ON public.classes;
CREATE POLICY "classes_update_authenticated"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "classes_delete_authenticated" ON public.classes;
CREATE POLICY "classes_delete_authenticated"
  ON public.classes FOR DELETE
  TO authenticated
  USING (true);
