-- Fix orders INSERT RLS: allow checkout to create pending / waiting_transfer orders
-- Root cause: 005_create_orders.sql only allowed status = 'pending', but bank transfer
-- inserts status = 'waiting_transfer' (Payment System 3.0 / migration 016).

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ── SELECT (unchanged behaviour) ─────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;
CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "orders_select_public" ON public.orders;
CREATE POLICY "orders_select_public"
  ON public.orders FOR SELECT
  USING (true);

-- ── INSERT (fixed) ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  WITH CHECK (
    status IN ('pending', 'waiting_transfer')
    AND payment_status IN ('pending', 'waiting_transfer')
  );

-- ── UPDATE (unchanged behaviour — fulfill, ECPay callback, admin actions) ───
DROP POLICY IF EXISTS "orders_update_public" ON public.orders;
CREATE POLICY "orders_update_public"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
