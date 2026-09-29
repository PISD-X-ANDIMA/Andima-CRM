# Requirement Document — Modul A2: CRM Sales Executive Dashboard

| Field | Value |
| --- | --- |
| **Project** | Andima CRM |
| **Modul** | A2 — Interaksi Pelanggan (Sales Executive Dashboard) |
| **Tech Stack** | Next.js (App Router) + Supabase + TypeScript |
| **Tanggal** | 29-09-2026 |
| **Status** | Draft |

---

## Daftar Isi

1. [Konteks & Scope](#1-konteks--scope)
2. [User Roles & Hak Akses](#2-user-roles--hak-akses)
3. [Database Schema (Supabase)](#3-database-schema-supabase)
4. [Supabase Storage](#4-supabase-storage)
5. [Halaman & Fitur](#5-halaman--fitur)
6. [API Endpoints](#6-api-endpoints)
7. [Integrasi dengan Modul Lain](#7-integrasi-dengan-modul-lain)
8. [Validasi & Error Handling](#8-validasi--error-handling)
9. [Business Rules](#9-business-rules)
10. [Deliverables](#10-deliverables)

---

## 1. Konteks & Scope

Modul A2 adalah dashboard web untuk **Sales Executive** mengelola interaksi pelanggan. Modul ini **tidak** menangani:

- Autentikasi/login (ditangani MID, di luar scope)
- Data master pelanggan (dari modul A1 — Company List)
- Data field agent & task (dari modul A3)
- Data karyawan (dari HRMS)

Modul A2 **hanya mengonsumsi** data di atas secara **read-only**.

### Yang Dibangun di Modul A2

| # | Fitur | Deskripsi Singkat |
|---|-------|-------------------|
| 1 | Record Conversation | Catat weekly meeting, percakapan informal, upload dokumen, tandai urgency & need assistance |
| 2 | Pemantauan Permintaan Bantuan | Lihat & tindaklanjuti permintaan bantuan dari A3, kelola status, catat eskalasi |
| 3 | Riwayat Penanganan Kasus | History trail semua pembahasan & keputusan per kasus (append-only) |

---

## 2. User Roles & Hak Akses

| Role | Akses |
|------|-------|
| **Sales Executive** | CRUD Record Conversation, update status Permintaan Bantuan, catat eskalasi, lihat riwayat |
| **Customer Success** | Read-only semua Record Conversation |

> **Catatan:** Mekanisme role & auth di-handle MID. Dev cukup terima user info (role, id) dari session/token yang sudah disediakan.

---

## 3. Database Schema (Supabase)

Semua tabel dibuat di **Supabase PostgreSQL**. Berikut skema yang harus dibuat:

### 3.1 `weekly_meeting_schedules`

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `job_number` | `varchar` | NOT NULL | Referensi ke job number sales |
| `customer_id` | `uuid` | NOT NULL | FK ke Company List (A1) |
| `sales_executive_id` | `uuid` | NOT NULL | FK ke data karyawan (HRMS) |
| `scheduled_date` | `timestamptz` | NOT NULL | Tanggal & waktu meeting |
| `notes` | `text` | NULLABLE | Catatan tambahan |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

### 3.2 `informal_conversations`

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `job_number` | `varchar` | NOT NULL | |
| `customer_id` | `uuid` | NOT NULL | FK ke A1 |
| `sales_executive_id` | `uuid` | NOT NULL | FK ke HRMS |
| `content` | `text` | NOT NULL | Isi catatan percakapan (misal dari WhatsApp) |
| `conversation_date` | `timestamptz` | NOT NULL | Tanggal percakapan terjadi |
| `created_at` | `timestamptz` | default `now()` | |

### 3.3 `record_conversations`

Tabel utama. Mencatat hasil weekly meeting dan/atau percakapan informal sebagai satu kesatuan record.

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `job_number` | `varchar` | NOT NULL | Dari list pekerjaan sales |
| `customer_id` | `uuid` | NOT NULL | FK ke A1 |
| `sales_executive_id` | `uuid` | NOT NULL | FK ke HRMS |
| `resume_conclusion` | `text` | NOT NULL | Ringkasan/kesimpulan percakapan |
| `need_assistance` | `boolean` | NOT NULL, default `false` | Tandai butuh bantuan atau tidak |
| `urgency` | `varchar` | NOT NULL, enum: `high_priority`, `average` | Level urgensi |
| `document_urls` | `text[]` | NULLABLE | Array path file di Supabase Storage |
| `conversation_date` | `timestamptz` | NOT NULL | Tanggal percakapan/meeting |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

### 3.4 `permintaan_bantuan`

Data disinkronkan dari modul A3. A2 **tidak** membuat data baru, hanya membaca & mengupdate status.

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK | Dari A3 |
| `job_number` | `varchar` | NOT NULL | |
| `customer_id` | `uuid` | NOT NULL | |
| `status` | `varchar` | NOT NULL, enum: `open`, `on_progress`, `need_review`, `closed` | |
| `description` | `text` | NULLABLE | Deskripsi permintaan |
| `created_at` | `timestamptz` | NOT NULL | Tanggal dibuat di A3 |
| `updated_at` | `timestamptz` | default `now()` | |
| `escalation_flagged` | `boolean` | default `false` | Auto-flag kalau >30 hari belum closed |

### 3.5 `escalations`

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `permintaan_bantuan_id` | `uuid` | NOT NULL, FK ke `permintaan_bantuan.id` | |
| `decision` | `text` | NOT NULL | Hasil keputusan rapat top management |
| `meeting_date` | `date` | NOT NULL | Tanggal rapat |
| `recorded_by` | `uuid` | NOT NULL | Sales Executive yang mencatat |
| `created_at` | `timestamptz` | default `now()` | |

### 3.6 `case_histories`

Append-only log. **Tidak boleh** di-update atau di-delete.

| Column | Type | Constraint | Keterangan |
|--------|------|------------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `permintaan_bantuan_id` | `uuid` | NULLABLE, FK | Kalau terkait permintaan bantuan |
| `record_conversation_id` | `uuid` | NULLABLE, FK | Kalau terkait record conversation |
| `job_number` | `varchar` | NOT NULL | |
| `customer_id` | `uuid` | NOT NULL | |
| `discussion_summary` | `text` | NOT NULL | Isi pembahasan |
| `decision` | `text` | NULLABLE | Keputusan (kalau ada) |
| `outcome` | `text` | NULLABLE | Hasil penanganan |
| `recorded_by` | `uuid` | NOT NULL | Sales Executive |
| `discussion_date` | `timestamptz` | NOT NULL | Tanggal pembahasan |
| `created_at` | `timestamptz` | default `now()` | |

> **PENTING:** Tabel `case_histories` bersifat **INSERT-only**. Tidak boleh ada UPDATE atau DELETE. Setiap entry baru menambah riwayat, bukan menggantikan.

---

## 4. Supabase Storage

### Bucket: `record-documents`

| Rule | Value |
|------|-------|
| **Format yang diizinkan** | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX), `image/jpeg`, `image/png` |
| **Max file size** | 10 MB per file |
| **Naming convention** | `{job_number}/{record_conversation_id}/{filename}` |
| **Akses** | Authenticated users only (RLS) |

---

## 5. Halaman & Fitur

### 5.1 Dashboard / Home

- Overview jumlah Record Conversation terbaru
- Jumlah Permintaan Bantuan aktif (Open + On Progress)
- Permintaan Bantuan yang sudah >30 hari (kandidat eskalasi) — highlight visual

### 5.2 Record Conversation

#### 5.2.1 List View

- Tabel/list semua record conversation milik Sales Executive yang login
- Filter: berdasarkan customer, job number, urgency, need assistance, rentang tanggal
- Sorting: tanggal terbaru (default)
- Visual indicator untuk record yang `need_assistance = true` (badge/warna merah/ikon)
- Customer Success bisa lihat semua record (bukan cuma punya sendiri)

#### 5.2.2 Form Buat Record Conversation Baru

| Field | Input Type | Wajib | Keterangan |
|-------|-----------|-------|------------|
| Job Number | Dropdown/searchable select | Ya | Dari list pekerjaan sales yang login |
| Customer | Dropdown/searchable select | Ya | Dari Company List A1, auto-filter berdasarkan job number kalau memungkinkan |
| Tanggal Percakapan | Date picker | Ya | |
| Resume / Conclusion | Textarea | Ya | Min 10 karakter |
| Need Assistance | Toggle (Ya/Tidak) | Ya | Default: Tidak |
| Urgency | Radio/Select: High Priority / Average | Ya | Default: Average |
| Upload Document | File upload (multi-file) | Tidak | Max 10MB per file, format: PDF/DOCX/XLSX/JPG/PNG |

**Tampilan read-only di form:**
- Task of Field Agent (dari A3) — tampilkan sebagai info box, tidak bisa diedit

#### 5.2.3 Detail View

- Tampilkan semua field record conversation
- List file yang di-upload (bisa preview/download)
- Link ke riwayat penanganan kasus terkait

### 5.3 Penjadwalan Weekly Meeting

#### 5.3.1 List View

- Kalender atau list view jadwal meeting
- Filter: customer, rentang tanggal

#### 5.3.2 Form Buat Jadwal

| Field | Input Type | Wajib |
|-------|-----------|-------|
| Job Number | Dropdown/searchable select | Ya |
| Customer | Dropdown/searchable select | Ya |
| Tanggal & Waktu | Datetime picker | Ya |
| Catatan | Textarea | Tidak |

### 5.4 Pencatatan Percakapan Informal

#### 5.4.1 Form Catat Percakapan

| Field | Input Type | Wajib |
|-------|-----------|-------|
| Job Number | Dropdown/searchable select | Ya |
| Customer | Dropdown/searchable select | Ya |
| Tanggal Percakapan | Date picker | Ya |
| Isi Catatan | Textarea | Ya |

### 5.5 Permintaan Bantuan

#### 5.5.1 List View

- List semua permintaan bantuan yang disinkronkan dari A3
- Tampilkan status: `Open`, `On Progress`, `Need Review`, `Closed`
- **Visual flag** untuk permintaan yang sudah >30 hari tanpa penyelesaian (kandidat eskalasi)
- Filter: status, job number, customer, rentang tanggal
- Sales Executive **tidak bisa** membuat permintaan bantuan baru dari A2

#### 5.5.2 Detail & Update Status

- Sales Executive bisa mengubah status permintaan bantuan
- Transisi status yang valid:
  - `open` → `on_progress`
  - `on_progress` → `need_review`
  - `need_review` → `closed`
  - `on_progress` → `closed`
- Transisi tidak valid harus ditolak (misal `closed` → `open`)

#### 5.5.3 Form Catat Eskalasi

Muncul ketika Sales Executive ingin mencatat keputusan eskalasi.

| Field | Input Type | Wajib |
|-------|-----------|-------|
| Permintaan Bantuan | Auto-filled (dari konteks) | Ya |
| Hasil Keputusan | Textarea | Ya |
| Tanggal Rapat | Date picker | Ya |

> **Catatan:** Eskalasi tidak otomatis. Sistem hanya menandai kandidat eskalasi (>30 hari). Pencatatan keputusan eskalasi dilakukan manual oleh Sales Executive setelah rapat dengan top management.

### 5.6 Riwayat Penanganan Kasus

#### 5.6.1 List View

- Timeline/list semua riwayat penanganan per kasus
- Filter: job number, customer, rentang tanggal
- Tampilkan: tanggal pembahasan, ringkasan, keputusan, hasil, siapa yang catat

#### 5.6.2 Form Tambah Riwayat

| Field | Input Type | Wajib |
|-------|-----------|-------|
| Job Number | Dropdown/searchable select | Ya |
| Customer | Dropdown/searchable select | Ya |
| Terkait Permintaan Bantuan | Dropdown (opsional) | Tidak |
| Terkait Record Conversation | Dropdown (opsional) | Tidak |
| Ringkasan Pembahasan | Textarea | Ya |
| Keputusan | Textarea | Tidak |
| Hasil Penanganan | Textarea | Tidak |
| Tanggal Pembahasan | Date picker | Ya |

> **Tidak ada tombol edit/delete** untuk riwayat yang sudah tersimpan. Append-only.

---

## 6. API Endpoints

Semua endpoint menggunakan **Supabase Client SDK** (bukan REST manual). Kalau pakai Next.js App Router, gunakan **Server Actions** atau **Route Handlers** (`app/api/`).

Tetap sediakan **Postman collection** untuk dokumentasi & testing oleh tim lain.

### 6.1 Record Conversation

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/record-conversations` | Buat record conversation baru |
| `GET` | `/api/record-conversations` | List record conversations (filter: customer, job, urgency, need_assistance, date range) |
| `GET` | `/api/record-conversations/:id` | Detail record conversation |

### 6.2 Weekly Meeting

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/weekly-meetings` | Buat jadwal meeting |
| `GET` | `/api/weekly-meetings` | List jadwal meeting |

### 6.3 Informal Conversation

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/informal-conversations` | Catat percakapan informal |
| `GET` | `/api/informal-conversations` | List percakapan informal |

### 6.4 Permintaan Bantuan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/permintaan-bantuan` | List permintaan bantuan (dari A3) |
| `GET` | `/api/permintaan-bantuan/:id` | Detail permintaan bantuan |
| `PATCH` | `/api/permintaan-bantuan/:id/status` | Update status |

### 6.5 Eskalasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/escalations` | Catat keputusan eskalasi |
| `GET` | `/api/escalations` | List eskalasi (filter: permintaan_bantuan_id) |

### 6.6 Riwayat Penanganan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/case-histories` | Tambah riwayat |
| `GET` | `/api/case-histories` | List riwayat (filter: job_number, customer_id, date range) |

### 6.7 Data Referensi (Read-Only)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/customers` | Data pelanggan dari A1 |
| `GET` | `/api/jobs` | Job number dari list pekerjaan sales |
| `GET` | `/api/field-agent-tasks` | Task of Field Agent dari A3 |

---

## 7. Integrasi dengan Modul Lain

| Modul | Data yang Diambil | Cara Integrasi | Catatan |
|-------|-------------------|----------------|---------|
| **A1** (Company List) | Data pelanggan (id, nama, detail) | Read-only query ke tabel A1 di Supabase | Jangan duplikasi data, cukup referensi `customer_id` |
| **A3** (Field Agent) | Permintaan Bantuan, Task of Field Agent | Sinkronisasi data ke tabel `permintaan_bantuan` | Mekanisme sync perlu dikoordinasikan dengan squad A3 (webhook / cron / realtime subscription) |
| **HRMS** | Data karyawan / Sales Executive | Read-only | Untuk nama & identitas pencatat |
| **MID** | Auth / Login | Session / token sudah disediakan | Dev cukup baca user info dari session |

### Catatan Sinkronisasi A3

Sinkronisasi data Permintaan Bantuan dari A3 bisa pakai salah satu mekanisme berikut (koordinasi dengan squad A3):

1. **Supabase Realtime** — subscribe ke perubahan tabel A3
2. **Webhook** — A3 kirim webhook saat ada permintaan bantuan baru
3. **Polling** — cron job periodik baca data A3

Pilih mekanisme berdasarkan kesepakatan dengan squad A3. Kalau belum ada kesepakatan, implementasi awal bisa pakai **shared database** (A2 query langsung ke tabel A3 di Supabase yang sama).

---

## 8. Validasi & Error Handling

### 8.1 Validasi Input

| Validasi | Rule |
|----------|------|
| File upload format | Hanya PDF, DOCX, XLSX, JPG, PNG |
| File upload size | Max 10 MB per file |
| Resume/Conclusion | Wajib diisi, min 10 karakter |
| Job number | Harus ada di list pekerjaan sales yang login |
| Customer | Harus ada di Company List A1 |
| Status transition | Hanya transisi valid yang diizinkan (lihat section 5.5.2) |

### 8.2 Error States

| Kondisi | Response |
|---------|----------|
| File melebihi 10 MB | Tolak upload, tampilkan: *"Ukuran file melebihi batas maksimal 10 MB"* |
| Format file tidak didukung | Tolak upload, tampilkan: *"Format file tidak didukung. Gunakan PDF, DOCX, XLSX, JPG, atau PNG"* |
| Job number tidak ditemukan | Tampilkan: *"Data job tidak ditemukan"* |
| Koneksi Supabase gagal | Tampilkan: *"Gagal terhubung ke server. Silakan coba lagi"* |
| Sinkronisasi A3 gagal | Tampilkan: *"Gagal memuat data terbaru. Data terakhir: [timestamp]"* + tombol retry |
| Transisi status tidak valid | Tolak perubahan, tampilkan: *"Perubahan status tidak valid"* |

### 8.3 Empty States

| Kondisi | Tampilan |
|---------|----------|
| Belum ada Record Conversation | Tampilkan ilustrasi kosong + tombol *"Buat Record Conversation Pertama"* |
| Tidak ada Permintaan Bantuan aktif | Tampilkan pesan: *"Tidak ada permintaan bantuan aktif"* |
| Belum ada riwayat penanganan | Tampilkan pesan: *"Belum ada riwayat penanganan untuk kasus ini"* |

---

## 9. Business Rules

### Umum

1. Pengisian Record Conversation **tidak wajib** harian/mingguan — sesuai kebutuhan
2. Semua Record Conversation disimpan **permanen** sebagai riwayat
3. Data job & data pelanggan **tidak dibuat ulang** di A2, hanya direferensikan

### Record Conversation

4. Hanya **Sales Executive** yang bisa membuat Record Conversation
5. Setiap record harus terkait dengan **job number** dan **customer**
6. Record yang ditandai `need_assistance = true` harus tampil dengan **visual highlight**

### Permintaan Bantuan

7. A2 **tidak bisa** membuat Permintaan Bantuan baru — hanya menampilkan & menindaklanjuti
8. Kandidat eskalasi muncul **otomatis** setelah 30 hari tanpa penyelesaian
9. Keputusan eskalasi dicatat **manual** berdasarkan hasil rapat top management (bukan otomatis)

### Riwayat Penanganan

10. Riwayat bersifat **append-only** — tidak boleh edit atau hapus entry yang sudah ada
11. Setiap riwayat harus terkait dengan **job number** dan **customer**
12. Riwayat hanya bisa dilihat oleh pengguna yang memiliki akses (sesuai role)

---

## 10. Deliverables

| # | Deliverable | Keterangan |
|---|-------------|------------|
| 1 | **Source code** Next.js project | App Router, TypeScript, terstruktur rapi |
| 2 | **Supabase migration files** | SQL migration untuk semua tabel + RLS policies |
| 3 | **Supabase Storage config** | Bucket `record-documents` + policies |
| 4 | **Postman collection** | Semua endpoint terdokumentasi, siap ditest |
| 5 | **README** | Cara setup, env variables, cara run lokal |
| 6 | **Environment variables** | Template `.env.example` berisi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dll |

---

## Catatan untuk Developer

1. **Supabase RLS (Row Level Security)** — aktifkan dan buat policy per tabel berdasarkan role user
2. **Optimistic UI** — untuk update status permintaan bantuan, pertimbangkan optimistic update biar UX responsif
3. **Pagination** — semua list view harus pakai pagination (cursor-based atau offset)
4. **Tanggal & Timezone** — simpan semua timestamp dalam UTC (`timestamptz`), tampilkan sesuai timezone user
5. **File naming** — hindari karakter spesial di nama file upload, sanitize sebelum simpan
6. **`case_histories` immutability** — pastikan tidak ada endpoint UPDATE/DELETE untuk tabel ini. Enforce di RLS level juga
