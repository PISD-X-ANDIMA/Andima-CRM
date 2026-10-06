# **DOKUMEN PENGUJIAN (QA)** 

## **Studi Kasus: PT Andima TransportIndo** 

_Disusun mengikuti format pada Panduan QA — (Use Case → Test Scenario → Test Case)_ 

# **Informasi Dokumen** 

|**Project Name**|CRM PT Andima TransportIndo|
|---|---|
|**Squad**|CRM – A2|
|**Penyusun**|Natalie Pratistha & Miranda Imanuella Rahmadani|
|**Tanggal Dibuat**|18 September 2026|
|**Referensi Dokumen**|FR-A2-001, FR-A2-002, FR-A2-003, FR-A2-004, TR-A2-001, TR-A2-002|



# **Riwayat Revisi (Revision History)** 

|**Versi**|**Tanggal**<br>**Revisi**|**Penyusun**|**Direvisi**<br>**Oleh**|**Deskripsi Perubahan**|**Nomor Dokumen**<br>**Terlibat**|
|---|---|---|---|---|---|
|1.0|18/09/2026|Natalie Pratistha<br>& Miranda<br>Imanuella<br>Rahmadani|-|Penyusunan awal dokumen QA<br>mencakup Use Case, Test Scenario,<br>Test Case, dan Traceability.|FR-A2-001, FR-A2-002,<br>FR-A2-003, FR-A2-004,<br>TR-A2-001, TR-A2-002|
|1.1|22/09/2026|Natalie Pratistha<br>& Miranda<br>Imanuella<br>Rahmadani|-|Penyempurnaan dan pelengkapan<br>dokumen QA, mencakup Use Case,<br>Test Scenario, Test Case, Identifikasi<br>Variable, Validity Check, Matriks<br>Test Case, serta Traceability<br>berdasarkan FR/TR.|FR-A2-001, FR-A2-002,<br>FR-A2-003, FR-A2-005,<br>FR-A2-006, FR-A2-008,<br>TR-A2-001, TR-A2-002,<br>TR-A2-003, TR-A2-004,<br>TR-A2-005|
|1.2|29/09/2026|Natalie Pratistha<br>& Miranda<br>Imanuella<br>Rahmadani|-|Penyesuaian dan pembaruan<br>dokumen FR/TR berdasarkan hasil<br>meeting.|FR-A2-001, FR-A2-002,<br>FR-A2-003|
|1.3|02/10/2026|Natalie Pratistha<br>& Miranda<br>Imanuella<br>Rahmadani|-|Penyesuaian dan pembaruan<br>dokumen FR/TR berdasarkan<br>penilaian week 3.|FR-A2-001, FR-A2-002,<br>FR-A2-003, FR-A2-004,<br>FR-A2-005, FR-A2-006,<br>TR-A2-001, TR-A2-002,<br>TR-A2-003, TR-A2-004|



# **1. Pedoman dan Acuan Pengujian** 

Pengujian pada dokumen ini mengacu pada dua alat bantu (tools) utama, yaitu Katalon Studio untuk pengujian fungsional/UI dan Postman untuk pengujian API. Berikut kriteria status dan tingkat keparahan bug yang menjadi acuan dalam pelaporan hasil pengujian. 

## **1.2 Kriteria Status Pengujian (Execution Status) — Katalon** 

|**Status**|**Arti**|**Kriteria**|
|---|---|---|
|Passed (Lulus)|Pengujian berhasil<br>penuh.|Semua langkah pengujian (test steps) berjalan sukses dan semua<br>validasi (assertions) bernilai benar (true). Tidak ada error atau<br>kegagalan sistem.|
|Failed (Gagal)|Validasi aplikasi tidak<br>sesuai ekspektasi.|Terjadi kegagalan pada titik verifikasi (checkpoint/assertion), misalnya<br>teks yang muncul di layar berbeda dengan yang diharapkan dalam<br>skrip.|
|Error (Kesalahan)|Gangguan teknis pada<br>skrip atau lingkungan.|Terjadi masalah teknis yang membuat skrip tidak dapat diselesaikan,<br>contoh: elemen web tidak ditemukan (NoSuchElementException),<br>koneksi terputus, atau kesalahan sintaksis kode.|
|Incomplete (Tidak<br>Selesai)|Pengujian terhenti di<br>tengah jalan.|Eksekusi dihentikan secara paksa oleh pengguna (user aborted)<br>sebelum seluruh langkah selesai dijalankan.|
|Skipped<br>(Dilewati)|Pengujian sengaja tidak<br>dijalankan.|Test case sengaja dilewati karena kondisi tertentu, biasanya diatur<br>dengan anotasi @Ignore atau karena test case prasyarat sebelumnya<br>gagal.|



## **1.3 Tingkat Keparahan Bug (Severity Levels) — Postman** 

|**Level**|**Definisi**|**Contoh pada Postman**|
|---|---|---|
|Blocker (S1)|Masalah total yang menghentikan<br>seluruh proses pengujian atau<br>fungsi sistem.|Server API mengalami down (error 500/503) pada semua<br>endpoint, atau autentikasi login token gagal total sehingga<br>tidak ada request lain yang dapat diuji.|
|Critical (S2)|Fitur utama/fungsionalitas bisnis<br>inti gagal berfungsi, atau terjadi<br>kehilangan data.|API checkout pesanan mengembalikan response error, atau<br>salah menghitung total harga saat payload dikirimkan.|
|Major (S3)|Fitur penting terganggu, namun<br>sistem/alur lain masih dapat<br>berjalan.|Response API berhasil memberikan data, tetapi format data<br>JSON salah (misalnya tipe data string berubah menjadi null),<br>atau fungsi sorting/filter pada query parameter tidak<br>merespons dengan benar.|
|Minor (S4)|Masalah kecil yang tidak<br>berdampak besar pada fungsi<br>utama aplikasi.|Pesan error dari API salah ketik (typo), atau kode HTTP<br>status yang dikembalikan tidak sesuai standar (misalnya<br>harusnya 200 OK, malah 201 Created untuk proses GET).|
|Trivial (S5)|Masalah<br>sepele<br>yang tidak<br>memengaruhi fungsionalitas.|Dokumentasi pada deskripsi request collection yang 2aria,<br>atau penamaan environment yang kurang rapi.|



# **2. Deskripsi Sistem dan Aktor** 

## **2.1 Gambaran Umum Sistem — Studi Kasus PT Andima TransportIndo** 

CRM PT Andima TransportIndo dirancang untuk mengelola hubungan dan tindak lanjut dengan customer, termasuk pencatatan 

_interacation,_ pemantauan kendala pelanggan, pencatatan serah terima _issue_ (eskalasi), penyediaan _API_ dan _Database_ untuk interaksi pelanggan _._ Sistem digunakan oleh Customer Success dan Sales Executive sesuai hak akses. Scope customer dalam sistem mencakup lima customer perusahaan aktif. 

CRM PT Andima TransportIndo menyediakan beberapa layanan utama sebagai berikut: 

- Monitoring Task Field Agent dan Hasil Pemeriksaan – Digunakan oleh Sales Executive untuk memantau status task Field Agent dan melihat hasil pemeriksaan yang tersedia berdasarkan Job Number, termasuk data aktual, foto, dokumen pendukung, dan hasil verifikasi. 

- Monitoring Issue/Kendala Pelanggan – Digunakan untuk memantau issue yang ditemukan dari hasil task Field Agent, melihat informasi issue yang terkait dengan Job Number, serta meneruskan issue yang membutuhkan bantuan ke Need Backup. 

- Record Conversation/Merekam Percakapan Pelanggan – Digunakan untuk mencatat dan mengelola informasi komunikasi dengan customer sebagai pengetahuan organisasi. Record Conversation dapat dikaitkan dengan Customer/Company dan Job Number. 

- Job/Transaksi Field Agent – Digunakan untuk membuat dan mengelola Job/Transaksi, menghubungkan transaksi dengan Customer/Company, menyediakan Job Number, serta melihat informasi transaksi dan status task. 

- Assignment Field Agent – Digunakan oleh Sales Executive untuk melakukan penugasan Field Agent pada Job/Transaksi, memilih Field Agent yang tersedia dari HRMS, menyimpan hubungan antara Job Number dan Field Agent, serta mencatat aktivitas assignment. 

## **2.2 Aktor dan Fungsi yang Diperankan** 

### <u>Terdapat tiga aktor utama yang menggunakan sistem dengan hak akses dan fungsi yang berbeda.</u> 

|**Aktor**|**Lay**|**anan yang Dapat Diaks**|**es**|**K**|**eterangan Fungsi**|
|---|---|---|---|---|---|
|Customer Success|Pencatatan<br>Pelanggan,<br>Permintaan<br>Kasus|Interaksi dan Tindak<br>Pemantauan dan<br>Bantuan, Riwayat Pena|Lanjut<br>Eskalasi<br>nganan<br>Menan<br>issue<br>peman<br>tindak|gani d<br>yang<br>tauan<br>lanjut.|an mengambil keputusan atas<br>dieskalasikan, melakukan<br>pekerjaan, dan memastikan|
|Sales Executive|Pencatatan<br>Pelanggan,|Interaksi dan Tindak<br>Riwayat Penanganan Ka|Lanjut<br>sus<br>Mener<br>awal,<br>menet<br>kelebi|bitkan<br> _uploa_<br>apkan<br>han bay|Job Number, membuat tiket<br>_d_<br>log percakapan harian,<br> _PIC_, dan menentukan aksi<br>ar.|



# **3. Use Case** 

## **3.0 Pemahaman QA terhadap FR & TR sebagai Dasar Penyusunan Use Case** 

Setiap Use Case disusun berdasarkan spesifikasi fungsional pada FR-A2-001 sampai FR-A2-006 dan ketentuan teknis pada TRA2-001 hingga TR-A2-004. Pemahaman terhadap FR & TR digunakan untuk mengidentifikasi alur utama, kondisi alternatif, dan kondisi error pada setiap fitur. Cakupan Use Case meliputi Monitoring Task Field Agent dan Hasil Pemeriksaan, Monitoring Issue / Kendala Pelanggan, Record Conversation / Merekam Percakapan Pelanggan, Job / Transaksi Field Agent, dan Assignment Field Agent. Setiap alur pada Use Case disesuaikan dengan aturan dan kebutuhan yang telah ditetapkan dalam FR dan TR sebagai dasar penyusunan Test Scenario dan Test Case oleh QA. 

## **3.1 Monitoring Task Field Agent dan Hasil Pemeriksaan** 

## **Tampilan** 

Berikut tampilan antarmuka (UI/UX) Monitoring Task Field Agent dan Hasil Pemeriksaan 

## **<u>Use Case</u>** 

|**Use Case ID**|UC-CRM-A2-001|
|---|---|
|**Reference To**|FR-A2-005,TR-A2-001,TR-A2-004|
|**NamaUse Case**|MonitoringTask FieldAgentdan Hasil Pemeriksaan|
|**Aktor **|SalesExecutive|



## **<u>Isi Use Case</u>** 

