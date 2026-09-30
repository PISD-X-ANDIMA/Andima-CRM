-- ============================================================================
-- SAMPLE AND TEST DATA: a1_company_list
-- ============================================================================
-- Uses only the six columns that existed in the table when this seed was created:
-- 1. company_list_id (UUID)
-- 2. customer_code   (Transaction No: TRX-0626-00112 through TRX-0626-00121)
-- 3. company_name    (PT. YOSSAVA TRANS LOGISTIK, etc.)
-- 4. name            (PIC contact name)
-- 5. job_number      (AENAT/2606/0209 through AENAT/2606/0219)
-- 6. created_by      (Wulan / Eca)
-- ============================================================================

-- 1. Ensure the UUID extension is enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure RLS permits the CRM application to read and write data.
ALTER TABLE public.a1_company_list ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'a1_company_list' AND policyname = 'a1_company_list_select_policy'
    ) THEN
        CREATE POLICY "a1_company_list_select_policy" 
        ON public.a1_company_list 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'a1_company_list' AND policyname = 'a1_company_list_auth_policy'
    ) THEN
        CREATE POLICY "a1_company_list_auth_policy" 
        ON public.a1_company_list 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 3. Insert sample and test data (only the six supported columns).
INSERT INTO public.a1_company_list (
    company_list_id,
    customer_code,
    company_name,
    name,
    job_number,
    created_by
) VALUES
    -- SAMPLE RECORDS supplied by the user.
    (gen_random_uuid(), 'TRX-0626-00112', 'PT. YOSSAVA TRANS LOGISTIK', 'Budi Santoso',   'AENAT/2606/0209', 'Wulan'),
    (gen_random_uuid(), 'TRX-0626-00113', 'PT. YOSSAVA TRANS LOGISTIK', 'Hendra Wijaya',  'AENAT/2606/0211', 'Eca'),
    (gen_random_uuid(), 'TRX-0626-00114', 'PT. YOSSAVA TRANS LOGISTIK', 'Siti Rahma',     'AENAT/2606/0212', 'Wulan'),
    (gen_random_uuid(), 'TRX-0626-00115', 'PT. YOSSAVA TRANS LOGISTIK', 'Dewi Sartika',   'AENAT/2606/0213', 'Eca'),
    (gen_random_uuid(), 'TRX-0626-00116', 'PT. YOSSAVA TRANS LOGISTIK', 'Agus Setiawan',  'AENAT/2606/0214', 'Wulan'),

    -- Additional test records following the same customer and job-number format.
    (gen_random_uuid(), 'TRX-0626-00117', 'PT. SAMUDERA BAHARI LOGISTIK',      'Rian Pratama',    'AENAT/2606/0215', 'Eca'),
    (gen_random_uuid(), 'TRX-0626-00118', 'PT. SINAR SURYA EXPRESS',           'Farhan Maulana',  'AENAT/2606/0216', 'Wulan'),
    (gen_random_uuid(), 'TRX-0626-00119', 'PT. CITRA MANDIRI CARGO',           'Melisa Anggraeni','AENAT/2606/0217', 'Eca'),
    (gen_random_uuid(), 'TRX-0626-00120', 'CV. BINTANG NUSANTARA DISTRIBUSI',   'Dedi Kurniawan',  'AENAT/2606/0218', 'Wulan'),
    (gen_random_uuid(), 'TRX-0626-00121', 'PT. PRIMA ANUGERAH TRANSINDO',      'Rina Marlina',    'AENAT/2606/0219', 'Eca');
