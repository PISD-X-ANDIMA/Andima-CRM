# Modul A2: Record Conversation & Field Agent Worksheets
## Spesifikasi & Dokumentasi Lengkap REST API

> **Versi API**: v1.0.0  
> **Base URL**: `http://<domain-crm>` (Lokal: `http://localhost:3000`)  
> **Format Data**: JSON (`application/json`) / Multipart (`multipart/form-data` untuk upload berkas)  
> **Target Pengguna**: Tim Mobile App, Tim Core C-Track, Tim Integrasi Sistem & Microservices  

---

## 1. Standar Respons API

Seluruh endpoint REST API menggunakan format respons terstandarisasi berikut:

### Respons Berhasil (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... } // Objek atau Array data
}
```

### Respons Gagal (HTTP 400 / 404 / 500)
```json
{
  "success": false,
  "error": "Pesan deskripsi kesalahan"
}
```

---

## 2. Ringkasan Endpoint

| No | Method | Endpoint | Deskripsi |
| :---: | :---: | :--- | :--- |
| 1 | `GET` | `/api/record-conversation/stats` | Mengambil statistik ringkasan kartu metrik atas |
| 2 | `GET` | `/api/record-conversation/customers` | Mengambil daftar akun perusahaan pelanggan |
| 3 | `GET` | `/api/record-conversation/conversations` | Mengambil riwayat percakapan dengan filter channel & status |
| 4 | `POST` | `/api/record-conversation/conversations` | Menyimpan log percakapan baru & lampiran berkas |
| 5 | `PATCH` | `/api/record-conversation/conversations` | Memperbarui atribut percakapan (summary, urgensi, asistensi, status, channel) |
| 6 | `GET` | `/api/record-conversation/worksheets` | Mengambil daftar tugas penugasan lapangan (*Field Worksheets*) |
| 7 | `GET` | `/api/record-conversation/worksheets/:id` | Mengambil detail lengkap 1 lembar kerja beserta 4 tabel relasi |
| 8 | `POST` | `/api/record-conversation/upload` | Mengunggah berkas percakapan (chat/meeting notes) |
| 9 | `GET` | `/api/feature/A3-tasks` | Mengambil daftar tugas Field Agent yang bersumber dari worksheet Sales Executive |
| 10 | `POST` | `/api/feature/A3-handover` | Menyimpan serah terima kargo, aktual koli/berat, dan validasi lokasi GPS |
| 11 | `POST` | `/api/feature/A3-documentation` | Menyimpan 4 foto wajib dan berkas dokumen pendukung |
| 12 | `POST` | `/api/feature/A3-issues` | Melaporkan finding/isu di lapangan dan mengeskalasi status `has_issue` ke Sales Executive |
| 13 | `POST` | `/api/feature/A3-verification` | Menyimpan checklist verifikasi kepatuhan dan menyelesaikan task (`Completed`) |

---

## 3. Detail Spesifikasi Endpoint

### 3.1. GET `/api/record-conversation/stats`
Mengambil metrik ringkasan kartu atas pada dashboard CRM secara real-time dari database.

- **Query Parameters**: Tidak ada.
- **Headers**: `Accept: application/json`

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": {
    "totalManagedCustomers": 20,
    "managedCustomersGrowth": "+3",
    "upcomingMeetingsCount": 9,
    "upcomingMeetingNote": "Hari ini 14:00 WIB dengan DSV Transport",
    "activeFieldIssuesCount": 7,
    "activeFieldIssuesNote": "Memerlukan verifikasi di Gerbang 3 Priok"
  }
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/record-conversation/stats" \
     -H "Accept: application/json"
```

---

### 3.2. GET `/api/record-conversation/customers`
Mengambil seluruh daftar akun perusahaan pelanggan dari tabel `public.a1_company_list` untuk pengisian dropdown pemilihan akun.

- **Query Parameters**: Tidak ada.
- **Headers**: `Accept: application/json`

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "company_list_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
      "job_number": "AENAT/2606/0209",
      "name": "Budi Santoso",
      "company_name": "PT. YOSSAVA TRANS LOGISTIK",
      "created_by": "Wulan",
      "customer_code": "TRX-0626-00112"
    }
  ]
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/record-conversation/customers" \
     -H "Accept: application/json"