|**Deskripsi**|Use Case ini menjelaskan proses Sales Executive dalam memantau status task Field Agent<br>dan melihat hasil pemeriksaan yang telah diselesaikan. Sistem menampilkan status task,<br>hasil pemeriksaan, data aktual, foto, dokumen pendukung, serta hasil verifikasi yang<br>terhubung dengan Job Number. Sales Executive hanya dapat melihat hasil pemeriksaan<br>tanpa mengubahdatayangtelahdiisioleh FieldAgent.|
|---|---|
|**Prakondisi**|Sales Executive telah berhasil login ke sistem CRM, memiliki akses untuk memantau task<br>Field Agent,serta data transaksi danJob Number telah tersediapada sistem.|
|**Alur Utama (Basic**|1.<br>Sales Executive membuka fitur monitoring task Field Agent.|
|**Flow)**|2.<br>Sistem menampilkandaftar task FieldAgentbesertaJob Numberdanstatustask.|



||3.<br>4.<br>5.<br>6.<br>7.<br>8.<br>9.<br>10.|Sales Executive memilih task yang akan dipantau.<br>Sistem mengambil data task berdasarkan Job Number yang dipilih.<br>Sistem menampilkan informasi task dan status pekerjaan Field Agent.<br><br>E-1 Task Belum Selesai<br>Sales Executive memilih task yang telah selesai untuk melihat hasil pemeriksaan.<br>Sistem mengambil hasil pemeriksaan yang terhubung dengan Job Number.<br><br>E-2 Hasil Pemeriksaan Belum Tersedia<br><br>E-3 Data Hasil Pemeriksaan Tidak Ditemukan<br>Sistem menampilkan detail hasil pemeriksaan, termasuk data aktual, foto,<br>dokumen pendukung, dan hasil verifikasi yang tersedia.<br>Sales Executive meninjau hasil pemeriksaan tanpa mengubah data yang telah<br>diisi oleh Field Agent.<br> Use Case selesai.|
|---|---|---|
|**Alur Alternatif**<br>**(Alternative Flow)**|-||
||E-1 Tas<br>1.<br>2.<br>3.<br>4.<br>E-2 Has|k Belum Selesai<br>Sistem memeriksa status task .<br>Sistem mendeteksi task belum selesai.<br>Sistem menampilkan status task saat ini.<br>Kembali ke Basic Flow Langkah 2.<br>il Pemeriksaan Belum Tersedia|
|**Alur Error (Error**<br>**Flow)**|1.<br>2.<br>3.<br>4.<br>E-3 Dat<br>1.<br>2.<br>3.<br>4.|Sistem mencari hasil pemeriksaan berdasarkan Job Number.<br>Sistem tidak menemukan hasil pemeriksaan yang tersedia.<br>Sistem menampilkan pesan bahwa hasil pemeriksaan belum tersedia.<br>Kembali ke Basic Flow Langkah 2.<br>a Hasil Pemeriksaan Tidak Ditemukan<br>Sistem mengambil data hasil pemeriksaan berdasarkan Job Number.<br>Data hasil pemeriksaan tidak ditemukan.<br>Sistem menampilkan pesan bahwa data hasil pemeriksaan tidak ditemukan.<br>Kembali ke Basic Flow Langkah 2.|
|**Pascakondisi**|Sales E<br>yang tel<br>tidak be|xecutive dapat melihat status task Field Agent dan meninjau hasil pemeriksaan<br>ah tersedia berdasarkan Job Number. Data hasil pemeriksaan tetap tersimpan dan<br>rubah karenaSales Executive hanya memiliki akses untuk melihat hasil tersebut.|
|**Referensi Requirement**|_FR-A2-_|_005, TR-A2-001, TR-A2-004._|





<!-- Start of picture text -->
Monitoring Task Field Agent dan<br>Hasil Pemeriksaan<br>E1<br>BEA<br>E2 E3<br>aeee<br><!-- End of picture text -->

## **<u>Matriks Skenario</u>** 

|**Skenario**|**Basic Flow**|**Error Flow**|**Alternative Flow**|
|---|---|---|---|
|Skenario1|BF|**—**|**—**|
|Skenario 2|BF|E1|**—**|
|Skenario 3|BF|E2|**—**|
|Skenario 4|BF|E3|**—**|



**Test Skenario** 

|**Skenario ID**|**Use Case Terkait**|**Judul Skenario**|**Tujuan Pengujian**|
|---|---|---|---|
|TS-001|UC-CRM-A2-<br>001|Monitoring Task dan<br>Hasil Pemeriksaan<br>dengan Data Valid|Memastikan Sales Executive dapat melihat<br>status task dan meninjau hasil pemeriksaan<br>yang tersedia berdasarkan Job Number.|
|TS-002|UC-CRM-A2-<br>001|Monitoring Task yang<br>Belum Selesai|Memastikan sistem menampilkan status task<br>saat ini ketika task Field Agent belum selesai.|
|TS-003|UC-CRM-A2-<br>001|Hasil Pemeriksaan<br>Belum Tersedia|Memastikan sistem menampilkan pesan bahwa<br>hasil pemeriksaan belum tersedia ketika hasil<br>pemeriksaan belum tersedia untuk ditampilkan.|
|TS-004|UC-CRM-A2-<br>001|Data Hasil<br>Pemeriksaan Tidak<br>Ditemukan|Memastikan sistem menampilkan pesan bahwa<br>data hasil pemeriksaan tidak ditemukan<br>berdasarkan Job Number.|



## **<u>Identifikasi Variable</u>** 

|**No.**|**Variabel**|**Keterangan**|
|---|---|---|
|1|Job Number|Nomor identitas transaksi yang digunakan untuk menghubungkan task<br>dan hasil pemeriksaan.|
|2|Status Task|Status pekerjaan Field Agent yang ditampilkan pada transaksi.|
|3|Hasil Pemeriksaan|Data hasil pemeriksaan yang diisi oleh Field Agent.|
|4|Data Aktual|Data aktual hasil pemeriksaan yang tersedia pada task.|
|5|Foto|Dokumentasi pemeriksaan yang terhubung dengan hasil pemeriksaan.|
|6|Dokumen Pendukung|Dokumen yang terhubung dengan hasil pemeriksaan.|
|7|Hasil Verifikasi|Hasil checklist verifikasi yang diisi Field Agent.|



## **<u>Validity Check</u>** 

|**Variabel**|**Valid**|**Invalid**|
|---|---|---|
|Job Number|Job Number tersedia dan terhubung<br>dengan task.|Job Number tidak ditemukan atau<br>tidak memiliki relasi task yang<br>valid.|
|Status Task|Status task tersedia dan sesuai dengan<br>kondisi pekerjaan.|Status task tidak tersedia atau<br>tidak dapat dikenali oleh sistem.|
|Hasil Pemeriksaan|Data hasil pemeriksaan tersedia dan<br>terhubung dengan Job Number.|Hasil pemeriksaan belum tersedia<br>atau tidak ditemukan.|
|Data Aktual|Data aktual tersedia sesuai hasil<br>pemeriksaan.|Data aktual tidak tersedia atau<br>tidak dapat ditampilkan.|
|Foto|Foto tersedia dan dapat diakses jika<br>terdapat dokumentasi.|File foto tidak ditemukan, rusak,<br>atau tidak dapat diakses.|
|Dokumen Pendukung|Dokumen tersedia dan dapat diakses jika<br>terdapat dokumen pendukung.|File tidak ditemukan, rusak, atau<br>tidak dapat diakses.|
|Hasil Verifikasi|Hasil verifikasi tersedia dan dapat<br>ditampilkan jika telah diisi.|Hasil verifikasi tidak ditemukan<br>atau tidak dapat ditampilkan.|



## **Test Case** 

## **<u>Matriks Test Case</u>** 

|**Test**<br>**Case**<br>**ID**|**Skenario**|**Job**<br>**Number**|**Status**<br>**Task**|**Hasil**<br>**Pemeriksaan**|**Expected Output**|**Keterangan**|
|---|---|---|---|---|---|---|
|TC-0|Skenario 1:|Valid|Valid|Valid|Sistem menampilkan status task dan|Data valid|
|01|BF||||detail hasil pemeriksaan yang<br>tersedia.||
|TC-0<br>02|Skenario 2:<br>BF→E-1|Valid|Invalid|Tidak diuji|Sistem menampilkan status task saat<br>ini tanpa menampilkan hasil sebagai|Task belum<br>selesai|



||||||hasil yang telah selesai.||
|---|---|---|---|---|---|---|
|TC-0<br>03|Skenario 3:<br>BF→E-2|Valid|Valid|Invalid|Sistem menampilkan pesan bahwa<br>hasil pemeriksaan belum tersedia.|Hasil belum<br>tersedia|
|TC-0|Skenario 4:|Valid|Valid|Invalid|Sistem menampilkan pesan bahwa|Data hasil|
|04|BF → E-3||||data hasil pemeriksaan tidak<br>ditemukan.|tidak<br>ditemukan|



## **<u>Nilai Aktual pada Variabel</u>** 

|**Test**<br>**Case**<br>**ID**|**Skenario**|**Job**<br>**Number**|**Status**<br>**Task**|**Hasil Pemeriksaan**|**Expected Output**|**Keterangan**|
|---|---|---|---|---|---|---|
|TC-<br>001|Skenario 1:<br>BF|JOB-001|Selesai|Data pemeriksaan, foto,<br>dokumen pendukung, dan<br>hasil verifikasi tersedia|Status task dan hasil<br>pemeriksaan berhasil<br>ditampilkan.|Data valid|
|TC-<br>002|Skenario 2:<br>BF → E-1|JOB-002|Dalam<br>Proses|Tidak diuji|Sistem menampilkan<br>status task saat ini<br>tanpa menampilkan<br>hasil<br>pemeriksaan<br>yang belum selesai.|Task belum<br>selesai|
|TC-<br>003|Skenario 3:<br>BF → E-2|JOB-003|Selesai|Belum tersedia|Sistem menampilkan<br>pesan bahwa hasil<br>pemeriksaan belum<br>tersedia.|Hasil belum<br>tersedia|
|TC-<br>004|Skenario 4:<br>BF → E-3|JOB-004|Selesai|Tidak ditemukan|Sistem menampilkan<br>pesan bahwa data<br>hasil<br>pemeriksaan<br>tidak ditemukan.|Data hasil<br>tidak<br>ditemukan|



## **3.2 Monitoring Issue / Kendala Pelanggan** 

## **Tampilan** 

Berikut tampilan antarmuka (UI/UX) layanan Monitoring Issue / Kendala Pelanggan 

## **<u>Use Case</u>** 

