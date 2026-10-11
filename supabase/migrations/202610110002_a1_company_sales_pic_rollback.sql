-- PERINGATAN: JANGAN jalankan rollback setelah ada data nyata. DROP COLUMN akan menghapus relasi Sales PIC pada data perusahaan yang sudah diisi.
-- ==============================================================================
-- ROLLBACK MIGRATION: 202610110002_a1_company_sales_pic_rollback.sql
-- DESKRIPSI: Mengembalikan perubahan penambahan kolom sales_pic_id pada a1_company_list
-- ==============================================================================

BEGIN;

DROP INDEX IF EXISTS public.idx_a1_company_list_sales_pic_id;

ALTER TABLE public.a1_company_list
  DROP COLUMN IF EXISTS sales_pic_id;

COMMIT;