```

---

### 3.3. GET `/api/record-conversation/conversations`
Mengambil daftar rekaman riwayat percakapan pelanggan dari `public.a2_record_conversations` secara bertahap (*server-side pagination*), lengkap dengan relasi nama perusahaan dari `a1_company_list` dan Sales PIC dari `d3_employee`.

- **Query Parameters**:
  - `channel` *(optional)*: `'All Channels'` | `'WhatsApp'` | `'Meeting'`
  - `status` *(optional)*: `'All Statuses'` | `'Active'` | `'Archived'`
  - `page` *(optional, integer)*: Nomor halaman (default: `1`)
  - `limit` *(optional, integer)*: Jumlah item per halaman (default: `8`)

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "b0000001-0000-0000-0000-000000000001",
      "job_number": "AENAT/2606/0209",
      "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
      "customer_code": "TRX-0626-00112",
      "sales_pic_id": "9c274330-44f1-474d-91c0-523aac3ea9cf",
      "channel_type": "WhatsApp",
      "conversation_date": "2026-09-20",
      "summary": "Koordinasi penanganan kargo dingin di Gate 3 Priok.",
      "need_assistance": false,
      "urgency_level": "standard",
      "synced_to_ctrack": true,
      "document_urls": null,
      "status": "active",
      "created_by": "9c274330-44f1-474d-91c0-523aac3ea9cf",
      "company_name": "PT. YOSSAVA TRANS LOGISTIK",
      "client_contact_name": "Budi Santoso",
      "sales_pic_name": "Adelia"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 8,
  "totalPages": 3
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/record-conversation/conversations?channel=WhatsApp&status=active" \
     -H "Accept: application/json"
```

---

### 3.4. POST `/api/record-conversation/conversations`
Menyimpan catatan percakapan baru ke tabel `public.a2_record_conversations`. Apabila terdapat lampiran file, otomatis disisipkan ke tabel `public.a2_conversation_files`.

- **Headers**: `Content-Type: application/json`
- **Request Body Parameters**:

| Field | Type | Required | Deskripsi |
| :--- | :--- | :---: | :--- |
| `customer_id` | `UUID` (string) | **Ya** | ID perusahaan dari `a1_company_list`. |
| `customer_code` | `string` | Tidak | Kode akun pelanggan (contoh: `TRX-0626-00112`). |
| `job_number` | `string` | Tidak | Nomor pekerjaan acuan jika ada. |
| `channel_type` | `string` | **Ya** | `'WhatsApp'` atau `'Meeting'`. |
| `conversation_date` | `string` | Tidak | Format `YYYY-MM-DD` (default: hari ini). |
| `summary` | `string` | **Ya** | Ringkasan isi diskusi percakapan. |
| `need_assistance` | `boolean` | **Ya** | `true` jika membutuhkan bantuan tim eskalasi. |
| `urgency_level` | `string` | **Ya** | `'high_priority'` atau `'average'`. |
| `synced_to_ctrack` | `boolean` | Tidak | Default `true`. |
| `uploaded_file` | `object` | Tidak | Metadata berkas dari endpoint `/upload`. |

#### Contoh Request Body (JSON):
```json
{
  "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
  "customer_code": "TRX-0626-00112",
  "job_number": "AENAT/2606/0209",
  "channel_type": "WhatsApp",
  "summary": "Diskusi kepastian jadwal kontainer di Gate 3 Priok. Butuh verifikasi fisik cepat.",
  "need_assistance": true,
  "urgency_level": "high_priority",
  "synced_to_ctrack": true,
  "uploaded_file": {
    "file_name": "chat_export.txt",
    "file_type": "txt",
    "file_url": "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js",
    "file_size_kb": 12
  }
}
```

