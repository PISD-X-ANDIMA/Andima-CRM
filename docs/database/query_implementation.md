# SQL Query Implementation — Modul A2: Record Conversation & Field Worksheet Detail

> **Target Database:** Supabase (PostgreSQL)  
> **Modul:** A2 — CRM Sales Executive Dashboard (Record Conversation & Field Worksheet Tracing)  
> **Prefix Kelompok:** `a2_`  
> **Dasar Desain:** Interface `components/InteractionTab.tsx`, `docs/database_structure.md`, dan real schema `docs/schema_database.json`  
> **Status Integrasi Real Database:**
> - User / Sales PIC / Field Inspector: `public.d3_employee(id)` (UUID)  
> - Master Pelanggan: `public.a2_company_list(customer_id)` (BIGINT)  
> - Worksheet Lapangan: `public.a2_worksheets(worksheet_id)` (BIGINT)  

---

## Panduan Eksekusi di Supabase

Jalankan seluruh blok query berikut secara berurutan di **Supabase SQL Editor**. Semua statement menggunakan klausa proteksi `IF NOT EXISTS` dan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` sehingga dijamin aman dan idempotent (dapat dieksekusi berulang tanpa menghapus data atau menimbulkan error tabrakan skema).

---

### Bagian 1: Penyesuaian Tabel Master Eksisting Kelompok A2

```sql
-- 1.1 Menambahkan customer_code pada tabel master pelanggan kelompok A2
-- Digunakan untuk menyimpan kode akun pelanggan (misal: 'CUST-JKT-0941') yang tampil di interface
ALTER TABLE public.a2_company_list 
ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);

-- 1.2 Menambahkan kolom pendukung pada tabel a2_worksheets
-- Menyesuaikan dengan tabel 'Field Agent Tasks & Worksheets' dan Panel Detail 'AGT'
ALTER TABLE public.a2_worksheets 
ADD COLUMN IF NOT EXISTS status_kendala VARCHAR(30) DEFAULT 'normal' CHECK (status_kendala IN ('normal', 'kendala_terdeteksi')),
ADD COLUMN IF NOT EXISTS field_agent_id UUID REFERENCES public.d3_employee(id),
ADD COLUMN IF NOT EXISTS sales_pic_id UUID REFERENCES public.d3_employee(id),
ADD COLUMN IF NOT EXISTS shipper TEXT,
ADD COLUMN IF NOT EXISTS consignee TEXT,
ADD COLUMN IF NOT EXISTS mawb VARCHAR(50),
ADD COLUMN IF NOT EXISTS hawb VARCHAR(50),
ADD COLUMN IF NOT EXISTS handover_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handover_location TEXT,
ADD COLUMN IF NOT EXISTS pihak_penyerah TEXT,
ADD COLUMN IF NOT EXISTS pihak_penerima TEXT,
ADD COLUMN IF NOT EXISTS is_dangerous_goods BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS special_handling TEXT,
ADD COLUMN IF NOT EXISTS has_issue BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS issue_note TEXT,
ADD COLUMN IF NOT EXISTS is_exported_pdf BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

---

### Bagian 2: Tabel Transaksi Percakapan (Modal REC & Tabel Conversation)

```sql
-- 2.1 Tabel Utama Percakapan: public.a2_record_conversations
-- Mencatat hasil inputan dari Modal "Rekaman Komunikasi Pelanggan" (REC)
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

-- Relasikan kembali ke a2_worksheets untuk job reference tracing (opsional)
ALTER TABLE public.a2_worksheets 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.a2_record_conversations(id) ON DELETE SET NULL;

-- 2.2 Tabel Lampiran File Percakapan: public.a2_conversation_files
-- Menyimpan metadata upload file drag-and-drop (.txt / .pdf max 15MB)
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
```

---

### Bagian 3: Tabel Detail Panel AGT (Field Agent Worksheet Detail)

