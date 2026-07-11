-- Payment System 3.0: configurable payment methods per course + system settings

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS allowed_payment_methods JSONB NOT NULL
  DEFAULT '["ecpay"]'::jsonb;

CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (key, value)
VALUES (
  'bank_transfer',
  '{
    "bankName": "台灣銀行",
    "bankCode": "004",
    "accountNumber": "123456789012",
    "accountName": "晟心誠藝劇團",
    "transferDeadlineDays": 3,
    "reminderText": "請完成匯款後保留收據。"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

UPDATE public.orders
SET payment_status = CASE
  WHEN status = 'paid' THEN 'paid'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END
WHERE payment_status IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending';

UPDATE public.orders SET payment_status = 'pending' WHERE payment_status IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'waiting_transfer', 'paid', 'cancelled'));

UPDATE public.orders
SET payment_method = 'ecpay'
WHERE status = 'paid'
  AND (
    payment_method IS NULL
    OR payment_method NOT IN ('free', 'ecpay', 'bank_transfer')
  );

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'waiting_transfer', 'paid', 'failed', 'cancelled'));

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_select_public"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "system_settings_update_authenticated"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_settings_insert_authenticated"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
