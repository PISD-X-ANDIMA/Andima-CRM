# Catatan Rilis Andima CRM

## 15–19 September 2026
- Inisialisasi aplikasi CRM menggunakan Next.js, React, TypeScript, dan Supabase.
- Pembuatan halaman login dan registrasi.
- Pembuatan layout CRM dengan sidebar dan navigasi Sales Executive.
- Pembuatan halaman Company List dan Meeting Schedule.

## 29 September 2026
- Penambahan alamat perusahaan pada Company List.
- Penambahan pencarian dan pagination daftar perusahaan.
- Penambahan operasi tambah, lihat, ubah, dan hapus perusahaan.
- Penambahan tampilan detail meeting dan pencatatan agenda meeting.

## 30 September 2026
- Penambahan kolom nomor telepon PIC pada data perusahaan.
- Penambahan validasi nama perusahaan agar tidak tercatat ganda.
- Penambahan pencarian dan pagination pada daftar meeting.

## 5–6 Oktober 2026
- Penambahan kalender mini dan tampilan slot waktu meeting.
- Penambahan pembuatan meeting satu kali dan rutin mingguan.
- Penambahan pengubahan dan pembatalan meeting.
- Penambahan tipe meeting offline dan online.
- Penambahan status Scheduled, Completed, dan Canceled.

## 7 Oktober 2026
- Dukungan beberapa meeting untuk satu perusahaan.
- Penambahan validasi waktu meeting dan pemeriksaan bentrok jadwal.
- Penambahan otomatisasi pembatalan meeting terjadwal yang sudah lewat.
- Penambahan akses Record Conversation untuk meeting yang selesai.
- Penambahan tampilan Task of Field Agent pada Sales Executive.

## 9–10 Oktober 2026
### Dashboard Sales Executive
- Penambahan kartu Total Customer, Upcoming Meeting, dan Task.
- Penambahan lima jadwal terdekat pada Schedule This Week.
- Penambahan penanda untuk meeting yang akan segera berlangsung.
- Penambahan tabel ringkasan transaksi dengan pencarian, pagination, dan detail.
- Penambahan data Transaction ID dan Job Number dari tabel transaksi.
- Penambahan ekspor data ke Excel dan PDF.

### Company List
- Penyesuaian tabel dengan kolom Company, Address, PIC, PIC Number, Meeting Schedule, View Task, dan Action.
- Penambahan pilihan kode negara dan validasi panjang nomor telepon.
- Penambahan dialog konfirmasi hapus dan notifikasi hasil operasi.
- Perbaikan tampilan skeleton saat data sedang dimuat.
- Penambahan ekspor daftar perusahaan ke Excel dan PDF.

### Meeting Schedule
- Sinkronisasi jadwal pada dashboard dengan data Meeting Schedule.
- Penambahan pilihan slot waktu satu jam dari 08:00 - 09:00 hingga 16:00 - 17:00.
- Penambahan tampilan status meeting dengan warna yang sesuai.
- Penambahan tombol Record Conversation pada detail meeting berstatus Completed.

### Navigasi dan sesi
- Pengalihan setelah login ke Sales Executive Dashboard.
- Penambahan sidebar yang dapat disembunyikan melalui tombol panah.
- Penyamaan sidebar dan tombol Logout di halaman CRM.
- Penyamaan tampilan profil pengguna pada halaman CRM.
- Penanganan sesi login saat memuat Company List dan Meeting Schedule.
- Penambahan menu Hak Akses Field Agent pada sidebar untuk kesiapan integrasi modul Squad A2, serta penghapusan entri Field Agent kosong.
- Penerapan isolasi data (Data Scoping) berbasis Sales Executive pada Company List, kartu KPI Dashboard, Schedule This Week, dan slot Meeting Schedule.
- Penentuan hak akses dan role CRM langsung dari integrasi akun kepegawaian `b2_register` yang terhubung ke tabel `d3_positions`.
- Penambahan halaman dan komponen Executive Oversight khusus Manager of Customer Success.
- Penambahan halaman Kelola Role Tim (`/dashboard/manager-customer-success/role-management`) untuk memberikan wewenang role Sales Executive dan Field Agent.
- Penambahan endpoint API kelola role (`/api/v1/manager/roles`) yang terhubung langsung ke `b2_register` dan `d3_positions`.
- Penerapan pengalihan login otomatis dan menu sidebar dinamis sesuai role pengguna (`sales_executive` vs `manager_customer_success`).