|**Use Case ID**|UC-CRM-A2-002|
|---|---|
|**Reference To**|FR-A2-006,TR-A2-001|
|**NamaUse Case**|MonitoringIssue /Kendala Pelanggan|
|**Aktor **|SalesExecutive|
|**Isi Use Case**<br>**Deskripsi**|Use Case ini digunakan oleh Sales Executive untuk memantau issue yang ditemukan dari<br>hasil task Field Agent, melihat informasi issue yang terkait dengan Job Number, dan<br>meneruskan issue yang butuhbantuan ke NeedBackup.|
|**Prakondisi**|Sales Executive telah berhasil login ke sistem CRM, data task Field Agent dan hasil<br>pemeriksaan tersedia serta memiliki akses ke fitur MonitoringIssue.|
||1.<br>Aktor memilih menu Monitoring Issue.<br>2.<br>Sistem menampilkan halaman Monitoring Issue.<br>3.<br>Sistem menampilkan indikator issue pada hasil task Field Agent.<br>4.<br>Aktor memilih issue yang ingin dipantau.<br>5.<br>Sistem menampilkan informasi dasar issue beserta Job Number yang terkait.|
|**Alur Utama (Basic**<br>**Flow)**|<br>E-1 Data Issue Tidak Lengkap<br>6.<br>Aktor memeriksa informasi issue yang ditampilkan.<br>7.<br>Aktor menentukan apakah issue membutuhkan bantuan lebih lanjut.<br><br>A-1 Issue Tidak Membutuhkan Bantuan<br>8.<br>Aktor melanjutkan issue yang membutuhkan bantuan ke Need Backup.<br>9.<br>Sistem memproses penerusan issue ke Need Backup.<br><br>E-2 Need Backup Gagal Dibuat<br>10. Sistem menampilkan hasilprosespenerusan issue.|



## **<u>Isi Use Case</u>** 

||11.|Use Case selesai.|
|---|---|---|
||A-1 Issu|e Tidak Membutuhkan Bantuan|
|**Alur Alternatif**|1.|Aktor memutuskan bahwa issue tidak membutuhkan bantuan lebih lanjut.|
|**(Alternative Flow)**|2.<br>3.|Aktor tidak meneruskan issue ke Need Backup.<br>UseCase selesai.|
|**Alur Error (Error**|E-1 Dat<br>1.<br>2.<br>3.|a Issue Tidak Lengkap<br>Sistem menemukan data issue yang tidak lengkap.<br>Sistem menampilkan informasi issue yang tersedia.<br>Use Case selesai.|
|**Flow)**|E-2 Nee<br>1.<br>2.<br>3.|d Backup Gagal Dibuat<br>Sistem gagal membuat Need Backup setelah aktor meneruskan issue.<br>Sistem menampilkan pesan kegagalan.<br>Use Case selesai.|
|**Pascakondisi**|Informa<br>terhubun<br>diterusk|si issue dapat ditampilkan dan diperiksa oleh Sales Executive. Issue tetap<br>g dengan Job Number terkait dan issue yang membutuhkan bantuan dapat<br>an ke NeedBackup jikaproses berhasil.|
|**Referensi Requirement**|_FR-A2-0_|_06, TR-A2-001_|





<!-- Start of picture text -->
Monitoring Issue / Kendala<br>Pelanggan<br>| £2<br><!-- End of picture text -->

## **<u>Matriks Skenario</u>** 

|**Skenario**|**Basic Flow**|**Error Flow**|**Alternative Flow**|
|---|---|---|---|
|Skenario 1|BF|—|—|
|Skenario 2|BF|E-1|—|
|Skenario 3|BF|E-2|—|
|Skenario 4|BF|—|A-1|



## **<u>Test Skenario</u>** 

|**Skenario ID**|**Use Case Terkait**|**Judul Skenario**|**Tujuan Pengujian**|
|---|---|---|---|
|TS-001|UC-CRM-A2-<br>002|Monitoring Issue<br>dengan Data Valid|Memastikan sistem menampilkan informasi<br>issue yang terhubung dengan Job Number dan<br>menyediakan akses untuk meneruskan issue ke<br>Need Backup.|
|TS-002|UC-CRM-A2-<br>002|Data Issue Tidak<br>Lengkap|Memastikan sistem tetap menampilkan<br>informasi issue yang tersedia ketika data issue<br>tidak lengkap.|



|TS-003|UC-CRM-A2-|Pembuatan Need|Memastikan sistem menampilkan pesan error|
|---|---|---|---|
||002|Backup Gagal|ketika proses penerusan issue ke Need Backup<br>tidak berhasil.|
|TS-004|UC-CRM-A2-|Issue Tidak|Memastikan issue dapat diperiksa tanpa|
||002|Membutuhkan<br>Bantuan|diteruskan ke Need Backup ketika tidak<br>membutuhkan bantuan.|



## **<u>Identifikasi Variable</u>** 

|**No.**|**Variabel**|**Keterangan**|
|---|---|---|
|1|Job Number|Nomor transaksi yang menjadi referensi dan penghubung issue dengan hasil<br>task Field Agent.|
|2|Issue|Informasi ketidaksesuaian atau kendala yang ditemukan dari hasil task Field<br>Agent.|
|3|Sumber Issue|Referensi hasil task Field Agent yang menjadi sumber issue.|
|4|Need Backup|Proses penerusan issue yang membutuhkan bantuan ke Need Backup.|



## **<u>Validity Check</u>** 

|**Variabel**|**Valid**|**Invalid**|
|---|---|---|
|Job Number|Job Number tersedia dan terkait dengan<br>issue.|Job Number tidak ditemukan atau<br>tidak sesuai dengan issue.|
|Issue|Informasi issue tersedia dan dapat<br>ditampilkan.|Informasi issue tidak tersedia atau<br>tidak lengkap.|
|Sumber Issue|Referensi hasil task tersedia dan terkait<br>dengan issue.|Referensi hasil task tidak ditemukan<br>atau tidak lengkap.|
|Need Backup|Issue dapat diteruskan ketika<br>membutuhkan bantuan dan proses<br>berhasil.|Proses penerusan gagal sehingga<br>Need Backup tidak berhasil dibuat.|



## **Test Case** 

## **<u>Matriks Test Case</u>** 

|**Test Case**<br>**ID**|**Skenario**|**Job**<br>**Number**|**Issue**|**Sumber**<br>**Issue**|**Need**<br>**Backup**|**Expected Output**|**Keterangan**|
|---|---|---|---|---|---|---|---|
|TC1|Skenario 1:<br>BF|Valid|Valid|Valid|Valid|Indikator dan informasi<br>issue ditampilkan serta<br>akses Need Backup<br>tersedia.|Data valid|
|TC2|Skenario 2:<br>BF → E-1|Valid|Invalid|Valid|-|Sistem menampilkan<br>informasi issue yang<br>tersedia.|Data issue<br>tidak<br>lengkap|
|TC3|Skenario 3:<br>BF → E-2|Valid|Valid|Valid|Invalid|Sistem menampilkan<br>pesan kegagalan ketika<br>Need Backup gagal<br>dibuat.|Penerusan<br>gagal|
|TC4|Skenario 4:<br>BF → A-1|Valid|Valid|Valid|Invalid|Informasi issue<br>ditampilkan tanpa<br>meneruskan issue ke<br>Need Backup.|Issue tidak<br>diteruskan|



## **<u>Nilai Aktual pada Variabel</u>** 

|**Test Case**<br>**ID**|**Skenario**|**Job**<br>**Number**|**Issue**|**Sumber**<br>**Issue**|**Need**<br>**Backup**|**Expected Output**|**Keterangan**|
|---|---|---|---|---|---|---|---|
|TC1|S1 → BF|JOB-<br>ISSUE-001|Kerusakan<br>barang<br>ditemukan|Hasil<br>pemeriksaan<br>JOB-<br>ISSUE-001|Berhasil<br>dibuat|Indikator dan informasi<br>issue ditampilkan serta<br>akses Need Backup<br>tersedia.|Data valid|
|TC2|Skenario2:|JOB-|Kerusakan|Hasil|–|Sistem menampilkan|Dataissue|



||BF → E-1|ISSUE-003|barang (data<br>tidak<br>lengkap)|pemeriksaan<br>JOB-<br>ISSUE-003||informasi issue yang<br>tersedia.|tidak<br>lengkap|
|---|---|---|---|---|---|---|---|
|TC3|Skenario 3:<br>BF → E-2|JOB-<br>ISSUE-004|Kerusakan<br>barang<br>ditemukan|Hasil<br>pemeriksaan<br>JOB-<br>ISSUE-004|Gagal<br>dibuat|Sistem menampilkan<br>pesan kegagalan ketika<br>Need Backup gagal<br>dibuat.|Penerusan<br>gagal|
|TC4|Skenario 4:<br>BF → A-1|JOB-<br>ISSUE-005|Kendala<br>pemeriksaan<br>ditemukan|Hasil<br>pemeriksaan<br>JOB-<br>ISSUE-005|Tidak<br>diteruskan|Informasi issue<br>ditampilkan tanpa<br>meneruskan issue ke<br>NeedBackup.|Issue tidak<br>diteruskan|



## **3.3 Record Conversation / Merekam Percakapan Pelanggan** 

## **Tampilan** 

Berikut tampilan antarmuka (UI/UX) layanan Record Conversation / Merekam Percakapan Pelanggan 

## **<u>Use Case</u>** 

|**UseCase ID**|UC-CRM-A2-003|
|---|---|
|**Reference To**|FR-A2-001,TR-A2-001|
|**NamaUseCase**|RecordConversation / Merekam Percakapan Pelanggan|
|**Aktor**|Sales Executive|



## **Isi Use** **<u>Case</u>** 

|**Deskripsi**|Use Cas<br>komuni<br>Custom<br>secarao|e ini digunakan oleh Sales Executive untuk mencatat dan mengelola informasi<br>kasi customer sebagai pengetahuan organisasi. Record Conversation memiliki<br>er/Company sebagai konteks utama dan dapat terhubung dengan Job Number<br>psional.|
|---|---|---|
|**Prakondisi**|Sales<br>Custom|Executive memiliki akses ke fitur Record Conversation serta data<br>er/Company yangdiperlukan tersedia.|
||1.<br>2.<br>3.<br>4.<br>5.<br>6.<br>7.|Aktor membuka fitur Record Conversation.<br>Sistem menampilkan halaman daftar Record Conversation.<br><br>A-1 Mencari Berdasarkan Customer/Company<br><br>A-2 Mencari Berdasarkan Job Number<br><br>E-1 Record Conversation Tidak Ditemukan<br>Aktor memilih tindakan untuk membuat Record Conversation baru.<br>Sistem menampilkan form Record Conversation.<br>Aktor memilih Customer/Company.<br>Aktor mengisi tanggal/waktu, channel, dan isi/ringkasan conversation.<br>Aktor menambahkan Job Number jika diperlukan.<br>|
|**Alur Utama (Basic**<br>**Flow)**|8.<br>9.<br>10. <br>11. <br>12. <br>13. <br>14. <br>15. <br>16.|<br>A-3 Record Conversation Tanpa Job Number<br><br>A-4 Record Conversation dengan Lebih dari Satu Job Number<br>Aktor menambahkan attachment jika diperlukan.<br>Aktor menyimpan Record Conversation.<br> Sistem memvalidasi data Record Conversation.<br><br>E-2 Data Record Conversation Tidak Valid<br> Sistem menyimpan Record Conversation beserta relasi data yang terkait.<br> Sistem mencatat Created By dan Created At secara otomatis.<br> Sistem menampilkan Record Conversation yang telah tersimpan.<br> Aktor memilih Record Conversation untuk melihat detail.<br> Sistem menampilkan detail Record Conversation.<br><br>A-5 Mengubah record Conversation<br> UseCase selesai.|
||A-1 Me<br>1.<br>2.<br>3.|ncari Berdasarkan Customer/Company<br>Aktor melakukan pencarian berdasarkan Customer/Company.<br>Sistem menampilkan Record Conversation yang sesuai dengan pencarian.<br>Aktor memilih Record Conversation yang ingin dilihat.|
|**Alur Alternatif**<br>**(Alternative Flow)**|4.<br>5.<br>A-2 Me<br>1.<br>2.<br>3.|Sistem menampilkan detail Record Conversation.<br>Use Case selesai.<br>ncari Berdasarkan Job Number<br>Aktor melakukan pencarian berdasarkan Job Number.<br>Sistem menampilkan Record Conversation yang terhubung dengan Job Number<br>tersebut.<br>Aktor memilih RecordConversationyangingin dilihat.|



