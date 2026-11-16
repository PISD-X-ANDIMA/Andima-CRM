-- Migration: Compatibility views for legacy table names
-- Provides backwards compatibility for clients or modules still referencing old table names.

-- 1. Compatibility view for a1_customer_meetings -> a1_meetings
CREATE OR REPLACE VIEW public.a1_customer_meetings AS
SELECT 
  id,
  customer_id AS company_id,
  customer_id,
  created_by,
  agenda,
  meeting_date,
  start_time,
  end_time,
  meeting_day,
  schedule_type,
  effective_start_date,
  pic_name,
  representative_name,
  meeting_type,
  location,
  meeting_link,
  notes,
  status,
  is_active,
  deleted_at,
  created_at,
  updated_at
FROM public.a1_meetings;

-- 2. Compatibility view for a1_company_list -> a1_customers
CREATE OR REPLACE VIEW public.a1_company_list AS
SELECT 
  id AS company_list_id,
  id,
  company_name,
  address,
  pic_name,
  pic_phone,
  created_by,
  created_by_name,
  deleted_at,
  created_at,
  updated_at
FROM public.a1_customers;

-- 3. Compatibility view for a2_worksheets -> a3_tasks + corp_jobs
CREATE OR REPLACE VIEW public.a2_worksheets AS
SELECT
  t.id AS worksheet_id,
  t.id,
  t.job_id,
  j.job_number AS job_no,
  j.customer_id,
  t.field_agent_id,
  t.status,
  t.issue_description AS status_kendala,
  t.issue_description,
  t.created_at,
  t.updated_at
FROM public.a3_tasks t
LEFT JOIN public.corp_jobs j ON t.job_id = j.id;

-- 4. Compatibility view for a2_need_backups -> a2_record_conversations
CREATE OR REPLACE VIEW public.a2_need_backups AS
SELECT 
  rc.id,
  'BCK-' || UPPER(SUBSTRING(rc.id::text, 1, 8)) AS ticket_id,
  COALESCE(j.job_number, '-') AS job_no,
  c.company_name AS customer_name,
  COALESCE(rc.channel, 'General') AS category,
  'High'::text AS priority,
  'SLA Respon < 4 Jam'::text AS sla_description,
  rc.summary AS description,
  COALESCE(r.full_name, 'Sales Executive') AS requested_by,
  'Open'::text AS status,
  rc.created_at,
  rc.updated_at
FROM public.a2_record_conversations rc
LEFT JOIN public.a1_customers c ON rc.customer_id = c.id
LEFT JOIN public.corp_jobs j ON j.customer_id = c.id
LEFT JOIN public.b2_register r ON rc.created_by = r.id
WHERE rc.need_assist = true;

-- 5. Grant access
GRANT SELECT ON public.a1_customer_meetings TO authenticated, anon;
GRANT SELECT ON public.a1_company_list TO authenticated, anon;
GRANT SELECT ON public.a2_worksheets TO authenticated, anon;
GRANT SELECT ON public.a2_need_backups TO authenticated, anon;