## 11–12 Oktober 2026
### Dashboard Manager of Customer Success
- Penambahan halaman Executive Oversight (`/dashboard/manager-customer-success`) dengan 4 kartu metrik agregat tim: Total Customer Tim, Total Sales Executive Aktif, Total Meeting Tim Minggu Ini, dan Total Need Backup.
- Penambahan tabel kinerja dan jadwal mingguan seluruh Sales Executive dengan status Scheduled, Completed, dan Cancelled.
- Penambahan endpoint agregat data tim `/api/v1/manager/dashboard/overview` terhubung langsung ke database Supabase tanpa data mock dummy.
- Penambahan fitur ekspor rekap kinerja tim Manager ke format Excel/CSV dan PDF.
- Penambahan proteksi rute otomatis: akun Manager of Customer Success yang membuka `/dashboard` atau `/dashboard/sales-executive` dialihkan secara otomatis ke dashboard Manager.

### Global Filter Sales Executive & Mode Baca Company List
- Penambahan komponen `ManagerGlobalFilterBar` pada dashboard dan halaman Company List khusus pengguna dengan peran Manager.
- Sinkronisasi status filter viewing Sales Executive: Manager dapat meninjau data per Sales Executive secara spesifik atau melihat data agregat tim secara keseluruhan ("All Sales Executives").
- Dropdown viewing Sales Executive difilter secara spesifik hanya menampilkan personel dengan role Sales Executive aktif.
- Penyesuaian halaman Company List (`/dashboard/company-list`) dalam mode baca (read-only) untuk Manager: tombol tambah, edit, dan hapus perusahaan disembunyikan/dinonaktifkan secara kondisional guna menjaga integritas kepemilikan data Sales Executive.

### Arsitektur Role & Hak Akses Berbasis HRMS
- Penghapusan total ketergantungan pada tabel perantara `a1_user_access` dari seluruh endpoint dan skrip migrasi database (`202610100001_a1_user_access.sql`).
- Penentuan akun dan hak akses CRM kini diturunkan langsung dari relasi akun kepegawaian `b2_register` yang terhubung ke jabatan `d3_positions` via `position_id`.
- Standardisasi resolusi peran (`resolveCrmRoleFromPosition`) berdasarkan kode dan judul posisi (`COM-CS-MGR` untuk Manager of Customer Success, `COM-SLS` untuk Sales Executive, dan `COM-FA` untuk Field Agent).
- Penyesuaian query tabel `d3_positions` dengan kolom skema valid (`code`, `title`) dan penanganan pencarian akun multi-kunci (`user.id`, email case-insensitive `ilike`, serta nama lengkap).
- Peningkatan alur login (`/login`): deteksi instan jabatan kepegawaian pasca-autentikasi dan pengalihan langsung ke rute dashboard yang sesuai (`/dashboard/manager-customer-success` atau `/dashboard/sales-executive`).
- Penyesuaian header dan breadcrumbs (`DashboardHeader`) agar dinamis menampilkan navigasi sesuai role aktif pengguna.

### Integrasi Modul Squad A2 & Pembersihan Data
- Pembersihan data mock/dummy statis pada halaman Squad A2 (`Record Conversation`, `Task of Field Agent`, dan `Need Backup`), disiapkan dalam bentuk *empty-state* terhubung ke database.
- Pembersihan riwayat data lama pada tabel `a1_company_list` dan `a1_customer_meetings`.
- Penambahan 5 data aktif perusahaan logistik Indonesia baru dengan PIC, nomor telepon valid, alamat operasional, dan jadwal meeting aktif minggu berjalan (12–16 Oktober 2026) yang terhubung ke akun `Budi Sales Exec`.

### Penyelarasan Sistem & Audit QA (12 Oktober 2026)
- Penyesuaian antarmuka Dashboard Sales Executive: tombol ekspor pada tabel ringkasan transaksi diselaraskan menjadi `Export Transaction Records`, judul modal diperbarui menjadi `Export Transaction Records` dengan filter rentang tanggal (From–To) dan opsi format Excel/PDF.
- Penyesuaian teks ringkasan pagination transaksi menjadi `Showing X-Y of Z transactions`.
- Penyelarasan menyeluruh 19 butir temuan audit pengujian QA dalam dokumen addendum persyaratan resmi (`docs/requirements/REVISI-DOKUMEN-FR-TR-SQUAD-A1.md`) dan seluruh berkas TR/FR terkait.
- Pembersihan menyeluruh teks internal pengembang pada empty state: penyelarasan teks `No open issues` (sesuai FR-A1-010-01.10) dan `No Sales Executive yet` (FR-A1-010-01.7) pada Dashboard Manager, serta standardisasi pesan antarmuka user-facing pada seluruh modul CRM.

