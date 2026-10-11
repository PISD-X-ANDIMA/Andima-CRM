<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Antigravity Architecture & Codebase Ownership Guide

Dokumen ini adalah acuan resmi bagi AI Assistant (Antigravity / Coding Agent) dan Developer yang bekerja di repositori ini.

---

## 1. Pemisahan Modul & Kepemilikan Berkas (Squad A1 vs Squad A2)

Repositori ini menggabungkan modul CRM dari beberapa squad. Patuhi aturan batas lingkup (*boundaries*) berikut:

### 🟢 AREA 1: Modul Sales Executive (Squad A1 — Selesai & Terbuka untuk Touchpoint A2)
Modul ini sudah stabil dan selesai dibangun oleh Squad A1. Squad A2 hanya berinteraksi melalui titik integrasi yang sudah disediakan.
* **Halaman & Komponen Utama:**
  * `app/dashboard/sales-executive/page.tsx`
  * `components/dashboard/SalesExecutiveDashboard.tsx`
  * `app/dashboard/company-list/` & `components/customer/*`
  * `app/dashboard/meeting-schedule/`
* **Titik Integrasi untuk Squad A2:**
  * Tombol **`+ Record Conversation`** di modal detail meeting (`meeting-schedule/page.tsx`) mengarahkan ke `/dashboard/record-conversation?customer_id=...&customer_name=...&meeting_id=...`.
  * Tombol **`View Task`** di baris Company List (`components/customer/CustomerTable.tsx`) mengarahkan ke `/dashboard/task-of-field-agent?company_id=...`.
  * Kartu KPI **`Task`** di dashboard membaca jumlah baris dari tabel `a2_worksheets`.

---

### 🟡 AREA 2: Modul Squad A2 (Wewenang Squad A2 untuk Dikembangkan Penuh)
Halaman-halaman berikut telah disiapkan oleh Squad A1 dalam bentuk *clean template* dan merupakan wewenang penuh Squad A2 untuk diimplementasikan:
* **Record Conversation:** `app/dashboard/record-conversation/page.tsx`
* **Task of Field Agent:** `app/dashboard/task-of-field-agent/page.tsx`
* **Need Backup:** `app/dashboard/need-backup/page.tsx`
* **Field Agent Management:** `app/dashboard/field-agent-management/page.tsx` (alias: `field-agent-access`)
* **Tabel Database A2:** `a2_worksheets`, `a2_record_conversations`, dsb.

---

### 🔴 AREA 3: Modul Manager Customer Success (STRICT: KHUSUS SQUAD A1)
> [!CAUTION]
> **ATURAN KERAS UNTUK ANTIGRAVITY AGENT:**
> Seluruh berkas di bawah ini adalah milik **Squad A1** yang sedang dalam tahap pengembangan lanjutan (US-031 s.d US-036).  
> **DILARANG MENGUBAH, MENGHAPUS, ATAU MERUBAH LOGIKA DI DALAM FILE-FILE BERIKUT:**
> 1. `app/dashboard/manager-customer-success/` (seluruh subdirektori dan halaman)
> 2. `components/dashboard/ManagerCustomerSuccessDashboard.tsx`
> 3. `app/api/v1/manager/` (API role management & endpoint manager)
> 4. `lib/auth/roles.ts`
> 5. Tabel database `a1_user_access`

Pemisahan fisik file ini sengaja dilakukan agar ketika Squad A2 memasukkan integrasi mereka ke Sales Executive, Squad A1 dapat melakukan `git pull` tanpa khawatir logika Manager Customer Success tertimpa atau terjadi konflik (*merge conflict*).
