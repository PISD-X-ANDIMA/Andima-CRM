# Seed 03: Conversation Files (Lampiran Upload Percakapan)

> **Tabel Target:** `public.a2_conversation_files`  
> **Urutan Eksekusi:** **Langkah 3**  
> **Relasi Terhubung:**  
> - `conversation_id` -> mengacu ke ID percakapan di `a2_record_conversations`  
> - `uploaded_by` -> mengacu ke `public.d3_employee(id)`  
> **Link File Aman:** Menggunakan file sampel publik standar komunitas W3C & Mozilla (100% aman, bebas malware, format PDF/TXT resmi).

```sql
INSERT INTO public.a2_conversation_files (
    id,
    conversation_id,
    file_name,
    file_type,
    file_url,
    file_size_kb,
    uploaded_by
)
SELECT 
    v.id,
    v.conversation_id,
    v.file_name,
    v.file_type,
    v.file_url,
    v.file_size_kb,
    e.emp_id
FROM (
    SELECT id AS emp_id FROM public.d3_employee LIMIT 1
) e
CROSS JOIN (
    VALUES
    (
        'c0000001-0000-0000-0000-000000000001'::uuid,
        'b0000001-0000-0000-0000-000000000001'::uuid,
        'chat_export_reefer_temp_log.txt',
        'txt',
        'https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js',
        142,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000002'::uuid,
        'b0000001-0000-0000-0000-000000000002'::uuid,
        'MoM_Gate3_Customs_Emergency.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        1250,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000004'::uuid,
        'b0000001-0000-0000-0000-000000000004'::uuid,
        'Special_Handling_Coil_Baja.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        2100,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000006'::uuid,
        'b0000001-0000-0000-0000-000000000006'::uuid,
        'WA_Chat_Vessel_Delay_Notification.txt',
        'txt',
        'https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js',
        98,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000009'::uuid,
        'b0000001-0000-0000-0000-000000000009'::uuid,
        'Claim_Damage_Report_Seal.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        1850,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000011'::uuid,
        'b0000001-0000-0000-0000-000000000011'::uuid,
        'DSV_Priok_Meeting_Minutes_20Sep.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        1400,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000013'::uuid,
        'b0000001-0000-0000-0000-000000000013'::uuid,
        'KITE_Permit_Application_Notes.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        880,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000015'::uuid,
        'b0000001-0000-0000-0000-000000000015'::uuid,
        'Escalation_Log_Jamrud_Terminal.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        2300,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000018'::uuid,
        'b0000001-0000-0000-0000-000000000018'::uuid,
        'Weighbridge_Discrepancy_Balikpapan.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        1650,
        NOW()
    ),
    (
        'c0000001-0000-0000-0000-000000000020'::uuid,
        'b0000001-0000-0000-0000-000000000020'::uuid,
        'Air_Cargo_Manifest_Draft_DPS.pdf',
        'pdf',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        1120,
        NOW()
    )
) AS v(id, conversation_id, file_name, file_type, file_url, file_size_kb, uploaded_at)
ON CONFLICT (id) DO NOTHING;
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_files FROM public.a2_conversation_files;
```