## 14 Oktober 2026
### Integrasi Data Riil Modul Lapangan (Squad A2 & A3)
- Integrasi data riil tabel `a2_worksheets` pada halaman Task of Field Agent (`/dashboard/task-of-field-agent`), menggantikan data statis dan menghubungkannya dengan `a1_company_list` dan `b2_register`.
- Penambahan tampilan modal detail inspeksi lapangan: ringkasan inspeksi A3 (actual pieces, gross weight, unduh bukti foto), informasi airway bill (HAWB/MAWB), dan penelusuran relasi task.
- Penyesuaian query tabel `a2_record_conversations` pada halaman Record Conversation untuk membaca data riil dari Supabase.
- Penyesuaian endpoint ekspor transaksi (`/api/v1/transactions/export`) dan metrik ringkasan dashboard manager (`/api/v1/manager/dashboard/overview`).

## 21 Oktober 2026
### Restrukturisasi Relasi Database Supabase (Squad A2 & A3)
- Penambahan tabel relasi `a2_company_sales` untuk menetapkan penanggung jawab (PIC) Sales Executive pada setiap perusahaan aktif (9 perusahaan terhubung).
- Penambahan tabel relasi `a2_field_agent_sales` untuk menghubungkan personel Field Agent ke atasan Sales Executive terkait (3 field agent terhubung).
- Pembagian ulang 29 job lama dari manajer ke masing-masing Sales Executive (Satya, Samuel, Zefanya) dan Field Agent (Aurelia, Mariani, Yohanes).
- Otomatisasi penugasan job baru: saat Field Agent membuat task, sistem secara otomatis mengisi relasi company, sales PIC, dan field agent pembuat.
- Standardisasi format penomoran otomatis untuk Job Number (`JOB-YYMM-#####`) dan Transaction Number (`TRX-YYMM-#####`).
- Penelusuran catatan lapangan A3: penambahan relasi `worksheet_id` pada 5 tabel operasional A3 (handover, dokumentasi, verifikasi, issue, dan history) agar catatan dapat ditelusuri ke job yang tepat.
- Penerapan integritas data di database: pencegahan nomor job duplikat per perusahaan, kewajiban pengisian sales PIC pada setiap job, dan pembuatan nomor transaksi unik.
- Migrasi penyimpanan data Need Backup ke tabel Supabase `a2_need_backups`.

### Penyelarasan Antarmuka & Perbaikan UI (Company List & Dashboard)
- Penggantian ikon tombol "View Task" pada tabel Company List (`CustomerTable.tsx`) menjadi ikon `ClipboardList` agar tidak serupa atau membingungkan dengan ikon detail (`Eye`).
- Standardisasi tampilan pesan error pada tabel perusahaan: penggantian warna error dari merah mencolok menjadi palet amber/oranye yang lebih ramah pengguna beserta tombol "Coba lagi".
- Penyelarasan ukuran, margin, dan padding pada kotak kartu ringkasan (KPI cards) agar seragam di seluruh resolusi layar.
- Perbaikan layout tabel transaksi pada Dashboard Sales Executive (`SalesExecutiveDashboard.tsx`) untuk mencegah elemen tabel saling menimpa (*overlap*) dengan kontainer lain.
- Pencegahan aksi tambah data (Add Company dan Add Meeting) dinonaktifkan secara otomatis saat terjadi kegagalan pemuatan data atau data belum tersedia.

### Konsistensi Skeleton Loading
- Standardisasi komponen skeleton loading pada seluruh tabel data (`CustomerTable`, `RecordConversation`, dan `TaskOfFieldAgent`).
- Penerapan animasi skeleton bertahap (*staggered delay*) dengan warna abu-abu halus (`bg-slate-200/70`) untuk menghilangkan lag dan efek kedipan (*flicker*) saat transisi data.

### Eliminasi Fitur "Need Backup" dari Sistem
- Penghapusan menu navigasi "Need Backup" dari sidebar Sales Executive dan Manager Customer Success (`Sidebar.tsx`, `/api/v1/navigation/sidebar/route.ts`).
- Penghapusan label navigasi "Need Backup" pada header breadcrumbs (`DashboardHeader.tsx`) dan penyesuaian deskripsi pada `ManagerGlobalFilterBar.tsx`.
- Pengalihan rute halaman `/dashboard/need-backup` menjadi halaman 404 (`notFound()`) sehingga tidak dapat diakses melalui URL.
- Penghapusan seluruh elemen "Need Backup" pada halaman Record Conversation (`/dashboard/record-conversation`): filter dropdown, kolom tabel, badge status, dan bagian informasi pada modal detail.

### Perbaikan Bug & Optimasi Kode
- Perbaikan error React *duplicate key* pada baris 214 tabel Record Conversation (`<tr key={item.id}>`) dengan menyimpan UUID asli (`rawId`), memformat ID unik berbasis suffix database (`CONV-${String(c.id).slice(-8).toUpperCase()}`), dan menggunakan key unik.
- Peningkatan keandalan kalkulasi metrik Sales Executive (`sales-executive-metrics.ts`): penanganan fallback nilai `count ?? 0` untuk mencegah nilai `null` pada kartu KPI Task.
