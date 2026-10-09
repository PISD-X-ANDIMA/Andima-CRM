# Catatan Rilis Andima CRM

Catatan ini merangkum perkembangan yang tercatat di Git dan implementasi yang ada di repositori sampai **9 Oktober 2026**. Riwayat Git memuat pekerjaan beberapa squad yang kemudian digabung ke branch CRM. Untuk menjaga pembagian tanggung jawab, catatan A1 di bawah berfokus pada **Company List**, **Meeting Schedule**, dan **Dashboard Sales Executive**. Fitur **Record Conversation** serta pengelolaan task Field Agent dimiliki squad lain.

> Catatan ini bukan daftar semua commit. Commit dengan pesan umum atau perubahan gabungan dirangkum berdasarkan perubahan kode yang dapat dikenali. Perubahan hanya berlaku di Supabase setelah migrasi SQL terkait dijalankan pada proyek database yang digunakan.

## 15–19 September 2026 — Inisialisasi proyek

- Membuat fondasi aplikasi Next.js dan konfigurasi awal proyek.
- Menambahkan alur awal C-Tracking untuk memantau status progress.
- Menambahkan pipeline CI dasar.

## 29 September 2026 — Fondasi dashboard CRM

- Membuat kerangka Dashboard Sales Executive dan awal daftar customer.
- Menyelaraskan layout, header, kartu ringkasan, hierarki sidebar, dan navigasi dengan referensi UI.
- Menghapus item navigasi MID dari sidebar CRM.

## 30 September 2026 — Company List dan fitur CRM A1 awal

- Menambahkan halaman Company List, detail customer, formulir tambah/edit, tabel, konfirmasi hapus, pencarian, pagination, serta ekspor awal.
- Menambahkan Dashboard Sales Executive dan kartu ringkasan data.
- Menambahkan halaman Meeting Schedule dengan kalender, slot waktu, dan tampilan detail meeting.
- Menambahkan endpoint customer, dashboard summary, detail customer, serta operasi meeting yang terkait customer.
- Menambahkan service dan tipe data untuk customer, meeting, dashboard, dan respons API.
- Membuat migrasi awal yang mempertahankan tabel `a1_company_list` yang telah ada, menambah metadata yang dibutuhkan, dan menyediakan relasi data CRM.
- Menambahkan data seed untuk pengembangan.
- Memperbaiki alur pagination, interaksi tabel, tampilan detail, serta integrasi halaman dengan Supabase.

## 5–6 Oktober 2026 — Halaman Sales Executive dan pengembangan Meeting Schedule

- Mengembangkan halaman khusus Sales Executive untuk Dashboard, Company List, dan Meeting Schedule.
- Menambahkan pemuatan data customer dan meeting dari Supabase melalui API/service aplikasi.
- Menyempurnakan form tambah/edit perusahaan dan meeting, tampilan detail, status, pencarian, serta interaksi kalender.
- Mengembangkan kartu metrik Dashboard berdasarkan data company dan meeting yang tersedia.
- Menghubungkan data transaksi Dashboard dengan tabel `a2_worksheets` untuk mengambil `transaction_no` dan `job_no`.
- Menambahkan fitur ekspor transaksi dan penyempurnaan data tabel transaksi.
- Mengarahkan landing page aplikasi ke alur login dan memperbaiki beberapa penanganan sesi serta pengaturan role/department pada alur autentikasi yang masuk ke repositori.
- Menambahkan skema detail meeting, termasuk agenda, PIC, perwakilan Andima, tipe meeting, lokasi atau tautan, catatan, dan status.

## 6 Oktober 2026 — Satu perusahaan dapat memiliki beberapa meeting

- Mengubah model data dan service agar satu perusahaan dapat memiliki lebih dari satu jadwal meeting.
- Menghapus batasan database lama yang hanya mengizinkan satu meeting aktif untuk setiap perusahaan.
- Menyesuaikan kalender, slot, detail, daftar meeting, formulir, dan API terhadap relasi beberapa meeting per perusahaan.
- Menambahkan migrasi `202610070002_a1_multiple_company_meetings.sql` untuk database yang sebelumnya sudah menjalankan skema awal.
- Menyempurnakan alur Company List dan menyesuaikan skema agar tetap kompatibel dengan tabel bersama yang telah memiliki data.

