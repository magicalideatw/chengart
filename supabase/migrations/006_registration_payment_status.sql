-- Add payment status to registrations & link to orders
-- Run after 005_create_orders.sql

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid'
  CHECK (status IN ('pending', 'paid', 'cancelled'));

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_status_idx ON public.registrations (status);
CREATE INDEX IF NOT EXISTS registrations_order_id_idx ON public.registrations (order_id);

UPDATE public.registrations SET status = 'paid' WHERE status IS NULL;

-- Only paid registrations consume course capacity
CREATE OR REPLACE FUNCTION public.check_course_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_cap       INT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  SELECT capacity
    INTO max_cap
    FROM public.courses
   WHERE id = NEW.course_id;

  IF max_cap IS NULL THEN
    RAISE EXCEPTION 'COURSE_NOT_FOUND';
  END IF;

  SELECT COUNT(*)
    INTO current_count
    FROM public.registrations
   WHERE course_id = NEW.course_id
     AND status = 'paid';

  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'CLASS_FULL';
  END IF;

  RETURN NEW;
END;
$$;
