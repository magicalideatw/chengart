-- Course covers: storage paths use shared event-covers bucket (010_event_covers_storage.sql)
-- Stored as event-covers/filename.ext — no separate course-covers bucket

-- Remove legacy external URLs (Unsplash, Bahamut, etc.)
UPDATE public.courses
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND cover_image ~* '^https?://'
  AND cover_image !~* '/storage/v1/object/public/(event-covers|course-covers|courses)/';

-- Convert existing Supabase public URLs to storage paths
UPDATE public.courses
SET cover_image = regexp_replace(
  cover_image,
  '^https?://[^/]+/storage/v1/object/public/([^/]+)/(.+)$',
  '\1/\2'
)
WHERE cover_image IS NOT NULL
  AND cover_image ~* '^https?://.+/storage/v1/object/public/';

-- Normalize legacy bucket prefixes to event-covers/
UPDATE public.courses
SET cover_image = regexp_replace(
  cover_image,
  '^(course-covers|courses)/',
  'event-covers/'
)
WHERE cover_image IS NOT NULL
  AND cover_image ~ '^(course-covers|courses)/';

NOTIFY pgrst, 'reload schema';
