-- Allow authenticated admins to delete orders and related email logs.
-- Root cause: orders had SELECT/INSERT/UPDATE policies but no DELETE policy,
-- so admin delete flows silently deleted 0 rows under RLS.

DROP POLICY IF EXISTS "orders_delete_authenticated" ON public.orders;
CREATE POLICY "orders_delete_authenticated"
  ON public.orders FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "order_email_logs_delete_authenticated" ON public.order_email_logs;
CREATE POLICY "order_email_logs_delete_authenticated"
  ON public.order_email_logs FOR DELETE
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
