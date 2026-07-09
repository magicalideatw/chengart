-- Orders for ECPay course registration payments
-- Run after 004_admin_auth_policies.sql

CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_trade_no  TEXT NOT NULL UNIQUE,
  course_id          UUID NOT NULL REFERENCES public.courses (id) ON DELETE RESTRICT,
  course_title       TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  amount             INT  NOT NULL CHECK (amount >= 0),
  payment_method     TEXT,
  ecpay_trade_no     TEXT,
  registration_id    UUID REFERENCES public.registrations (id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL,
  phone              TEXT NOT NULL,
  form_data          JSONB NOT NULL,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_course_id_idx ON public.orders (course_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_merchant_trade_no_idx ON public.orders (merchant_trade_no);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

-- Checkout page & payment callback need to read pending orders (anon / no session)
CREATE POLICY "orders_select_public"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  WITH CHECK (status = 'pending');

CREATE POLICY "orders_update_public"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);
