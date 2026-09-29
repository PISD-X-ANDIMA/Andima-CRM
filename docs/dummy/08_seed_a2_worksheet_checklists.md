# Seed 08: Checklist Centang Kargo (5 Checklist Verified per Worksheet)

> **Tabel Target:** `public.a2_worksheet_checklists`  
> **Urutan Eksekusi:** **Langkah 8**  
> **Relasi Terhubung:**  
> - `worksheet_id` -> mengacu ke ID worksheet (1 s/d 20) di tabel `public.a2_worksheets`  
> - `verified_by` -> mengacu ke `public.d3_employee(id)`  
> **Representasi UI:** Menghasilkan 5 baris checklist conformity (Quantity match, Visual good, Safe for flight, Document conformity, Airline standard) dengan badge hijau Verified pada panel AGT.

```sql
INSERT INTO public.a2_worksheet_checklists (
    id,
    worksheet_id,
    check_label,
    is_verified,
    verified_by,
    verified_at,
    sort_order
)
SELECT 
    gen_random_uuid(),
    w.id,
    c.check_label,
    true,
    e.emp_id,
    '2026-09-20 10:35:00+07'::timestamptz,
    c.sort_order
FROM (
    SELECT id AS emp_id FROM public.d3_employee LIMIT 1
) e
CROSS JOIN (
    SELECT generate_series(1, 20) AS id
) w
CROSS JOIN (
    VALUES
    ('Quantity & weight match', 0),
    ('Visual condition good', 1),
    ('Safe for flight', 2),
    ('Document conformity', 3),
    ('Airline standard conformity', 4)
) AS c(check_label, sort_order);
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_checklists FROM public.a2_worksheet_checklists;
```
*(Hasil harus berjumlah 100 baris data: 5 checklist x 20 worksheet)*
