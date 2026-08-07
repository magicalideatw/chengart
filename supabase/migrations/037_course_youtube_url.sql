ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS youtube_url text;

COMMENT ON COLUMN courses.youtube_url IS 'Optional YouTube video URL for course/performance detail page';