#### Contoh Respons (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "e2808c1a-6cb2-40fe-a8c9-25f0e1f72a6b",
    "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
    "customer_code": "TRX-0626-00112",
    "job_number": "AENAT/2606/0209",
    "sales_pic_id": "9c274330-44f1-474d-91c0-523aac3ea9cf",
    "channel_type": "WhatsApp",
    "conversation_date": "2026-09-30",
    "summary": "Diskusi kepastian jadwal kontainer di Gate 3 Priok. Butuh verifikasi fisik cepat.",
    "need_assistance": true,
    "urgency_level": "high_priority",
    "synced_to_ctrack": true,
    "document_urls": ["https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js"],
    "status": "active"
  }
}
```

#### Contoh cURL:
```bash
curl -X POST "http://localhost:3000/api/record-conversation/conversations" \
     -H "Content-Type: application/json" \
     -d '{
       "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
       "channel_type": "WhatsApp",
       "summary": "Diskusi jadwal peti kemas Gate 3.",
       "need_assistance": false,
       "urgency_level": "average"
     }'
```

---

### 3.5. PATCH `/api/record-conversation/conversations`
Memperbarui atribut percakapan yang ada di tabel `public.a2_record_conversations` (seperti ringkasan diskusi, channel, tingkat urgensi, kebutuhan asistensi, status, atau job number).

- **Headers**: `Content-Type: application/json`
- **Request Body (JSON)**:
  - `id` *(required, string UUID)*: ID percakapan yang akan diperbarui.
  - `summary` *(optional, string)*: Ringkasan catatan diskusi.
  - `channel_type` *(optional, enum)*: `'WhatsApp'` | `'Meeting'`.
  - `urgency_level` *(optional, enum)*: `'high_priority'` | `'average'` | `'standard'`.
  - `need_assistance` *(optional, boolean)*: `true` | `false`.
  - `status` *(optional, enum)*: `'active'` | `'archived'`.
  - `job_number` *(optional, string)*: Nomor acuan pekerjaan.

#### Contoh Request Body:
```json
{
  "id": "e2808c1a-6cb2-40fe-a8c9-25f0e1f72a6b",
  "summary": "Diskusi kepastian jadwal kontainer di Gate 3 Priok. Penanganan selesai dikoordinasikan.",
  "channel_type": "WhatsApp",
  "urgency_level": "average",
  "need_assistance": false,
  "status": "active"
}
```

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "e2808c1a-6cb2-40fe-a8c9-25f0e1f72a6b",
    "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
    "customer_code": "TRX-0626-00112",
    "job_number": "AENAT/2606/0209",
    "sales_pic_id": "9c274330-44f1-474d-91c0-523aac3ea9cf",
    "channel_type": "WhatsApp",
    "conversation_date": "2026-09-30",
    "summary": "Diskusi kepastian jadwal kontainer di Gate 3 Priok. Penanganan selesai dikoordinasikan.",
    "need_assistance": false,
    "urgency_level": "average",
    "synced_to_ctrack": true,
    "status": "active",
    "updated_at": "2026-09-30T01:34:00.000Z",
    "company_name": "PT. YOSSAVA TRANS LOGISTIK",
    "sales_pic_name": "Adelia"
  }
}
```

#### Contoh cURL:
```bash
curl -X PATCH "http://localhost:3000/api/record-conversation/conversations" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "e2808c1a-6cb2-40fe-a8c9-25f0e1f72a6b",
       "summary": "Ringkasan telah diperbarui.",
       "urgency_level": "average"
     }'
```

---

### 3.6. GET `/api/record-conversation/worksheets`
Mengambil daftar seluruh penugasan lembar kerja inspektur lapangan (*Field Agent Tasks & Worksheets*) dari `public.a2_worksheets` secara bertahap (*server-side pagination*).

- **Query Parameters**:
  - `page` *(optional, integer)*: Nomor halaman (default: `1`)
  - `limit` *(optional, integer)*: Jumlah item per halaman (default: `8`)
- **Headers**: `Accept: application/json`

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "worksheet_id": 1,
      "transaction_no": "TRX-0626-00112",
      "job_no": "AENAT/2606/0209",
      "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
      "create_date": "2026-09-14",
      "status_kendala": "normal",
      "field_agent_id": "9c274330-44f1-474d-91c0-523aac3ea9cf",
      "company_name": "PT. YOSSAVA TRANS LOGISTIK",
      "field_agent_name": "Marsel",
      "field_agent_role": "Field Inspector",
      "field_agent_initials": "M",
      "sales_pic_name": "Adelia"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 8,
  "totalPages": 3
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/record-conversation/worksheets?page=1&limit=8" \
     -H "Accept: application/json"
