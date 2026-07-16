ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS participation_method TEXT NOT NULL DEFAULT 'internal';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS external_url TEXT;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS action_button_text TEXT NOT NULL DEFAULT '立即報名';

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_participation_method_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_participation_method_check
  CHECK (participation_method IN ('internal', 'external', 'coming_soon'));

NOTIFY pgrst, 'reload schema';
