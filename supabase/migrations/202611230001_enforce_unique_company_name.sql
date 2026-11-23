-- Migration: Enforce Single Unique Active Company Name on a1_customers
-- Description:
-- 1. Deletes any orphaned/redundant soft-deleted duplicate customer rows
-- 2. Enforces uniqueness across active company names (case-insensitive & trimmed spaces)
--    so that a company can never exist more than once in the database.

-- 1. Purge redundant soft-deleted duplicate rows where an active row already exists
DELETE FROM public.a1_customers
WHERE deleted_at IS NOT NULL
  AND lower(trim(regexp_replace(company_name, '\s+', ' ', 'g'))) IN (
    SELECT lower(trim(regexp_replace(company_name, '\s+', ' ', 'g')))
    FROM public.a1_customers
    WHERE deleted_at IS NULL
  );

-- 2. Create partial unique index on active companies
CREATE UNIQUE INDEX IF NOT EXISTS uq_a1_customers_active_company_name
ON public.a1_customers (lower(trim(regexp_replace(company_name, '\s+', ' ', 'g'))))
WHERE deleted_at IS NULL;
