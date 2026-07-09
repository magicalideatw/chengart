-- Patch for orders RLS + PostgREST schema reload
-- Run if order creation fails with "schema cache" or permission errors

DO $$
BEGIN
  CREATE POLICY "orders_select_public"
    ON public.orders FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
