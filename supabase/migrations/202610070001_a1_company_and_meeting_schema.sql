-- A1 Company List and Meeting Schedule schema for the existing shared company table.
-- Additive migration: preserves all seven existing a1_company_list columns and rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT company_list_id
    FROM public.a1_company_list
    GROUP BY company_list_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add A1 meeting relations: duplicate company_list_id values exist.';
  END IF;
END $$;

ALTER TABLE public.a1_company_list
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.a1_company_list
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

CREATE OR REPLACE FUNCTION public.a1_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a1_company_list_updated_at ON public.a1_company_list;
CREATE TRIGGER trg_a1_company_list_updated_at
BEFORE UPDATE ON public.a1_company_list
FOR EACH ROW EXECUTE FUNCTION public.a1_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_a1_company_list_deleted_at
  ON public.a1_company_list (deleted_at);

-- Guarantee the legacy UUID used by both new foreign keys is unique.
CREATE UNIQUE INDEX IF NOT EXISTS uq_a1_company_list_company_list_id
  ON public.a1_company_list (company_list_id);

-- PIC is one-per-company and is stored in the existing a1_company_list.name column.

-- A company may have multiple active one-time or weekly meeting schedules.
CREATE TABLE IF NOT EXISTS public.a1_customer_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.a1_company_list(company_list_id) ON DELETE CASCADE,
  meeting_day TEXT NOT NULL CHECK (meeting_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one_day', 'weekly')),
  meeting_date DATE NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_start_date DATE NULL,
  agenda TEXT NOT NULL CHECK (length(btrim(agenda)) > 0),
  pic_name TEXT NOT NULL CHECK (length(btrim(pic_name)) > 0),
  representative_name TEXT NOT NULL CHECK (length(btrim(representative_name)) > 0),
  meeting_type TEXT NOT NULL DEFAULT 'offline' CHECK (meeting_type IN ('offline', 'online')),
  location TEXT NULL,
  meeting_link TEXT NULL,
  notes TEXT NULL CHECK (notes IS NULL OR length(notes) <= 500),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT a1_customer_meetings_time_order CHECK (end_time > start_time),
  CONSTRAINT a1_customer_meetings_frequency_date CHECK (
    (schedule_type = 'one_day' AND meeting_date IS NOT NULL)
    OR (schedule_type = 'weekly' AND effective_start_date IS NOT NULL)
  ),
  CONSTRAINT a1_customer_meetings_location_or_link CHECK (
    (meeting_type = 'offline' AND location IS NOT NULL AND length(btrim(location)) > 0)
    OR (meeting_type = 'online' AND meeting_link IS NOT NULL AND length(btrim(meeting_link)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_company_id
  ON public.a1_customer_meetings (company_id);
CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_date
  ON public.a1_customer_meetings (meeting_date, meeting_day)
  WHERE is_active = true AND deleted_at IS NULL;
-- Remove the legacy one-active-meeting-per-company index if an earlier A1 migration created it.
DROP INDEX IF EXISTS public.uq_a1_customer_meetings_active_company;
DROP INDEX IF EXISTS public.unique_a1_active_meeting_per_company;

DROP TRIGGER IF EXISTS trg_a1_customer_meetings_updated_at ON public.a1_customer_meetings;
CREATE TRIGGER trg_a1_customer_meetings_updated_at
BEFORE UPDATE ON public.a1_customer_meetings
FOR EACH ROW EXECUTE FUNCTION public.a1_set_updated_at();