```

---

### 3.7. GET `/api/record-conversation/worksheets/:id`
Mengambil data detail lengkap 1 lembar kerja penugasan lapangan berserta **4 tabel relasi anak**:
1. `physical_items`: Rincian fisik barang kargo.
2. `photos`: Bukti foto verifikasi lapangan.
3. `documents`: Dokumen pengiriman & manifest.
4. `checklists`: Butir verifikasi kelayakan kargo.

- **Path Parameter**: `id` *(number/integer, contoh: `1`)*.

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": {
    "worksheet_id": 1,
    "transaction_no": "TRX-0626-00112",
    "job_no": "AENAT/2606/0209",
    "customer_id": "a98b5048-49f1-49a2-832b-9f1191aae258",
    "company_name": "PT. YOSSAVA TRANS LOGISTIK",
    "shipper": "PT Indo Pasifik Perkasa",
    "consignee": "PT Yossava Trans Logistik",
    "mawb": "126-90412850",
    "hawb": "HAWB-0209-A",
    "handover_datetime": "2026-09-14T03:15:00+00:00",
    "handover_location": "Gate 3 Tanjung Priok",
    "pihak_penyerah": "Budi Santoso",
    "pihak_penerima": "Marsel",
    "is_dangerous_goods": false,
    "special_handling": "Reefer Temp -20C",
    "has_issue": false,
    "issue_note": "Kondisi suhu peti kemas stabil dan segel pelayaran utuh.",
    "field_agent_name": "Marsel",
    "field_agent_role": "Field Inspector",
    "field_agent_initials": "M",
    "sales_pic_name": "Adelia",
    "physical_items": [
      {
        "id": "1450e838-f9e1-44ea-9862-5c74fe4e9065",
        "worksheet_id": 1,
        "item_label": "JUMLAH COIL",
        "item_value": "8",
        "item_unit": "coil"
      }
    ],
    "photos": [
      {
        "id": "a13c296b-eb8d-4f94-a271-7eff2f96377a",
        "worksheet_id": 1,
        "photo_label": "1. Foto Keseluruhan",
        "photo_status": "OK",
        "photo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        "file_name": "DSC_0410.JPG",
        "is_verified": true
      }
    ],
    "documents": [
      {
        "id": "57324ca6-0240-4af4-9f16-107df9b9afc0",
        "worksheet_id": 1,
        "doc_name": "Packing List.pdf",
        "doc_type": "PDF",
        "file_size_kb": 1400,
        "doc_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "is_verified": true
      }
    ],
    "checklists": [
      {
        "id": "457479c9-23ee-4472-be71-550c8d1a97de",
        "worksheet_id": 1,
        "check_label": "Quantity & weight match",
        "is_verified": true
      }
    ]
  }
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/record-conversation/worksheets/1" \
     -H "Accept: application/json"
```

---

### 3.8. POST `/api/record-conversation/upload`
Mengunggah berkas percakapan chat export (`.txt`) atau catatan rapat (`.pdf`/`.docx`).

- **Headers**: `Content-Type: multipart/form-data`
- **Body Form-Data**:
  - Key: `file` (File binary)

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": {
    "file_name": "chat_dsve_2026.txt",
    "file_type": "txt",
    "file_url": "https://raw.githubusercontent.com/mathiasbynens/utf8.js/master/tests/tests.js",
    "file_size_kb": 24
  }
}
```

#### Contoh cURL:
```bash
curl -X POST "http://localhost:3000/api/record-conversation/upload" \
     -F "file=@/path/to/local/notes.pdf"
