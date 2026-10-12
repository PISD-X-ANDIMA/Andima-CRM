# Dokumentasi API: Field Agent File Upload

Dokumentasi resmi endpoint upload file (dokumen dan foto lapangan) untuk modul **Field Agent** dan modul **Monitoring Task of Field Agent**.

---

## 1. Ikhtisar Endpoint

| Spesifikasi | Keterangan |
| :--- | :--- |
| **Endpoint URL** | `/api/feature/field-agent/upload` |
| **Metode HTTP** | `POST` |
| **Content-Type** | `multipart/form-data` |
| **Target Bucket** | `A3-field-agent-documents` (Supabase Storage) |
| **Batas Ukuran** | **5 MB** (5,242,880 bytes) per berkas |
| **Format Didukung**| PDF, PNG, JPG, JPEG, DOC, DOCX, XLS, XLSX, ZIP |
| **Autentikasi** | Session / Public Form Upload |

---

## 2. Request Parameters (`multipart/form-data`)

| Parameter | Tipe | Wajib? | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- | :--- | :--- |
| `file` | `File / Binary` | **Ya** | File fisik dokumen atau foto yang akan diunggah (maks. 5 MB). | `reimbursement_AENAT.pdf` |
| `jobNumber` | `string` | Opsional | Nomor job atau tugas terkait (default: `GENERAL`). | `#AENAT/2609/0307` |
| `category` | `string` | Opsional | Kategori file (`main_doc`, `supporting_doc`, `cargo_photo`, `issue_doc`). | `main_doc` |

---

## 3. Respon Sukses (`HTTP 201 Created`)

```json
{
  "success": true,
  "message": "Berkas berhasil diunggah.",
  "data": {
    "file_name": "Copy of reimbursement_Example_AENAT.pdf",
    "file_url": "https://<supabase-project-id>.supabase.co/storage/v1/object/public/A3-field-agent-documents/_AENAT_2609_0307/main_doc_1760264500123_reimbursement.pdf",
    "file_size_kb": 3520,
    "file_type": "pdf",
    "category": "main_doc",
    "bucket": "A3-field-agent-documents",
    "storage_method": "supabase-storage",
    "uploaded_at": "2026-10-12T10:20:45.123Z"
  }
}
```

---

## 4. Respon Error

### 4.1. Berkas Tidak Ditemukan (`HTTP 400 Bad Request`)
```json
{
  "success": false,
  "error": "Berkas tidak ditemukan. Parameter \"file\" wajib disertakan."
}
```

### 4.2. Berkas Melebihi Batas 5 MB (`HTTP 413 Payload Too Large`)
```json
{
  "success": false,
  "error": "Ukuran berkas \"laporan_berat.pdf\" (7.45 MB) melebihi batas maksimal 5 MB."
}
```

### 4.3. Kesalahan Server / Penyimpanan (`HTTP 500 Internal Server Error`)
```json
{
  "success": false,
  "error": "Gagal menyimpan berkas ke storage maupun penyimpanan server."
}
```

---

## 5. Alur Kerja (Workflow Diagram)

```
[ Field Agent App ]
        │
        ├─ 1. Memilih file di form Dokumentasi (Main Doc / Supporting Doc / Foto)
        ├─ 2. Validasi file.size <= 5 MB pada browser
        │
        ▼ (POST /api/feature/field-agent/upload)
[ Server API Route ]
        │
        ├─ 3. Verifikasi ukuran file (<= 5 MB)
        ├─ 4. Unggah ke Supabase Storage (Bucket: A3-field-agent-documents)
        │     └─ [Fallback Otomatis ke /public/uploads/ jika storage cloud error]
        ├─ 5. Kembalikan URL publik berkas (file_url)
        │
        ▼
[ Database & State Sync ]
        │
        ├─ 6. Simpan URL berkas ke data worksheet dokumentasi
        │
        ▼
[ Monitoring Task of Field Agent ]
        │
        └─ 7. Modal detail & inspeksi otomatis menampilkan link file asli
              - Tombol 'Eye' -> Membuka file fisik di tab baru
              - Tombol 'Download' -> Mengunduh file fisik asli
```

---

## 6. Contoh Implementasi Penggunaan (Frontend Fetch)

```typescript
const handleUpload = async (file: File, jobNumber: string, category: string) => {
  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file melebihi batas maksimal 5 MB.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobNumber", jobNumber);
  formData.append("category", category);

  const res = await fetch("/api/feature/field-agent/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Upload gagal");
  }

  // URL berkas yang siap dipakai untuk preview & download
  console.log("File URL:", json.data.file_url);
  return json.data;
};
```
