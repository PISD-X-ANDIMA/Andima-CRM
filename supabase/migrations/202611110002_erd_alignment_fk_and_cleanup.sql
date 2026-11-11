-- ==============================================================================
-- MIGRATION: 202611110002_erd_alignment_fk_and_cleanup.sql
-- TUJUAN: Menerapkan 100% Skema ERD Baru sesuai docs/workflow_diagram_viewer.html
--         dan menghapus seluruh tabel lama / backup / backfill di luar ERD baru.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. HAPUS STUB VIEW/TABLE LAMA AGAR TIDAK KONFLIK SAAT MEMBUAT TABEL BARU
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.relname AS obj_name, c.relkind AS obj_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm')
      AND c.relname IN ('a1_customers', 'a1_meetings', 'a1_user_access')
  LOOP
    IF rec.obj_kind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', rec.obj_name);
    ELSIF rec.obj_kind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', rec.obj_name);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', rec.obj_name);
    END IF;
  END LOOP;
END $$;

-- 2. BUAT a1_customers & MIGRASI DATA DARI a1_company_list
CREATE TABLE public.a1_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT NULL,
  pic_name TEXT NULL,
  pic_phone TEXT NULL,
  created_by UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
  created_by_name TEXT NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'a1_company_list' AND c.relkind IN ('r', 'p')
  ) THEN
    INSERT INTO public.a1_customers (id, company_name, address, pic_name, pic_phone, created_by, created_by_name, deleted_at, created_at, updated_at)
    SELECT
      c.company_list_id,
      c.company_name,
      c.address,
      c.name,
      c.pic_phone_number,
      (SELECT b.id FROM public.b2_register b WHERE b.id::text = c.created_by OR lower(b.full_name) = lower(c.created_by) LIMIT 1),
      c.created_by,
      c.deleted_at,
      COALESCE(c.created_at, now()),
      COALESCE(c.updated_at, now())
    FROM public.a1_company_list c
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3. BUAT a1_meetings & MIGRASI DATA DARI a1_customer_meetings
CREATE TABLE public.a1_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.a1_customers (id) ON DELETE CASCADE,
  created_by UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
  agenda TEXT NOT NULL,
  meeting_date DATE NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  meeting_day TEXT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'one_day',
  effective_start_date DATE NULL,
  pic_name TEXT NULL,
  representative_name TEXT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'offline',
  location TEXT NULL,
  meeting_link TEXT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'a1_customer_meetings' AND c.relkind IN ('r', 'p')
  ) THEN
    INSERT INTO public.a1_meetings (
      id, customer_id, agenda, meeting_date, start_time, end_time, meeting_day,
      schedule_type, effective_start_date, pic_name, representative_name,
      meeting_type, location, meeting_link, notes, status, is_active, deleted_at, created_at, updated_at
    )
    SELECT
      m.id, m.company_id, m.agenda, m.meeting_date, m.start_time, m.end_time, m.meeting_day,
      m.schedule_type, m.effective_start_date, m.pic_name, m.representative_name,
      m.meeting_type, m.location, m.meeting_link, m.notes, m.status, m.is_active, m.deleted_at, m.created_at, m.updated_at
    FROM public.a1_customer_meetings m
    WHERE EXISTS (SELECT 1 FROM public.a1_customers cust WHERE cust.id = m.company_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 4. SESUAIKAN a2_record_conversations SECARA LANGSUNG (IN-PLACE) SESUAI ERD BARU
DO $$
DECLARE
  con RECORD;
BEGIN
  -- Jika belum ada sama sekali, buat baru
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'a2_record_conversations' AND c.relkind IN ('r', 'p')
  ) THEN
    CREATE TABLE public.a2_record_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES public.a1_customers (id) ON DELETE CASCADE,
      meeting_id UUID NULL REFERENCES public.a1_meetings (id) ON DELETE SET NULL,
      created_by UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
      channel TEXT NOT NULL DEFAULT 'Meeting',
      summary TEXT NOT NULL,
      need_assist BOOLEAN NOT NULL DEFAULT false,
      attachment_url TEXT NULL,
      conversation_date DATE NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );
  ELSE
    -- Lepas constraint FK/CHECK lama agar alter kolom berjalan mulus
    FOR con IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.a2_record_conversations'::regclass
        AND contype IN ('f', 'c')
    LOOP
      EXECUTE format('ALTER TABLE public.a2_record_conversations DROP CONSTRAINT IF EXISTS %I', con.conname);
    END LOOP;

    -- Rename channel_type -> channel dan ubah ke TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'channel_type') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'channel') THEN
        ALTER TABLE public.a2_record_conversations RENAME COLUMN channel_type TO channel;
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'channel') THEN
      ALTER TABLE public.a2_record_conversations ADD COLUMN channel TEXT NOT NULL DEFAULT 'Meeting';
    ELSE
      EXECUTE 'ALTER TABLE public.a2_record_conversations ALTER COLUMN channel TYPE TEXT USING channel::text';
    END IF;

    -- Rename need_assistance -> need_assist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'need_assistance') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'need_assist') THEN
        ALTER TABLE public.a2_record_conversations RENAME COLUMN need_assistance TO need_assist;
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'need_assist') THEN
      ALTER TABLE public.a2_record_conversations ADD COLUMN need_assist BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Pindahkan document_urls[0] -> attachment_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'attachment_url') THEN
      ALTER TABLE public.a2_record_conversations ADD COLUMN attachment_url TEXT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'document_urls') THEN
      EXECUTE 'UPDATE public.a2_record_conversations SET attachment_url = to_jsonb(document_urls)->>0 WHERE document_urls IS NOT NULL AND attachment_url IS NULL';
    END IF;

    -- Tambah meeting_id jika belum ada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'a2_record_conversations' AND column_name = 'meeting_id') THEN
      ALTER TABLE public.a2_record_conversations ADD COLUMN meeting_id UUID NULL;
    END IF;

    -- Hapus kolom lama yang tidak ada di ERD baru
    ALTER TABLE public.a2_record_conversations
      DROP COLUMN IF EXISTS job_number CASCADE,
      DROP COLUMN IF EXISTS customer_code CASCADE,
      DROP COLUMN IF EXISTS sales_pic_id CASCADE,
      DROP COLUMN IF EXISTS urgency_level CASCADE,
      DROP COLUMN IF EXISTS synced_to_ctrack CASCADE,
      DROP COLUMN IF EXISTS document_urls CASCADE,
      DROP COLUMN IF EXISTS status CASCADE;

    -- Bersihkan created_by agar valid berelasi ke b2_register(id)
    EXECUTE 'ALTER TABLE public.a2_record_conversations ALTER COLUMN created_by DROP NOT NULL';
    EXECUTE '
      UPDATE public.a2_record_conversations rc
      SET created_by = NULL
      WHERE created_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.b2_register b WHERE b.id::text = rc.created_by::text)
    ';
    EXECUTE '
      ALTER TABLE public.a2_record_conversations
      ALTER COLUMN created_by TYPE UUID
      USING (CASE WHEN created_by::text ~ ''^[0-9a-fA-F-]{36}$'' THEN created_by::text::uuid ELSE NULL END)
    ';

    -- Pastikan hanya baris dengan customer_id valid yang dipertahankan & pasang FK resmi
    EXECUTE '
      DELETE FROM public.a2_record_conversations rc
      WHERE NOT EXISTS (SELECT 1 FROM public.a1_customers cust WHERE cust.id = rc.customer_id)
    ';

    EXECUTE '
      ALTER TABLE public.a2_record_conversations
        ADD CONSTRAINT fk_a2_conv_customer FOREIGN KEY (customer_id) REFERENCES public.a1_customers (id) ON DELETE CASCADE,
        ADD CONSTRAINT fk_a2_conv_meeting FOREIGN KEY (meeting_id) REFERENCES public.a1_meetings (id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_a2_conv_created_by FOREIGN KEY (created_by) REFERENCES public.b2_register (id) ON DELETE SET NULL
    ';
  END IF;
END $$;

-- 5. BUAT TABEL BARU LAINNYA SESUAI ERD
-- 5a. a2_conversation_alerts (Notifikasi ke Manager jika need_assist = true)
CREATE TABLE IF NOT EXISTS public.a2_conversation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.a2_record_conversations (id) ON DELETE CASCADE,
  manager_id UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed')),
  alerted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  EXECUTE '
    INSERT INTO public.a2_conversation_alerts (conversation_id, status, alerted_at)
    SELECT id, ''Pending'', COALESCE(created_at, now())
    FROM public.a2_record_conversations
    WHERE need_assist = true
    ON CONFLICT (conversation_id) DO NOTHING
  ';
END $$;

-- 5b. corp_jobs (Migrasi dari jobs)
CREATE TABLE IF NOT EXISTS public.corp_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  customer_id UUID NULL REFERENCES public.a1_customers (id) ON DELETE SET NULL,
  origin TEXT NULL,
  destination TEXT NULL,
  job_type TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'jobs' AND c.relkind IN ('r', 'p')
  ) THEN
    INSERT INTO public.corp_jobs (id, job_number, customer_id, destination, job_type, created_at)
    SELECT
      j.id,
      j.job_number,
      CASE WHEN EXISTS (SELECT 1 FROM public.a1_customers cust WHERE cust.id = j.customer_id) THEN j.customer_id ELSE NULL END,
      j.delivery_location,
      j.job_type,
      COALESCE(j.created_at, now())
    FROM public.jobs j
    ON CONFLICT (job_number) DO NOTHING;
  END IF;
