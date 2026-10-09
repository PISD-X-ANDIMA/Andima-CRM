# Audit Kesesuaian FR/TR A1

Tanggal pemeriksaan: 9 Oktober 2026  
Lingkup: aplikasi CRM A1 pada repository ini. Tabel transaksi, worksheet, task Field Agent, dan Record Conversation merupakan dependensi Squad A2 sesuai pembagian kerja tim.

## Ringkasan

Implementasi A1 mencakup alur utama Company List dan Meeting Schedule, termasuk pencarian, pagination, CRUD, ekspor, slot waktu, meeting berulang, status, dan ringkasan dashboard. Kesesuaian belum dapat dinyatakan 100%: beberapa kebutuhan bergantung pada kontrak/data Squad A2, data historis untuk persentase KPI belum tersedia, dan migration kepemilikan customer harus diterapkan serta data lama dipetakan di Supabase.

## Checklist FR

| Dokumen | Hasil | Implementasi / catatan |
|---|---|---|
| FR-A1-001-01 Navigasi dan sidebar | Sebagian besar sesuai | Layout CRM dan navigasi berada di `components/dashboard/Sidebar.tsx`, `components/dashboard/DashboardShell.tsx`, dan `app/dashboard/layout.tsx`. Sidebar mengambil submenu Sales Executive dari API dengan fallback lokal. Profil saat ini hanya display sesuai revisi terakhir user. |
| FR-A1-002-01 KPI dan Schedule This Week | Sebagian | Kartu Total Customer, Upcoming Meeting, dan Task di `components/dashboard/SalesExecutiveDashboard.tsx`. Sumber hitungan Task adalah jumlah baris `a2_worksheets`. Lima jadwal terdekat diambil dari `app/api/v1/dashboard/weekly-schedule/route.ts`. Tren/persentase perubahan belum tersedia karena belum ada sumber nilai periode pembanding. |
| FR-A1-003-01 Pencarian dan ringkasan transaksi | Sebagian | Tabel, pencarian, pagination, detail dan ekspor dashboard menggunakan `/api/v1/transactions/summary` dan `/api/v1/transactions/export`. Nomor transaksi/job membaca `a2_worksheets.transaction_no` dan `job_no`. Urutan terbaru memakai nomor transaksi sebagai perkiraan, karena kolom tanggal transaksi resmi belum dikonfirmasi. UI detail memakai modal sesuai revisi UI terakhir; bila FR mewajibkan halaman detail terpisah, ini berbeda. |
| FR-A1-004-01 Tabel Company List | Sebagian besar sesuai | Kolom Company, Address, PIC, PIC Number, Meeting Schedule, View Task, Action, real-time search, pagination, dan empty/loading state di `components/customer/CustomerTable.tsx` dan `app/dashboard/company-list/page.tsx`. View Task membuka `/dashboard/task-of-field-agent?company_id=...`; data task tetap menunggu endpoint A2. |
| FR-A1-005-01 CRUD Company | Sebagian besar sesuai | Form, validasi, update, delete/soft-delete dan pesan sukses di `app/dashboard/company-list/page.tsx`, `components/customer/CustomerFormModal.tsx`, dan `lib/services/customer-service.ts`. Akses dibatasi ke pemilik customer memakai `sales_id`; migration dan backfill Supabase wajib dijalankan sebelum fitur ini berfungsi pada skema baru. |
| FR-A1-006-01 Ekspor Company List | Sebagian besar sesuai | Dialog Excel/PDF, filter tanggal dan pencarian di `app/dashboard/company-list/page.tsx`; endpoint data ekspor `app/api/v1/customers/export/route.ts`. PDF memakai print dialog browser (“Save as PDF”), bukan generator PDF server. |
| FR-A1-007-01 Kalender, slot, dan status | Sebagian besar sesuai | Mini calendar dan status warna di `app/dashboard/meeting-schedule/page.tsx`; data marker dari `/api/v1/meetings/calendar`; slot terpilih dari `/api/v1/meetings/slots`. Slot 08:00–17:00 satu jam. Status selesai/canceled/scheduled dipetakan ke warna UI. |
| FR-A1-008-01 Penjadwalan dan pengulangan | Sebagian besar sesuai | Form Add/Edit, tipe online/offline, slot, frekuensi one-time/weekly, catatan, validasi bentrok, detail, status, dan delete di `app/dashboard/meeting-schedule/page.tsx`, customer meeting API, serta `lib/services/meeting-service.ts`. Edit meeting selesai dikunci. Auto-cancel hanya berlaku untuk one-time; series weekly tidak otomatis dibatalkan per-occurrence karena satu baris database mewakili seluruh series. |
| FR-A1-009-01 Record Conversation | Terintegrasi terbatas | Tombol pada detail meeting hanya aktif bila status Completed atau waktu meeting berlalu dan meneruskan `customer_id`, `meeting_id`, serta alias `source_meeting_id`. Halaman/penyimpanan conversation milik A2; A1 tidak dapat menjamin proses pencatatan tanpa API A2. |

## Checklist TR dan API

