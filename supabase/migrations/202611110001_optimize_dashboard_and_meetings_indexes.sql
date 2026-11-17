-- ==============================================================================
-- MIGRATION: 202611110001_optimize_dashboard_and_meetings_indexes.sql
-- TIKET: [WebDev] Optimasi Latency Fetch Data Dashboard KPI & Transaksi
-- TUJUAN:
--   1. Menambahkan indeks performa untuk mempercepat kueri agregasi kartu metrik:
--      - a1_company_list (deleted_at, created_by, created_at)
--      - a1_customer_meetings (status, is_active, deleted_at, company_id, meeting_date, start_time)
--      - a2_worksheets (id, created_at)
-- ==============================================================================

-- 1. INDEKS UNTUK a1_company_list
CREATE INDEX IF NOT EXISTS idx_a1_company_list_active_created 
  ON public.a1_company_list (deleted_at, created_by, created_at);

-- 2. INDEKS UNTUK a1_customer_meetings (Dashboard upcoming meetings & calendar lookup)
CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_status_active 
  ON public.a1_customer_meetings (status, is_active, deleted_at, schedule_type, meeting_date, start_time);

CREATE INDEX IF NOT EXISTS idx_a1_customer_meetings_company_lookup 
  ON public.a1_customer_meetings (company_id, is_active, deleted_at);

-- 3. INDEKS UNTUK a2_worksheets
CREATE INDEX IF NOT EXISTS idx_a2_worksheets_worksheet_id 
  ON public.a2_worksheets (worksheet_id);

CREATE INDEX IF NOT EXISTS idx_a2_worksheets_status_date 
  ON public.a2_worksheets (create_date DESC, status_kendala, has_issue);

