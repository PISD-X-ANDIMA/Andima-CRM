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
- Penambahan skema tabel `a1_user_access` untuk hak akses dan role CRM.
- Penambahan halaman dan komponen Executive Oversight khusus Manager of Customer Success.
- Penambahan halaman Kelola Role Tim (`/dashboard/manager-customer-success/role-management`) untuk memberikan wewenang role Sales Executive dan Field Agent.
- Penambahan endpoint API kelola role (`/api/v1/manager/roles`) yang terhubung langsung ke `b2_register`, `d3_positions`, dan `a1_user_access`.
- Penerapan pengalihan login otomatis dan menu sidebar dinamis sesuai role pengguna (`sales_executive` vs `manager_customer_success`).
