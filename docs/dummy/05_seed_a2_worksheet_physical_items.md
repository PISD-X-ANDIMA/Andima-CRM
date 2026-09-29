# Seed 05: Data Fisik Barang (3 Kartu per Worksheet: Coil, Pieces, Weight)

> **Tabel Target:** `public.a2_worksheet_physical_items`  
> **Urutan Eksekusi:** **Langkah 5**  
> **Relasi Terhubung:**  
> - `worksheet_id` -> mengacu ke ID worksheet (1 s/d 20) di tabel `public.a2_worksheets`  
> **Representasi UI:** Menghasilkan 3 kartu data fisik kargo pada Panel Detail AGT (JUMLAH COIL, ACTUAL PIECES, GROSS WEIGHT).

```sql
INSERT INTO public.a2_worksheet_physical_items (
    id,
    worksheet_id,
    item_label,
    item_value,
    item_unit,
    sort_order
) VALUES
-- Worksheet 1: Yossava (0209)
(gen_random_uuid(), 1, 'JUMLAH COIL', '8', 'coil', 0),
(gen_random_uuid(), 1, 'ACTUAL PIECES', '8 Pcs', 'pcs', 1),
(gen_random_uuid(), 1, 'GROSS WEIGHT', '1,850 Kg', 'kg', 2),

-- Worksheet 2: Yossava (0211)
(gen_random_uuid(), 2, 'JUMLAH COIL', '15', 'coil', 0),
(gen_random_uuid(), 2, 'ACTUAL PIECES', '15 Pcs', 'pcs', 1),
(gen_random_uuid(), 2, 'GROSS WEIGHT', '3,200 Kg', 'kg', 2),

-- Worksheet 3: Yossava (0212)
(gen_random_uuid(), 3, 'JUMLAH COIL', '4', 'coil', 0),
(gen_random_uuid(), 3, 'ACTUAL PIECES', '24 Pcs', 'pcs', 1),
(gen_random_uuid(), 3, 'GROSS WEIGHT', '950 Kg', 'kg', 2),

-- Worksheet 4: Yossava (0213)
(gen_random_uuid(), 4, 'JUMLAH COIL', '20', 'coil', 0),
(gen_random_uuid(), 4, 'ACTUAL PIECES', '20 Pcs', 'pcs', 1),
(gen_random_uuid(), 4, 'GROSS WEIGHT', '4,800 Kg', 'kg', 2),

-- Worksheet 5: Yossava (0214)
(gen_random_uuid(), 5, 'JUMLAH COIL', '6', 'coil', 0),
(gen_random_uuid(), 5, 'ACTUAL PIECES', '40 Pcs', 'pcs', 1),
(gen_random_uuid(), 5, 'GROSS WEIGHT', '1,120 Kg', 'kg', 2),

-- Worksheet 6: Samudera Bahari (0215)
(gen_random_uuid(), 6, 'JUMLAH COIL', '10', 'coil', 0),
(gen_random_uuid(), 6, 'ACTUAL PIECES', '10 Pcs', 'pcs', 1),
(gen_random_uuid(), 6, 'GROSS WEIGHT', '2,100 Kg', 'kg', 2),

-- Worksheet 7: Sinar Surya (0216)
(gen_random_uuid(), 7, 'JUMLAH COIL', '5', 'coil', 0),
(gen_random_uuid(), 7, 'ACTUAL PIECES', '30 Pcs', 'pcs', 1),
(gen_random_uuid(), 7, 'GROSS WEIGHT', '890 Kg', 'kg', 2),

-- Worksheet 8: Citra Mandiri (0217)
(gen_random_uuid(), 8, 'JUMLAH COIL', '2', 'coil', 0),
(gen_random_uuid(), 8, 'ACTUAL PIECES', '500 Pcs', 'pcs', 1),
(gen_random_uuid(), 8, 'GROSS WEIGHT', '1,450 Kg', 'kg', 2),

-- Worksheet 9: Bintang Nusantara (0218)
(gen_random_uuid(), 9, 'JUMLAH COIL', '14', 'coil', 0),
(gen_random_uuid(), 9, 'ACTUAL PIECES', '14 Pcs', 'pcs', 1),
(gen_random_uuid(), 9, 'GROSS WEIGHT', '2,900 Kg', 'kg', 2),

-- Worksheet 10: Prima Anugerah (0219)
(gen_random_uuid(), 10, 'JUMLAH COIL', '7', 'coil', 0),
(gen_random_uuid(), 10, 'ACTUAL PIECES', '70 Pcs', 'pcs', 1),
(gen_random_uuid(), 10, 'GROSS WEIGHT', '1,680 Kg', 'kg', 2),

-- Worksheet 11: DSV Transport Indonesia (03382 / 2551) - Interface Default Row
(gen_random_uuid(), 11, 'JUMLAH COIL', '12', 'coil', 0),
(gen_random_uuid(), 11, 'ACTUAL PIECES', '12 Pcs', 'pcs', 1),
(gen_random_uuid(), 11, 'GROSS WEIGHT', '2,450 Kg', 'kg', 2),

-- Worksheet 12: Sinar Logistik (03381 / 0393) - Interface Row 2
(gen_random_uuid(), 12, 'JUMLAH COIL', '18', 'coil', 0),
(gen_random_uuid(), 12, 'ACTUAL PIECES', '18 Pcs', 'pcs', 1),
(gen_random_uuid(), 12, 'GROSS WEIGHT', '3,750 Kg', 'kg', 2),

-- Worksheet 13: Samudera Freight (03383)
(gen_random_uuid(), 13, 'JUMLAH COIL', '9', 'coil', 0),
(gen_random_uuid(), 13, 'ACTUAL PIECES', '45 Pcs', 'pcs', 1),
(gen_random_uuid(), 13, 'GROSS WEIGHT', '2,050 Kg', 'kg', 2),

-- Worksheet 14: Kargo Global Andalan (03384)
(gen_random_uuid(), 14, 'JUMLAH COIL', '16', 'coil', 0),
(gen_random_uuid(), 14, 'ACTUAL PIECES', '32 Pcs', 'pcs', 1),
(gen_random_uuid(), 14, 'GROSS WEIGHT', '4,200 Kg', 'kg', 2),

-- Worksheet 15: Trans Megah Maritim (03385)
(gen_random_uuid(), 15, 'JUMLAH COIL', '22', 'coil', 0),
(gen_random_uuid(), 15, 'ACTUAL PIECES', '22 Pcs', 'pcs', 1),
(gen_random_uuid(), 15, 'GROSS WEIGHT', '5,100 Kg', 'kg', 2),

-- Worksheet 16: Berkah Cargo Pratama (03386)
(gen_random_uuid(), 16, 'JUMLAH COIL', '3', 'coil', 0),
(gen_random_uuid(), 16, 'ACTUAL PIECES', '120 Pcs', 'pcs', 1),
(gen_random_uuid(), 16, 'GROSS WEIGHT', '1,320 Kg', 'kg', 2),

-- Worksheet 17: Lintas Khatulistiwa Express (03387)
(gen_random_uuid(), 17, 'JUMLAH COIL', '11', 'coil', 0),
(gen_random_uuid(), 17, 'ACTUAL PIECES', '55 Pcs', 'pcs', 1),
(gen_random_uuid(), 17, 'GROSS WEIGHT', '2,680 Kg', 'kg', 2),

-- Worksheet 18: Nusantara Ocean Freight (03388)
(gen_random_uuid(), 18, 'JUMLAH COIL', '25', 'coil', 0),
(gen_random_uuid(), 18, 'ACTUAL PIECES', '25 Pcs', 'pcs', 1),
(gen_random_uuid(), 18, 'GROSS WEIGHT', '6,350 Kg', 'kg', 2),

-- Worksheet 19: Multi Jasa Logistik (03389)
(gen_random_uuid(), 19, 'JUMLAH COIL', '8', 'coil', 0),
(gen_random_uuid(), 19, 'ACTUAL PIECES', '80 Pcs', 'pcs', 1),
(gen_random_uuid(), 19, 'GROSS WEIGHT', '1,920 Kg', 'kg', 2),

-- Worksheet 20: Pelita Bahari Logistics (03390)
(gen_random_uuid(), 20, 'JUMLAH COIL', '5', 'coil', 0),
(gen_random_uuid(), 20, 'ACTUAL PIECES', '15 Pcs', 'pcs', 1),
(gen_random_uuid(), 20, 'GROSS WEIGHT', '840 Kg', 'kg', 2);
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_items FROM public.a2_worksheet_physical_items;
```
*(Hasil harus berjumlah 60 baris data: 3 kartu x 20 worksheet)*
