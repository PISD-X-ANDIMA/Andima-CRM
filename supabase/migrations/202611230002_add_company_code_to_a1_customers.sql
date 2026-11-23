-- Migration: Add company_code to a1_customers
-- Description:
-- 1. Adds company_code column (VARCHAR(20))
-- 2. Creates unique index on company_code where not null

ALTER TABLE public.a1_customers 
ADD COLUMN IF NOT EXISTS company_code VARCHAR(20) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_a1_customers_company_code 
ON public.a1_customers (company_code) 
WHERE company_code IS NOT NULL;
