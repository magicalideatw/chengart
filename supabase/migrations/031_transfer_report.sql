-- ATM bank transfer self-report (customer submits last5 / date / time after remittance)
-- Safe to run if columns were added manually in Supabase dashboard.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transfer_reported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_last5 TEXT,
  ADD COLUMN IF NOT EXISTS transfer_date DATE,
  ADD COLUMN IF NOT EXISTS transfer_time TIME,
  ADD COLUMN IF NOT EXISTS transfer_note TEXT,
  ADD COLUMN IF NOT EXISTS transfer_reported_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_transfer_reported_idx
  ON public.orders (transfer_reported)
  WHERE payment_method = 'bank_transfer';

NOTIFY pgrst, 'reload schema';
