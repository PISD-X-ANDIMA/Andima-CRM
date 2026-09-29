# Database Structure — Andima CRM
> Platform: **Supabase (PostgreSQL)**
> Basis: Interface aktif per 29 Sep 2026.
> Konvensi: `snake_case`, `UUID` sebagai PK, `TIMESTAMPTZ` untuk semua timestamp.

---

## ENUM Types
> Buat terlebih dahulu sebelum membuat tabel manapun.

```sql
-- Channel percakapan
CREATE TYPE channel_type_enum AS ENUM ('WhatsApp', 'Meeting');

-- Level urgensi percakapan
CREATE TYPE urgency_level_enum AS ENUM ('critical', 'standard');

-- Status percakapan
CREATE TYPE conversation_status_enum AS ENUM ('active', 'archived');

-- Status worksheet lapangan
CREATE TYPE status_kendala_enum AS ENUM ('normal', 'kendala_terdeteksi');

-- Prioritas follow-up / alert
CREATE TYPE priority_enum AS ENUM ('High', 'Medium', 'Low');

-- Prioritas alert complaints
CREATE TYPE alert_priority_enum AS ENUM ('high', 'average');

-- Status follow-up task
CREATE TYPE task_status_enum AS ENUM ('open', 'on_progress', 'closed');

-- Status workspace complaints
CREATE TYPE workspace_status_enum AS ENUM ('open', 'in_progress', 'resolved');

-- Mode intervensi CS
CREATE TYPE intervention_mode_enum AS ENUM ('internal_note', 'reply_client', 'field_team');

-- Tipe SLA
CREATE TYPE sla_type_enum AS ENUM ('urgent', 'standard');

-- Arah pesan chat
CREATE TYPE message_direction_enum AS ENUM ('in', 'out');

-- Tipe file upload
CREATE TYPE file_type_enum AS ENUM ('txt', 'pdf');

-- Role user sistem
CREATE TYPE user_role_enum AS ENUM ('Sales Executive', 'CS Staff', 'Field Inspector', 'Dispatcher');
```

---

## Daftar Tabel

| No | Tabel | Digunakan Oleh |
|----|-------|----------------|
| 1 | `users` | Semua tab (Sales PIC, CS, Field Agent) |
| 2 | `customers` | Semua tab |
| 3 | `conversations` | Tab Interactions — tabel Conversation |
| 4 | `conversation_files` | Tab Interactions — REC modal (uploaded file) |
| 5 | `field_worksheets` | Tab Interactions — tabel Field Agent Tasks |
| 6 | `worksheet_physical_items` | AGT panel — Data Fisik Barang |
| 7 | `worksheet_photos` | AGT panel — Foto Bukti Lapangan |
| 8 | `worksheet_documents` | AGT panel — Dokumen Pendukung |
| 9 | `worksheet_checklists` | AGT panel — Checklist Centang |
| 10 | `followup_tasks` | Tab Follow-up |
| 11 | `assistance_alerts` | Tab Complaints — feed card |
| 12 | `alert_chat_messages` | Tab Complaints — WhatsApp chat replay |
| 13 | `alert_action_checklists` | Tab Complaints — checklist di workspace |
| 14 | `cs_workspace_responses` | Tab Complaints — Form Aksi Respon & Intervensi CS |

---

## 1. `users`
> Semua staf internal Andima: Sales Executive, CS Staff, Field Inspector, Dispatcher.

```sql
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT        NOT NULL,
  initials      VARCHAR(5)  NOT NULL,
  -- Contoh: 'KA', 'M', 'YS', 'I', 'N'
  role          user_role_enum NOT NULL,
  -- 'Sales Executive' | 'CS Staff' | 'Field Inspector' | 'Dispatcher'
  team          TEXT,
  -- Contoh: 'Sales Team A', 'Sales Executive'
  location      TEXT,
  -- Contoh: 'Surabaya', 'Jakarta', 'Tanjung Priok'
  duty_shift    TEXT,
  -- Contoh: 'Tanjung Priok - S1'
  email         TEXT        UNIQUE NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. `customers`
> Master data pelanggan (perusahaan klien Andima). Dipakai di semua tab sebagai FK.

```sql
CREATE TABLE customers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(30) UNIQUE NOT NULL,
  -- Contoh: 'CUST-JKT-0941', 'CUST-SBY-0418', 'CUST-MDN-0442'
  name          TEXT        NOT NULL,
  -- Contoh: 'PT DSV Transport Indonesia', 'PT Sinar Logistik'
  industry      TEXT,
  -- Contoh: 'Maritime & Industrial Freight', 'Freight Forwarding'
  city          TEXT,
  -- Contoh: 'Jakarta', 'Surabaya', 'Medan'
  address       TEXT,
  pic_name      TEXT,
  -- Nama kontak utama dari sisi klien, contoh: 'Bpk. Hendra'
  pic_phone     TEXT,
  pic_email     TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. `conversations`
