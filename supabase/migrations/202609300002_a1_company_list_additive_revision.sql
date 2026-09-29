-- ============================================================================
-- MIGRATION: 202609300002_a1_company_list_additive_revision.sql
-- Module: Sales Executive Dashboard & Customer Data Management (Squad A1)
-- Table Utama: public.a1_company_list (Existing)
-- Relasi Baru: public.a1_company_contacts, public.a1_customer_meetings,
--              public.a1_meeting_minutes, public.a1_customer_jobs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function otomatis update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. MODIFIKASI ADDITIVE PADA public.a1_company_list (TIDAK MENGHAPUS KOLOM LAMA)
ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS id UUID;
UPDATE public.a1_company_list SET id = company_list_id WHERE id IS NULL;
ALTER TABLE public.a1_company_list ALTER COLUMN id SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_a1_company_list_id ON public.a1_company_list (id);

ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Alamat belum diatur';
ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.a1_company_list ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_a1_company_list_sales_id ON public.a1_company_list (sales_id);
CREATE INDEX IF NOT EXISTS idx_a1_company_list_company_name ON public.a1_company_list (company_name);
CREATE INDEX IF NOT EXISTS idx_a1_company_list_deleted_at ON public.a1_company_list (deleted_at);

-- Trigger updated_at pada a1_company_list
DROP TRIGGER IF EXISTS trg_a1_company_list_updated_at ON public.a1_company_list;
CREATE TRIGGER trg_a1_company_list_updated_at
BEFORE UPDATE ON public.a1_company_list
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update sales_id untuk 10 data existing yang sudah ada ke sales user pertama
DO $$
DECLARE
    v_first_user UUID;
BEGIN
    SELECT id INTO v_first_user FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF v_first_user IS NOT NULL THEN
        UPDATE public.a1_company_list SET sales_id = v_first_user WHERE sales_id IS NULL;
    END IF;
END $$;

-- 2. TABEL: public.a1_company_contacts (PIC Utama & Tambahan)
CREATE TABLE IF NOT EXISTS public.a1_company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.a1_company_list(company_list_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    position VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_a1_contacts_company_id ON public.a1_company_contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_a1_contacts_deleted_at ON public.a1_company_contacts (deleted_at);

-- Partial Constraint: Satu customer hanya boleh memiliki 1 PIC utama aktif
CREATE UNIQUE INDEX IF NOT EXISTS unique_a1_primary_contact_per_company 
ON public.a1_company_contacts (company_id) 
WHERE is_primary = true AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_a1_company_contacts_updated_at ON public.a1_company_contacts;
CREATE TRIGGER trg_a1_company_contacts_updated_at
BEFORE UPDATE ON public.a1_company_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrasikan data PIC dari kolom `name` pada a1_company_list existing ke a1_company_contacts
INSERT INTO public.a1_company_contacts (company_id, full_name, phone_number, is_primary)
SELECT 
    c.company_list_id,
    COALESCE(c.name, 'PIC Utama'),
    '081234567890',
    true
FROM public.a1_company_list c
WHERE NOT EXISTS (
    SELECT 1 FROM public.a1_company_contacts cc 
    WHERE cc.company_id = c.company_list_id AND cc.is_primary = true
);

-- 3. TABEL: public.a1_customer_meetings (Jadwal Meeting Customer)
CREATE TABLE IF NOT EXISTS public.a1_customer_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.a1_company_list(company_list_id) ON DELETE CASCADE,
    meeting_day VARCHAR(20) NOT NULL CHECK (meeting_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekly', 'one_day')),
    meeting_date DATE NULL,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '10:00:00',
    effective_start_date DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_a1_meetings_company_id ON public.a1_customer_meetings (company_id);
CREATE INDEX IF NOT EXISTS idx_a1_meetings_deleted_at ON public.a1_customer_meetings (deleted_at);

-- Partial Constraint: Satu customer hanya boleh memiliki 1 jadwal meeting aktif
CREATE UNIQUE INDEX IF NOT EXISTS unique_a1_active_meeting_per_company 
ON public.a1_customer_meetings (company_id) 
WHERE is_active = true AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_a1_customer_meetings_updated_at ON public.a1_customer_meetings;
CREATE TRIGGER trg_a1_customer_meetings_updated_at
BEFORE UPDATE ON public.a1_customer_meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. TABEL: public.a1_meeting_minutes (Notulensi - Pendukung KPI 3 & 4)
CREATE TABLE IF NOT EXISTS public.a1_meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NULL REFERENCES public.a1_customer_meetings(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.a1_company_list(company_list_id) ON DELETE CASCADE,
    sales_id UUID NOT NULL REFERENCES auth.users(id),
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_management')),
    sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL: public.a1_customer_jobs (List Job / Task per Customer)
CREATE TABLE IF NOT EXISTS public.a1_customer_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.a1_company_list(company_list_id) ON DELETE CASCADE,
    transaction_no VARCHAR(100) NULL,
    job_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'In Progress',
    agent_id UUID NULL,
    scheduled_date DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_a1_jobs_company_id ON public.a1_customer_jobs (company_id);

-- Migrasikan job_number dan customer_code yang ada di a1_company_list ke a1_customer_jobs
INSERT INTO public.a1_customer_jobs (company_id, transaction_no, job_number, title, status)
SELECT 
    c.company_list_id,
    c.customer_code,
    COALESCE(c.job_number, 'JOB-DEFAULT'),
    'Pengiriman Logistik ' || c.company_name,
    'In Progress'
FROM public.a1_company_list c
WHERE NOT EXISTS (
    SELECT 1 FROM public.a1_customer_jobs j WHERE j.company_id = c.company_list_id
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.a1_company_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a1_company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a1_customer_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a1_meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a1_customer_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy a1_company_list
    DROP POLICY IF EXISTS "a1_company_list_sales_policy" ON public.a1_company_list;
    CREATE POLICY "a1_company_list_sales_policy" ON public.a1_company_list
    FOR ALL TO authenticated
    USING (sales_id = auth.uid() OR sales_id IS NULL)
    WITH CHECK (sales_id = auth.uid());

    -- Policy a1_company_contacts
    DROP POLICY IF EXISTS "a1_company_contacts_sales_policy" ON public.a1_company_contacts;
    CREATE POLICY "a1_company_contacts_sales_policy" ON public.a1_company_contacts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_company_contacts.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_company_contacts.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    );

    -- Policy a1_customer_meetings
    DROP POLICY IF EXISTS "a1_customer_meetings_sales_policy" ON public.a1_customer_meetings;
    CREATE POLICY "a1_customer_meetings_sales_policy" ON public.a1_customer_meetings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_customer_meetings.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_customer_meetings.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    );

    -- Policy a1_customer_jobs
    DROP POLICY IF EXISTS "a1_customer_jobs_sales_policy" ON public.a1_customer_jobs;
    CREATE POLICY "a1_customer_jobs_sales_policy" ON public.a1_customer_jobs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_customer_jobs.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.a1_company_list c 
            WHERE c.company_list_id = a1_customer_jobs.company_id 
              AND (c.sales_id = auth.uid() OR c.sales_id IS NULL)
              AND c.deleted_at IS NULL
        )
    );