```

---

## 4. Contoh Integrasi Client (TypeScript SDK / Fetch)

Tim lain yang menggunakan JavaScript / TypeScript dapat mengonsumsi endpoint secara langsung atau menggunakan helper berikut:

```typescript
// Contoh implementasi fetch di microservice / mobile app lain
async function logCustomerConversation(payload: {
  customer_id: string;
  channel_type: 'WhatsApp' | 'Meeting';
  summary: string;
  need_assistance: boolean;
  urgency_level: 'high_priority' | 'average';
}) {
  const response = await fetch('http://<domain-crm>/api/record-conversation/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}
```

---

## 5. Alur Kerja Integrasi: Sales Executive (A2) & Field Agent (A3)

Bagian ini mendokumentasikan integrasi siklus data dua arah antara petugas kantor (Sales Executive) dan petugas operasional lapangan (Field Agent).

### 5.1. Diagram Alur Kerja End-to-End

```mermaid
sequenceDiagram
    autonumber
    actor SE as Sales Executive (A2)
    participant DB as Supabase PostgreSQL
    actor FA as Field Agent (A3)
    participant API as CRM REST API

    Note over SE, DB: 1. Penugasan Pekerjaan
    SE->>API: Buat Job / Transaksi Lapangan
    API->>DB: INSERT / UPDATE a2_worksheets (Status: Assigned)
    
    Note over FA, DB: 2. Pengambilan & Eksekusi Lapangan
    FA->>API: GET /api/feature/A3-tasks
    API->>DB: SELECT a2_worksheets JOIN a1_company_list
    API-->>FA: Tampilkan daftar My Task

    FA->>API: POST /api/feature/A3-handover (Data serah terima + GPS)
    API->>DB: INSERT a3_field_agent_handovers & UPDATE a2_worksheets (Status: In Progress)

    FA->>API: POST /api/feature/A3-documentation (Foto & dokumen PDF)
    API->>DB: Simpan lampiran & UPDATE a2_worksheets

    alt Ditemukan Kendala / Finding di Lapangan
        FA->>API: POST /api/feature/A3-issues (Finding / Rusak / Kurang)
        API->>DB: INSERT a3_field_agent_issues & UPDATE a2_worksheets (status: "Has Issue", has_issue: true)
        Note over SE: Notifikasi otomatis muncul di tab "Need Backup" dan "Task of Field Agent"
    else Checklist Sesuai & Selesai
        FA->>API: POST /api/feature/A3-verification (Final Checklist)
        API->>DB: INSERT a3_field_agent_verifications & UPDATE a2_worksheets (status: "Completed")
        Note over SE: Status transaksi di monitor SE otomatis berubah menjadi "Completed"
    end
```

### 5.2. Tahapan Operasional Field Agent
1. **Detail Job**: Memeriksa kelengkapan nomor job, customer, shipper, consignee, MAWB/HAWB, dan alamat pengiriman.
2. **Handover**: Merekam identitas pihak penyerah dan penerima, data koli/berat aktual, serta validasi koordinat GPS dari perangkat mobile/browser.
3. **Dokumentasi**: Mengunggah 4 titik foto wajib (*Keseluruhan Barang*, *Marking Label*, *Seal/Segel*, *Area Pallet/Kerusakan*) dan 2 dokumen wajib (*Packing List* & *Commercial Invoice*).
4. **Verifikasi Checklist**: Memeriksa kesesuaian dokumen, kondisi fisik paket, standar maskapai, dan regulasi *Dangerous Goods*.
5. **Eskalasi Isu Otomatis**: Jika ada kendala, tiket kendala langsung dibuat dan status di tabel `a2_worksheets` langsung berubah menjadi `Has Issue` sehingga muncul di tab **Need Backup** Sales Executive secara waktu nyata (*real-time*).

---

## 6. Detail Spesifikasi Endpoint Field Agent (A3)

### 6.1. GET `/api/feature/A3-tasks`
Mengambil seluruh daftar penugasan lapangan untuk Field Agent yang bersumber langsung dari `a2_worksheets`.

- **Method**: `GET`
- **Headers**: `Accept: application/json`

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "c7e19697-2039-4186-888f-8c937b4df471",
      "job_number": "JOB-JKT-2403",
      "customer_name": "PT Majo Logistics",
      "shipper_name": "PT Global Freight",
      "consignee_name": "PT Indah Karya",
      "mawb_hawb": "215-8812",
      "job_type": "Delivery",
      "planned_pieces": 5,
      "planned_gross_weight": 850,
      "delivery_location": "Terminal Cargo 1, Soekarno-Hatta",
      "status": "In Progress",
      "has_issue": false,
      "created_at": "2026-09-29T21:53:08.70111+00:00",
      "updated_at": "2026-09-29T21:53:08.70111+00:00"
    }
  ]
}
```

#### Contoh cURL:
```bash
curl -X GET "http://localhost:3000/api/feature/A3-tasks"
```

---

### 6.2. POST `/api/feature/A3-handover`
Mencatat proses serah terima barang fisik dan validasi lokasi koordinat GPS dari perangkat petugas.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body JSON**:
```json
{
  "jobNumber": "JOB-JKT-2401",
  "deliveringParty": "Budi Santoso",
  "receivingParty": "Andi Pratama",
  "actualPieces": 10,
  "actualGrossWeight": 250,
  "location": "Gate 3, Terminal 2, Bandara Soekarno-Hatta",
  "latitude": -6.1275,
  "longitude": 106.6537,
  "accuracy": 4.5
}
```

#### Efek Samping Basis Data:
1. Menyimpan data serah terima ke `a3_field_agent_handovers`.
2. Memperbarui status di `a2_worksheets` menjadi `'In Progress'`.

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "message": "Handover record saved successfully",
  "data": {
    "job_number": "JOB-JKT-2401",
    "status": "In Progress"
  }
}
```

---

### 6.3. POST `/api/feature/A3-documentation`
Menyimpan daftar berkas foto fisik kargo dan dokumen legalitas pelayaran/penerbangan.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body JSON**:
```json
{
  "jobNumber": "JOB-JKT-2401",
  "photos": [
    "Foto_Keseluruhan_Barang.jpg",
    "Marking_Shipping_Label.jpg",
    "Segel_Kontainer.jpg",
    "Area_Pallet.jpg"
  ],
  "documents": [
    "PackingList_DSV.pdf",
    "Invoice_DSV.pdf"
  ]
}
```

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "message": "Documentation saved successfully"
}
```

---

### 6.4. POST `/api/feature/A3-issues`
Melaporkan temuan kerusakan (*Damaged Package*), ketidaksesuaian jumlah (*Quantity Mismatch*), dokumen hilang, atau kendala operasional lapangan.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body JSON**:
```json
{
  "jobNumber": "JOB-JKT-2410",
  "category": "Damaged Package",
  "classification": "Urgent",
  "description": "Ditemukan 2 kardus kemasan basah dan robek pada sisi palet kanan."
}
```

#### Efek Samping Basis Data:
1. Menyimpan laporan kendala ke `a3_field_agent_issues`.
2. Status di `a2_worksheets` langsung diubah menjadi `'Has Issue'` dan kolom `has_issue` diset `true`.
3. Tugas otomatis muncul di tab **Need Backup** Sales Executive secara waktu nyata (*real-time*).

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "message": "Issue reported and worksheet updated successfully",
  "data": {
    "jobNumber": "JOB-JKT-2410",
    "status": "Has Issue"
  }
}
```

---

### 6.5. POST `/api/feature/A3-verification`
Menyimpan lembar checklist verifikasi akhir kelayakan pengiriman barang sesuai standar maskapai.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body JSON**:
```json
{
  "jobNumber": "JOB-JKT-2401",
  "documentVerification": "Sesuai",
  "packageCondition": "Baik",
  "airlineStandard": "Sesuai",
  "dangerousGoods": false,
  "specialHandling": []
}
```

#### Efek Samping Basis Data:
1. Menyimpan rekaman verifikasi ke `a3_field_agent_verifications`.
2. Status di `a2_worksheets` diperbarui menjadi `'Completed'` dan kolom `has_issue` diset `false`.

#### Contoh Respons (200 OK):
```json
{
  "success": true,
  "message": "Verification completed and job status marked as Completed",
  "data": {
    "jobNumber": "JOB-JKT-2401",
    "status": "Completed"
  }
}
```

