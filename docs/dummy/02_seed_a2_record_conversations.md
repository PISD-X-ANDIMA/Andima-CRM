# Seed 02: Record Conversations (20 Data Percakapan Realistis)

> **Tabel Target:** `public.a2_record_conversations`  
> **Urutan Eksekusi:** **Langkah 2**  
> **Relasi Terhubung:**  
> - `customer_id` -> mengacu ke `a1_company_list(company_list_id)` (10 ID eksisting + 10 ID ekspansi)  
> - `sales_pic_id` & `created_by` -> mengacu dinamis ke `(SELECT id FROM public.d3_employee LIMIT 1)` agar 100% bebas dari error FK violation.

```sql
INSERT INTO public.a2_record_conversations (
    id,
    job_number,
    customer_id,
    customer_code,
    sales_pic_id,
    channel_type,
    conversation_date,
    summary,
    need_assistance,
    urgency_level,
    synced_to_ctrack,
    document_urls,
    status,
    created_by
)
SELECT 
    v.id,
    v.job_number,
    v.customer_id,
    v.customer_code,
    e.emp_id,
    v.channel_type,
    v.conversation_date,
    v.summary,
    v.need_assistance,
    v.urgency_level,
    v.synced_to_ctrack,
    v.document_urls,
    v.status,
    e.emp_id
FROM (
    SELECT id AS emp_id FROM public.d3_employee LIMIT 1
) e
CROSS JOIN (
    VALUES 
    -- 1. PT. YOSSAVA TRANS LOGISTIK (Job 0209)
    (
        'b0000001-0000-0000-0000-000000000001'::uuid,
        'AENAT/2606/0209',
        'a98b5048-49f1-49a2-832b-9f1191aae258'::uuid,
        'TRX-0626-00112',
        'WhatsApp',
        '2026-09-14'::date,
        'Koordinasi bersama Pak Budi Santoso mengenai penanganan kargo dingin (reefer cargo). Klien meminta update status peti kemas sebelum pukul 15:00 WIB.',
        false,
        'average',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 2. PT. YOSSAVA TRANS LOGISTIK (Job 0211)
    (
        'b0000001-0000-0000-0000-000000000002'::uuid,
        'AENAT/2606/0211',
        'dc568388-9d87-479d-a1c7-d5c0c3d88d20'::uuid,
        'TRX-0626-00113',
        'Meeting',
        '2026-09-15'::date,
        'Weekly Sync meeting dengan Pak Hendra Wijaya perihal kendala antrean di Gate 3 Priok. Butuh bantuan tim customs clearance segera untuk percepatan dokumen manifest.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 3. PT. YOSSAVA TRANS LOGISTIK (Job 0212)
    (
        'b0000001-0000-0000-0000-000000000003'::uuid,
        'AENAT/2606/0212',
        '4ee01193-5baa-4536-af6a-a06470ad584f'::uuid,
        'TRX-0626-00114',
        'WhatsApp',
        '2026-09-16'::date,
        'Ibu Siti Rahma menanyakan dokumen sertifikasi fumigasi pallet ekspor. Dokumen sudah diverifikasi oleh tim inspektur lapangan.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 4. PT. YOSSAVA TRANS LOGISTIK (Job 0213)
    (
        'b0000001-0000-0000-0000-000000000004'::uuid,
        'AENAT/2606/0213',
        '88ea967b-c618-455f-afd4-b30604d75d67'::uuid,
        'TRX-0626-00115',
        'Meeting',
        '2026-09-17'::date,
        'Diskusi penyesuaian jadwal muat kontainer ekspor baja coil. Membutuhkan verifikasi fisik cepat dan pendampingan alat berat fork-lift kapasitas 15 ton.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 5. PT. YOSSAVA TRANS LOGISTIK (Job 0214)
    (
        'b0000001-0000-0000-0000-000000000005'::uuid,
        'AENAT/2606/0214',
        '532b7fe8-fc32-4412-b18c-db76d2857bf4'::uuid,
        'TRX-0626-00116',
        'WhatsApp',
        '2026-09-18'::date,
        'Konfirmasi penerimaan invoice pengiriman Surabaya - Tanjung Priok oleh Pak Agus Setiawan. Tidak ada kendala operasional.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 6. PT. SAMUDERA BAHARI LOGISTIK (Job 0215)
    (
        'b0000001-0000-0000-0000-000000000006'::uuid,
        'AENAT/2606/0215',
        '9f1d90b5-7bab-4055-888d-136c24a0503a'::uuid,
        'TRX-0626-00117',
        'WhatsApp',
        '2026-09-19'::date,
        'Pak Rian Pratama melaporkan adanya potensi keterlambatan feeder vessel dari Pontianak. Butuh koordinasi slot penumpukan di dermaga 102.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 7. PT. SINAR SURYA EXPRESS (Job 0216)
    (
        'b0000001-0000-0000-0000-000000000007'::uuid,
        'AENAT/2606/0216',
        '9f28d20c-87ff-4ef8-a34e-7701759fd949'::uuid,
        'TRX-0626-00118',
        'Meeting',
        '2026-09-19'::date,
        'Review rute angkutan darat Jawa - Bali bersama Pak Farhan Maulana. Jadwal pengiriman berjalan normal sesuai estimasi waktu tiba (ETA).',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 8. PT. CITRA MANDIRI CARGO (Job 0217)
    (
        'b0000001-0000-0000-0000-000000000008'::uuid,
        'AENAT/2606/0217',
        'b822219c-e91d-4caf-bb34-fad9bf3d11fa'::uuid,
        'TRX-0626-00119',
        'WhatsApp',
        '2026-09-20'::date,
        'Ibu Melisa Anggraeni meminta konfirmasi ketersediaan dry container 40ft High Cube untuk komoditas garmen tujuan Amerika Serikat.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 9. CV. BINTANG NUSANTARA DISTRIBUSI (Job 0218)
    (
        'b0000001-0000-0000-0000-000000000009'::uuid,
        'AENAT/2606/0218',
        'e566cdee-3416-4adb-a634-5ba7a07d6bb4'::uuid,
        'TRX-0626-00120',
        'Meeting',
        '2026-09-20'::date,
        'Penyampaian keluhan segel kontainer rusak ringan saat perjalanan dari Cikarang Dry Port. Membutuhkan verifikasi bersama tim asuransi kargo.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 10. PT. PRIMA ANUGERAH TRANSINDO (Job 0219)
    (
        'b0000001-0000-0000-0000-000000000010'::uuid,
        'AENAT/2606/0219',
        'ed1c9d5e-081a-4f2c-bb56-59131ba06628'::uuid,
        'TRX-0626-00121',
        'WhatsApp',
        '2026-09-20'::date,
        'Koordinasi pengambilan Delivery Order (DO) pelabuhan dengan Ibu Rina Marlina. Proses billing lancar tanpa kendala.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 11. PT DSV Transport Indonesia (Job 2551) - Interface Demo Row 1
    (
        'b0000001-0000-0000-0000-000000000011'::uuid,
        'AENAT/2605/2551',
        'f1111111-1111-4111-a111-111111111111'::uuid,
        'CUST-JKT-0941',
        'Meeting',
        '2026-09-20'::date,
        'Diskusi bersama Bpk. Hendra Subagyo (DSV) mengenai kepastian jadwal kontainer di Gate 3 Priok. Membutuhkan verifikasi fisik cepat dan pendampingan customs clearance untuk mencegah denda demurrage.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 12. PT Sinar Logistik (Job 0393) - Interface Demo Row 2
    (
        'b0000001-0000-0000-0000-000000000012'::uuid,
        'AENAT/2605/0393',
        'f2222222-2222-4222-a222-222222222222'::uuid,
        'CUST-SBY-0418',
        'WhatsApp',
        '2026-09-19'::date,
        'Follow up rutin bersama Bpk. Agus Santoso mengenai status pengiriman kargo spare parts mesin Surabaya ke Priok. Pengiriman tiba aman.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 13. PT Samudera Freight Nusantara (Job 2551-DSV)
    (
        'b0000001-0000-0000-0000-000000000013'::uuid,
        'DSVEXP/2605/2551',
        'f3333333-3333-4333-a333-333333333333'::uuid,
        'CUST-MDN-0442',
        'Meeting',
        '2026-09-21'::date,
        'Pembahasan permohonan fasilitas kemudahan impor tujuan ekspor (KITE). Perlu koordinasi dengan pihak bea cukai Belawan.',
        false,
        'average',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 14. PT Kargo Global Andalan
    (
        'b0000001-0000-0000-0000-000000000014'::uuid,
        'AENAT/2606/0220',
        'f4444444-4444-4444-a444-444444444444'::uuid,
        'CUST-JKT-1029',
        'WhatsApp',
        '2026-09-21'::date,
        'Penetapan jadwal stuffing muatan bahan kimia industri di Cikarang. Klien menyertakan Material Safety Data Sheet (MSDS).',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 15. PT Trans Megah Maritim
    (
        'b0000001-0000-0000-0000-000000000015'::uuid,
        'AENAT/2606/0221',
        'f5555555-5555-4555-a555-555555555555'::uuid,
        'CUST-SBY-0512',
        'Meeting',
        '2026-09-21'::date,
        'Eskalasi kendala crane macet di dermaga Jamrud Surabaya. Kargo tertahan 6 jam, tim sales meminta intervensi dispatcher pelabuhan.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 16. PT Berkah Cargo Pratama
    (
        'b0000001-0000-0000-0000-000000000016'::uuid,
        'AENAT/2606/0222',
        'f6666666-6666-4666-a666-666666666666'::uuid,
        'CUST-BDG-0319',
        'WhatsApp',
        '2026-09-22'::date,
        'Pemberitahuan perubahan waktu kedatangan armada truk trailer di gudang konsolidasi Bandung.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 17. PT Lintas Khatulistiwa Express
    (
        'b0000001-0000-0000-0000-000000000017'::uuid,
        'AENAT/2606/0223',
        'f7777777-7777-4777-a777-777777777777'::uuid,
        'CUST-SMG-0821',
        'WhatsApp',
        '2026-09-22'::date,
        'Diskusi tarif kontrak baru rute Semarang - Makassar untuk komoditas pangan olahan Q4 2026.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 18. PT Nusantara Ocean Freight
    (
        'b0000001-0000-0000-0000-000000000018'::uuid,
        'AENAT/2606/0224',
        'f8888888-8888-4888-a888-888888888888'::uuid,
        'CUST-BPN-0614',
        'Meeting',
        '2026-09-23'::date,
        'Klarifikasi discrepancy berat kargo alat berat tambang di Balikpapan Kariangau. Butuh penimbangan ulang di jembatan timbang resmi.',
        true,
        'high_priority',
        true,
        ARRAY['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']::text[],
        'active'
    ),
    -- 19. CV Multi Jasa Logistik
    (
        'b0000001-0000-0000-0000-000000000019'::uuid,
        'AENAT/2606/0225',
        'f9999999-9999-4999-a999-999999999999'::uuid,
        'CUST-PLM-0725',
        'WhatsApp',
        '2026-09-23'::date,
        'Pengecekan nomor segel pelayaran untuk 2 unit kontainer karet reefer tujuan Palembang - Singapura.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    ),
    -- 20. PT Pelita Bahari Logistics
    (
        'b0000001-0000-0000-0000-000000000020'::uuid,
        'AENAT/2606/0226',
        'faaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'::uuid,
        'CUST-DPS-0911',
        'Meeting',
        '2026-09-23'::date,
        'Koordinasi pengiriman kargo pameran kerajinan Bali ke Eropa via jalur udara (Air Freight). Pembahasan airway bill dan batas waktu closing.',
        false,
        'average',
        true,
        NULL::text[],
        'active'
    )
) AS v(id, job_number, customer_id, customer_code, channel_type, conversation_date, summary, need_assistance, urgency_level, synced_to_ctrack, document_urls, status)
ON CONFLICT (id) DO NOTHING;
```

---

### Verifikasi Hasil:
```sql
SELECT count(*) AS total_conversations FROM public.a2_record_conversations;
```
