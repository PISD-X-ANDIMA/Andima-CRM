-- ==============================================================================
-- MIGRATION: 202610110002_a1_company_sales_pic.sql
-- DESKRIPSI: Migrasi aditif terpisah untuk penanda Sales Executive penanggung jawab
--            perusahaan pada tabel a1_company_list (Menunggu persetujuan Squad A1).
--
-- URUTAN EKSEKUSI:
--   1. Eksekusi file ini HANYA setelah ada kesepakatan lintas squad dengan Squad A1.
--   2. Seluruh transaksi dibungkus BEGIN/COMMIT; kegagalan akan otomatis me-rollback.
--
-- CARA CEK SESUDAHNYA:
--   SELECT column_name, data_type 
--   FROM information_schema.columns 
--   WHERE table_schema = 'public' 
--     AND table_name = 'a1_company_list' 
--     AND column_name = 'sales_pic_id';
--
-- ATURAN: 100% Aditif. Tidak ada DROP tabel, DROP kolom, atau penghapusan data.
-- ==============================================================================

BEGIN;

-- Penanda Sales Executive Penanggung Jawab Perusahaan
ALTER TABLE public.a1_company_list
  ADD COLUMN IF NOT EXISTS sales_pic_id UUID REFERENCES public.d3_employee(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_a1_company_list_sales_pic_id
  ON public.a1_company_list (sales_pic_id);

COMMENT ON COLUMN public.a1_company_list.sales_pic_id IS
  'Sales Executive (d3_employee) yang bertanggung jawab menangani perusahaan ini.';

COMMIT;
