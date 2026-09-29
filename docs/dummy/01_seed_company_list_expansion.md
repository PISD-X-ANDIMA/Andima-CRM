# Seed 01: Company List Expansion (10 Perusahaan Tambahan)

> **Tabel Target:** `public.a1_company_list`  
> **Urutan Eksekusi:** **Langkah 1** (Jalankan ini terlebih dahulu jika Anda ingin memiliki 20 data perusahaan lengkap yang selaras dengan UI Andima CRM)  
> **Keterangan:** Menggunakan `ON CONFLICT (company_list_id) DO NOTHING` sehingga aman dijalankan dan tidak menduplikasi data yang sudah ada.

```sql
INSERT INTO public.a1_company_list (
    company_list_id,
    job_number,
    name,
    company_name,
    created_by,
    customer_code
) VALUES 
(
    'f1111111-1111-4111-a111-111111111111',
    'AENAT/2605/2551',
    'Bpk. Hendra Subagyo',
    'PT DSV Transport Indonesia',
    'Adelia',
    'CUST-JKT-0941'
),
(
    'f2222222-2222-4222-a222-222222222222',
    'AENAT/2605/0393',
    'Bpk. Agus Santoso',
    'PT Sinar Logistik',
    'Adelia',
    'CUST-SBY-0418'
),
(
    'f3333333-3333-4333-a333-333333333333',
    'DSVEXP/2605/2551',
    'Ibu Dewi Lestari',
    'PT Samudera Freight Nusantara',
    'Adelia',
    'CUST-MDN-0442'
),
(
    'f4444444-4444-4444-a444-444444444444',
    'AENAT/2606/0220',
    'Bpk. Ridwan Siregar',
    'PT Kargo Global Andalan',
    'Khoirul',
    'CUST-JKT-1029'
),
(
    'f5555555-5555-4555-a555-555555555555',
    'AENAT/2606/0221',
    'Ibu Maya Indriani',
    'PT Trans Megah Maritim',
    'Marsel',
    'CUST-SBY-0512'
),
(
    'f6666666-6666-4666-a666-666666666666',
    'AENAT/2606/0222',
    'Bpk. Anton Hartono',
    'PT Berkah Cargo Pratama',
    'Adelia',
    'CUST-BDG-0319'
),
(
    'f7777777-7777-4777-a777-777777777777',
    'AENAT/2606/0223',
    'Bpk. Bambang Pamungkas',
    'PT Lintas Khatulistiwa Express',
    'Khoirul',
    'CUST-SMG-0821'
),
(
    'f8888888-8888-4888-a888-888888888888',
    'AENAT/2606/0224',
    'Ibu Sarah Amalia',
    'PT Nusantara Ocean Freight',
    'Adelia',
    'CUST-BPN-0614'
),
(
    'f9999999-9999-4999-a999-999999999999',
    'AENAT/2606/0225',
    'Bpk. Denny Wahyudi',
    'CV Multi Jasa Logistik',
    'Marsel',
    'CUST-PLM-0725'
),
(
    'faaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    'AENAT/2606/0226',
    'Ibu Ratna Kumala',
    'PT Pelita Bahari Logistics',
    'Khoirul',
    'CUST-DPS-0911'
)
ON CONFLICT (company_list_id) DO NOTHING;
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_company FROM public.a1_company_list;
```
*(Hasil harus berjumlah 20 baris data)*
