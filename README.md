# Andima CRM — Sistem Terpadu Pengelolaan Pelanggan & Operasional

Sistem CRM berbasis **Next.js (App Router)** dan **Supabase** untuk PT Andima Transportindo, yang dikembangkan secara kolaboratif antarsquad (Squad A1, A2, dan A3).

---

## 📌 Pembagian Modul & Arsitektur Direktori

Untuk menghindari konflik kode (*merge conflict*) antar squad, struktur modul telah dipisahkan secara ketat:

| Modul | Pemilik | Lokasi File & Komponen | Keterangan & Batasan |
|---|---|---|---|
| **Sales Executive** | **Squad A1** | `app/dashboard/sales-executive/`<br>`components/dashboard/SalesExecutiveDashboard.tsx`<br>`app/dashboard/company-list/`<br>`app/dashboard/meeting-schedule/` | **Stabil & Siap Pakai.** Terbuka untuk integrasi tombol Squad A2. |
| **Manager Customer Success** | **Squad A1** | `app/dashboard/manager-customer-success/`<br>`components/dashboard/ManagerCustomerSuccessDashboard.tsx`<br>`app/api/v1/manager/` | ⚠️ **ISOLATED / DILARANG DIUBAH SQUAD LAIN.** Fitur role management & dashboard analitik manajer sedang dikembangkan oleh A1. |
| **Record Conversation** | **Squad A2** | `app/dashboard/record-conversation/page.tsx` | Disiapkan kosong untuk diisi modul formulir & riwayat percakapan oleh Squad A2. |
| **Task of Field Agent** | **Squad A2** | `app/dashboard/task-of-field-agent/page.tsx` | Disiapkan kosong untuk diisi modul worksheet lapangan oleh Squad A2. |
| **Need Backup** | **Squad A2** | `app/dashboard/need-backup/page.tsx` | Disiapkan kosong untuk diisi modul eskalasi bantuan oleh Squad A2. |
| **Field Agent Management** | **Squad A2** | `app/dashboard/field-agent-management/page.tsx` | Disiapkan kosong untuk diisi modul manajemen agent oleh Squad A2. |

---

## 🤖 Panduan Khusus untuk Antigravity / AI Agent (Squad A2)

Jika Anda atau AI Coding Assistant Anda (seperti Google Antigravity / Claude / Cursor) bekerja di repositori ini untuk mengimplementasikan fitur **Squad A2**:

1. **Titik Masuk Integrasi Sales Executive:**
   * Tombol **`+ Record Conversation`** di modal detail meeting (`app/dashboard/meeting-schedule/page.tsx`) akan mengirimkan query param: `customer_id`, `customer_name`, `meeting_id`, `source_meeting_id` ke rute `/dashboard/record-conversation`.
   * Tombol **`View Task`** di tabel Company List (`components/customer/CustomerTable.tsx`) akan mengirimkan query param `company_id` ke rute `/dashboard/task-of-field-agent`.
   * Metrik Task pada dashboard membaca baris dari tabel Supabase `a2_worksheets`.

2. **Batasan Mutlak (Boundary Rule):**
   * **JANGAN PERNAH MENGUBAH** file di dalam `app/dashboard/manager-customer-success/` dan `components/dashboard/ManagerCustomerSuccessDashboard.tsx`.
   * Bagian Manager CS diisolasi secara fisik sehingga ketika Anda melakukan push/merge integrasi Sales Executive, tim A1 dapat melakukan `git pull` tanpa khawatir fitur Manager CS tertimpa atau rusak.

---

## 🚀 Memulai Pengembangan Lokal

1. Salin konfigurasi environment ke `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://ufjbbwqaztgkqmpdmcyv.supabase.co"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_0GFbshHOM6k80Wxde_iZVQ_v6DpVj1D"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_0GFbshHOM6k80Wxde_iZVQ_v6DpVj1D"
   ```

2. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

3. Buka di browser:
   * **Dashboard Sales Executive:** `http://localhost:3000/dashboard/sales-executive`
   * **Dashboard Manager CS:** `http://localhost:3000/dashboard/manager-customer-success`
   * **Record Conversation (A2):** `http://localhost:3000/dashboard/record-conversation`
   * **Task Field Agent (A2):** `http://localhost:3000/dashboard/task-of-field-agent`
