-- Course cover images: optional cover_image + Supabase Storage bucket

ALTER TABLE public.courses
  ALTER COLUMN cover_image DROP NOT NULL;

ALTER TABLE public.courses
  ALTER COLUMN cover_image SET DEFAULT NULL;

UPDATE public.courses
SET cover_image = NULL
WHERE cover_image IS NOT NULL AND btrim(cover_image) = '';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'courses',
  'courses',
  true,
  31457280,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "courses_public_read" ON storage.objects;
CREATE POLICY "courses_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'courses');

DROP POLICY IF EXISTS "courses_auth_insert" ON storage.objects;
CREATE POLICY "courses_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'courses');

DROP POLICY IF EXISTS "courses_auth_update" ON storage.objects;
CREATE POLICY "courses_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'courses');

DROP POLICY IF EXISTS "courses_auth_delete" ON storage.objects;
CREATE POLICY "courses_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'courses');

NOTIFY pgrst, 'reload schema';