END $$;

-- 5c. a3_tasks (Rebuild bersih sesuai ERD baru)
DROP TABLE IF EXISTS public.a3_tasks CASCADE;
CREATE TABLE public.a3_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.corp_jobs (id) ON DELETE CASCADE,
  field_agent_id UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Has Issue')),
  issue_description TEXT NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5d. a3_task_handovers
CREATE TABLE IF NOT EXISTS public.a3_task_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES public.a3_tasks (id) ON DELETE CASCADE,
  latitude NUMERIC NULL,
  longitude NUMERIC NULL,
  actual_weight_kg NUMERIC NULL,
  total_koli INTEGER NULL,
  handover_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5e. a3_task_documents
CREATE TABLE IF NOT EXISTS public.a3_task_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.a3_tasks (id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('4_photos', 'main_doc', 'support_doc', 'msds')),
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5f. a2_field_task_notes
CREATE TABLE IF NOT EXISTS public.a2_field_task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.a3_tasks (id) ON DELETE CASCADE,
  sales_id UUID NULL REFERENCES public.b2_register (id) ON DELETE SET NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. HAPUS SEMUA TABEL LAMA, TABEL BACKUP, & TABEL DI LUAR ERD BARU
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.relname AS obj_name, c.relkind AS obj_kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm')
      AND c.relname NOT IN (
        'b2_register',
        'd3_positions',
        'd3_employee',
        'd3_departments',
        'a1_customers',
        'a1_meetings',
        'a2_record_conversations',
        'a2_conversation_alerts',
        'corp_jobs',
        'a3_tasks',
        'a3_task_handovers',
        'a3_task_documents',
        'a2_field_task_notes'
      )
      AND (
        c.relname LIKE 'a1\_%' ESCAPE '\'
        OR c.relname LIKE 'a2\_%' ESCAPE '\'
        OR c.relname LIKE 'a3\_%' ESCAPE '\'
        OR c.relname IN ('jobs', 'job_handovers', 'job_documentation', 'job_issues', 'job_history', 'job_verifications')
      )
  LOOP
    IF rec.obj_kind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', rec.obj_name);
    ELSIF rec.obj_kind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', rec.obj_name);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', rec.obj_name);
    END IF;
    RAISE NOTICE 'Dihapus (di luar ERD baru): %', rec.obj_name;
  END LOOP;
