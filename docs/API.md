# Dokumentasi API CRM A1

Dokumen ini menjelaskan seluruh route API di folder `app/api/v1`, fungsi setiap route, contoh data yang dikirim, bentuk hasilnya, dan apakah halaman saat ini sudah memakainya.

## Pengantar

Alamat dasar semua API adalah `/api/v1`. Contoh: `GET /api/v1/customers`.

API mengirim dan menerima JSON. Untuk route yang membaca atau mengubah database, browser harus mengirim sesi login Supabase yang sama dengan sesi aplikasi. Jangan mengirim Supabase key di body request.

Jika berhasil, bentuk umumnya:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`data` berisi hasil utama. `meta` berisi informasi tambahan seperti jumlah baris atau nomor halaman, jika relevan.

Jika gagal, bentuk umumnya:

```json
{
  "success": false,
  "code": "VALIDATION_001",
  "message": "Keterangan kesalahan",
  "errors": {}
}
```

`errors` bisa tidak disertakan. Kode dan pesan pada bagian tiap API adalah kesalahan yang paling umum; kegagalan database juga dapat menghasilkan kode lain yang disebutkan di bawah.

## Company List dan data customer

### `GET /customers` — mengambil daftar perusahaan

**Dipakai oleh:** halaman Company List, Meeting Schedule, jadwal mingguan dashboard Sales Executive, dan proses ekspor Company List.

Contoh:

```text
GET /api/v1/customers?page=1&limit=20&search=logistik
```

| Parameter | Jenis | Nilai awal | Keterangan |
|---|---|---:|---|
| `page` | angka | `1` | Halaman yang ingin diambil; dimulai dari 1. |
| `limit` | angka | `20` | Jumlah data per halaman, dibatasi antara 1 dan 100. |
| `perPage` | angka | — | Nama lama untuk `limit`, masih didukung. Jika keduanya dikirim, `limit` dipakai. |
| `search` | teks | kosong | Mencari nama perusahaan, nama PIC, dan nomor telepon PIC. |
| `sortBy` | teks | `company_name` | Kolom pengurutan: `company_name` atau `created_at`. |
| `sortOrder` | teks | `asc` | Arah urutan: `asc` atau `desc`. |
| `context` | teks | — | `calendar` atau `weeklySchedule` meminta API memastikan data meeting tersedia. |

`data` berupa daftar perusahaan dengan informasi PIC, nomor transaksi/job dari A2 jika tersedia, data meeting, dan ringkasan jadwal berikutnya. `meta` berisi `total` (jumlah semua hasil), `page`, `perPage`, dan `totalPages` (jumlah halaman). Respons tidak disimpan di cache. Sebelum membaca data, API juga menjalankan pemeriksaan untuk membatalkan meeting satu kali yang sudah terlewat.

Kesalahan umum: `LIST_001` saat daftar gagal dibaca, `CAL_001` saat data kalender gagal dibaca, dan `SCH_001` saat jadwal mingguan gagal dibaca. Umumnya berstatus HTTP 500.

### `POST /customers` — menambahkan perusahaan

**Dipakai oleh:** formulir Add Company. Ini route utama untuk menambah perusahaan.

Contoh body:

```json
{
  "company_name": "PT Example Logistics",
  "address": "Jakarta",
  "pic_name": "Aida",
  "pic_number": "081234567890"
}
```

Semua kolom di contoh wajib diisi. Nama perusahaan harus unik. Nomor telepon PIC harus menggunakan awalan `0` atau `+62`. Nama alternatif yang masih diterima: `pic_full_name` untuk `pic_name`, dan `pic_phone_number` untuk `pic_number`.

Jika berhasil, HTTP 201 dengan data `{ "companyId": "UUID perusahaan" }`.

Kesalahan umum: `CUSTOMER_001` data wajib kosong (400), `CUSTOMER_002` format nomor PIC salah (400), `AUTH_001` sesi login tidak ada/kedaluwarsa (401), `CUSTOMER_003` nama perusahaan sudah terdaftar (409), dan `CUSTOMER_004` gagal menyimpan ke database (500).

### `POST /customers/create` — route penambahan lama

**Dipakai oleh:** halaman saat ini tidak memanggil route ini. Route dipertahankan agar integrasi lama tidak langsung rusak.

Body yang diterima: `company_name`, `address`, `pic_full_name`, dan `pic_phone_number`. Hasil serta validasinya sama seperti `POST /customers`.

### `GET /customers/{customerId}` — melihat detail perusahaan

**Dipakai oleh:** detail customer di dashboard dan jendela detail di Company List.