> Sumber: Tab Interactions — tabel Conversation + modal Rekaman Komunikasi Pelanggan (REC).
> Satu record = satu sesi percakapan yang direkam Sales dengan klien.

```sql
CREATE TABLE conversations (
  id                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID                    NOT NULL REFERENCES customers(id),
  sales_pic_id      UUID                    NOT NULL REFERENCES users(id),
  -- Sales yang merekam percakapan ini (dropdown "Select Customer Account")
  channel_type      channel_type_enum       NOT NULL,
  -- 'WhatsApp' = pilihan "WhatsApp (.txt)" di REC modal
  -- 'Meeting'  = pilihan "Meeting Document" di REC modal
  conversation_date DATE                    NOT NULL,
  -- Tanggal percakapan, contoh: '2026-09-20'
  summary           TEXT                    NOT NULL,
  -- Isian textarea Kesimpulan (field wajib, bintang merah)
  need_assistance   BOOLEAN                 NOT NULL DEFAULT FALSE,
  -- FALSE = 'No (Standard Log)'
  -- TRUE  = 'Yes (Send Alert)' — memicu pembuatan assistance_alert
  urgency_level     urgency_level_enum,
  -- NULL jika need_assistance = FALSE
  -- 'critical' = Tingkat Kritis / High Priority
  -- 'standard' = Tingkat Standar / Average
  synced_to_ctrack  BOOLEAN                 NOT NULL DEFAULT FALSE,
  -- Flag "Auto-synced with C-Track Timeline" di footer REC modal
  status            conversation_status_enum NOT NULL DEFAULT 'active',
  created_by        UUID                    NOT NULL REFERENCES users(id),
  -- User yang menekan tombol Simpan di REC modal
  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);
```

---

## 4. `conversation_files`
> Sumber: REC modal — area drag & drop "Upload chat export .txt or meeting notes PDF".
> Satu conversation dapat memiliki satu file upload.