|4.<br>5.<br>A-3 Re<br>1.<br>2.<br>3.<br>A-4 Re<br>1.<br>2.<br>3.<br>A-5 Me<br>1.<br>2.<br>3.<br>4.<br>5.<br>6.<br>7.<br>8.<br>9.|Sistem menampilkan detail Record Conversation.<br>Use Case selesai.<br>cord Conversation Tanpa Job Number<br>Aktor tidak menambahkan Job Number.<br>Sistem mengizinkan Record Conversation dibuat tanpa Job Number.<br>Kembali ke Basic Flow langkah 8.<br>cord Conversation dengan Lebih dari Satu Job Number<br>Aktor menambahkan lebih dari satu Job Number.<br>Sistem mengaitkan Job Number yang dipilih dengan Record Conversation.<br>Kembali ke Basic Flow langkah 8.<br>ngubah Record Conversation<br>Aktor memilih tindakan untuk mengubah Record Conversation.<br>Sistem menampilkan form pengubahan Record Conversation.<br>Aktor mengubah informasi Record Conversation.<br>Aktor menyimpan perubahan.<br>Sistem memvalidasi data dan relasi Record Conversation.<br>Jika data valid, sistem menyimpan perubahan.<br>Sistem mencatat Edited By dan Edited At secara otomatis.<br>Sistem menampilkan Record Conversation yang telah diperbarui.<br>UseCase selesai.|
|---|---|
|E-1 Rec<br>1.<br>2.<br>3.<br>4.<br>E-2 Dat<br>1.|ord Conversation Tidak Ditemukan<br>Sistem mendeteksi bahwa tidak terdapat Record Conversation pada halaman<br>daftar.<br>Sistem menampilkan informasi bahwa Record Conversation tidak ditemukan.<br>Aktor memilih tindakan untuk membuat Record Conversation baru.<br>Kembali ke Basic Flow langkah 4.<br>a Record Conversation Tidak Valid<br>Sistem mendeteksi data Record Conversation tidak valid, yaitu:<br>|
|**Alur Error (Error**<br>**Flow)**<br>2.<br>3.<br>4.<br>5.<br>6.|-<br>Customer/Company belum dipilih.<br>-<br>Tanggal/Waktu belum diisi.<br>-<br>Channel belum dipilih.<br>-<br>Isi/Ringkasan belum diisi.<br>-<br>Job Number tidak ditemukan.<br>-<br>Relasi data tidak valid.<br>Sistem menolak penyimpanan Record Conversation.<br>Sistem menampilkan informasi kesalahan sesuai data yang tidak valid.<br>Aktor memperbaiki data Record Conversation.<br>Aktor menyimpan kembali Record Conversation.<br>Kembali ke Basic Flow langkah 10.|
|Record|Conversation berhasil tersimpan dan dapat ditampilkan kembali sebagai|
|**Pascakondisi**<br>pengeta<br>Number<br>danwak|huan organisasi. Record dapat terhubung dengan Customer/Company dan Job<br>jika tersedia, serta perubahan record dapat ditelusuri melalui informasi pengguna<br>tu perubahan.|
|**Referensi Requirement** _FR-A2-_|_001, TR-A2-001_|





<!-- Start of picture text -->
Record Conversation /<br>Merekam Percakapan Pelanggan<br>AL<br>£<br>ie<br># et<br>a3<br>aa<br>2<br>as<br><!-- End of picture text -->

## **<u>Matriks Skenario</u>** 

|**Skenario**|**Basic Flow**|**Error Flow**|**Alternative Flow**|
|---|---|---|---|
|Skenario 1|BF|—|—|
|Skenario 2|BF|—|A-1|
|Skenario 3|BF|—|A-2|
|Skenario 4|BF|E-1|—|
|Skenario 5|BF|—|A-3|
|Skenario 6|BF|—|A-4|
|Skenario 7|BF|E-2|—|
|Skenario 8|BF|—|A-5|



## **<u>Test Skenario</u>** 

|**Skenario ID**|**Use Case Terkait**|**Judul Skenario**|**Tujuan Pengujian**|
|---|---|---|---|
|TS-001|UC-CRM-A2-<br>003|Record Conversation<br>dengan Data Valid|Memastikan Record Conversation berhasil<br>disimpan ketika seluruh data yang diperlukan<br>valid.|
|TS-002|UC-CRM-A2-<br>003|Pencarian<br>Berdasarkan<br>Customer/Company|Memastikan sistem menampilkan Record<br>Conversation<br>berdasarkan<br>Customer/Company.|
|TS-003|UC-CRM-A2-<br>003|Pencarian<br>Berdasarkan<br>Job<br>Number|Memastikan sistem menampilkan Record<br>Conversation berdasarkan Job Number.|
|TS-004|UC-CRM-A2-<br>003|Record Conversation<br>Tidak Ditemukan|Memastikan sistem menampilkan informasi<br>ketika Record Conversation tidak ditemukan.|
|TS-005|UC-CRM-A2-<br>003|Record Conversation<br>Tanpa Job Number|Memastikan Record Conversation dapat dibuat<br>tanpa Job Number.|
|TS-006|UC-CRM-A2-<br>003|Record Conversation<br>dengan Lebih dari<br>Satu Job Number|Memastikan satu Record Conversation dapat<br>dikaitkan dengan lebih dari satu Job Number.|
|TS-007|UC-CRM-A2-<br>003|Customer/Company<br>Tidak Dipilih|Memastikan sistem menolak penyimpanan<br>ketika Customer/Company tidak dipilih|



|TS-008|UC-CRM-A2-<br>003|Job Number<br>Ditemukan|Tidak<br>Memastikan<br>kesalahan ket|sistem menampilkan pesan<br>ika Job Number tidak valid.|
|---|---|---|---|---|
|TS-009|UC-CRM-A2-<br>003|Tanggal/Waktu<br>Diisi|Tidak<br>Memastikan<br>ketika Tangg|sistem menolak penyimpanan<br>al/Waktu tidak diisi.|
|TS-010|UC-CRM-A2-<br>003|Channel Tidak|Dipilih<br>Memastikan<br>ketika Chann|sistem menolak penyimpanan<br>el tidak dipilih.|
|TS-011|UC-CRM-A2-<br>003|Isi/Ringkasan<br>Diisi|Tidak<br>Memastikan<br>ketika Isi/Rin|sistem menolak penyimpanan<br>gkasan tidak diisi.|
|TS-012|UC-CRM-A2-<br>003|Data<br>Conversation<br>Diisi|Record<br>Tidak<br>Memastikan<br>ketika data R|sistem menolak penyimpanan<br>ecord Conversation tidak diisi.|
|TS-013|UC-CRM-A2-<br>003|Mengubah<br>Conversation|Record<br>Memastikan<br>dan informasi|Record Conversation dapat diubah<br>perubahan tercatat.|



## **<u>Identifikasi Variable</u>** 

|**No.**|**Variabel**|**Keterangan**|
|---|---|---|
|1|Customer/Company|Nomor transaksi yang menjadi referensi dan penghubung issue dengan hasil<br>task Field Agent.|
|2|Job Number|Nomor Job/Transaksi yang dapat dikaitkan dengan Record Conversation<br>secara opsional dan dapat lebih dari satu.|
|3|Tanggal/Waktu|Tanggal dan waktu komunikasi dengan customer.|
|4|Channel|Channel komunikasi yang digunakan.|
|5|Isi/Ringkasam|Informasi utama atau ringkasan conversation.|
|6|Attachment|Berkas yang ditambahkan sebagai bukti atau sumber informasi conversation<br>secara opsional.|
|7|Created By|Pengguna yang membuat Record Conversation dan dicatat otomatis oleh<br>sistem.|
|8|Created At|Waktu pembuatan Record Conversation yang dicatat otomatis oleh sistem.|
|9|Edited By|Pengguna yang terakhir mengubah Record Conversation.|
|10|Edited At|Waktu perubahan terakhir Record Conversation.|



## **<u>Validity Check</u>** 

|**Variabel**|**Valid**|**Invalid**|
|---|---|---|
|Customer/Company|Customer/Company dipilih dan tersedia|Customer/Company tidak dipilih|
|Job Number|Job Number ditemukan dan dapat dikaitkan|Job Number tidak ditemukan|
|Tanggal/Waktu|Tanggal dan waktu diisi|Tanggal dan waktu tidak diisi|
|Channel|Channel komunikasi dipilih|Channel komunikasi tidak dipilih|
|Isi/Ringkasan|Isi/ringkasan diisi|Isi/ringkasan tidak diisi|
|Attachment|Attachment ditambahkan jika diperlukan|–|
|Created By|Sistem mencatat pengguna pembuat secara<br>otomatis|–|
|Created At|Sistem mencatat waktu pembuatan secara<br>otomatis|–|
|Edited By|Sistem mencatat pengguna yang melakukan<br>perubahan|–|
|Edited At|Sistem mencatat waktu perubahan secara<br>otomatis|–|



## **Test Case** 

## **<u>Matriks Test Case</u>** 

**Test Skenario Customer/ Job** 