END $$;

-- ============================================================================
-- ATOMIC RPC FUNCTION: Create Customer + PIC Utama (Transaction Safe)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_a1_customer_with_pic(
    p_company_name VARCHAR,
    p_address TEXT,
    p_pic_full_name VARCHAR,
    p_pic_phone_number VARCHAR,
    p_pic_position VARCHAR DEFAULT NULL,
    p_pic_email VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sales_id UUID;
    v_company_id UUID;
    v_contact_id UUID;
BEGIN
    v_sales_id := auth.uid();

    -- Cek duplikasi nama customer untuk sales yang sama
    IF EXISTS (
        SELECT 1 FROM public.a1_company_list 
        WHERE (sales_id = v_sales_id OR v_sales_id IS NULL)
          AND LOWER(company_name) = LOWER(p_company_name)
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_COMPANY: Nama perusahaan sudah terdaftar untuk akun Anda';
    END IF;

    -- 1. Insert ke tabel existing public.a1_company_list
    v_company_id := gen_random_uuid();
    INSERT INTO public.a1_company_list (
        company_list_id,
        id,
        company_name,
        name,
        address,
        sales_id,
        created_at,
        updated_at
    ) VALUES (
        v_company_id,
        v_company_id,
        p_company_name,
        p_pic_full_name,
        p_address,
        v_sales_id,
        now(),
        now()
    );

    -- 2. Insert ke tabel relasi public.a1_company_contacts sebagai PIC Utama
    INSERT INTO public.a1_company_contacts (
        company_id,
        full_name,
        phone_number,
        position,
        email,
        is_primary
    ) VALUES (
        v_company_id,
        p_pic_full_name,
        p_pic_phone_number,
        p_pic_position,
        p_pic_email,
        true
    ) RETURNING id INTO v_contact_id;

    RETURN jsonb_build_object(
        'success', true,
        'company_id', v_company_id,
        'contact_id', v_contact_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE; -- Transaction otomatis rollback bila terjadi error
END;
$$;