END $$;

-- 7. INDEKS PERFORMA UNTUK SEMUA TABEL ERD BARU
CREATE INDEX IF NOT EXISTS idx_a1_customers_active ON public.a1_customers (deleted_at, created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_a1_meetings_customer ON public.a1_meetings (customer_id, status, is_active, deleted_at);
DO $$
BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_a2_conv_customer ON public.a2_record_conversations (customer_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_a2_conv_meeting ON public.a2_record_conversations (meeting_id)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_a2_conv_assist ON public.a2_record_conversations (need_assist) WHERE need_assist = true';
END $$;
CREATE INDEX IF NOT EXISTS idx_a2_alerts_status ON public.a2_conversation_alerts (status, alerted_at DESC);
CREATE INDEX IF NOT EXISTS idx_a3_tasks_job ON public.a3_tasks (job_id, status);
CREATE INDEX IF NOT EXISTS idx_a3_docs_task ON public.a3_task_documents (task_id);
CREATE INDEX IF NOT EXISTS idx_a2_notes_task ON public.a2_field_task_notes (task_id);

-- 8. KEBIJAKAN ROW-LEVEL SECURITY (RLS) UNTUK 9 TABEL ERD BARU
DO $$
DECLARE
  tbl TEXT;
  erd_tables TEXT[] := ARRAY[
    'a1_customers',
    'a1_meetings',
    'a2_record_conversations',
    'a2_conversation_alerts',
    'corp_jobs',
    'a3_tasks',
    'a3_task_handovers',
    'a3_task_documents',
    'a2_field_task_notes'
  ];
BEGIN
  FOREACH tbl IN ARRAY erd_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_authenticated_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_service_role_all', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl || '_authenticated_all', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl || '_service_role_all', tbl
    );
  END LOOP;
END $$;
