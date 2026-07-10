-- Session-based registrations should use session capacity, not course capacity
-- Run after 013_registration_sessions.sql

CREATE OR REPLACE FUNCTION public.check_course_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_cap       INT;
  session_remaining INT;
  session_status TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  -- Session enrollment: validate against sessions.remaining_capacity
  IF NEW.session_id IS NOT NULL THEN
    SELECT remaining_capacity, status
      INTO session_remaining, session_status
      FROM public.sessions
     WHERE id = NEW.session_id;

    IF session_remaining IS NULL THEN
      RAISE EXCEPTION 'SESSION_NOT_FOUND';
    END IF;

    IF session_status IS DISTINCT FROM 'open' OR session_remaining <= 0 THEN
      RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    RETURN NEW;
  END IF;

  -- Legacy course-level capacity (single offering without sessions)
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

NOTIFY pgrst, 'reload schema';
