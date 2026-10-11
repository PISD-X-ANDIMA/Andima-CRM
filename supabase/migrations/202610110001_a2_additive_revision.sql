-- ==============================================================================
-- MIGRATION: 202610110001_a2_additive_revision.sql
-- DESKRIPSI: Migrasi aditif Fase 1 catatan revisi kelompok A2 (Tanpa a1_company_list):
--   1. Tabel pesan lanjutan Sales Executive ke Field Agent (a2_task_followup_messages)
--   2. Ekstensi atribut tiket pada a2_worksheets (Pekerjaan = Tiket)
--   3. Tabel audit log & tanggapan tiket (a2_ticket_audit_logs)
--   4. Kolom pendukung status penyelesaian Need Assistance (a2_record_conversations)
--
-- URUTAN EKSEKUSI:
--   1. Jalankan seluruh skrip ini di Supabase SQL Editor.
--   2. Seluruh transaksi dibungkus BEGIN/COMMIT; kegagalan akan otomatis me-rollback.
--
-- CARA CEK SESUDAHNYA:
--   Jalankan query verifikasi read-only yang disediakan di dokumen laporan
--   untuk memastikan 2 tabel baru, 9 kolom baru, 6 indeks, dan 2 policy telah aktif.
--
-- ATURAN: 100% Aditif. Tidak ada DROP tabel, DROP kolom, atau penghapusan data.
-- ==============================================================================

BEGIN;

-- 1. Tabel Pesan Lanjutan Sales Executive ke Field Agent (Monitoring Task)
CREATE TABLE IF NOT EXISTS public.a2_task_followup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.d3_employee(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('sales_executive', 'management', 'field_agent')),
  message_text TEXT NOT NULL CHECK (length(btrim(message_text)) > 0),
  is_read_by_agent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_a2_followup_worksheet_created
  ON public.a2_task_followup_messages (worksheet_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_a2_followup_unread
  ON public.a2_task_followup_messages (worksheet_id, is_read_by_agent)
  WHERE is_read_by_agent = false;

ALTER TABLE public.a2_task_followup_messages ENABLE ROW LEVEL SECURITY;

-- KNOWN LIMITATION: baca terbuka untuk anon sampai Tahap 3 (login server). Data ini sensitif.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'a2_task_followup_messages' AND policyname = 'a2_followup_messages_select_policy'
  ) THEN
    CREATE POLICY "a2_followup_messages_select_policy"
      ON public.a2_task_followup_messages
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;


-- 2. Ekstensi Atribut Tiket pada a2_worksheets (Pekerjaan = Tiket)
ALTER TABLE public.a2_worksheets
  ADD COLUMN IF NOT EXISTS ticket_priority TEXT DEFAULT 'Normal' CHECK (ticket_priority IN ('Origin', 'Normal', 'Standard', 'Low')),
  ADD COLUMN IF NOT EXISTS ticket_category TEXT DEFAULT 'Others/Lainnya',
  ADD COLUMN IF NOT EXISTS ticket_summary TEXT,
  ADD COLUMN IF NOT EXISTS ticket_status TEXT DEFAULT 'Open' CHECK (ticket_status IN ('Open', 'In Progress', 'Pending Follow-up', 'Resolved')),
  ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.d3_employee(id);

CREATE INDEX IF NOT EXISTS idx_a2_worksheets_ticket_status
  ON public.a2_worksheets (ticket_status);

CREATE INDEX IF NOT EXISTS idx_a2_worksheets_ticket_priority
  ON public.a2_worksheets (ticket_priority);

COMMENT ON COLUMN public.a2_worksheets.ticket_priority IS
  'Tingkat prioritas tiket pekerjaan: Origin, Normal, Standard, Low.';
COMMENT ON COLUMN public.a2_worksheets.ticket_summary IS
  'Ringkasan eskalasi/pekerjaan tiket maksimal 200 kata.';
COMMENT ON COLUMN public.a2_worksheets.ticket_status IS
  'Status siklus hidup tiket: Open, In Progress, Pending Follow-up, Resolved.';


-- 3. Tabel Audit Log & Riwayat Tanggapan Tiket (Auto-update & Histori)
CREATE TABLE IF NOT EXISTS public.a2_ticket_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.d3_employee(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'STATUS_CHANGE', 'NOTE_ADDED', 'ESCALATION', 'RESOLVED'
  previous_status TEXT,
  new_status TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_a2_ticket_audit_worksheet
  ON public.a2_ticket_audit_logs (worksheet_id, created_at DESC);

ALTER TABLE public.a2_ticket_audit_logs ENABLE ROW LEVEL SECURITY;

-- KNOWN LIMITATION: baca terbuka untuk anon sampai Tahap 3 (login server). Data ini sensitif.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'a2_ticket_audit_logs' AND policyname = 'a2_ticket_audit_logs_select_policy'
  ) THEN
    CREATE POLICY "a2_ticket_audit_logs_select_policy"
      ON public.a2_ticket_audit_logs
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;


-- 4. Penanda Resolusi Need Assistance pada Record Conversation
ALTER TABLE public.a2_record_conversations
  ADD COLUMN IF NOT EXISTS assistance_resolved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assistance_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_a2_record_conv_need_assist_active
  ON public.a2_record_conversations (need_assistance, assistance_resolved)
  WHERE need_assistance = true AND assistance_resolved = false;

COMMENT ON COLUMN public.a2_record_conversations.assistance_resolved IS
  'Status apakah permintaan Need Assistance telah ditindaklanjuti/diselesaikan.';

COMMIT;
