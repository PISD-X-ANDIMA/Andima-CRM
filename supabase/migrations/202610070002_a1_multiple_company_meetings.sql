-- Allow a company to have multiple active meeting schedules.
-- Keep this migration separate so databases that already ran 202610070001
-- can apply the change without replaying the schema migration.
DROP INDEX IF EXISTS public.uq_a1_customer_meetings_active_company;
DROP INDEX IF EXISTS public.unique_a1_active_meeting_per_company;

CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_company_active_date
  ON public.a1_customer_meetings (company_id, meeting_date, start_time)
  WHERE is_active = true AND deleted_at IS NULL;
