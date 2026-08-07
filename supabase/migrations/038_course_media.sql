-- Extensible course/performance media (YouTube first; Vimeo/MP4 reserved)
CREATE TABLE IF NOT EXISTS public.course_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'youtube',
  title TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_media_media_type_check
    CHECK (media_type IN ('youtube', 'vimeo', 'mp4'))
);

CREATE INDEX IF NOT EXISTS course_media_course_id_idx
  ON public.course_media (course_id);

CREATE INDEX IF NOT EXISTS course_media_course_sort_idx
  ON public.course_media (course_id, sort_order);

-- Migrate legacy single YouTube URL column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'courses'
      AND column_name = 'youtube_url'
  ) THEN
    INSERT INTO public.course_media (
      course_id,
      media_type,
      title,
      source_url,
      sort_order,
      is_visible
    )
    SELECT
      id,
      'youtube',
      '課程介紹影片',
      youtube_url,
      0,
      TRUE
    FROM public.courses
    WHERE youtube_url IS NOT NULL
      AND btrim(youtube_url) <> '';

    ALTER TABLE public.courses DROP COLUMN IF EXISTS youtube_url;
  END IF;
END $$;

ALTER TABLE public.course_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read visible course media" ON public.course_media;
CREATE POLICY "Public can read visible course media"
  ON public.course_media FOR SELECT
  USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage course media" ON public.course_media;
CREATE POLICY "Authenticated can manage course media"
  ON public.course_media FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
