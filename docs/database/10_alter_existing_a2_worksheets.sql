-- =========================================================================
-- ANDIMA CRM - ALTER EXISTING SUPABASE SCHEMA (A2 WORKSHEETS EXTENSION)
-- Platform: Supabase (PostgreSQL 15+)
-- Menambahkan fitur Field Agent Tasks, Issue Detail, & Need Backup 
-- langsung ke tabel yang sudah ada: public.a2_worksheets
-- =========================================================================

-- 1. Tambah Kolom Baru ke Tabel a2_worksheets
ALTER TABLE public.a2_worksheets 
  ADD COLUMN IF NOT EXISTS task_id_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS progress_status VARCHAR(50) DEFAULT 'Assigned',
  ADD COLUMN IF NOT EXISTS issue_category VARCHAR(150),
  ADD COLUMN IF NOT EXISTS issue_document_status VARCHAR(150),
  ADD COLUMN IF NOT EXISTS variance_tolerance VARCHAR(50) DEFAULT '0%',
  ADD COLUMN IF NOT EXISTS dispatcher_disposition_notes TEXT;

-- Update data yang sudah ada agar memiliki task_id_code otomatis
UPDATE public.a2_worksheets 
SET task_id_code = 'TSK-2506-' || LPAD(worksheet_id::text, 4, '0')
WHERE task_id_code IS NULL;

-- 2. Tambah Kolom EXIF & Badge ke Tabel a2_worksheet_photos
ALTER TABLE public.a2_worksheet_photos 
  ADD COLUMN IF NOT EXISTS badge_tag VARCHAR(100) DEFAULT 'OPS Stamped',
  ADD COLUMN IF NOT EXISTS is_exif_validated BOOLEAN DEFAULT TRUE;

-- 3. Buat Tabel Baru untuk Tiket Need Backup yang terhubung ke a2_worksheets
CREATE TABLE IF NOT EXISTS public.a2_need_backups (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id      BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    job_no            VARCHAR(50) NOT NULL,
    customer_name     VARCHAR(255) NOT NULL,
    category          VARCHAR(150) NOT NULL,
    priority          VARCHAR(50) NOT NULL DEFAULT 'High / Urgent', -- 'Normal' / 'High / Urgent'
    sla_description   VARCHAR(150) NOT NULL,
    description       TEXT NOT NULL,
    requested_by      VARCHAR(150) NOT NULL DEFAULT 'Adelia',
    status            VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Buat Tabel Baru untuk Timeline & Audit Log yang terhubung ke a2_worksheets
CREATE TABLE IF NOT EXISTS public.a2_worksheet_timelines (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id  BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author        VARCHAR(150) NOT NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexing untuk Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_a2_worksheets_task_code ON public.a2_worksheets(task_id_code);
CREATE INDEX IF NOT EXISTS idx_a2_need_backups_ws ON public.a2_need_backups(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_a2_ws_timelines_ws ON public.a2_worksheet_timelines(worksheet_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.a2_need_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a2_worksheet_timelines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public Read Access for a2_need_backups" ON public.a2_need_backups FOR SELECT USING (true);
  CREATE POLICY "Public Insert/Update for a2_need_backups" ON public.a2_need_backups FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Access for a2_worksheet_timelines" ON public.a2_worksheet_timelines FOR SELECT USING (true);
  CREATE POLICY "Public Insert/Update for a2_worksheet_timelines" ON public.a2_worksheet_timelines FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
