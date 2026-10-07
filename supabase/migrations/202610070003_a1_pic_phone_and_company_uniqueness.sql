-- Store the manually entered company PIC phone and prevent adding duplicate
-- active companies. Existing duplicate company rows are preserved; the guard
-- only prevents new duplicates and renames/restores that would add another.
ALTER TABLE public.a1_company_list
  ADD COLUMN IF NOT EXISTS pic_phone_number TEXT NULL;

ALTER TABLE public.a1_company_list
  DROP CONSTRAINT IF EXISTS a1_company_list_pic_phone_number_format;

ALTER TABLE public.a1_company_list
  ADD CONSTRAINT a1_company_list_pic_phone_number_format CHECK (
    pic_phone_number IS NULL
    OR pic_phone_number ~ '^[+0-9][+0-9 ().-]{5,19}$'
  );

CREATE OR REPLACE FUNCTION public.a1_prevent_duplicate_active_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_name TEXT := lower(btrim(NEW.company_name));
BEGIN
  IF TG_OP = 'UPDATE'
    AND lower(btrim(OLD.company_name)) = normalized_name
    AND ((OLD.deleted_at IS NULL) = (NEW.deleted_at IS NULL)) THEN
    RETURN NEW;
  END IF;

  IF NEW.deleted_at IS NULL THEN
    -- Serialize inserts/renames for the same normalized name to close the
    -- concurrent-request race left by an application-only duplicate check.
    PERFORM pg_advisory_xact_lock(hashtextextended(normalized_name, 0));
    IF EXISTS (
      SELECT 1
      FROM public.a1_company_list company
      WHERE lower(btrim(company.company_name)) = normalized_name
        AND company.deleted_at IS NULL
        AND company.company_list_id IS DISTINCT FROM NEW.company_list_id
    ) THEN
      RAISE EXCEPTION 'An active company with this name already exists.'
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
