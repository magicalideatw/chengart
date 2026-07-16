-- courses.cover_image must allow NULL (no cover upload required).
-- Migration 020 failed on UPDATE ... SET cover_image = NULL while column was still NOT NULL.
-- Safe to run even if 019 already applied DROP NOT NULL.

ALTER TABLE public.courses
  ALTER COLUMN cover_image DROP NOT NULL;

ALTER TABLE public.courses
  ALTER COLUMN cover_image SET DEFAULT NULL;

UPDATE public.courses
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND btrim(cover_image) = '';

-- Data cleanup from 020 (blocked until column is nullable)
UPDATE public.courses
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND cover_image ~* '^https?://'
  AND cover_image !~* '/storage/v1/object/public/(event-covers|course-covers|courses)/';

UPDATE public.courses
SET cover_image = regexp_replace(
  cover_image,
  '^https?://[^/]+/storage/v1/object/public/([^/]+)/(.+)$',
  '\1/\2'
)
WHERE cover_image IS NOT NULL
  AND cover_image ~* '^https?://.+/storage/v1/object/public/';

NOTIFY pgrst, 'reload schema';
