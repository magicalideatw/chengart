-- Order management: order_status, refunded payment status, email send logs

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_status TEXT;

UPDATE public.orders
SET order_status = CASE
  WHEN payment_status = 'paid' THEN 'completed'
  WHEN payment_status = 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END
WHERE order_status IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_status SET DEFAULT 'pending';

UPDATE public.orders
SET order_status = 'pending'
WHERE order_status IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_status SET NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'completed', 'cancelled'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (
    payment_status IN (
      'pending',
      'waiting_transfer',
      'paid',
      'cancelled',
      'refunded'
    )
  );

CREATE TABLE IF NOT EXISTS public.order_email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  event         TEXT NOT NULL,
  recipient     TEXT NOT NULL,
  subject       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_email_logs_order_id_idx
  ON public.order_email_logs (order_id);

CREATE INDEX IF NOT EXISTS order_email_logs_created_at_idx
  ON public.order_email_logs (created_at DESC);

ALTER TABLE public.order_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_email_logs_select_authenticated"
  ON public.order_email_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "order_email_logs_insert_public"
  ON public.order_email_logs FOR INSERT
  WITH CHECK (true);