Ganti `{customerId}` dengan UUID perusahaan. Hasilnya satu objek detail perusahaan pada `data`. Jika perusahaan tidak ditemukan, API mengembalikan `NOT_FOUND_001` (404). Jika gagal membaca data, API mengembalikan `GET_001` (500).

### `PATCH /customers/{customerId}` — mengubah perusahaan

**Dipakai oleh:** formulir Edit Company.

Kirim hanya kolom yang ingin diubah. Kolom yang didukung: `company_name`, `address`, `pic_name` atau `pic_full_name`, dan `pic_number` atau `pic_phone_number`. Kolom yang dikirim tidak boleh kosong; format nomor PIC harus benar.

Contoh:

```json
{
  "address": "Jakarta Utara",
  "pic_name": "Aida",
  "pic_number": "081234567890"
}
```

Jika berhasil, `data` berisi `{ "customerId": "UUID perusahaan" }`. Kesalahan umum: `CUSTOMER_001` atau `CUSTOMER_002` (400), `AUTH_001` (401), `CUSTOMER_003` nama perusahaan duplikat (409), dan `CUSTOMER_004` (500).

### `DELETE /customers/{customerId}` — menghapus perusahaan

**Dipakai oleh:** tombol hapus di Company List. Body tidak diperlukan. Hasil sukses berisi `{ "customerId": "UUID perusahaan" }`.

Jika gagal, API mengembalikan `DELETE_001` atau `DELETE_002` (500). Penghapusan mengikuti operasi yang diatur customer service; daftar hanya menampilkan perusahaan yang belum ditandai terhapus.

## Meeting Schedule

### `GET /customers/{customerId}/meetings` — membaca meeting sebuah perusahaan

Route tersedia untuk membaca jadwal suatu perusahaan. Halaman Meeting Schedule saat ini membaca semua perusahaan beserta meeting melalui `GET /customers?context=calendar`, bukan route ini.

Hasil `data` berupa daftar meeting dan `meta.total` berisi jumlah meeting. Sebelum membaca data, API menjalankan pemeriksaan meeting satu kali yang terlewat. Kesalahan umum `CAL_001` (500).

### `POST /customers/{customerId}/meetings` — menambahkan meeting (dipakai UI)

**Dipakai oleh:** formulir Add Meeting di halaman Meeting Schedule.

Contoh body:

```json
{
  "meeting_day": "thursday",
  "schedule_type": "one_day",
  "meeting_date": "2026-10-08",
  "start_time": "09:00",
  "end_time": "10:00",
  "agenda": "Quarterly service review",
  "pic_name": "Aida",
  "representative_name": "Yuliana",
  "meeting_type": "offline",
  "location": "PT Example Office, Jakarta",
  "meeting_link": null,
  "notes": "Catatan opsional"
}
```

`meeting_day`, `schedule_type`, jam mulai/selesai, `agenda`, `pic_name`, `representative_name`, dan `meeting_type` wajib dikirim. Untuk `one_day`, kirim `meeting_date`. Untuk `weekly`, kirim `effective_start_date`. Tipe `offline` memerlukan `location`; tipe `online` memerlukan `meeting_link`. Catatan maksimal 500 karakter.

Slot harus berupa satu jam, dari pukul 08.00 sampai 17.00. Tanggal lampau, slot hari ini yang sudah dimulai, slot di luar aturan, dan jadwal yang bentrok akan ditolak. Jika berhasil, HTTP 201 dengan `{ "meetingId": "UUID meeting" }`.

Kesalahan umum: `VALIDATION_001`, `SCH_002`, atau `SCH_004` (400); `SCH_CLASH_001` jika jadwal bertabrakan (409); `SCH_003` jika sistem tidak dapat memeriksa bentrok (503); `CREATE_001` jika database gagal menyimpan (500).

### `PATCH /customers/{customerId}/meetings` — mengubah meeting atau statusnya

**Dipakai oleh:** formulir edit dan pilihan status di jendela detail meeting. Semua permintaan harus berisi `meetingId`.

Untuk mengubah status saja:

```json
{
  "meetingId": "UUID meeting",
  "status": "completed"
}
```

Status yang diterima: `scheduled`, `completed`, dan `cancelled`. Untuk mengedit detail, kirim field meeting yang ingin diubah, dengan nama yang sama seperti contoh pada endpoint POST.

Meeting yang sudah `completed` tidak dapat diedit atau diubah statusnya. Jika berhasil, hasilnya `{ "meetingId": "UUID meeting" }`.

Kesalahan umum: data tidak valid (`VALIDATION_001`, 400), meeting tidak ditemukan (`NOT_FOUND_001`, 404), jadwal bertabrakan (`SCH_CLASH_001`, 409), meeting selesai terkunci (`MEETING_LOCKED_001`, 409), pemeriksaan jadwal gagal (`SCH_003`, 503), atau database gagal memperbarui (`UPDATE_001`, 500).