```sql
-- 3.1 Data Fisik Barang (3 Kartu: JUMLAH COIL, ACTUAL PIECES, GROSS WEIGHT)
CREATE TABLE IF NOT EXISTS public.a2_worksheet_physical_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    item_label TEXT NOT NULL, -- Contoh: 'JUMLAH COIL', 'ACTUAL PIECES', 'GROSS WEIGHT'
    item_value TEXT NOT NULL, -- Contoh: '12', '12 Pcs', '2,450 Kg'
    item_unit TEXT,           -- Contoh: 'coil', 'pcs', 'kg'
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Foto Bukti Lapangan (4 Foto Verifikasi: Keseluruhan, Marking/Label, Seal, Kerusakan)
CREATE TABLE IF NOT EXISTS public.a2_worksheet_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    photo_label TEXT NOT NULL, -- Contoh: '1. Foto Keseluruhan', '2. Marking / Label', dll.
    photo_status TEXT NOT NULL, -- 'OK', 'Match', 'Intact', 'No damage'
    photo_url TEXT,
    file_name TEXT,            -- Contoh: 'DSC_0410.JPG'
    taken_at TIMESTAMPTZ,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Dokumen Pendukung Lapangan (Packing List, MSDS)
CREATE TABLE IF NOT EXISTS public.a2_worksheet_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    doc_name TEXT NOT NULL,     -- Contoh: 'Packing List.pdf', 'MSDS.pdf'
    doc_type VARCHAR(10) NOT NULL, -- 'PDF', 'DOCX', 'XLSX'
    file_size_kb INTEGER,
    doc_url TEXT NOT NULL,
    doc_description TEXT,       -- 'Verified', 'Material Safety Sheet'
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES public.d3_employee(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Checklist Centang & Status Masalah (5 Checklist Standard Kelayakan Cargo)
CREATE TABLE IF NOT EXISTS public.a2_worksheet_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id BIGINT NOT NULL REFERENCES public.a2_worksheets(worksheet_id) ON DELETE CASCADE,
    check_label TEXT NOT NULL,  -- 'Quantity & weight match', 'Visual condition good', dll.
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES public.d3_employee(id),
    verified_at TIMESTAMPTZ,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Bagian 4: Indeks & Trigger Otomatis Pembaruan `updated_at`

```sql
-- 4.1 Indeks Optimasi Query
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_cust ON public.a2_record_conversations(customer_id, conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_pic ON public.a2_record_conversations(sales_pic_id);
CREATE INDEX IF NOT EXISTS idx_a2_record_conv_assist ON public.a2_record_conversations(need_assistance);
CREATE INDEX IF NOT EXISTS idx_a2_conv_files_parent ON public.a2_conversation_files(conversation_id);

CREATE INDEX IF NOT EXISTS idx_a2_worksheets_kendala ON public.a2_worksheets(status_kendala);
CREATE INDEX IF NOT EXISTS idx_a2_ws_physical_wsid ON public.a2_worksheet_physical_items(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_a2_ws_photos_wsid ON public.a2_worksheet_photos(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_a2_ws_docs_wsid ON public.a2_worksheet_documents(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_a2_ws_checks_wsid ON public.a2_worksheet_checklists(worksheet_id);

-- 4.2 Function & Trigger Update Otomatis Kolom updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_a2_record_conv_updated_at ON public.a2_record_conversations;
CREATE TRIGGER trg_a2_record_conv_updated_at
    BEFORE UPDATE ON public.a2_record_conversations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_a2_worksheets_updated_at ON public.a2_worksheets;
CREATE TRIGGER trg_a2_worksheets_updated_at
    BEFORE UPDATE ON public.a2_worksheets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

## 5. Ringkasan Pemetaan Terhadap Menu Record Conversation

| Menu / Komponen UI | Tabel Database Terkait | Keterangan & Relasi |
|---|---|---|
| **Modal REC (Input Percakapan)** | `a2_record_conversations` | Menyimpan channel, tanggal, kesimpulan, urgency, dan status need assistance |
| **Modal REC (Upload Chat/PDF)** | `a2_conversation_files` | Menyimpan file lampiran terpisah per sesi percakapan |
| **Tabel Conversation (Utama)** | `a2_record_conversations` join `a2_company_list` | Menampilkan baris pelanggan, sumber, tanggal, butuh asisten, dan prioritas |
| **Tabel Field Agent Tasks** | `a2_worksheets` join `d3_employee` | Menampilkan nomor transaksi, job number, PIC, dan status kendala |
| **Panel AGT (Job & Shipment Info)** | `a2_worksheets` | Header panel, MAWB, HAWB, shipper, consignee, waktu serah terima |
| **Panel AGT (Data Fisik Barang)** | `a2_worksheet_physical_items` | Tiga kartu: Jumlah Coil, Actual Pieces, Gross Weight |
| **Panel AGT (Foto Bukti Lapangan)** | `a2_worksheet_photos` | Empat foto bukti dengan status verifikasi (4/4 Verified) |
| **Panel AGT (Dokumen Pendukung)** | `a2_worksheet_documents` | Daftar PDF: Packing List, MSDS, disertai nama pihak penyerah & penerima |
| **Panel AGT (Checklist Centang)** | `a2_worksheet_checklists` | Lima checklist conformity kargo dan flag dangerous goods / special handling |
