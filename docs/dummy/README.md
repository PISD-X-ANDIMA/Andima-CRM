# Panduan & Dokumentasi Data Dummy — Modul A2: Record Conversation

Folder ini berisi query data dummy terpisah untuk setiap tabel pada modul **A2 — Record Conversation** (termasuk modal REC dan seluruh section panel detail inspeksi lapangan AGT).

---

## Urutan Eksekusi di Supabase SQL Editor

Jalankan query dari file-file di bawah ini secara **berurutan dari 01 sampai 08**:

| No | File Dokumentasi | Tabel Target | Keterangan Data |
|:---:|---|---|---|
| 1 | [01_seed_company_list_expansion.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/01_seed_company_list_expansion.md) | `public.a1_company_list` | 10 perusahaan tambahan agar total menjadi 20 perusahaan lengkap (termasuk DSV & Sinar Logistik). |
| 2 | [02_seed_a2_record_conversations.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/02_seed_a2_record_conversations.md) | `public.a2_record_conversations` | 20 log percakapan realistis (WhatsApp/Meeting, status asisten, urgensi, kesimpulan). |
| 3 | [03_seed_a2_conversation_files.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/03_seed_a2_conversation_files.md) | `public.a2_conversation_files` | 10 file upload lampiran percakapan (.txt / .pdf online aman W3C). |
| 4 | [04_seed_a2_worksheets.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/04_seed_a2_worksheets.md) | `public.a2_worksheets` | 20 data penugasan inspeksi fisik lapangan (MAWB, HAWB, status kendala normal/kritis). |
| 5 | [05_seed_a2_worksheet_physical_items.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/05_seed_a2_worksheet_physical_items.md) | `public.a2_worksheet_physical_items` | 60 item data fisik (3 kartu per worksheet: Coil, Actual Pieces, Gross Weight). |
| 6 | [06_seed_a2_worksheet_photos.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/06_seed_a2_worksheet_photos.md) | `public.a2_worksheet_photos` | 80 foto bukti lapangan (4 foto verifikasi per worksheet, link CDN Unsplash aman CC0). |
| 7 | [07_seed_a2_worksheet_documents.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/07_seed_a2_worksheet_documents.md) | `public.a2_worksheet_documents` | 40 dokumen pendukung lapangan (Packing List & MSDS resmi). |
| 8 | [08_seed_a2_worksheet_checklists.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/dummy/08_seed_a2_worksheet_checklists.md) | `public.a2_worksheet_checklists` | 100 checklist kelayakan kargo terverifikasi (5 item per worksheet). |

---

## Query Pengetesan Relasi Antar Tabel (Testing All JOINs)

Setelah seluruh query 01 sampai 08 dieksekusi, jalankan query berikut untuk memverifikasi bahwa seluruh data dummy terhubung 100% tanpa ada Foreign Key yang lepas:

```sql
-- Uji Koneksi: Percakapan Sales + Nama Perusahaan + Pegawai Pencatat
SELECT 
    c.id AS conversation_id,
    c.channel_type,
    c.conversation_date,
    comp.company_name,
    comp.customer_code,
    e.full_name AS sales_pic,
    c.urgency_level,
    c.need_assistance
FROM public.a2_record_conversations c
JOIN public.a1_company_list comp ON c.customer_id = comp.company_list_id
JOIN public.d3_employee e ON c.sales_pic_id = e.id
ORDER BY c.conversation_date DESC;

-- Uji Koneksi: Worksheet Lapangan + Data Fisik + Foto + Dokumen + Checklist
SELECT 
    w.worksheet_id,
    w.transaction_no,
    w.job_no,
    comp.company_name,
    w.status_kendala,
    count(DISTINCT p.id) AS total_photos,
    count(DISTINCT d.id) AS total_docs,
    count(DISTINCT chk.id) AS total_checklists
FROM public.a2_worksheets w
JOIN public.a1_company_list comp ON w.customer_id = comp.company_list_id
LEFT JOIN public.a2_worksheet_photos p ON w.worksheet_id = p.worksheet_id
LEFT JOIN public.a2_worksheet_documents d ON w.worksheet_id = d.worksheet_id
LEFT JOIN public.a2_worksheet_checklists chk ON w.worksheet_id = chk.worksheet_id
GROUP BY w.worksheet_id, w.transaction_no, w.job_no, comp.company_name, w.status_kendala
ORDER BY w.worksheet_id ASC;
```
