ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS activity_status TEXT NOT NULL DEFAULT 'open';

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_activity_status_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_activity_status_check
  CHECK (
    activity_status IN (
      'draft',
      'coming_soon',
      'open',
      'full',
      'closed',
      'finished',
      'archived'
    )
  );

UPDATE public.courses
SET activity_status = CASE
  WHEN is_open THEN 'open'
  ELSE 'closed'
END;

NOTIFY pgrst, 'reload schema';
