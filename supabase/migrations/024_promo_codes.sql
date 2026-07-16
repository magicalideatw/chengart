CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value INT NOT NULL CHECK (discount_value >= 0),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  max_uses_per_person INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, code)
);

CREATE INDEX IF NOT EXISTS promo_codes_course_id_idx
  ON public.promo_codes (course_id);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx
  ON public.promo_codes (code);

CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes (id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_code_redemptions_promo_email_idx
  ON public.promo_code_redemptions (promo_code_id, email);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active promo codes" ON public.promo_codes;
CREATE POLICY "Public can read active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can manage promo redemptions" ON public.promo_code_redemptions;
CREATE POLICY "Authenticated can manage promo redemptions"
  ON public.promo_code_redemptions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service can insert promo redemptions" ON public.promo_code_redemptions;
CREATE POLICY "Service can insert promo redemptions"
  ON public.promo_code_redemptions FOR INSERT
  WITH CHECK (TRUE);

NOTIFY pgrst, 'reload schema';
