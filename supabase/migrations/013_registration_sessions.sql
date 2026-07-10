-- Link registrations to sessions for multi-date enrollment
-- Prerequisite: 011_create_classes.sql, 012_create_sessions.sql
-- Does NOT modify courses, orders, or ECPay integration

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS registrations_session_id_idx
  ON public.registrations (session_id);

CREATE INDEX IF NOT EXISTS registrations_order_id_idx
  ON public.registrations (order_id);

NOTIFY pgrst, 'reload schema';
