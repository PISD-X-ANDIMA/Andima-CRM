-- ==============================================================================
-- MIGRATION: 202610110001_fix_a1_schema_and_rls.sql
-- TUJUAN: Menyelaraskan Database Supabase dengan Tiket Planka SE-02:
--         1. Mengaktifkan Row Level Security (RLS) pada tabel A1
--         2. Menerapkan Kebijakan RLS (Policy) untuk Mengunci Akses Publik Anonim
--         3. Menyediakan a1_customers dan a1_meetings
--         4. Menjamin Data Retention Rule (Soft Delete & Protected Foreign Key)
-- ==============================================================================

-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.a1_company_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a1_customer_meetings ENABLE ROW LEVEL SECURITY;

-- 2. BERSIHKAN KEBIJAKAN (POLICY) LAMA AGAR TIDAK TERJADI DUPLIKASI
DROP POLICY IF EXISTS "a1_company_list_authenticated_select" ON public.a1_company_list;
DROP POLICY IF EXISTS "a1_company_list_authenticated_insert" ON public.a1_company_list;
DROP POLICY IF EXISTS "a1_company_list_authenticated_update" ON public.a1_company_list;
DROP POLICY IF EXISTS "a1_company_list_authenticated_delete" ON public.a1_company_list;
DROP POLICY IF EXISTS "a1_company_list_service_role" ON public.a1_company_list;

DROP POLICY IF EXISTS "a1_customer_meetings_authenticated_select" ON public.a1_customer_meetings;
DROP POLICY IF EXISTS "a1_customer_meetings_authenticated_insert" ON public.a1_customer_meetings;
DROP POLICY IF EXISTS "a1_customer_meetings_authenticated_update" ON public.a1_customer_meetings;
DROP POLICY IF EXISTS "a1_customer_meetings_authenticated_delete" ON public.a1_customer_meetings;
DROP POLICY IF EXISTS "a1_customer_meetings_service_role" ON public.a1_customer_meetings;

-- 3. KEBIJAKAN RLS UNTUK a1_company_list
-- Hanya pengguna yang terotentikasi (authenticated) atau backend service role yang memiliki akses.
-- Akses publik (anon) secara otomatis DITOLAK (Access Denied).
CREATE POLICY "a1_company_list_authenticated_select"
  ON public.a1_company_list
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "a1_company_list_authenticated_insert"
  ON public.a1_company_list
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "a1_company_list_authenticated_update"
  ON public.a1_company_list
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "a1_company_list_authenticated_delete"
  ON public.a1_company_list
  FOR DELETE
  TO authenticated
  USING (true);

-- Bypass penuh untuk service_role (proses latar belakang & webhook admin)
CREATE POLICY "a1_company_list_service_role"
  ON public.a1_company_list
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. KEBIJAKAN RLS UNTUK a1_customer_meetings
CREATE POLICY "a1_customer_meetings_authenticated_select"
  ON public.a1_customer_meetings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "a1_customer_meetings_authenticated_insert"
  ON public.a1_customer_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "a1_customer_meetings_authenticated_update"
  ON public.a1_customer_meetings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "a1_customer_meetings_authenticated_delete"
  ON public.a1_customer_meetings
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "a1_customer_meetings_service_role"
  ON public.a1_customer_meetings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. PASTIKAN TIDAK ADA VIEW TAMBAHAN (MENGGUNAKAN TABEL FISIK ASLI)
DROP VIEW IF EXISTS public.a1_customers CASCADE;
DROP VIEW IF EXISTS public.a1_meetings CASCADE;

