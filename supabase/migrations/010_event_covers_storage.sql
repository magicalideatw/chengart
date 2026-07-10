-- Supabase Storage bucket for event cover images
-- Run after 009_events_cms.sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_covers_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');

CREATE POLICY "event_covers_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-covers');

CREATE POLICY "event_covers_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-covers');

CREATE POLICY "event_covers_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-covers');