## 7 Oktober 2026 — Aturan meeting, validasi, dan integrasi API

- Menambahkan validasi bentrok jadwal berdasarkan hari/tanggal, rentang waktu, meeting mingguan, dan perwakilan yang sama.
- Membatasi pilihan jadwal ke slot satu jam dari **08:00–09:00** sampai **16:00–17:00**.
- Menolak jadwal untuk tanggal lampau dan slot hari ini yang sudah dimulai.
- Mengubah meeting satu kali yang terlewat dan masih berstatus Scheduled menjadi Canceled saat data jadwal dibaca.
- Menambahkan/menyempurnakan endpoint kompatibilitas untuk meeting, slot meeting, navigasi sidebar, customer, transaksi, dan ringkasan dashboard.
- Menyesuaikan tampilan status meeting: Scheduled, Completed, dan Canceled, termasuk warna status pada kalender dan daftar slot.
- Membatasi meeting berstatus Completed agar tidak diedit atau dihapus; tombol **+ Record Conversation** aktif hanya setelah meeting selesai dan mengarahkan pengguna ke submenu terkait. Isi lengkap modul tersebut tetap milik squad pemilik Record Conversation.
- Menggabungkan perubahan lintas squad pada navigasi dan modul CRM. Kehadiran halaman atau integrasi dari merge tidak berarti seluruh fitur milik A1.

## 9 Oktober 2026 — Penyempurnaan Dashboard, Company List, dan ekspor

### Dashboard Sales Executive

- Kartu **Total Customer** menghitung perusahaan aktif pada `a1_company_list`.
- Kartu **Upcoming Meeting** menghitung jadwal meeting aktif yang belum berlangsung. Kartu **Active Customer** tidak ditampilkan karena skema Company List belum memiliki status customer yang dapat mendefinisikannya.
- Kartu **Task** menghitung jumlah baris yang dapat dibaca pada tabel `a2_worksheets`. Ini adalah hitungan baris worksheet, bukan jumlah task yang difilter menurut agen atau status.
- Bagian **Schedule This Week** memuat jadwal minggu berjalan dari data meeting, menampilkan nama perusahaan, tanggal, dan jam. Dashboard memuat ulang data jadwal saat halaman mendapat fokus agar perubahan di Meeting Schedule ikut terlihat.
- Jadwal menampilkan paling banyak data yang diterima API untuk seluruh halaman, bukan hanya dua entri contoh; saat loading disediakan skeleton lima baris dan ketika data kosong ditampilkan keadaan kosong.
- Menambahkan peringatan untuk meeting yang akan dimulai dalam waktu dekat.
- Daftar transaksi menampilkan `transaction_no` dan `job_no` dari `a2_worksheets`, pencarian, pagination, detail transaksi, dan ekspor.

### Company List

- Menampilkan kolom **Company**, **Address**, **PIC**, **PIC Number**, **Meeting Schedule**, **View Task**, dan **Action** sesuai kebutuhan tabel Company List. Menu Action menyediakan detail, edit, dan hapus.
- Menyediakan tambah, edit, detail, hapus, pencarian, pagination, dan panel task yang terkait perusahaan. Integrasi task Field Agent secara penuh tetap bergantung pada layanan/database squad pemiliknya.
- Mencegah perusahaan aktif dengan nama yang sama dibuat lebih dari satu kali. Pemeriksaan dilakukan di aplikasi dan dilindungi trigger database untuk menangani permintaan bersamaan.
- Menambahkan nomor telepon PIC yang dimasukkan manual. Formulir menyediakan pilihan kode negara Indonesia, Amerika Serikat, Inggris, Singapura, Malaysia, dan Australia, membatasi panjang nomor sesuai pilihan, lalu menyimpan nomor dalam format internasional.
- Menampilkan skeleton berbentuk tabel ketika data sedang dimuat.
- Menggunakan dialog konfirmasi penghapusan di dalam aplikasi dan menampilkan pesan keberhasilan setelah operasi selesai.

### Meeting Schedule

