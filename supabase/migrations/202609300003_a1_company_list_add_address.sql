-- Add the address field required by TR-A1-001 to the existing A1 customer table.
-- Nullable keeps existing customer records valid until their real addresses are backfilled.
ALTER TABLE public.a1_company_list
  ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN public.a1_company_list.address IS
  'Company address required for newly created A1 customers; legacy rows may be null until backfilled.';