```sql
CREATE TABLE conversation_files (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID           NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  file_name       TEXT           NOT NULL,
  -- Contoh: 'chat_export_20sep.txt', 'meeting_notes_q3.pdf'
  file_type       file_type_enum NOT NULL,
  -- 'txt' | 'pdf'
  file_url        TEXT           NOT NULL,
  -- Public URL dari Supabase Storage
  file_size_kb    INTEGER,
  -- Ukuran dalam KB. Batas max: 15360 KB (15MB sesuai label UI)
  uploaded_by     UUID           NOT NULL REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

---

## 5. `field_worksheets`
> Sumber: Tab Interactions — tabel Field Agent Tasks & Worksheets + panel AGT (Field Agent Worksheet).
> Satu record = satu job lapangan dengan seluruh data inspeksi fisik.

```sql
CREATE TABLE field_worksheets (
  id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_number      VARCHAR(30)          UNIQUE NOT NULL,
  -- Contoh: 'TRX-0526-03382', 'TRX-0526-03381'
  job_number      TEXT                 NOT NULL,
  -- Contoh: '#AENAT/2605/2551', '#DSVEXP/2605/2551'
  -- Ditampilkan sebagai subtitle biru di header AGT panel
  customer_id     UUID                 NOT NULL REFERENCES customers(id),
  conversation_id UUID                 REFERENCES conversations(id),
  -- FK opsional: worksheet bisa terhubung ke conversation asal
  sales_pic_id    UUID                 REFERENCES users(id),
  -- Sales PIC (ditampilkan di Job Info - Sales di AGT panel): Adelia
  field_agent_id  UUID                 NOT NULL REFERENCES users(id),
  -- Field Inspector (kolom DIBUAT OLEH / PIC di tabel): Marsel, Khoirul
  created_by      UUID                 NOT NULL REFERENCES users(id),

  -- SHIPMENT INFORMATION (AGT panel section 2)
  shipper         TEXT,
  -- 'PT Example Shipper'
  consignee       TEXT,
  -- 'PT Example Consignee'
  mawb            TEXT,
  -- '123-45678901'
  hawb            TEXT,
  -- 'HAWB-00123' (tampil dengan warna biru di BoxRow)

  -- WAKTU SERAH TERIMA (AGT panel section 3)
  handover_datetime TIMESTAMPTZ,
  -- '2026-09-20 10:30:00+07'
  handover_location TEXT,
  -- 'Gate 3 Priok'

  -- STATUS KENDALA (kolom di tabel Field Agent Tasks)
  status_kendala  status_kendala_enum  NOT NULL DEFAULT 'normal',
  -- 'normal'             = badge biru "Normal"
  -- 'kendala_terdeteksi' = badge merah "Kendala Terdeteksi"

  -- NAMA PETUGAS (bagian bawah DOKUMEN PENDUKUNG di AGT panel)
  pihak_penyerah  TEXT,
  -- 'Budi Santoso'
  pihak_penerima  TEXT,
  -- 'Marsel'

  -- CHECKLIST FLAGS (baris bawah tabel checklist di AGT panel)
  is_dangerous_goods BOOLEAN            NOT NULL DEFAULT FALSE,
  -- Dangerous Goods: NO (false) / YES (true)
  special_handling   TEXT,
  -- NULL jika tidak ada. Contoh: 'Reefer / Priority Cargo'

  -- ISSUE SECTION (AGT panel section 8)
  has_issue       BOOLEAN              NOT NULL DEFAULT FALSE,
  -- FALSE = card hijau "No operational issue detected"
  issue_note      TEXT,
  -- Deskripsi isu jika has_issue = TRUE

  -- EXPORT
  is_exported_pdf BOOLEAN              NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
```

---

## 6. `worksheet_physical_items`
> Sumber: AGT panel — DATA FISIK BARANG (3 kartu: Jumlah Coil, Actual Pieces, Gross Weight).

```sql
CREATE TABLE worksheet_physical_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id    UUID        NOT NULL REFERENCES field_worksheets(id) ON DELETE CASCADE,
  item_label      TEXT        NOT NULL,
  -- 'JUMLAH COIL' | 'ACTUAL PIECES' | 'GROSS WEIGHT'
  item_value      TEXT        NOT NULL,
  -- Contoh: '12' | '12 Pcs' | '2,450 Kg'
  item_unit       TEXT,
  -- Contoh: 'coil' | 'pcs' | 'kg'
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  -- 0 = Jumlah Coil, 1 = Actual Pieces, 2 = Gross Weight
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. `worksheet_photos`
> Sumber: AGT panel — FOTO BUKTI LAPANGAN.
> 4 foto per worksheet. Badge "4/4 Verified" dihitung dari COUNT(is_verified = true).

```sql
CREATE TABLE worksheet_photos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id    UUID        NOT NULL REFERENCES field_worksheets(id) ON DELETE CASCADE,
  photo_label     TEXT        NOT NULL,
  -- '1. Foto Keseluruhan'
  -- '2. Marking / Label'
  -- '3. Foto Seal'
  -- '4. Area Kerusakan'
  photo_status    TEXT        NOT NULL,
  -- 'OK' | 'Match' | 'Intact' | 'No damage'
  photo_url       TEXT,
  -- URL foto di Supabase Storage (nullable jika belum diupload)
  file_name       TEXT,
  -- Contoh: 'DSC_0410.JPG', 'DSC_0411.JPG'
  taken_at        TIMESTAMPTZ,
  -- Waktu foto diambil, contoh: '2026-09-20 10:32:00+07'
  is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Bagian dari perhitungan badge "4/4 Verified"
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  -- 0, 1, 2, 3
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8. `worksheet_documents`
> Sumber: AGT panel — DOKUMEN PENDUKUNG (list file PDF dengan tombol download).

```sql
CREATE TABLE worksheet_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id    UUID        NOT NULL REFERENCES field_worksheets(id) ON DELETE CASCADE,
  doc_name        TEXT        NOT NULL,
  -- 'Packing List.pdf', 'MSDS.pdf'
  doc_type        TEXT        NOT NULL,
  -- 'PDF' | 'DOCX' | 'XLSX'
  file_size_kb    INTEGER,
  -- 1400 (ditampilkan UI sebagai '1.4 MB'), 883 (ditampilkan '883 KB')
  doc_url         TEXT        NOT NULL,
  -- URL dokumen di Supabase Storage
  doc_description TEXT,
  -- 'Verified' | 'Material Safety Sheet'
  is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  uploaded_by     UUID        REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. `worksheet_checklists`
> Sumber: AGT panel — CHECKLIST CENTANG & STATUS MASALAH (5 item list dengan badge Verified).

```sql
CREATE TABLE worksheet_checklists (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id    UUID        NOT NULL REFERENCES field_worksheets(id) ON DELETE CASCADE,
  check_label     TEXT        NOT NULL,
  -- 'Quantity & weight match'
  -- 'Visual condition good'
  -- 'Safe for flight'
  -- 'Document conformity'
  -- 'Airline standard conformity'
  is_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  -- TRUE = tampil badge emerald 'Verified' di kanan
  verified_by     UUID        REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  -- 0 sampai 4
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. `followup_tasks`
> Sumber: Tab Follow-up — tabel utama + detail panel (slide dari kanan).

```sql
CREATE TABLE followup_tasks (
  id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code        VARCHAR(20)       UNIQUE NOT NULL,
  -- Contoh: 'FLW-042', 'FLW-043', 'FLW-044', 'FLW-045', 'FLW-046'
  customer_id      UUID              NOT NULL REFERENCES customers(id),
  conversation_id  UUID              REFERENCES conversations(id),
  -- Opsional: task yang berasal dari suatu interaksi
  task_description TEXT              NOT NULL,
  -- Contoh: 'Confirm complaint resolution'
  -- Contoh: 'Follow-up on quotation'
  -- Contoh: 'Request missing document'
  -- Contoh: 'Schedule quarterly review'
  -- Contoh: 'Confirm payment receipt'
  assigned_to      UUID              NOT NULL REFERENCES users(id),
  -- Khoirul Anwar | Marselinus | Yemima Saragih | Imanuella | Nathalie
  due_datetime     TIMESTAMPTZ       NOT NULL,
  -- Disimpan sebagai TIMESTAMPTZ penuh. 'Today, 14:00 WIB' = '2026-09-14 14:00:00+07'
  priority         priority_enum     NOT NULL,
  -- 'High' | 'Medium' | 'Low'
  status           task_status_enum  NOT NULL DEFAULT 'open',
  -- 'open' | 'on_progress' | 'closed'

  -- Detail panel — Terkait Interaksi
  related_interaction_title TEXT,
  -- Judul interaksi terkait, contoh: 'Delivery discussion'
  related_interaction_date  DATE,
  -- Contoh: '2026-09-14'

  -- Detail panel — Target
  target_date      DATE,
  -- Contoh: '2026-09-15'
  target_time      TIME,
  -- Contoh: '14:00:00'

  -- Detail panel — Task Notes (textarea di panel)
  task_notes       TEXT,

  -- SLA Warning (muncul di panel jika deadline sudah dekat)
  sla_reference    TEXT,
  -- Contoh: '#AENAT/2609/0305'

  closed_at        TIMESTAMPTZ,
  closed_by        UUID              REFERENCES users(id),
  created_by       UUID              NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
```

---

## 11. `assistance_alerts`
> Sumber: Tab Complaints — setiap card pada feed alert + info bar di workspace modal.

```sql
CREATE TABLE assistance_alerts (
  id               UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code      VARCHAR(30)            UNIQUE NOT NULL,
  -- Contoh: 'ESC-PRIOK-942', 'ESC-JKT-1029'
  priority         alert_priority_enum    NOT NULL,
  -- 'high'    = HIGH PRIORITY (badge merah di card)
  -- 'average' = AVERAGE (badge orange di card)

  alert_datetime   TIMESTAMPTZ            NOT NULL,
  -- Contoh: '2026-09-20 14:15:00+07'

  -- Info bar di workspace modal
  customer_id      UUID                   NOT NULL REFERENCES customers(id),
  job_ref          TEXT,
  -- Contoh: '#AENAT/2605/2551'

  -- Sales PIC (ditampilkan di card dan info bar workspace)
  sales_pic_id     UUID                   NOT NULL REFERENCES users(id),
  -- Adelia | Lidya

  -- Escalation Source (ditampilkan di card feed)
  source_channel   TEXT                   NOT NULL,
  -- 'WhatsApp Chat' | 'Meeting Minutes'
  source_badge     TEXT,
  -- 'Direct Not Forward' | 'MoM Received'
  source_badge_color TEXT,
  -- 'blue' | 'emerald' (menentukan warna badge di card)
  source_ref       TEXT,
  -- 'Thread ID: #WA-8819' | 'Ref: Q3-Sync-DSV'

  -- Threat Analysis (workspace modal — kiri atas)
  summary_quote    TEXT                   NOT NULL,
  -- Pesan Utama / Callout Quote (tampil italic di kotak abu)
  risk_detail      TEXT,
  -- Detail Risiko Lapangan (kolom kanan Threat Analysis)

  -- SLA
  sla_type         sla_type_enum          NOT NULL,
  -- 'urgent' | 'standard'
  sla_target_mins  INTEGER,
  -- 30 (menit, untuk urgent). NULL untuk standard
  sla_label        TEXT,
  -- 'Response Target: < 30 mins (Urgent SLA)'
  -- 'Response Target: Standard within today (COB)'
  sla_mins_display TEXT,
  -- '18 mins left (Target < 30 mnt)' | 'Standard COB'
  -- Ditampilkan di SLA TARGET box di header workspace modal

  -- Workspace status
  workspace_status workspace_status_enum  NOT NULL DEFAULT 'open',
  -- 'open' | 'in_progress' | 'resolved'
  handled_by_cs    UUID                   REFERENCES users(id),
  -- CS yang sedang handle. Contoh: 'CS Budi'
  -- Badge: "In Progress by CS Budi"
  handled_at       TIMESTAMPTZ,

  -- Label tombol Action 1 di card feed
  action1_label    TEXT,
  -- 'View Chat History' | 'View MoM Attachment'

  -- Link ke field worksheet (opsional, muncul di link "Lihat Worksheet / Job Ref")
  worksheet_id     UUID                   REFERENCES field_worksheets(id),

  created_by       UUID                   REFERENCES users(id),
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);
```

---

## 12. `alert_chat_messages`
> Sumber: Tab Complaints — workspace modal — area WhatsApp Business Escalation (replay bubble chat).

```sql
CREATE TABLE alert_chat_messages (
  id              UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID                     NOT NULL REFERENCES assistance_alerts(id) ON DELETE CASCADE,
  sender_name     TEXT                     NOT NULL,
  -- 'Bpk. Hendra (Logistics Lead - PT Sinar Logistik)'
  -- 'Adelia (Sales Executive)'
  -- 'Lidya (Sales Team A)'
  message_text    TEXT                     NOT NULL,
  sent_at_time    TIME                     NOT NULL,
  -- Waktu tampil di bubble: '14:02', '14:05', '14:08'
  sent_at         TIMESTAMPTZ              NOT NULL,
  -- Full datetime untuk sorting: '2026-09-20 14:02:00+07'
  direction       message_direction_enum   NOT NULL,
  -- 'in'  = pesan dari klien (bubble putih, align kiri)
  -- 'out' = pesan dari sales/CS (bubble hijau, align kanan)
  sort_order      SMALLINT                 NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);
```

---

## 13. `alert_action_checklists`
> Sumber: Tab Complaints — workspace modal — checklist bawah di Form Aksi Respon & Intervensi CS.

```sql
CREATE TABLE alert_action_checklists (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID        NOT NULL REFERENCES assistance_alerts(id) ON DELETE CASCADE,
  check_label     TEXT        NOT NULL,
  -- Contoh: 'Kirim notifikasi SMS/WA darurat ke PIC Lapangan Gate 3 (Didik - Priok)'
  -- Contoh: 'Lampirkan instruksi penahanan kontainer ke Audit Log C-Track & Manifest Sistem'
  -- Contoh: 'Koordinasikan dengan tim Legal untuk review adendum'
  -- Contoh: 'Update status di sistem CRM'
  is_checked      BOOLEAN     NOT NULL DEFAULT TRUE,
  -- Default TRUE (sudah dicentang di UI saat workspace dibuka)
  checked_by      UUID        REFERENCES users(id),
  checked_at      TIMESTAMPTZ,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 14. `cs_workspace_responses`
> Sumber: Tab Complaints — workspace modal — Form Aksi Respon & Intervensi CS (sisi kanan bawah).
> Menyimpan mode intervensi + draft pesan yang dikirim oleh CS.

```sql
CREATE TABLE cs_workspace_responses (
  id                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id          UUID                    NOT NULL REFERENCES assistance_alerts(id) ON DELETE CASCADE,
  cs_user_id        UUID                    NOT NULL REFERENCES users(id),
  -- CS yang mengisi dan submit form ini

  intervention_mode intervention_mode_enum  NOT NULL,
  -- 'internal_note' = Catatan Internal (ke Sales PIC)
  -- 'reply_client'  = Balas Klien (via WhatsApp)
  -- 'field_team'    = Tim Lapangan (Gate 3 Didik Priok)

  draft_message     TEXT                    NOT NULL,
  -- Isian textarea "Draft Pesan Balasan / Catatan Instruksi CS"

  is_sent           BOOLEAN                 NOT NULL DEFAULT FALSE,
  sent_at           TIMESTAMPTZ,

  -- Tombol "Update & Transfer Back to Sales"
  is_transferred    BOOLEAN                 NOT NULL DEFAULT FALSE,
  transferred_at    TIMESTAMPTZ,
  transferred_to    UUID                    REFERENCES users(id),
  -- Sales PIC tujuan transfer

  created_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);
```

---

## Indexes yang Disarankan

```sql
-- conversations
CREATE INDEX idx_conversations_customer    ON conversations(customer_id, conversation_date DESC);
CREATE INDEX idx_conversations_sales_pic   ON conversations(sales_pic_id);
CREATE INDEX idx_conversations_need_assist ON conversations(need_assistance) WHERE need_assistance = TRUE;

-- field_worksheets
CREATE INDEX idx_worksheets_field_agent    ON field_worksheets(field_agent_id, status_kendala);
CREATE INDEX idx_worksheets_customer       ON field_worksheets(customer_id);

-- followup_tasks
CREATE INDEX idx_followup_assigned         ON followup_tasks(assigned_to, status, due_datetime);
CREATE INDEX idx_followup_customer         ON followup_tasks(customer_id);

-- assistance_alerts
CREATE INDEX idx_alerts_priority_status    ON assistance_alerts(priority, workspace_status, alert_datetime DESC);
CREATE INDEX idx_alerts_customer           ON assistance_alerts(customer_id);
CREATE INDEX idx_alerts_sales_pic          ON assistance_alerts(sales_pic_id);

-- alert_chat_messages
CREATE INDEX idx_chat_alert_order          ON alert_chat_messages(alert_id, sort_order);
```

---

## Relasi

```
customers ──< conversations ──< conversation_files
customers ──< field_worksheets
customers ──< followup_tasks
customers ──< assistance_alerts

conversations >──  field_worksheets   (opsional)
conversations ──< followup_tasks      (opsional)

field_worksheets ──< worksheet_physical_items
field_worksheets ──< worksheet_photos
field_worksheets ──< worksheet_documents
field_worksheets ──< worksheet_checklists

assistance_alerts ──< alert_chat_messages
assistance_alerts ──< alert_action_checklists
assistance_alerts ──< cs_workspace_responses
assistance_alerts >── field_worksheets   (opsional)

users ──> conversations.sales_pic_id / created_by
users ──> field_worksheets.field_agent_id / sales_pic_id / created_by
users ──> followup_tasks.assigned_to / closed_by / created_by
users ──> assistance_alerts.sales_pic_id / handled_by_cs / created_by
users ──> cs_workspace_responses.cs_user_id / transferred_to
users ──> worksheet_documents.uploaded_by
users ──> worksheet_checklists.verified_by
```

---

## Catatan Supabase

1. **`gen_random_uuid()`** — bawaan Supabase, tidak perlu ekstensi tambahan.
2. **Storage buckets** yang perlu dibuat:
   - `conversation-files` — untuk upload .txt / PDF dari REC modal
   - `worksheet-photos` — untuk foto bukti lapangan
   - `worksheet-documents` — untuk dokumen pendukung (Packing List, MSDS)
3. **RLS (Row Level Security)** — aktifkan dan buat policy per tabel sesuai role user.
4. **`updated_at` auto-update** — buat trigger PostgreSQL:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Terapkan ke setiap tabel yang punya updated_at:
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Ulangi untuk: users, customers, field_worksheets,
-- followup_tasks, assistance_alerts, cs_workspace_responses
```

5. **Urutan pembuatan tabel** (ikuti urutan FK):
   ```
   users → customers → conversations → conversation_files
   → field_worksheets → worksheet_physical_items → worksheet_photos
   → worksheet_documents → worksheet_checklists
   → followup_tasks → assistance_alerts → alert_chat_messages
   → alert_action_checklists → cs_workspace_responses
   ```
