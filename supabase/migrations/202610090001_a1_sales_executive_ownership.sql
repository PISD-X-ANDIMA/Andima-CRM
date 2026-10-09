-- Align A1 customer visibility and duplicate rules with the Sales Executive
-- ownership requirement. Unmatched legacy rows remain unassigned and must be
-- mapped to their actual owner before they are visible to an authenticated user.

ALTER TABLE public.a1_company_list
  ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_a1_company_list_sales_id
  ON public.a1_company_list (sales_id);

-- Backfill only when one registered profile matches created_by exactly by name.
-- Ambiguous or unmatched records are deliberately left NULL for manual mapping.
DO $$
BEGIN
  IF to_regclass('public.b2_register') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'b2_register' AND column_name = 'full_name'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'b2_register' AND column_name = 'id'
    ) THEN
    EXECUTE $sql$
      UPDATE public.a1_company_list AS company
      SET sales_id = matched.user_id
      FROM LATERAL (
        SELECT MIN(profile.id::text)::uuid AS user_id
        FROM public.b2_register AS profile
        WHERE lower(btrim(profile.full_name)) = lower(btrim(company.created_by))
        HAVING COUNT(DISTINCT profile.id) = 1
      ) AS matched
      WHERE company.sales_id IS NULL
        AND matched.user_id IS NOT NULL
    $sql$;
  END IF;
END $$;

-- A customer name may be reused by different executives, but not duplicated
-- within the same executive's active customer list.
CREATE OR REPLACE FUNCTION public.a1_prevent_duplicate_active_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_name TEXT := lower(btrim(NEW.company_name));
  owner_key TEXT := coalesce(NEW.sales_id::text, 'unassigned');
BEGIN
  IF TG_OP = 'UPDATE'
    AND lower(btrim(OLD.company_name)) = normalized_name
    AND OLD.sales_id IS NOT DISTINCT FROM NEW.sales_id
    AND ((OLD.deleted_at IS NULL) = (NEW.deleted_at IS NULL)) THEN
    RETURN NEW;
  END IF;

  IF NEW.deleted_at IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(owner_key || ':' || normalized_name, 0));
    IF EXISTS (
      SELECT 1
      FROM public.a1_company_list AS company
      WHERE lower(btrim(company.company_name)) = normalized_name
        AND company.sales_id IS NOT DISTINCT FROM NEW.sales_id
        AND company.deleted_at IS NULL
        AND company.company_list_id IS DISTINCT FROM NEW.company_list_id
    ) THEN
      RAISE EXCEPTION 'An active company with this name already exists for this Sales Executive.'
        USING ERRCODE = '23505', CONSTRAINT = 'a1_company_list_unique_active_company_name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a1_prevent_duplicate_active_company ON public.a1_company_list;
CREATE TRIGGER trg_a1_prevent_duplicate_active_company
BEFORE INSERT OR UPDATE ON public.a1_company_list
FOR EACH ROW EXECUTE FUNCTION public.a1_prevent_duplicate_active_company();

ALTER TABLE public.a1_company_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "a1_company_list_sales_policy" ON public.a1_company_list;
CREATE POLICY "a1_company_list_sales_policy" ON public.a1_company_list
  FOR ALL TO authenticated
  USING (sales_id = auth.uid())
  WITH CHECK (sales_id = auth.uid());

ALTER TABLE public.a1_customer_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "a1_customer_meetings_sales_policy" ON public.a1_customer_meetings;
CREATE POLICY "a1_customer_meetings_sales_policy" ON public.a1_customer_meetings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.a1_company_list AS company
      WHERE company.company_list_id = a1_customer_meetings.company_id
        AND company.sales_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.a1_company_list AS company
      WHERE company.company_list_id = a1_customer_meetings.company_id
        AND company.sales_id = auth.uid()
    )
  );
