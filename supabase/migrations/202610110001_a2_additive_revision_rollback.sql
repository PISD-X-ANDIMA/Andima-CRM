-- PERINGATAN: JANGAN jalankan rollback setelah ada data nyata. DROP akan menghapus pesan follow-up, log audit tiket, dan data tiket yang sudah diisi.
-- ==============================================================================
-- ROLLBACK MIGRATION: 202610110001_a2_additive_revision_rollback.sql
-- DESKRIPSI: Mengembalikan perubahan skema migrasi aditif Fase 1 secara aman
-- ATURAN: Hanya membatalkan penambahan kolom & tabel baru tanpa merusak data legacy.
-- ==============================================================================

BEGIN;

-- 4. Rollback kolom resolusi Need Assistance pada a2_record_conversations
DROP INDEX IF EXISTS public.idx_a2_record_conv_need_assist_active;
ALTER TABLE public.a2_record_conversations
  DROP COLUMN IF EXISTS assistance_resolved,
  DROP COLUMN IF EXISTS assistance_notes;

-- 3. Rollback tabel audit log tiket
DROP TABLE IF EXISTS public.a2_ticket_audit_logs CASCADE;

-- 2. Rollback kolom ekstensi tiket pada a2_worksheets
DROP INDEX IF EXISTS public.idx_a2_worksheets_ticket_status;
DROP INDEX IF EXISTS public.idx_a2_worksheets_ticket_priority;
ALTER TABLE public.a2_worksheets
  DROP COLUMN IF EXISTS ticket_priority,
  DROP COLUMN IF EXISTS ticket_category,
  DROP COLUMN IF EXISTS ticket_summary,
  DROP COLUMN IF EXISTS ticket_status,
  DROP COLUMN IF EXISTS follow_up_notes,
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS resolved_by;

-- 1. Rollback tabel pesan lanjutan follow-up
DROP TABLE IF EXISTS public.a2_task_followup_messages CASCADE;

COMMIT;