### `DELETE /customers/{customerId}/meetings` — menghapus meeting

**Dipakai oleh:** tombol hapus meeting. Body wajib:

```json
{ "meetingId": "UUID meeting" }
```

Meeting yang sudah selesai tidak dapat dihapus. Hasil sukses berisi `{ "meetingId": "UUID meeting" }`. Kemungkinan kesalahan: `VALIDATION_001` (400), `NOT_FOUND_001` (404), `MEETING_LOCKED_001` (409), dan `DELETE_001` (500).

### `POST /meetings` — cara kanonis untuk integrasi tambah meeting

**Dipakai oleh:** belum dipanggil langsung oleh UI saat ini. Route ini disediakan untuk integrasi Planka atau pemanggil API lain. Berbeda dengan route per perusahaan, ID perusahaan dikirim sebagai `company_id` di body.

Contoh:

```json
{
  "company_id": "UUID perusahaan",
  "topic": "Quarterly service review",
  "pic_name": "Aida",
  "rep_name": "Yuliana",
  "type": "offline",
  "location_link": "PT Example Office, Jakarta",
  "frequency": "one-time",
  "date": "2026-10-08",
  "start_time": "09:00",
  "end_time": "10:00",
  "notes": "Catatan opsional"
}
```

Field kontrak Planka (`company_id`, `topic`, `pic_name`, `rep_name`, `type`, `location_link`, `frequency`) wajib, demikian juga tanggal dan slot waktu karena data tersebut diperlukan untuk membuat jadwal. `type` menerima `offline` atau `online` (termasuk label yang mengandung kata Location atau Link). `location_link` disimpan sebagai alamat jika offline atau tautan jika online. `frequency` menerima `one-time`/`one_day` atau variasi weekly. Untuk weekly, `date` menjadi tanggal mulai; `meeting_day` opsional untuk menentukan hari secara langsung. Validasi slot dan bentrok sama dengan route meeting UI. Hasil sukses HTTP 201 dengan `{ "meetingId": "UUID meeting" }`.

### `GET /meetings/slots?date=YYYY-MM-DD` — melihat slot pada tanggal tertentu

**Dipakai oleh:** belum dipanggil UI. Halaman jadwal sekarang menampilkan slot yang dihitung dari data `GET /customers?context=calendar`.

Tanggal wajib memakai format `YYYY-MM-DD` dan tidak boleh sudah lewat. Hasil `data` berisi tanggal dan sembilan slot per jam: 08.00–09.00 sampai 16.00–17.00. Setiap slot menyertakan `start_time`, `end_time`, `available`, `status`, dan `meeting` (ringkasan meeting atau `null`). Status bisa berupa `available`, `past`, `scheduled`, atau `completed`. Meeting yang dibatalkan tidak memblokir slot; meeting selesai tetap tercatat pada slot.

Kesalahan umum: `VALIDATION_001` untuk format/tanggal salah (400), `SCH_004` untuk tanggal lampau (400), `DATABASE_001` jika koneksi database tidak tersedia (503), dan `CAL_001` jika jadwal gagal dibaca (500).

### Aturan otomatis status meeting

Saat data customer atau jadwal dibaca, service memeriksa meeting `one_day`. Meeting yang belum selesai dan waktu akhirnya sudah lewat akan diubah menjadi `cancelled`. Aturan ini tidak membatalkan jadwal berulang `weekly`.

## Dashboard dan transaksi

### Kartu dashboard Sales Executive

Kartu metrik pada halaman `/dashboard/sales-executive` dimuat oleh server, bukan melalui route `/api/v1` terpisah. Nilai total customer dihitung dari `a1_company_list`, meeting minggu ini dari `a1_customer_meetings`, dan kartu **Task** menghitung jumlah baris pada tabel `a2_worksheets`.

Jika akses ke salah satu sumber data gagal, nilai terkait tidak ditampilkan sebagai angka nol; UI menandainya sebagai data tidak tersedia. Hitungan Task adalah jumlah seluruh baris worksheet, bukan hitungan tugas Field Agent yang sudah disaring menurut status/agen. Data transaksi dan worksheet tetap dikelola Squad A2.

### `GET /dashboard/summary` — ringkasan untuk kartu dashboard lama

**Dipakai oleh:** komponen `SummaryCards`. Mengembalikan ringkasan customer dan meeting yang dapat dihitung dari tabel A1. Penghitung Record Conversation bernilai nol karena datanya milik Squad A2. Jika gagal, API mengembalikan `DASHBOARD_001` (500).

Kartu di halaman Sales Executive memakai metrik server di atas, bukan route ini.

