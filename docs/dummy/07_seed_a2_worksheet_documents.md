# Seed 07: Dokumen Pendukung Lapangan (Packing List & MSDS per Worksheet)

> **Tabel Target:** `public.a2_worksheet_documents`  
> **Urutan Eksekusi:** **Langkah 7**  
> **Relasi Terhubung:**  
> - `worksheet_id` -> mengacu ke ID worksheet (1 s/d 20) di tabel `public.a2_worksheets`  
> - `uploaded_by` -> mengacu ke `public.d3_employee(id)`  
> **Representasi UI:** Menghasilkan 2 baris dokumen (Packing List.pdf dan MSDS.pdf) lengkap dengan badge Verified & Material Safety Sheet pada panel AGT.

```sql
INSERT INTO public.a2_worksheet_documents (
    id,
    worksheet_id,
    doc_name,
    doc_type,
    file_size_kb,
    doc_url,
    doc_description,
    is_verified,
    uploaded_by,
    uploaded_at
)
SELECT 
    gen_random_uuid(),
    w.id,
    d.doc_name,
    d.doc_type,
    d.file_size_kb,
    d.doc_url,
    d.doc_description,
    true,
    e.emp_id,
    NOW()
FROM (
    SELECT id AS emp_id FROM public.d3_employee LIMIT 1
) e
CROSS JOIN (
    SELECT generate_series(1, 20) AS id
) w
CROSS JOIN (
    VALUES
    (
        'Packing List.pdf',
        'PDF',
        1400,
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'Verified'
    ),
    (
        'MSDS.pdf',
        'PDF',
        883,
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'Material Safety Sheet'
    )
) AS d(doc_name, doc_type, file_size_kb, doc_url, doc_description);
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_documents FROM public.a2_worksheet_documents;
```
*(Hasil harus berjumlah 40 baris data: 2 dokumen x 20 worksheet)*
