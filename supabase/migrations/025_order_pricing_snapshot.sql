ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal INT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_total INT NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