### `GET /transactions/summary?page=1&limit=5&search=...` — daftar transaksi dashboard

**Dipakai oleh:** tabel transaksi di dashboard Sales Executive, termasuk pencarian dan pagination.

Route mencari data perusahaan/PIC lalu menghubungkannya dengan `a2_worksheets.transaction_no` dan `job_no`. Hanya baris yang memiliki nomor transaksi yang ditampilkan. `search` mencari perusahaan/PIC sebelum hasil transaksi dibentuk. `meta` berisi `total`, `page`, `limit`, dan `totalPages`.

Urutan saat ini ditentukan dari nomor dengan pola `TRX-MMYY-NNNNN` (tahun, bulan, lalu urutan). Untuk format lain dipakai urutan teks alami menurun. Karena kolom tanggal transaksi resmi dari A2 belum dipastikan, urutan ini belum tentu sama dengan tanggal transaksi terbaru.

Kesalahan umum: `SRCH_001` bila pencarian terisi tetapi tidak ada hasil transaksi (404), dan `SRCH_002` bila pencarian gagal (500).

### `GET /transactions/export?from=YYYY-MM-DD&to=YYYY-MM-DD&search=...` — data ekspor dashboard

**Dipakai oleh:** tombol ekspor PDF/Excel dashboard Sales Executive.

Parameter `from` dan `to` wajib memakai format tanggal tersebut dan `from` tidak boleh setelah `to`. Hasil API adalah JSON berisi perusahaan yang dibuat dalam rentang tanggal inklusif, dengan pencarian opsional berdasarkan nama perusahaan/PIC. API ini tidak mengirim file PDF/Excel; browser membentuk file dari hasil JSON.

Kesalahan umum: `VALIDATION_001` rentang/format tanggal salah (400), `DATABASE_001` koneksi database tidak tersedia (503), dan `EXPORT_001` gagal membaca data (500).

### Ekspor Company List

Company List tidak memakai route ekspor khusus. Halaman mengambil semua halaman yang cocok melalui `GET /customers` (maksimal 100 baris per permintaan), lalu browser membentuk file Excel atau PDF.

## Navigasi sidebar

### `GET /navigation/sidebar` — mengambil menu sesuai role

**Dipakai oleh:** belum dipanggil UI saat ini; sidebar ditampilkan dari konfigurasi komponen frontend.

Memerlukan sesi Supabase yang valid. Route mengembalikan nama role dan daftar menu. Role dibaca dari metadata Supabase; jika tidak ditemukan, route mencoba membaca `b2_register` dan `d3_positions`. Role Field Agent mendapat menu Field Agent; role CRM lainnya mendapat Sales Executive dan entry Field Agent kosong.

Kesalahan umum: `AUTH_001` jika belum login (401), `DATABASE_001` jika database tidak tersedia (503), dan `NAV_001` jika menu gagal dibuat (500).

## Ringkasan DoD Planka

| Kebutuhan | Route / implementasi | Kondisi sekarang |
|---|---|---|
| Tambah meeting dengan `company_id`, topik, PIC, perwakilan, tipe, lokasi/tautan, dan frekuensi | `POST /meetings`; tanggal serta jam slot juga wajib. UI memakai `POST /customers/{customerId}/meetings`. | Route integrasi tersedia; UI memakai route per perusahaan. |
| Slot meeting berdasarkan tanggal | `GET /meetings/slots?date=...` | Tersedia, belum dipanggil langsung UI. |
| Sidebar berdasarkan role | `GET /navigation/sidebar` | Tersedia, tetapi UI masih memakai sidebar frontend. |
| Tambah perusahaan | `POST /customers` | Dipakai UI. |
| Daftar, halaman, dan pencarian perusahaan | `GET /customers?page=&limit=&search=` | Dipakai UI; `perPage` juga masih didukung. |
| Ringkasan transaksi terbaru | `GET /transactions/summary` | Dipakai UI; urutan berdasarkan nomor transaksi karena tanggal A2 belum dikonfirmasi. |
| Pencarian customer | `GET /customers?search=...` | Dipakai Company List. Dashboard mencari lewat `/transactions/summary`. |
| Hitung Task untuk kartu Sales Executive | Server menghitung jumlah baris `a2_worksheets` | Dipakai kartu Task; memerlukan hak baca tabel A2. |

## Batas tanggung jawab data

Data Company List dan Meeting Schedule dikelola A1. Worksheet/transaksi dan tugas Field Agent dikelola Squad A2. Dashboard membaca jumlah baris worksheet A2 untuk kartu Task, tetapi ini hanya jumlah baris; API belum mengklaim jumlah tugas berdasarkan agen atau status. Record Conversation juga bukan bagian yang dikelola A1.
