# Seed 06: Foto Bukti Lapangan (4 Foto Verifikasi per Worksheet)

> **Tabel Target:** `public.a2_worksheet_photos`  
> **Urutan Eksekusi:** **Langkah 6**  
> **Relasi Terhubung:**  
> - `worksheet_id` -> mengacu ke ID worksheet (1 s/d 20) di tabel `public.a2_worksheets`  
> **Link Foto Online Aman:** Menggunakan CDN resmi Unsplash (100% bebas hak cipta / CC0, resolusi optimal, bebas virus, foto logistik dan peti kemas asli).

```sql
INSERT INTO public.a2_worksheet_photos (
    id,
    worksheet_id,
    photo_label,
    photo_status,
    photo_url,
    file_name,
    taken_at,
    is_verified,
    sort_order
)
SELECT 
    gen_random_uuid(),
    w.id,
    p.photo_label,
    p.photo_status,
    p.photo_url,
    p.file_name,
    '2026-09-20 10:32:00+07'::timestamptz,
    true,
    p.sort_order
FROM (
    SELECT generate_series(1, 20) AS id
) w
CROSS JOIN (
    VALUES
    (
        '1. Foto Keseluruhan',
        'OK',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        'DSC_0410.JPG',
        0
    ),
    (
        '2. Marking / Label',
        'Match',
        'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
        'DSC_0411.JPG',
        1
    ),
    (
        '3. Foto Seal',
        'Intact',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
        'DSC_0412.JPG',
        2
    ),
    (
        '4. Area Kerusakan',
        'No damage',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        'DSC_0413.JPG',
        3
    )
) AS p(photo_label, photo_status, photo_url, file_name, sort_order);
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_photos FROM public.a2_worksheet_photos;
```
*(Hasil harus berjumlah 80 baris data: 4 foto x 20 worksheet)*
