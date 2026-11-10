-- Migration: Remove a1_user_access table
-- Access control and CRM roles are now derived directly from b2_register connected to d3_positions.

DROP TRIGGER IF EXISTS trg_a1_user_access_updated_at ON public.a1_user_access;
DROP FUNCTION IF EXISTS public.a1_set_user_access_updated_at();
DROP TABLE IF EXISTS public.a1_user_access CASCADE;
