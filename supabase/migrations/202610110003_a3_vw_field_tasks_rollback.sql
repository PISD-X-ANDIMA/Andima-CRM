-- ROLLBACK DEFINISI ASLI VIEW vw_field_tasks
-- PERINGATAN: JANGAN DIJALANKAN (Hanya proposal untuk ditinjau oleh pemilik proyek)
-- Mengembalikan definisi view vw_field_tasks ke kondisi asli sebelum revisi (32 kolom)

BEGIN;

DROP VIEW IF EXISTS public.vw_field_tasks;

CREATE VIEW public.vw_field_tasks
WITH (security_invoker = true) AS
WITH latest_handover AS (
    SELECT DISTINCT ON (job_number)
        job_number,
        delivering_party,
        receiving_party,
        location AS handover_location,
        created_at AS handover_datetime
    FROM public.a3_handovers
    ORDER BY job_number, created_at DESC
),
latest_verification AS (
    SELECT DISTINCT ON (job_number)
        job_number,
        created_at AS field_verified_at
    FROM public.a3_verifications
    ORDER BY job_number, created_at DESC
),
issue_agg AS (
    SELECT
        job_number,
        COUNT(*) AS open_issues_count,
        (ARRAY_AGG(category ORDER BY created_at DESC))[1] AS latest_issue_category,
        (ARRAY_AGG(description ORDER BY created_at DESC))[1] AS latest_issue_note
    FROM public.a3_field_issues
    WHERE status = 'Open'
    GROUP BY job_number
)
SELECT
    w.worksheet_id,
    w.transaction_no,
    w.job_no,
    w.customer_id,
    w.created_by_user_id,
    w.create_date,
    CASE
        WHEN (COALESCE(ia.open_issues_count, 0) > 0 OR COALESCE(w.has_issue, false) = true OR w.status_kendala = 'kendala_terdeteksi')
            THEN 'kendala_terdeteksi'
        ELSE COALESCE(w.status_kendala, 'normal')
    END AS status_kendala,
    w.field_agent_id,
    w.sales_pic_id,
    w.shipper,
    w.consignee,
    w.mawb,
    w.hawb,
    COALESCE(lh.handover_datetime, w.handover_datetime) AS handover_datetime,
    COALESCE(lh.handover_location, w.handover_location) AS handover_location,
    COALESCE(lh.delivering_party, w.pihak_penyerah) AS pihak_penyerah,
    COALESCE(lh.receiving_party, w.pihak_penerima) AS pihak_penerima,
    COALESCE(w.is_dangerous_goods, false) AS is_dangerous_goods,
    w.special_handling,
    (COALESCE(ia.open_issues_count, 0) > 0 OR COALESCE(w.has_issue, false) = true OR w.status_kendala = 'kendala_terdeteksi') AS has_issue,
    COALESCE(ia.latest_issue_note, w.issue_note) AS issue_note,
    COALESCE(ia.latest_issue_category, w.issue_category) AS issue_category,
    COALESCE(w.is_exported_pdf, false) AS is_exported_pdf,
    w.updated_at,
    w.conversation_id,
    CASE
        WHEN (COALESCE(ia.open_issues_count, 0) > 0 OR COALESCE(w.has_issue, false) = true OR w.status_kendala = 'kendala_terdeteksi')
            THEN 'Has Issue'
        WHEN lh.job_number IS NOT NULL
            THEN 'In Progress'
        WHEN w.field_agent_id IS NOT NULL
            THEN 'Assigned'
        ELSE 'Draft'
    END AS field_status,
    CASE
        WHEN lh.job_number IS NOT NULL
            THEN 'In Progress'
        WHEN w.field_agent_id IS NOT NULL
            THEN 'Assigned'
        ELSE 'Draft'
    END AS field_stage,
    lv.field_verified_at,
    COALESCE(ia.open_issues_count, 0)::bigint AS open_issues_count,
    c.company_name AS customer_name,
    fa.full_name AS field_agent_name,
    sp.full_name AS sales_pic_name
FROM public.a2_worksheets w
LEFT JOIN latest_handover lh ON lh.job_number = w.job_no
LEFT JOIN latest_verification lv ON lv.job_number = w.job_no
LEFT JOIN issue_agg ia ON ia.job_number = w.job_no
LEFT JOIN public.a1_company_list c ON c.company_list_id = w.customer_id
LEFT JOIN public.d3_employee fa ON fa.id = w.field_agent_id
LEFT JOIN public.d3_employee sp ON sp.id = w.sales_pic_id;

COMMIT;
