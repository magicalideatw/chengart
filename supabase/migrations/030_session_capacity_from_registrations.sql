-- Derive session capacity from paid registrations instead of sessions.remaining_capacity.
-- Prerequisite: 012_create_sessions.sql, 013 (registrations.session_id), 014, 015
--
-- sessions has class_id (not course_id). There is no registration_sessions table;
-- each registrations row with session_id consumes one seat on that session.

CREATE OR REPLACE FUNCTION public.session_paid_enrollment_count(p_session_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT
    FROM public.registrations
   WHERE session_id = p_session_id
     AND status = 'paid';
$$;

CREATE OR REPLACE FUNCTION public.check_course_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_cap       INT;
  session_status TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  -- Session enrollment: count paid registrations for this session
  IF NEW.session_id IS NOT NULL THEN
    SELECT capacity, status
      INTO max_cap, session_status
      FROM public.sessions
     WHERE id = NEW.session_id;

    IF max_cap IS NULL THEN
      RAISE EXCEPTION 'SESSION_NOT_FOUND';
    END IF;

    IF session_status IN ('cancelled', 'closed') THEN
      RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    SELECT public.session_paid_enrollment_count(NEW.session_id)
      INTO current_count;

    IF current_count >= max_cap THEN
      RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    RETURN NEW;
  END IF;

  -- Legacy course-level capacity (registrations without session_id)
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

CREATE OR REPLACE FUNCTION public.sync_session_status_from_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sid UUID;
  enrolled INT;
  cap INT;
  cur_status TEXT;
BEGIN
  sid := COALESCE(NEW.session_id, OLD.session_id);
  IF sid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT capacity, status
    INTO cap, cur_status
    FROM public.sessions
   WHERE id = sid;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF cur_status IN ('cancelled', 'closed') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  enrolled := public.session_paid_enrollment_count(sid);

  UPDATE public.sessions
     SET status = CASE
           WHEN enrolled >= cap THEN 'full'
           ELSE 'open'
         END,
         updated_at = NOW()
   WHERE id = sid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_session_enrollment ON public.registrations;

CREATE TRIGGER sync_session_enrollment
  AFTER INSERT OR DELETE OR UPDATE OF session_id, status
  ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_session_status_from_enrollment();

NOTIFY pgrst, 'reload schema';
