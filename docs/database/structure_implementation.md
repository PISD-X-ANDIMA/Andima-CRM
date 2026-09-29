# Database Implementation Structure — Modul A2: Record Conversation

> **Target Platform:** Supabase (PostgreSQL)  
> **Modul:** A2 — CRM Sales Executive Dashboard (Spesifik Halaman Record Conversation / `InteractionTab.tsx`)  
> **Dasar Desain:** Interface aktif `components/InteractionTab.tsx`, `REQUIREMENT-A2-WEB-DEV.md`, dan real schema database `docs/schema_database.json`  
> **Status:** Final & Terverifikasi (Bebas Konflik)  

---

## 1. Konteks Integrasi Database Riil (Supabase)

Berdasarkan metadata skema riil pada [schema_database.json](file:///c:/choirul/PISD%20A/Andima-CRM/docs/schema_database.json) dari seluruh kelompok:

1. **User / Employee Login (`public.d3_employee`):**
   - Di [database_structure.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/database_structure.md), skema konseptual menggunakan nama generik `users (id UUID)`.
   - Pada database riil yang digunakan bersama, tabel data pengguna/karyawan yang login ke sistem Andima adalah **`public.d3_employee`** dengan Primary Key `id` berjenis `UUID` (`employee_id`, `full_name`, `email`, `avatar_url`, dll).
   - **Keputusan Implementasi:** Seluruh relasi Foreign Key yang mencatat aktor (`sales_pic_id`, `created_by`, `uploaded_by`, `field_agent_id`) dialihkan dan mengikat langsung ke **`public.d3_employee(id)`**.

2. **Master Pelanggan / Company List (`public.a2_company_list`):**
   - Kelompok A2 telah memiliki tabel pelanggan sendiri yaitu **`public.a2_company_list`** dengan Primary Key `customer_id` berjenis `BIGINT` dan `customer_name` (`VARCHAR(150)`).
   - **Keputusan Implementasi:** Foreign Key relasi pelanggan pada transaksi percakapan menggunakan tipe `BIGINT` yang mereferensikan `public.a2_company_list(customer_id)`.
   - Untuk mengakomodasi kode akun pelanggan pada UI (misal: `Acc: CUST-JKT-0941`), kolom `customer_code VARCHAR(50)` ditambahkan pada `public.a2_company_list` dan dicatat pula pada riwayat percakapan.

3. **Field Agent Worksheets (`public.a2_worksheets`):**
   - Kelompok A2 telah memiliki tabel **`public.a2_worksheets`** (`worksheet_id BIGINT`, `transaction_no VARCHAR(20)`, `job_no VARCHAR(30)`, `customer_id BIGINT`, `created_by_user_id BIGINT`, `create_date DATE`).
   - Pada tabel *Field Agent Tasks & Worksheets* di [InteractionTab.tsx](file:///c:/choirul/PISD%20A/Andima-CRM/components/InteractionTab.tsx), terdapat kolom penampil status kendala (*Normal* / *Kendala Terdeteksi*) dan PIC petugas lapangan (e.g. *Marsel*, *Khoirul*).
   - **Keputusan Implementasi:** Mempertahankan tabel eksis dan menambahkan kolom `status_kendala` (`VARCHAR(30)` default `'normal'`), `field_agent_id` (`UUID REFERENCES d3_employee(id)`), serta relasi opsional `conversation_id` tanpa menghapus atau membuat ulang tabel.

---

## 2. Definisi Skema DDL SQL (Safe & Idempotent)

Jalankan query DDL berikut di Supabase SQL Editor:

```sql
-- =========================================================================
-- MODUL A2: CRM SALES EXECUTIVE - RECORD CONVERSATION IMPLEMENTATION
-- Safe execution: Menggunakan IF NOT EXISTS dan ALTER TABLE ADD COLUMN
-- =========================================================================

-- 1. Penyesuaian Kolom pendukung pada tabel pelanggan kelompok A2
ALTER TABLE public.a2_company_list 
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);

-- 2. Tabel Utama: public.a2_record_conversations
-- Menyimpan seluruh sesi komunikasi pelanggan (WhatsApp / Meeting) dari Modal REC
CREATE TABLE IF NOT EXISTS public.a2_record_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number VARCHAR(50),
    customer_id BIGINT NOT NULL REFERENCES public.a2_company_list(customer_id),
    customer_code VARCHAR(50),
    sales_pic_id UUID NOT NULL REFERENCES public.d3_employee(id),
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('WhatsApp', 'Meeting')),
    conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    need_assistance BOOLEAN NOT NULL DEFAULT FALSE,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('high_priority', 'average', 'critical', 'standard')),
    synced_to_ctrack BOOLEAN NOT NULL DEFAULT TRUE,
    document_urls TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL REFERENCES public.d3_employee(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Lampiran Dokumen: public.a2_conversation_files
-- Menyimpan metadata file upload dari Modal REC (Chat export .txt / Meeting notes PDF)
CREATE TABLE IF NOT EXISTS public.a2_conversation_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.a2_record_conversations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('txt', 'pdf', 'docx', 'xlsx', 'jpg', 'png')),
    file_url TEXT NOT NULL,
    file_size_kb INTEGER,
    uploaded_by UUID NOT NULL REFERENCES public.d3_employee(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Penyesuaian Tabel Lapangan: public.a2_worksheets
-- Menyesuaikan dengan tabel 'Field Agent Tasks & Worksheets' pada InteractionTab.tsx
ALTER TABLE public.a2_worksheets 
ADD COLUMN IF NOT EXISTS status_kendala VARCHAR(30) DEFAULT 'normal' CHECK (status_kendala IN ('normal', 'kendala_terdeteksi')),
ADD COLUMN IF NOT EXISTS field_agent_id UUID REFERENCES public.d3_employee(id),
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.a2_record_conversations(id);

-- 5. Indeks untuk Akselerasi Query Dashboard
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_cust ON public.a2_record_conversations(customer_id, conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_pic ON public.a2_record_conversations(sales_pic_id);
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_assist ON public.a2_record_conversations(need_assistance);
CREATE INDEX IF NOT EXISTS idx_a2_conv_files_parent ON public.a2_conversation_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_a2_worksheets_kendala ON public.a2_worksheets(status_kendala);
```

---

## 3. Matriks Alignment Interface UI terhadap Database (100% Align)

Berikut adalah pemetaan setiap komponen tampilan pada [InteractionTab.tsx](file:///c:/choirul/PISD%20A/Andima-CRM/components/InteractionTab.tsx) dengan kolom database:

| Bagian Interface | Elemen Tampilan UI | Kolom Database | Tipe Data & Constraint | Sumber Tabel |
|---|---|---|---|---|
| **Modal REC** | Dropdown `Select Customer Account *` | `customer_id`, `customer_code` | `BIGINT NOT NULL`, `VARCHAR(50)` | `a2_record_conversations` join `a2_company_list` |
| **Modal REC** | Pilihan `Jenis Channel *` (`WhatsApp` / `Meeting`) | `channel_type` | `VARCHAR(20) NOT NULL` | `a2_record_conversations` |
| **Modal REC** | Upload Dokumen (`.txt`, `.pdf` Max 15MB) | `file_name`, `file_type`, `file_url`, `file_size_kb` | `TEXT`, `VARCHAR(10)`, `TEXT`, `INTEGER` | `a2_conversation_files` |
| **Modal REC** | Textarea `Kesimpulan *` | `summary` | `TEXT NOT NULL` | `a2_record_conversations` |
| **Modal REC** | Opsi `Need Assistance?` (`No` / `Yes`) | `need_assistance` | `BOOLEAN NOT NULL DEFAULT FALSE` | `a2_record_conversations` |
| **Modal REC** | Radio `Urgency Level` (`Tingkat Kritis` / `Tingkat Standar`) | `urgency_level` | `VARCHAR(20)` (`high_priority` / `average`) | `a2_record_conversations` |
| **Modal REC** | Badge Footer `Auto-synced with C-Track Timeline` | `synced_to_ctrack` | `BOOLEAN NOT NULL DEFAULT TRUE` | `a2_record_conversations` |
| **Tabel Percakapan** | Kolom `PELANGGAN` (Nama & `Acc: CUST-xxx`) | `customer_name`, `customer_code` | `VARCHAR(150)`, `VARCHAR(50)` | `a2_company_list` |
| **Tabel Percakapan** | Kolom `SUMBER` (Badge Channel) | `channel_type` | `VARCHAR(20)` | `a2_record_conversations` |
| **Tabel Percakapan** | Kolom `TANGGAL` (e.g. `20 Sep 2026`) | `conversation_date` | `DATE NOT NULL` | `a2_record_conversations` |
| **Tabel Percakapan** | Kolom `BUTUH ASISTEN` (Badge `Yes` / `No`) | `need_assistance` | `BOOLEAN NOT NULL` | `a2_record_conversations` |
| **Tabel Percakapan** | Kolom `PRIORITAS` (Badge `High` / `—`) | `urgency_level` | `VARCHAR(20)` | `a2_record_conversations` |
| **Tabel Percakapan** | Kolom `AKSI` (Tombol `View`) | `id` | `UUID PK` | `a2_record_conversations` |
| **Tabel Worksheet** | Kolom `NOMOR TRANSAKSI` | `transaction_no` | `VARCHAR(20)` | `a2_worksheets` |
| **Tabel Worksheet** | Kolom `NOMOR PEKERJAAN` | `job_no` | `VARCHAR(30)` | `a2_worksheets` |
| **Tabel Worksheet** | Kolom `NAMA PELANGGAN` | `customer_name` | `VARCHAR(150)` | `a2_company_list` |
| **Tabel Worksheet** | Kolom `DIBUAT OLEH / PIC` | `field_agent_id` -> `full_name` | `UUID` -> `VARCHAR(255)` | `a2_worksheets` join `d3_employee` |
| **Tabel Worksheet** | Kolom `STATUS KENDALA` (`Normal` / `Kendala Terdeteksi`) | `status_kendala` | `VARCHAR(30)` (`normal` / `kendala_terdeteksi`) | `a2_worksheets` |

---

## 4. Evaluasi Cross-Check Bebas Tabrakan dengan File Lain di `/docs`

Setiap kalimat dan definisi skema pada rancangan ini telah dicek silang terhadap seluruh file di folder `/docs`:

1. **Terhadap [docs/database_structure.md](file:///c:/choirul/PISD%20A/Andima-CRM/docs/database_structure.md):**
   - **Status:** **Tidak Bertabrakan (Harmonis).**
   - **Evaluasi:** Dokumen `database_structure.md` mendeskripsikan arsitektur global seluruh CRM (termasuk modul Follow-up dan Complaints). Implementasi A2 mengambil spesifikasi `conversations` (Section 3) dan `conversation_files` (Section 4), melokalisasinya dengan prefix `a2_` (`a2_record_conversations` dan `a2_conversation_files`), serta menautkan Foreign Key user ke tabel sistem nyata (`d3_employee`) alih-alih tabel generik `users`.
2. **Terhadap [docs/schema_database.json](file:///c:/choirul/PISD%20A/Andima-CRM/docs/schema_database.json):**
   - **Status:** **Tidak Bertabrakan (100% Kompatibel).**
   - **Evaluasi:** Tidak ada bentrokan nama objek tabel di skema `public`. Tabel baru menggunakan namespace kelompok `a2_`. Kolom tambahan pada tabel yang sudah ada (`a2_company_list` dan `a2_worksheets`) menggunakan perintah aman `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, sehingga data dan struktur yang dibuat sebelumnya tidak akan terhapus ataupun error saat skrip dieksekusi ulang.
3. **Terhadap [REQUIREMENT-A2-WEB-DEV.md](file:///c:/choirul/PISD%20A/Andima-CRM/REQUIREMENT-A2-WEB-DEV.md):**
   - **Status:** **Sesuai 100% Scope Kelompok A2.**
   - **Evaluasi:** Menjaga batasan arsitektur di mana modul A2 hanya mengelola record percakapan sales executive, dan mengonsumsi data pelanggan (A1/Company List) serta data karyawan (HRMS/`d3_employee`) secara read-only via Foreign Key.
