-- Email notification settings (sender name, admin email, reply-to)
INSERT INTO public.system_settings (key, value)
VALUES (
  'email_settings',
  jsonb_build_object(
    'senderName', '晟心誠藝劇團',
    'adminEmail', '',
    'replyToEmail', ''
  )
)
ON CONFLICT (key) DO NOTHING;