| Kebutuhan teknis | Status | Catatan |
|---|---|---|
| React, Next.js App Router, Supabase | Sesuai | Struktur aplikasi memakai React/Next.js dan Supabase server/client. |
| `GET /api/v1/auth/me` dan `GET /api/v1/user/profile?role=sales_executive` | Tersedia | Implementasi di `app/api/v1/auth/me/route.ts` dan `app/api/v1/user/profile/route.ts`. Profile HR bersifat best effort bila tabel HR tidak bisa diakses. |
| `GET /api/v1/navigation/sidebar` sesuai role | Sebagian besar sesuai | Sidebar mengambil submenu Sales Executive dari endpoint dengan fallback lokal bila API gagal. |
| Dashboard statistics dan weekly schedule | Tersedia dengan keterbatasan | `/api/v1/dashboard/stats` mengembalikan KPI tetapi `changes: null`; `/api/v1/dashboard/weekly-schedule` memasok jadwal dalam rentang tanggal. |
| `GET /api/v1/customers?page&limit&search` dan `POST /api/v1/customers` | Sesuai | Mendukung pagination/search/CRUD dan sesi Supabase. Alias `perPage` dipertahankan. |
| `PUT /api/v1/customers/{id}` | Tersedia | Alias kompatibilitas untuk implementasi update PATCH. |
| `GET /api/v1/customers/export?format&search` | Tersedia dan dipakai | Mengembalikan baris JSON terfilter; browser menyusun file Excel/PDF. |
| `POST /api/v1/meetings` dengan kontrak Planka | Tersedia | Integrasi menerima kontrak Planka; UI saat ini menggunakan route per-customer POST/PATCH. |
| `GET /api/v1/meetings/slots?date` | Tersedia dan dipakai | Memuat 9 slot harian, status dan keterangan meeting. |
| `GET /api/v1/meetings/calendar?month` | Tersedia dan dipakai | Dipakai untuk marker mini calendar. |
| `PUT /api/v1/meetings/{id}/status` | Alias tersedia | UI saat ini mengubah status melalui PATCH route per-customer. |
| Isolasi data per Sales Executive | Perlu migration dan backfill | `supabase/migrations/202610090001_a1_sales_executive_ownership.sql` menambah `sales_id`, RLS, dan duplikat per pemilik. Baris lama yang tidak cocok tepat ke profil `b2_register.full_name` tetap tidak ber-owner dan tidak tampak bagi user sampai dipetakan manual. Jalankan migration hanya setelah meninjau pemetaan data lama. |

## Catatan perbedaan / dependensi yang belum dapat disamakan

1. **Persentase perubahan KPI:** belum dapat dihitung tanpa periode pembanding yang tersimpan/terdefinisi (misalnya total customer bulan lalu). Endpoint statistik mengembalikan `changes: null`; UI sebaiknya tidak menampilkan angka tren palsu.
2. **KPI Task dan View Task:** kartu Task menghitung semua baris `a2_worksheets`, sesuai instruksi user. Ini bukan hitungan Field Agent Task yang disaring per agent/status. Tabel task pada modal/halaman Field Agent memerlukan API dan skema A2.
3. **Data transaksi “terbaru”:** sumber `transaction_no`/`job_no` tersedia, tetapi tanpa kolom tanggal transaksi yang dikonfirmasi, urutan nomor bukan jaminan urutan waktu terbaru.
4. **Record Conversation:** A1 mengatur kapan tombol dapat dibuka serta mengirim referensi meeting/customer, termasuk alias `source_meeting_id`. Penyimpanan dan route conversation harus disepakati/dimiliki A2.
5. **Weekly series status/auto-cancel:** model saat ini menyimpan satu row untuk satu series mingguan. Mengubah status menjadi Completed berlaku pada seluruh row/series; automatic cancel per occurrence membutuhkan tabel occurrence atau exception khusus. Saat ini auto-cancel hanya untuk one-time meeting.
6. **Sidebar berbasis role:** sidebar mengambil submenu Sales Executive dari API; daftar Field Agent tetap berupa entry kosong sesuai keputusan UI A1. Pengujian dengan role aktual dan konfigurasi metadata Supabase masih perlu dilakukan.
7. **Migration Supabase:** migration kepemilikan belum otomatis diterapkan ke proyek remote. Data `created_by` lama tidak selalu sama dengan nama unik pada `b2_register`; pemetaan manual perlu sebelum RLS ketat digunakan agar data lama tidak tampak hilang.
8. **PDF:** file dibuat melalui print dialog browser; pengalaman dapat berbeda antar browser dan pengguna perlu memilih “Save as PDF”.
9. **Detail transaksi:** modal digunakan mengikuti revisi UI user. Jika FR/TR versi terbaru menentukan route/halaman detail khusus, perlu dipastikan dari acceptance criteria final.

## Langkah agar audit dapat ditutup

- Minta Squad A2 memastikan endpoint/schema Task Field Agent dan Record Conversation, serta kolom tanggal yang dipakai untuk urutan transaksi terbaru.
- Tentukan definisi angka pembanding setiap tren KPI.
- Cocokkan `created_by` customer lama dengan UUID Sales Executive dan terapkan migration ownership di Supabase.
- Sambungkan sidebar ke endpoint menu role jika dinyatakan wajib pada penilaian final.
- Jalankan build di CI/Vercel setelah migration dan environment Supabase yang sesuai tersedia.