**Tanggal/ Channel Isi/** 

**Attachment** 

**Expected Keterangan** 

|**Case**<br>**ID**||**Company**|**Number**|**Waktu**||**Ringkasan**||**Output**||
|---|---|---|---|---|---|---|---|---|---|
|TC-001|Skenario 1:<br>BF|Valid|Valid|Valid|Valid|Valid|Valid|Record<br>Conversation<br>berhasil disimpan|Seluruh data<br>yang diperlukan<br>valid|
|TC-002|Skenario 2:<br>BF → A-1|Valid|Valid|Valid|Valid|Valid|Valid|<br>Record<br>Conversation<br>berdasarkan<br>Customer/Compa<br>ny ditampilkan|Pencarian<br>Customer/Com<br>pany berhasil|
|TC-003|Skenario 3:<br>BF → A-2|Valid|Valid|Valid|Valid|Valid|Valid|<br>Record<br>Conversation<br>berdasarkan Job<br>Number<br>ditampilkan|Pencarian Job<br>Number<br>berhasil|
|TC-004|Skenario 4:<br>BF → E-1|–|–|–|–|–|–|Sistem<br>menampilkan<br>informasi bahwa<br>Record<br>Conversation<br>tidak ditemukan|Belum terdapat<br>Record<br>Conversation|
|TC-005|Skenario 5:<br>BF → A-3|Valid|Tidak<br>diisi|Valid|Valid|Valid|Tidak diisi|<br>Record<br>Conversation<br>berhasil disimpan|Job Number<br>bersifat<br>opsional|
|TC-006|Skenario 6:<br>BF → A-4|Valid|Valid|Valid|Valid|Valid|Valid|<br>Record<br>Conversation<br>berhasil disimpan<br>dengan lebih dari<br>satu Job Number|Satu Record<br>Conversation<br>dikaitkan<br>dengan<br>beberapa Job<br>Number|
|TC-007|Skenario 7:<br>BF → E-2|Invalid|Valid|Valid|Valid|Valid|Tidak diisi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Customer/<br>Company tidak<br>dipilih|
|TC-008|Skenario 8:<br>BF → E-2|Valid|Invalid|Valid|Valid|Valid|Tidak diisi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Job Number<br>tidak ditemukan|
|TC-009|Skenario 9:<br>BF → E-2|Valid|Valid|Invalid|Valid|Valid|Tidak diisi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Tanggal/Waktu<br>tidak diisi|
|TC-010|Skenario<br>10: BF →<br>E-2|Valid|Valid|Valid|Invalid|Valid|Tidak diisi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Channel tidak<br>dipilih|
|TC-011|Skenario<br>11: BF →<br>E-2|Valid|Valid|Valid|Valid|Invalid|Tidak diisi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Isi/Ringkasan<br>tidak diisi|
|TC-012|Skenario<br>12: BF →<br>E-2|Invalid|Tidak<br>diisi|Invalid|Invalid|Invalid|Tidak disi|Penyimpanan<br>Record<br>Conversation<br>ditolak dan<br>sistem<br>menampilkan<br>informasi<br>kesalahan|Data wajib<br>Record<br>Conversation<br>tidak diisi|



|TC-013|Skenario<br>13: BF →<br>A-5|Valid|Valid|Valid|Valid|Valid|Valid|Record<br>Conversation<br>berhasil<br>diperbarui dan<br>informasi<br>perubahan<br>tercatat|Edited By dan<br>Edited At<br>dicatat otomatis|
|---|---|---|---|---|---|---|---|---|---|



## **<u>Nilai Aktual pada Variabel</u>** 

|**Test**<br>**Cas**|**Skenario**|**Customer/**<br>**Company**|**Job**<br>**Number**|**Tanggal/**<br>**Waktu**|**Channel**|**Isi/Ringkasan**|**Attachment**|**Expected**<br>**Output**|**Keterangan**|
|---|---|---|---|---|---|---|---|---|---|
|**e**<br>TC-<br>001|Skenario 1:<br>BF|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 09:00|WhatsA<br>pp|Konfirmasi<br>jadwal<br>pengiriman|invoice.pdf|Record<br>Conversation<br>berhasildisimpan|Data seluruh field yang<br>diperlukan valid|
|TC-<br>002|Skenario 2:<br>BF → A-1|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 09:00|WhatsA<br>pp|Konfirmasi<br>jadwal<br>pengiriman|invoice.pdf|Record<br>Conversation<br>berdasarkan<br>Customer/Compa<br>nyditampilkan|Pencarian berdasarkan<br>Customer/Company<br>berhasil|
|TC-<br>003|Skenario 3:<br>BF → A-2|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 09:00|WhatsA<br>pp|Konfirmasi<br>jadwal<br>pengiriman|invoice.pdf|Record<br>Conversation<br>berdasarkan Job<br>Number<br>ditampilkan|Pencarian berdasarkan Job<br>Number berhasil|
|TC-<br>004|Skenario 4:<br>BF → E-1|Tidak ada|Tidak ada|Tidak ada|Tidak<br>ada|Tidak ada|Tidak ada|Sistem<br>menampilkan<br>pesan bahwa<br>Record<br>Conversation<br>tidakditemukan|Tidak terdapat Record<br>Conversation yang sesuai|
|TC-<br>005|Skenario 5:<br>BF → A-3|PT Andima<br>Transportin<br>do|Tidak diisi|05/10/202<br>6 11:00|Email|Follow up<br>kebutuhan<br>pengiriman<br>pelanggan|Tidak diisi|Record<br>Conversation<br>berhasil disimpan<br>tanpa Job<br>Number|Job Number bersifat<br>opsional|
|TC-<br>006|Skenario 6:<br>BF → A-4|PT Andima<br>Transportin<br>do|JOB-2026-<br>001 dan<br>JOB-2026-<br>002|05/10/202<br>6 09:00|Meeting|Pembahasan<br>status dua<br>transaksi<br>pelanggan|meeting-<br>notes.pdf|Record<br>Conversation<br>berhasil disimpan<br>dan terhubung<br>dengan lebih dari<br>satu Job Number|Satu Record Conversation<br>memiliki lebih dari satu<br>Job Number|
|TC-<br>007|Skenario 7:<br>BF → E-2|Tidak<br>dipilih|JOB-2026-<br>001|05/10/202<br>6 13:00|WhatsA<br>pp|Menanyakan<br>status<br>transaksi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan bahwa<br>Customer/Compa<br>nyharus dipilih|Customer/Company tidak<br>dipilih|
|TC-<br>008|Skenario 8:<br>BF → E-2|PT Andima<br>Transportin<br>do|JOB-2026-<br>999|05/10/202<br>6 13:00|WhatsA<br>pp|Menanyakan<br>status<br>transaksi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan bahwa Job<br>Number tidak<br>ditemukan|Job Number tidak tersedia<br>dalam sistem|
|TC-<br>009|Skenario 9:<br>BF → E-2|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|Tidak<br>diisi|WhatsA<br>pp|Menanyakan<br>status<br>transaksi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan bahwa<br>Tanggal/Waktu<br>harus diisi|Tanggal/Waktu tidak diisi|
|TC-<br>010|Skenario<br>10: BF →<br>E-2|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 13:00|Tidak<br>dipilih|Menanyakan<br>status<br>transaksi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan bahwa<br>Channel harus<br>dipilih|Channel tidak dipilih|
|TC-<br>011|Skenario<br>11: BF →<br>E-2|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 13:00|WhatsA<br>pp|Tidak diisi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan bahwa<br>Isi/Ringkasan<br>harus diisi|Isi/Ringkasan tidak diisi|
|TC-<br>012|Skenario<br>12: BF →<br>E-2|Tidak<br>dipilih|Tidak diisi|Tidak<br>diisi|Tidak<br>dipilih|Tidak diisi|Tidak diisi|Sistem menolak<br>penyimpanan dan<br>menampilkan<br>pesan validasi<br>pada data yang<br>wajib diisi|Seluruh data wajib tidak<br>diisi|
|TC-<br>013|Skenario<br>13: BF →<br>A-5|PT Andima<br>Transportin<br>do|JOB-2026-<br>001|05/10/202<br>6 14:00|WhatsA<br>pp|Pembaruan<br>hasil<br>komunikasi<br>dengan<br>pelanggan|invoice.pdf|Record<br>Conversation<br>berhasil diubah<br>dan informasi<br>Edited By serta<br>Edited At tercatat|Data Record Conversation<br>berhasil diperbarui|



## **3.4 Feature Job / Transaksi Field Agent** 

## **Tampilan** 

Berikut tampilan antarmuka (UI/UX) layanan Feature Job / Transaksi Field Agent 

## **<u>Use Case</u>** 

|**UseCase ID**|UC-CRM-A2-004|
|---|---|
|**Reference To**|FR-A2-002,FR-A2-003,TR-A2-001|
|**NamaUseCase**|FeatureJob / Transaksi Field Agent|
|**Aktor**|Sales Executive|



## **Isi Use** **<u>Case</u>** 

|**Deskripsi**|Use Cas<br>hasil tas<br>menerus|e ini digunakan oleh Sales Executive untuk memantau issue yang ditemukan dari<br>k Field Agent, melihat informasi issue yang terkait dengan Job Number, dan<br>kan issueyangbutuh bantuan ke Need Backup.|
|---|---|---|
|**Prakondisi**|Sales E<br>pemerik|xecutive telah berhasil login ke sistem CRM, data task Field Agent dan hasil<br>saan tersediaserta memiliki akseskefitur MonitoringIssue.|
||1.<br>2.<br>3.<br>4.<br>5.<br>6.<br>7.<br>8.<br>9.<br>10.|Aktor membuka fitur Job/Transaksi pada modul CRM.<br>Sistem menampilkan halaman Job/Transaksi.<br>Aktor memilih tindakan untuk membuat Job/Transaksi baru.<br>Sistem menampilkan formulir pembuatan Job/Transaksi.<br>Aktor mengisi informasi transaksi yang diperlukan.<br>Aktor memilih Customer/Company yang terkait dengan transaksi.<br>Aktor mengisi data shipment sesuai kebutuhan transaksi.<br>Aktor menyimpan Job/Transaksi.<br>Sistem memeriksa kelengkapan informasi yang diperlukan.<br><br>E-1 Data Transaksi Belum Lengkap<br> Sistem membuat atau menyediakan Job Number untuk transaksi.<br>|
|**Alur Utama (Basic**<br>**Flow)**|11. <br>12. <br>13. <br>14. <br>15. <br>16. <br>17.|<br>E-2 Job Number Tidak Tersedia<br> Sistem menyimpan Job/Transaksi beserta relasi data yang terkait.<br> Sistem menampilkan informasi bahwa Job/Transaksi berhasil disimpan.<br> Aktor membuka daftar Job/Transaksi.<br> Sistem menampilkan daftar transaksi beserta Job Number, Customer/Company,<br>dan status task.<br><br>A-1 Transaksi Telah Ditugaskan<br><br>A-2 Transaksi Belum Ditugaskan<br><br>A-3 Tidak Ada Transaksi<br> Aktor memilih transaksi yang telah dibuat.<br><br>E-3 Transaksi Tidak Ditemukan<br> Sistem menampilkan detail Job/Transaksi yang dipilih.<br><br>A-4 Mengubah Informasi Job/Transaksi<br> Use Case selesai.|
||A-1 Tra|nsaksi Telah Ditugaskan|
||1.<br>2.<br>3.<br>A-2 Tra<br>1.<br>2.<br>3.<br>A-3 Tid|Aktor memilih transaksi yang telah memiliki Field Agent.<br>Sistem menampilkan detail transaksi beserta Field Agent yang telah ditugaskan.<br>Use Case selesai.<br>nsaksi Belum Ditugaskan<br>Aktor memilih transaksi yang belum memiliki Field Agent.<br>Sistem menampilkan detail transaksi tanpa informasi Field Agent.<br>Use Case selesai.<br>ak Ada Transaksi|
|**Alur Alternatif**<br>**(Alternative Flow)**|1.<br>2.<br>3.<br>A-4 Me<br>1.<br>2.<br>3.<br>4.<br>5.<br>6.<br>7.<br>8.|Sistem tidak menemukan transaksi yang tersedia.<br>Sistem menampilkan kondisi daftar transaksi kosong.<br>Use Case selesai.<br>ngubah Informasi Job/Transaksi<br>Aktor memilih tindakan untuk mengubah informasi Job/Transaksi.<br>Sistem menampilkan formulir perubahan informasi Job/Transaksi.<br>Aktor mengubah informasi Job/Transaksi yang diperbolehkan.<br>Aktor menyimpan perubahan.<br>Sistem memvalidasi perubahan informasi.<br>Sistem menyimpan perubahan Job/Transaksi.<br>Sistem menampilkan informasi Job/Transaksi yang telah diperbarui.<br>Use Case selesai.|
|**Alur Error(Error**|E-1 Dat|a Transaksi Belum Lengkap|



||1.<br>2.<br>3.<br>4.<br>5.|Sistem menemukan data transaksi yang belum lengkap, yaitu:<br>-<br>Customer/Company belum dipilih.<br>-<br>Informasi transaksi yang diperlukan belum diisi.<br>-<br>Data shipment yang diperlukan belum diisi.<br>Sistem menolak penyimpanan Job/Transaksi.<br>Sistem menampilkan informasi mengenai data yang perlu dilengkapi.<br>Aktor melengkapi data yang diperlukan atau mengakhiri proses.<br>Kembali ke Basic Flow langkah 9.|
|---|---|---|
|**Flow)**|E-2 Job<br>1.<br>2.<br>3.<br>4.<br>E-3 Tra<br>1.<br>2.<br>3.|Number Tidak Tersedia<br>Sistem gagal membuat atau menyediakan Job Number.<br>Sistem menampilkan pesan kegagalan.<br>Proses penyimpanan Job/Transaksi tidak dilanjutkan.<br>Use Case selesai.<br>nsaksi Tidak Ditemukan<br>Sistem tidak menemukan transaksi yang dipilih.<br>Sistem menampilkan pesan bahwa transaksi tidak ditemukan.<br>Use Case selesai.|
||Job/Tra|nsaksi berhasil tersimpan dengan Job Number sebagai identitas utama, dapat|
|**Pascakondisi**|ditampi<br>diperba|lkan pada daftar dan detail transaksi, serta informasi yang diperbolehkan dapat<br>ruisesuai kondisi transaksi.|
|**Referensi Requirement**|_FR-A2-_|_002, FR-A2-003, TR-A2-001_|





<!-- Start of picture text -->
Feature Job / Transaksi Field<br>Agent<br>\<br>L<br>L<br>L<br>L<br><!-- End of picture text -->

## **<u>Matriks Skenario</u>** 

|**Skenario**|**Basic Flow**|**Error Flow**|**Alternative Flow**|
|---|---|---|---|
|Skenario 1|BF|—|—|
|Skenario 2|BF|E-1|—|
|Skenario 3|BF|E-1|—|
|Skenario 4|BF|E-1|—|
|Skenario 5|BF|E-1|—|
|Skenario 6|BF|E-2|—|



|Skenario 7|BF|—|A-1|
|---|---|---|---|
|Skenario 8|BF|—|A-2|
|Skenario 9|BF|—|A-3|
|Skenario 10|BF|—|A-4|
|Skenario 11|BF|E-3|—|



## **<u>Test Skenario</u>** 

|**Skenario**<br>**ID**|**Use Case**<br>**Terkait**|**Judul Skenario**|**Tujuan Pengujian**|
|---|---|---|---|
|TS-001|UC-CRM-A2-<br>004|Membuat dan melihat<br>Job/Transaksi|Memastikan<br>Aktor<br>dapat<br>membuat<br>Job/Transaksi, memperoleh Job Number,<br>melihat daftar, dan melihat detail<br>Job/Transaksi.|
|TS-002|UC-CRM-A2-<br>004|Seluruh Data Wajib<br>Belum Diisi|Memastikan sistem menolak penyimpanan<br>ketika seluruh data yang diperlukan belum<br>diisi.|
|TS-003|UC-CRM-A2-<br>004|Customer/Company<br>Belum Dipilih|Memastikan sistem menolak penyimpanan<br>ketika Customer/Company belum dipilih.|
|TS-004|UC-CRM-A2-<br>004|Informasi Transaksi<br>Belum Diisi|Memastikan sistem menolak penyimpanan<br>ketika informasi transaksi yang diperlukan<br>belum diisi.|
|TS-005|UC-CRM-A2-<br>004|Data Shipment Belum<br>Diisi|Memastikan sistem menolak penyimpanan<br>ketika data shipment yang diperlukan belum<br>diisi.|
|TS-006|UC-CRM-A2-<br>004|Job Number Tidak<br>Tersedia|Memastikan sistem menangani kondisi ketika<br>Job Number tidak tersedia.|
|TS-007|UC-CRM-A2-<br>004|Melihat<br>Transaksi<br>Telah Ditugaskan|Memastikan Aktor dapat melihat detail<br>Job/Transaksi yang telah memiliki Field Agent.|
|TS-008|UC-CRM-A2-<br>004|Melihat<br>Transaksi<br>Belum Ditugaskan|Memastikan Aktor dapat melihat detail<br>Job/Transaksi yang belum memiliki Field<br>Agent.|
|TS-009|UC-CRM-A2-<br>004|Tidak Ada Transaksi|Memastikan sistem menampilkan kondisi<br>daftar ketika tidak terdapat Job/Transaksi.|
|TS-010|UC-CRM-A2-<br>004|Mengubah Informasi<br>Job/Transaksi|Memastikan Aktor dapat mengubah informasi<br>Job/Transaksi yang diperbolehkan.|
|TS-011|UC-CRM-A2-<br>004|Transaksi<br>Tidak<br>Ditemukan|Memastikan sistem menampilkan informasi<br>ketika Job/Transaksi yang dipilih tidak<br>ditemukan.|



## **<u>Identifikasi Variable</u>** 

|**No.**|**Variabel**|**Keterangan**|
|---|---|---|
|1|Job Number|Identitas utama Job/Transaksi.|
|2|Customer/Company|Customer/Company yang terkait dengan transaksi.|
|3|Data Transaksi|Informasi transaksi yang diperlukan.|
|4|Data Shipment|Data shipment sesuai kebutuhan transaksi.|
|5|Sales|Data Sales yang terkait dengan transaksi sesuai kebutuhan.|
|6|Status Task|Status Task pada Job/Transaksi.|
|7|Field Agent|Field Agent yang ditampilkan jika telah ditugaskan.|
|8|Job Number|Identitas utama Job/Transaksi.|



**<u>Validity Check</u>** 

**<u>Variabel</u>** 

**<u>Valid</u>** 

**<u>Invalid</u>** 

|Job Number|Job Number tersedia dan sesuai dengan<br>transaksi.|Job Number tidak tersedia atau tidak<br>sesuai.|
|---|---|---|
|Customer/Company|Customer/Company dipilih dan sesuai<br>dengan transaksi.|Customer/Company belum dipilih<br>atau tidak sesuai.|
|Data Transaksi|Informasi transaksi yang diperlukan<br>lengkap.|Informasi transaksi yang diperlukan<br>belum lengkap.|
|Data Shipment|Data shipment yang diperlukan telah diisi<br>sesuai kebutuhan transaksi.|Data shipment yang diperlukan<br>belum lengkap.|
|Sales|Sales tersedia dan sesuai jika diperlukan.|Sales tidak valid ketika diperlukan.|
|Status Task|Status Task tersedia dan sesuai dengan<br>kondisi transaksi.|Status Task tidak tersedia atau tidak<br>sesuai.|
|Field Agent|Field Agent tersedia dan sesuai ketika<br>transaksi telah ditugaskan.|Field Agent tidak tersedia atau tidak<br>sesuai dengan status penugasan.|
|Job Number|Job Number tersedia dan sesuai dengan<br>transaksi.|Job Number tidak tersedia atau tidak<br>sesuai.|



## **Test Case** 

## **<u>Matriks Test Case</u>** 

|**Test**<br>**Case**<br>**ID**|**Skenario**|**Job**<br>**Numb**<br>**er**|**Custome**<br>**r/**<br>**Compan**<br>**y**|**Data**<br>**Transa**<br>**ksi**|**Data**<br>**Shipm**<br>**ent**|**Sales**|**Status**<br>**Task**|**Field**<br>**Agent**|**Data Edit**<br>**Job/Trans**<br>**aksi**|**Expected Output**|**Keteranga**<br>**n**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|TC1|Skenario<br>1: BF|Valid|Valid|Valid|Valid|Valid|Valid|Valid|-|Job/Transaksi berhasil<br>dibuat, Job Number<br>tersimpan, serta daftar<br>dan detail transaksi<br>dapat ditampilkan.|Data valid|
|TC2|Skenario<br>2: BF →<br>E-1|-|Invalid|Invalid|Invalid|-|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan<br>informasi bahwa<br>seluruh data belum<br>diisi.|Seluruh<br>data wajib<br>belum diisi|
|TC3|Skenario<br>3: BF →<br>E-1|Valid|Imvalid|Valid|Valid|Valid|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan<br>informasi bahwa<br>Customer/Company<br>belumdipilih.|Job<br>Number<br>tidak<br>tersedia|
|TC4|Skenario<br>4: BF →<br>E-1|Valid|Valid|Invalid|Valid|Valid|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan<br>informasi bahwa<br>informasi transaksi<br>yang diperlukan belum<br>diisi.|Transaksi<br>telah<br>ditugaskan|
|TC5|Skenario<br>5: BF →<br>E-1|Valid|Valid|Valid|Invalid|Valid|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan<br>informasi bahwa data<br>shipment yang<br>diperlukanbelumdiisi.|Transaksi<br>belum<br>ditugaskan|
|TC6|Skenario<br>6: BF →<br>E-2|Invalid|Valid|Valid|Valid|Valid|-|-|-|Sistem menampilkan<br>informasi bahwa Job<br>Number tidak tersedia<br>dan Job/Transaksi<br>tidak dilanjutkan untuk<br>disimpan.|Tidak ada<br>transaksi|
|TC7|Skenario<br>7: BF →<br>A-1|Valid|Valid|Valid|Valid|Valid|Valid|Valid|-|Detail Job/Transaksi<br>ditampilkan beserta<br>Field Agent yang telah<br>ditugaskan.|Data edit<br>valid|
|TC8|Skenario<br>8: BF →<br>A-2|Valid|Valid|Valid|Valid|Valid|Valid|Invalid|-|Detail Job/Transaksi<br>ditampilkan tanpa<br>FieldAgent.|Transaksi<br>tidak<br>ditemukan|



|TC9|Skenario<br>9: BF →<br>A-3|-|-|-|-|-|-|-|-|Sistem menampilkan<br>kondisi daftar<br>Job/Transaksi kosong.|Tidak ada<br>transaksi|
|---|---|---|---|---|---|---|---|---|---|---|---|
|TC1<br>0|Skenario<br>10: BF<br>→ A-4|Valid|Valid|Valid|Valid|Valid|Valid|Valid|Valid|Sistem menyimpan<br>perubahan informasi<br>Job/Transaksi yang<br>diperbolehkan dan<br>menampilkan<br>informasi yang telah<br>diperbarui.|Data edit<br>valid|
|TC1<br>1|Skenario<br>11: BF<br>→ E-3|Invalid|-|-|-|-|-|-|-|Sistem menampilkan<br>informasi bahwa<br>Job/Transaksi tidak<br>ditemukan.|Transaksi<br>tidak<br>ditemukan|



## **<u>Nilai Aktual pada Variabel</u>** 

|**Test**<br>**Case**<br>**ID**|**Sken**<br>**ario**|**Job**<br>**Number**|**Custom**<br>**er/**<br>**Compa**<br>**ny**|**Data**<br>**Transa**<br>**ksi**|**Data**<br>**Shipment**|**Sales**|**Status**<br>**Task**|**Field**<br>**Agent**|**Data**<br>**Edit**<br>**Job/Tra**<br>**nsaksi**|**Expected Output**|**Keterangan**|
|---|---|---|---|---|---|---|---|---|---|---|---|
|TC1|Sken<br>ario<br>1:<br>BF|JOB-001|PT<br>Maju<br>Jaya|Lengka<br>p|Lengkap|Sales-<br>001|Sesuai<br>transa<br>ksi|FA-001|-|Job/Transaksi berhasil<br>dibuat, Job Number<br>tersimpan, serta daftar dan<br>detail transaksi dapat<br>ditampilkan.|Data valid|
|TC2|Sken<br>ario<br>2:<br>BF<br>→<br>E-1|-|-|-|-|-|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan informasi<br>bahwa seluruh data belum<br>diisi.|Seluruh data<br>wajib belum<br>diisi|
|TC3|Sken<br>ario<br>3:<br>BF<br>→<br>E-1|-|-|Lengka<br>p|Lengkap|Sales-<br>001|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan informasi<br>bahwa Customer/Company<br>belum dipilih.|Job Number<br>tidak tersedia|
|TC4|Sken<br>ario<br>4:<br>BF<br>→<br>E-1|-|PT<br>Maju<br>Jaya|Belum<br>Lengka<br>p|Lengkap|Sales-<br>001|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan informasi<br>bahwa informasi transaksi<br>yang diperlukan belum<br>diisi.|Transaksi<br>telah<br>ditugaskan|
|TC5|Sken<br>ario<br>5:<br>BF<br>→<br>E-1|-|PT<br>Maju<br>Jaya|Lengka<br>p|Belum<br>Lengkap|Sales-<br>001|-|-|-|Sistem menolak<br>penyimpanan<br>Job/Transaksi dan<br>menampilkan informasi<br>bahwa data shipment yang<br>diperlukan belum diisi.|Transaksi<br>belum<br>ditugaskan|
|TC6|Sken<br>ario<br>6:<br>BF<br>→<br>E-2|-|PT<br>Maju<br>Jaya|Lengka<br>p|Lengkap|Sales-<br>001|-|-|-|Sistem menampilkan<br>informasi bahwa Job<br>Number tidak tersedia dan<br>Job/Transaksi tidak<br>dilanjutkan untuk<br>disimpan.|Tidak ada<br>transaksi|
|TC7|Sken<br>ario<br>7:<br>BF<br>→<br>A-1|JOB-004|PT<br>Maju<br>Jaya|Lengka<br>p|Lengkap|Sales-<br>001|On<br>Progre<br>ss|FA-001|-|Detail Job/Transaksi<br>ditampilkan beserta Field<br>Agent yang telah<br>ditugaskan.|Data edit valid|
|TC8|Sken<br>ario<br>8:<br>BF<br>→<br>A-2|JOB-005|PT<br>Sejahter<br>a|Lengka<br>p|Lengkap|Sales-<br>002|Belum<br>Dituga<br>skan|Tidak<br>ada|-|Detail Job/Transaksi<br>ditampilkan tanpa Field<br>Agent.|Transaksi<br>tidak<br>ditemukan|
|TC9|Sken<br>ario<br>9:<br>BF<br>→|-|-|-|-|-|-|-|-|Sistem menampilkan<br>kondisi daftar<br>Job/Transaksi kosong.||
||A-3|||||||||||
|TC1<br>0|Sken<br>ario|JOB-006|PT<br>Maju|Lengka<br>p|Lengkap|Sales-<br>001|On<br>Progre|FA-001|Data<br>transaks|Sistem menyimpan<br>perubahan informasi||



||10:<br>BF<br>→<br>A-4||Jaya||||ss|i<br>diperbar<br>ui dan<br>disimpa<br>n|Job/Transaksi yang<br>diperbolehkan dan<br>menampilkan informasi<br>yang telah diperbarui.|
|---|---|---|---|---|---|---|---|---|---|
|TC1<br>1|Sken<br>ario<br>11:<br>BF<br>→<br>E-3|JOB-999|-|-|-|-|-|-<br>-|Sistem menampilkan<br>informasi bahwa<br>Job/Transaksi tidak<br>ditemukan.|



## **3.5 Feature Assignment Field Agent** 

## **Tampilan** 

Berikut tampilan antarmuka (UI/UX) layanan Feature Assignment Field Agent 

## **<u>Use Case</u>** 

|**UseCase ID**|UC-CR|M-A2-005|
|---|---|---|
|**Reference To**|FR-A2|-004,TR-A2-001,TR-A2-002,TR-A2-003|
|**NamaUseCase**|Feature|Assignment Field Agent|
|**Aktor**|Sales E|xecutive|
|**Isi Use Case**|||
|**Deskripsi**|Use Ca<br>pada Jo<br>yang ter<br>dipilih,|se ini digunakan oleh Sales Executive untuk melakukan penugasan Field Agent<br>b/Transaksi, memastikan informasi transaksi telah lengkap, melihat Field Agent<br>sedia dari HRMS, menyimpan hubungan antara Job Number dan Field Agent yang<br>serta mencatat aktivitasassignment agarperubahandapatditelusuri.|
|**Prakondisi**|Sales<br>Job/Tra<br>informa|Executive telah berhasil login dan memiliki akses ke fitur Assignment.<br>nsaksi dan Data Field Agent telah tersedia. Data transaksi telah memenuhi<br>siyang dipelukanuntuk assignment.|
|**Alur Utama (Basic**<br>**Flow)**|1.<br>2.<br>3.<br>4.<br>5.<br>6.<br>7.<br>8.<br>9.<br>10. <br>11. <br>12. <br>13.|Aktor membuka fitur Assignment Field Agent.<br>Sistem menampilkan halaman Assignment Field Agent.<br>Aktor memilih Job/Transaksi yang akan ditugaskan.<br>Sistem menampilkan detail Job/Transaksi yang dipilih.<br>Sistem memeriksa kelengkapan data transaksi.<br><br>E-1 Data Transaksi Belum Lengkap<br>Sistem menampilkan daftar Field Agent yang tersedia dari HRMS.<br><br>E-2 Data Field Agent Tidak Ditemukan<br>Aktor memilih Field Agent yang akan ditugaskan.<br>Aktor mengonfirmasi assignment Field Agent.<br><br>A-1 Aktor Membatalkan Assignment<br>Sistem memvalidasi Job Number dan Field Agent yang dipilih.<br><br>E-3 Job Number Tidak Ditemukan<br> Sistem menyimpan hubungan antara Job Number dan Field Agent.<br><br>E-4 Relasi Job Number dan Field Agent Tidak Valid<br> Sistem mencatat aktivitas assignment berdasarkan identitas pengguna dan waktu<br>perubahan.<br><br>E-5 Data Pengguna Tidak Tersedia<br> Sistem menampilkan field agent yang telah berhasil ditugaskan pada<br>Job/Transaksi.<br> Use Case selesai.|
||A-1 Ak|tor Membatalkan Assignment|
|**Alur Alternatif**<br>**(Alternative Flow)**|1.<br>2.<br>3.<br>4.|Aktor membatalkan proses assignment.<br>Sistem tidak menyimpan penugasan baru.<br>Sistem kembali ke halaman sebelumnya.<br>Use Case selesai.|
||E-1 Dat<br>1.<br>|a Transaksi Belum Lengkap<br>Sistem menemukan data transaksi yang belum lengkap.<br>|
|**Alur Error (Error**<br>**Flow)**|2.<br>3.<br>4.<br>5.<br>E-2 Dat|Sistem menghentikan proses assignment.<br>Sistem menampilkan informasi mengenai data yang perlu dilengkapi.<br>Sales Executive melengkapi data transaksi atau mengakhiri proses.<br>Kembali ke Basic Flow langkah 5.<br>a FieldAgent Tidak Ditemukan|



||1.<br>2.<br>3.<br>4.<br>E-3 Job<br>1.<br>2.<br>3.<br>4.<br>5.<br>E-4 Rela<br>1.<br>2.<br>3.<br>4.<br>5.<br>E-5 Data<br>1.<br>2.<br>3.<br>4.|Sistem tidak menemukan Data Field Agent yang tersedia dari HRMS.<br>Sistem menghentikan proses assignment.<br>Sistem menampilkan informasi bahwa Field Agent tidak tersedia.<br>Use Case selesai.<br>Number Tidak Ditemukan<br>Sistem tidak menemukan Job Number yang digunakan dalam proses assignment.<br>Sistem menghentikan proses penyimpanan assignment.<br>Sistem menampilkan informasi bahwa Job Number tidak ditemukan.<br>Sales Executive kembali memilih Job/Transaksi.<br>Kembali ke Basic Flow langkah 3.<br>si Job Number dan Field Agent Tidak Valid<br>Sistem menemukan bahwa hubungan antara Job Number dan Field Agent yang<br>dipilih tidak valid.<br>Sistem menghentikan proses penyimpanan assignment.<br>Sistem menampilkan informasi mengenai relasi yang tidak valid.<br>Sales Executive memilih kembali Field Agent.<br>Kembali ke Basic Flow langkah 7.<br>Pengguna Tidak Tersedia<br>Sistem tidak menemukan data pengguna yang diperlukan untuk pencatatan<br>aktivitas assignment.<br>Sistem menghentikan proses pencatatan aktivitas assignment.<br>Sistem menampilkan informasi bahwa data pengguna tidak tersedia.<br>Use Case selesai.|
|---|---|---|
|**Pascakondisi**|Job/Tran<br>ditampil<br>diperbar|saksi berhasil tersimpan dengan Job Number sebagai identitas utama, dapat<br>kan pada daftar dan detail transaksi, serta informasi yang diperbolehkan dapat<br>uisesuai kondisi transaksi.|
|**Referensi Requirement**|_FR-A2-0_|_02, FR-A2-003, TR-A2-001_|





<!-- Start of picture text -->
Feature Assignment<br>Field Agent<br>Ai<br>Fa<br>=<br>Pa<br>&<br>es<br>5s<br><!-- End of picture text -->

## **<u>Matriks Skenario</u>** 

|**Skenario**|**Basic Flow**|**Error Flow**|**Alternative Flow**|
|---|---|---|---|
|Skenario 1|BF|—|—|
|Skenario 2|BF|—|A-1|
|Skenario 3|BF|E-1|—|
|Skenario 4|BF|E-2|—|
|Skenario 5|BF|E-3|—|
|Skenario 6|BF|E-4|—|
|Skenario 7|BF|E-5|—|



## **<u>Test Skenario</u>** 

|**Skenario ID**|**Use Case Terkait**|**Judul Skenario**|**Tujuan Peng**|**ujian**|
|---|---|---|---|---|
|TS-001|UC-CRM-A2-<br>004|Assignment<br>Field<br>Agent<br>berhasil<br>dilakukan|Memastikan<br>assignment<br>dengan data<br>valid, dan Fi|sistem dapat melakukan<br>Field Agent pada Job/Transaksi<br>transaksi lengkap, Job Number<br>eld Agent tersedia.|
|TS-002|UC-CRM-A2-<br>004|Aktor membatalkan<br>assignment<br>Field<br>Agent|Memastikan<br>assignment<br>proses assign|sistem tidak menyimpan<br>baru ketika aktor membatalkan<br>ment.|
|TS-003|UC-CRM-A2-<br>004|Data transaksi belum<br>lengkap|Memastikan<br>assignment<br>lengkap.|sistem menghentikan proses<br>ketika data transaksi belum|
|TS-004|UC-CRM-A2-<br>004|Data Field Agent tidak<br>ditemukan dari HRMS|Memastikan<br>proses assign<br>HRMS tidak|sistem tidak dapat melanjutkan<br>ment ketika data Field Agent dari<br>ditemukan.|
|TS-005|UC-CRM-A2-<br>004|Job Number tidak<br>ditemukan|Memastikan<br>ketika Job<br>ditemukan.|sistem menolak proses assignment<br>Number yang digunakan tidak|
|TS-006|UC-CRM-A2-<br>004|Relasi Job Number<br>dan Field Agent tidak<br>valid|Memastikan<br>assignment k<br>Field Agent t|sistem menolak penyimpanan<br>etika relasi antara Job Number dan<br>idak valid.|
|TS-007|UC-CRM-A2-<br>004|Data pengguna tidak<br>tersedia|Memastikan<br>assignment b<br>tersedia untu|sistem tidak menyatakan proses<br>erhasil ketika data pengguna tidak<br>k pencatatan aktivitas assignment.|



## **<u>Identifikasi Variable</u>** 

|**No.**|**Variabel**|**Keterangan**|
|---|---|---|
|1|Job Number|Identitas/referensi utama Job/Transaksi yang digunakan dalam assignment|
|2|Data Transaksi|Data yang dibutuhkan untuk menentukan apakah transaksi sudah lengkap<br>untuk assignment|
|3|Field Agent|Field Agent yang tersedia dari HRMS dan dipilih untuk assignment|
|4|Relasi Assignment|Hubungan antara Job Number dengan Field Agent|
|5|Data Pengguna|Identitas pengguna yang melakukan assignment untuk kebutuhan<br>pencatatan aktivitas|
|6|Riwayat Assignment|Informasi aktivitas assignment, termasuk Job Number, Field Agent,|



<u>tindakan, pengguna, dan waktu 7 Status Assignment Kondisi hasil proses assignment, seperti berhasil, dibatalkan, atau gagal</u> 

## **<u>Validity Check</u>** 

|**Variabel**|**Valid**|**Invalid**|
|---|---|---|
|Job Number|Job Number tersedia dan dapat digunakan<br>sebagai referensi transaksi|Job Number tidak tersedia, tidak<br>ditemukan, atau tidak valid|
|Data Transaksi|Data transaksi sudah lengkap untuk<br>dilakukan assignment|Data transaksi belum lengkap|
|Field Agent|Field Agent tersedia dari HRMS dan dapat<br>dipilih|Data Field Agent dari HRMS tidak<br>tersedia atau Field Agent yang<br>dipilih tidak valid|
|Relasi Assignment|Hubungan Job Number–Field Agent valid<br>dan dapat disimpan|Hubungan Job Number–Field Agent<br>tidak valid|
|Data Pengguna|Identitas pengguna tersedia dan dapat<br>digunakan untuk pencatatan aktivitas|Identitas pengguna tidak tersedia|
|Riwayat Assignment|Riwayat assignment berhasil disimpan|Riwayat assignment gagal disimpan|
|Status Assignment|Status sesuai dengan hasil proses<br>sebenarnya|Status tidak sesuai dengan hasil<br>proses|
|Job Number|Job Number tersedia dan dapat digunakan<br>sebagai referensi transaksi|Job Number tidak tersedia, tidak<br>ditemukan, atau tidak valid|



## **Test Case** 

## **<u>Matriks Test Case</u>** 

|**Test**<br>**Cas**<br>**e ID**|**Skenari**<br>**o**|**Job**<br>**Numbe**<br>**r**|**Data**<br>**Transaks**<br>**i**|**Field**<br>**Agent**|**Relasi**<br>**Assignmen**<br>**t**|**Data**<br>**Penggun**<br>**a**|**Riwayat**<br>**Assignmen**<br>**t**|**Status**<br>**Assignmen**<br>**t**|**Expected**<br>**Result**|**Keterangan**|
|---|---|---|---|---|---|---|---|---|---|---|
|TC1|BF|JOB-00<br>1|Valid|Valid|Valid|Valid|Valid|Valid|Assignment<br>berhasil<br>dilakukan<br>dan FA-001<br>ditampilkan<br>pada<br>Job/Transaks<br>i|Assignment<br>Field Agent<br>berhasil<br>dilakukan|
|TC2|BF →<br>A-1|JOB-00<br>2|Valid|Valid|Valid|Valid|Valid|Dibatalkan|Assignment<br>dibatalkan<br>dan data<br>assignment<br>baru tidak<br>disimpan|Aktor<br>membatalka<br>n assignment<br>Field Agent|
|TC3|BF →<br>E-1|JOB-00<br>3|Invalid|Valid|Valid|Valid|Valid|Invalid|Proses<br>assignment<br>dihentikan<br>karena data<br>transaksi<br>belum<br>lengkap|Data<br>transaksi<br>belum<br>lengkap|
|TC4|BF →<br>E-2|JOB-00<br>4|Valid|Invali<br>d|Invalid|Valid|Valid|Invalid|Field Agent<br>tidak dapat<br>ditampilkan<br>dan proses<br>assignment<br>tidak dapat<br>dilanjutkan|Data Field<br>Agent tidak<br>ditemukan<br>dari HRMS|
|TC5|BF →<br>E-3|JOB-99<br>9|Valid|Valid|Invalid|Valid|Valid|Invalid|Assignment<br>ditolak<br>karena Job<br>Number<br>tidak<br>ditemukan|Job Number<br>tidak<br>ditemukan|
|TC6|BF →<br>E-4|JOB-00<br>5|Valid|Valid|Invalid|Valid|Invalid|Invalid|Assignment<br>ditolak|Relasi Job<br>Number dan|



||||||||||karena relasi<br>Job Number<br>dan Field<br>Agent tidak<br>valid|Field Agent<br>tidak valid|
|---|---|---|---|---|---|---|---|---|---|---|
|TC7|BF →<br>E-5|JOB-00<br>6|Valid|Valid|Valid|Invalid|Invalid|Invalid|Aktivitas<br>assignment<br>tidak dapat<br>dicatat<br>sehingga<br>proses tidak<br>dinyatakan<br>berhasil|Data<br>pengguna<br>tidak<br>tersedia|



## **<u>Nilai Aktual pada Variabel</u>** 

|**Test**<br>**Case**<br>**ID**|**Job**<br>**Number**|**Data Transaksi**|**Field**<br>**Agent**|**Relasi**<br>**Assignment**|**Data**<br>**Pengguna**|**Riwayat**<br>**Assignment**|**Status**<br>**Assignme**<br>**nt**|**Actual Result**|**Keterangan**|
|---|---|---|---|---|---|---|---|---|---|
|TC1|JOB-00<br>1|Customer/<br>Company = PT<br>Maju Jaya;<br>Shipment =<br>SHP-001|FA-00<br>1 -<br>Budi|Job Number<br>JOB-001<br>terhubung<br>dengan<br>FA-001|USER-001<br>- Andi|Assignment<br>JOB-001 ke<br>FA-001<br>tercatat|Success|FA-001 berhasil<br>ditugaskan ke<br>JOB-001 dan<br>ditampilkan pada<br>Job/Transaksi|Assignment<br>Field Agent<br>berhasil<br>dilakukan|
|TC2|JOB-00<br>2|Customer/<br>Company = PT<br>Sejahtera;<br>Shipment =<br>SHP-002|FA-00<br>2 -<br>Sari|Assignment<br>dibatalkan<br>sebelum<br>disimpan|USER-001<br>- Andi|Tidak ada<br>riwayat<br>assignment<br>baru|Cancelled|Assignment<br>dibatalkan dan<br>data assignment<br>baru tidak<br>tersimpan|Aktor<br>membatalkan<br>assignment<br>Field Agent|
|TC3|JOB-00<br>3|Customer/<br>Company =<br>kosong;<br>Shipment =<br>SHP-003|FA-00<br>1 -<br>Budi|Tidak<br>diproses|USER-001<br>- Andi|Tidak ada<br>riwayat<br>assignment|Failed|Proses<br>assignment<br>berhenti karena<br>data transaksi<br>belum lengkap|Data<br>transaksi<br>belum<br>lengkap|
|TC4|JOB-00<br>4|Customer/<br>Company = PT<br>Makmur;<br>Shipment =<br>SHP-004|-|Tidak<br>diproses|USER-001<br>- Andi|Tidak ada<br>riwayat<br>assignment|Failed|Field Agent tidak<br>dapat<br>ditampilkan<br>sehingga<br>assignment tidak<br>dapat dilanjutkan|Data Field<br>Agent tidak<br>ditemukan<br>dari HRMS|
|TC5|JOB-99<br>9|Customer/<br>Company = PT<br>Sentosa;<br>Shipment =<br>SHP-005|FA-00<br>1 -<br>Budi|Job Number<br>tidak<br>ditemukan|USER-001<br>- Andi|Tidak ada<br>riwayat<br>assignment|Failed|Assignment<br>ditolak karena<br>Job Number<br>tidak ditemukan|Job Number<br>tidak<br>ditemukan|
|TC6|JOB-00<br>5|Customer/<br>Company = PT<br>Nusantara;<br>Shipment =<br>SHP-006|FA-99<br>9 -<br>Field<br>Agent<br>tidak<br>ditemu<br>kan|Relasi<br>JOB-005 dan<br>FA-999 tidak<br>valid|USER-001<br>- Andi|Tidak ada<br>riwayat<br>assignment|Failed|Assignment<br>ditolak karena<br>relasi Job<br>Number dan<br>Field Agent tidak<br>valid|Relasi Job<br>Number dan<br>Field Agent<br>tidak valid|
|TC7|JOB-00<br>6|Customer/<br>Company = PT<br>Abadi; Shipment<br>= SHP-007|FA-00<br>3 -<br>Rudi|Job Number<br>JOB-006<br>terhubung<br>dengan<br>FA-003|Data<br>pengguna<br>tidak<br>tersedia|Riwayat<br>assignment<br>tidak dapat<br>dicatat|Failed|Aktivitas<br>assignment tidak<br>tercatat dan<br>proses tidak<br>dinyatakan<br>berhasil|Data<br>pengguna<br>tidak tersedia|



