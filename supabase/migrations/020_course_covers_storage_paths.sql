-- Course covers: storage-only paths (course-covers/filename.ext)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  true,
  31457280,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "course_covers_public_read" ON storage.objects;
CREATE POLICY "course_covers_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-covers');

DROP POLICY IF EXISTS "course_covers_auth_insert" ON storage.objects;
CREATE POLICY "course_covers_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-covers');

DROP POLICY IF EXISTS "course_covers_auth_update" ON storage.objects;
CREATE POLICY "course_covers_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-covers');

DROP POLICY IF EXISTS "course_covers_auth_delete" ON storage.objects;
CREATE POLICY "course_covers_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-covers');

-- Remove legacy external URLs (Unsplash, Bahamut, etc.)
UPDATE public.courses
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND cover_image ~* '^https?://'
  AND cover_image !~* '/storage/v1/object/public/(course-covers|courses)/';

-- Convert existing Supabase public URLs to storage paths
UPDATE public.courses
SET cover_image = regexp_replace(
  cover_image,
  '^https?://[^/]+/storage/v1/object/public/([^/]+)/(.+)$',
  '\1/\2'
)
WHERE cover_image ~* '^https?://.+/storage/v1/object/public/';

NOTIFY pgrst, 'reload schema';
