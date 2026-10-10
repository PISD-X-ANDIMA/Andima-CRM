-- Table for CRM Tribe A1 Role and User Access Management
CREATE TABLE IF NOT EXISTS public.a1_user_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.b2_register(id) ON DELETE CASCADE,
    crm_role TEXT NOT NULL CHECK (
        crm_role IN (
            'manager_customer_success',
            'sales_executive',
            'field_agent'
        )
    ),
    assigned_by UUID REFERENCES public.b2_register(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_a1_user_access_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_a1_user_access_role ON public.a1_user_access(crm_role);
CREATE INDEX IF NOT EXISTS idx_a1_user_access_assigned_by ON public.a1_user_access(assigned_by);
CREATE INDEX IF NOT EXISTS idx_a1_user_access_is_active ON public.a1_user_access(is_active);

CREATE OR REPLACE FUNCTION public.a1_set_user_access_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a1_user_access_updated_at ON public.a1_user_access;
CREATE TRIGGER trg_a1_user_access_updated_at
BEFORE UPDATE ON public.a1_user_access
FOR EACH ROW EXECUTE FUNCTION public.a1_set_user_access_updated_at();