- Menggunakan data meeting yang sama dengan Company List dan Dashboard; perubahan jadwal menjadi sumber bagi tampilan meeting pada kedua halaman tersebut.
- Menyediakan kalender, slot waktu, tambah/edit, detail, status, agenda, PIC, perwakilan, jenis meeting, lokasi/tautan, frekuensi satu kali atau mingguan, serta catatan.
- Menampilkan slot kosong sebagai **Available** dan status meeting dengan warna yang berbeda.
- Menyediakan pesan kosong saat tidak ada meeting pada minggu berjalan di Dashboard.

### Ekspor dan bahasa antarmuka

- Merapikan ekspor Excel untuk Dashboard dan Company List, termasuk lebar kolom, filter, dan data yang mengikuti pencarian/rentang tanggal yang dipilih.
- Merapikan ekspor PDF sebagai tampilan cetak lanskap dengan header tabel yang berulang. Penyimpanan PDF dilakukan melalui dialog cetak browser dengan pilihan **Save as PDF**.
- Pesan validasi dan error pada alur yang direvisi menggunakan bahasa Inggris, sesuai bahasa antarmuka sistem.

## Migrasi database A1

File migrasi yang menjadi bagian dari repositori:

| File | Tujuan utama |
|---|---|
| `supabase/migrations/202609300002_a1_company_list_additive_revision.sql` | Fondasi skema CRM A1 yang kompatibel dengan tabel Company List yang sudah ada. |
| `supabase/migrations/202609300003_a1_company_list_add_address.sql` | Menambahkan alamat perusahaan jika belum tersedia. |
| `supabase/migrations/202609300004_a1_company_list_make_job_number_optional.sql` | Membuat `job_number` opsional agar penambahan Company List tidak gagal saat nomor job belum tersedia. |
| `supabase/migrations/202610060001_a1_meeting_details.sql` | Menambahkan atau melengkapi informasi dan status detail meeting pada instalasi yang sudah memiliki tabel meeting. |
| `supabase/migrations/202610070001_a1_company_and_meeting_schema.sql` | Skema Company List dan meeting A1, timestamp, validasi, trigger, dan indeks. |
| `supabase/migrations/202610070002_a1_multiple_company_meetings.sql` | Menghapus batas satu meeting aktif per perusahaan dan menambahkan indeks pencarian jadwal. |
| `supabase/migrations/202610070003_a1_pic_phone_and_company_uniqueness.sql` | Menambahkan nomor telepon PIC dan perlindungan agar nama perusahaan aktif tidak duplikat. |

Migrasi di atas adalah file SQL di repository; catatan ini tidak dapat memastikan migrasi mana yang sudah dijalankan pada proyek Supabase tertentu. Pastikan urutan dan status penerapannya diperiksa di database tujuan sebelum deployment.

## Batas cakupan dan ketergantungan lintas squad

- A1 memiliki Company List, Meeting Schedule, dan Dashboard Sales Executive.
- Dashboard A1 membaca `a2_worksheets` untuk Transaction ID, Job Number, dan hitungan jumlah baris pada kartu Task. A1 tidak mengelola definisi, assignment, atau status task A2/A3.
- **Record Conversation** dan workflow task Field Agent bukan modul yang dimiliki A1. Tombol dari meeting selesai hanya menyediakan navigasi ke submenu; kelengkapan proses setelah navigasi mengikuti implementasi squad pemiliknya.
- Data Task hanya dapat dihitung jika Supabase mengizinkan query membaca tabel worksheet. Kebijakan RLS/permission dapat membuat jumlah yang terbaca berbeda dari jumlah total sebenarnya.
- Kartu Active Customer tidak dapat dihitung dengan benar sampai definisi status dan kolom sumbernya disepakati serta tersedia.
- Perilaku fitur database bergantung pada migrasi yang sesuai sudah diterapkan pada proyek Supabase yang digunakan aplikasi.

## Versi dan status

- **Tanggal batas rangkuman:** 9 Oktober 2026.
- **Branch yang diperiksa:** `feature/A1-company-list`.
- **Commit HEAD saat pemeriksaan:** `15296cf`.
- Catatan ini merangkum riwayat yang tersedia pada clone lokal saat diperiksa; commit baru atau perubahan di branch lain setelah titik tersebut belum tercakup.
