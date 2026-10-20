import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MyTaskExportItem {
  id: string;
  job_number?: string;
  customer?: string;
  sales_executive?: string;
  origin?: string;
  destination?: string;
  actual_cargo?: string;
  cargo_pieces?: string;
  gross_weight?: string;
  has_issue?: boolean | null;
  status?: string;
  field_status?: string;
  date?: string;
}

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Format tanggal cetak dalam format WIB Indonesia
 */
function getFormattedPrintDate(): string {
  const now = new Date();
  return now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";
}

/**
 * 1. EXPORT TO PDF (.pdf) menggunakan jsPDF & jspdf-autotable
 * Menghasilkan file PDF vektor resmi berformat A4 Landscape dengan tabel lengkap,
 * kop surat perusahaan, metadata, dan tanda tangan resmi.
 */
export function exportMyTaskToPdfFile(
  jobs: MyTaskExportItem[],
  agentName: string = "Andima WebDev (Field Inspector)",
  activeFilter: string = "All Tasks"
): void {
  if (!jobs || jobs.length === 0) {
    alert("Tidak ada data task untuk diekspor.");
    return;
  }

  // Buat dokumen jsPDF ukuran A4 Landscape
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const printDate = getFormattedPrintDate();
  const totalTasks = jobs.length;
  const issueCount = jobs.filter((j) => j.has_issue || j.status === "Has Issue").length;
  const normalCount = totalTasks - issueCount;

  // Header / Kop Surat
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 22, "F");

  // Nama Perusahaan
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PT. ANDIMA LOGISTIK INDONESIA", 14, 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Operational Logistics CRM & Cargo Field Monitoring System", 14, 16);

  // Status Badge di pojok kanan atas kop
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(210, 6, 73, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL FIELD AGENT REPORT", 215, 12.5);

  // Judul Dokumen
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("DOKUMEN RIWAYAT MY TASK (FIELD AGENT)", 14, 32);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Daftar catatan riwayat penugasan kargo, serah terima, dan verifikasi fisik lapangan.", 14, 37);

  // Metadata Panel
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 41, 269, 15, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.text("Tanggal Cetak:", 18, 47);
  doc.text("Field Agent:", 95, 47);
  doc.text("Filter Aktif:", 180, 47);
  doc.text("Ringkasan Data:", 230, 47);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(printDate, 40, 47);
  doc.text(agentName, 115, 47);
  doc.text(activeFilter, 198, 47);
  doc.text(`${totalTasks} Task (${normalCount} Normal, ${issueCount} Issue)`, 253, 47);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Dokumen ini dihasilkan secara otomatis dan terverifikasi oleh sistem CRM Andima.", 18, 52);

  // Table Data
  const tableHeaders = [
    [
      "No",
      "Job Number",
      "Customer / Shipper",
      "Sales Executive",
      "Origin",
      "Destination",
      "Komoditas / Cargo",
      "Fisik (Koli / Berat)",
      "Problem / Issue",
      "Status",
    ],
  ];

  const tableBody = jobs.map((j, idx) => {
    const jobNum = (j.job_number || j.id || "-").startsWith("#")
      ? (j.job_number || j.id || "-")
      : `#${j.job_number || j.id || "-"}`;

    const customer = j.customer || "-";
    const sales = j.sales_executive || "-";
    const origin = j.origin && j.origin !== "[BELUM ADA]" ? j.origin : "-";
    const dest = j.destination && j.destination !== "[BELUM ADA]" ? j.destination : "-";
    const cargo = j.actual_cargo || "-";
    const pieces = j.cargo_pieces || "-";
    const weight = j.gross_weight || "-";
    const fisik = pieces !== "-" || weight !== "-" ? `${pieces} / ${weight}` : "-";
    const hasProblem = j.has_issue || j.status === "Has Issue" ? "Yes (Ada Issue)" : "No (Aman)";
    const statusText = j.field_status || j.status || "Completed";

    return [
      String(idx + 1),
      jobNum,
      customer,
      sales,
      origin,
      dest,
      cargo,
      fisik,
      hasProblem,
      statusText,
    ];
  });

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    startY: 60,
    margin: { left: 14, right: 14, bottom: 26 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy #1e3a8a
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: 25, fontStyle: "bold", textColor: [37, 99, 235] },
      2: { cellWidth: 38, fontStyle: "bold" },
      3: { cellWidth: 24 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      6: { cellWidth: 36 },
      7: { cellWidth: 26 },
      8: { cellWidth: 23, halign: "center" },
      9: { cellWidth: 22, halign: "center" },
    },
    didParseCell: (data) => {
      // Highlight row if issue
      if (data.section === "body" && data.column.index === 8) {
        if (String(data.cell.raw).includes("Yes")) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-600
        }
      }
    },
  });

  // Tanda Tangan & Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 196, 283, 196);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Andima CRM • Dokumen Laporan Riwayat My Task • Dicetak: ${printDate}`,
      14,
      201
    );
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      283,
      201,
      { align: "right" }
    );
  }

  // Unduh dokumen PDF secara otomatis
  const safeDate = new Date().toISOString().split("T")[0];
  const fileName = `Laporan_Riwayat_My_Task_${safeDate}.pdf`;
  doc.save(fileName);

  // Buka juga di tab baru untuk preview instan
  try {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
  } catch (e) {
    // ignore pop-up block
  }
}

/**
 * 2. PRINTABLE REPORT WINDOW
 * Menghasilkan jendela cetak dokumen HTML khusus berformat A4 Landscape dengan layout resmi,
 * sehingga saat dialog "Microsoft Print to PDF" muncul, dokumen yang dicetak 100% bersih,
 * lengkap, tanpa elemen browser / sidebar / tombol / scrollbar.
 */
export function openMyTaskPrintReport(
  jobs: MyTaskExportItem[],
  agentName: string = "Andima WebDev (Field Inspector)",
  activeFilter: string = "All Tasks"
): void {
  if (!jobs || jobs.length === 0) {
    alert("Tidak ada data task untuk dicetak.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback langsung ke generator PDF jsPDF jika pop-up diblokir
    exportMyTaskToPdfFile(jobs, agentName, activeFilter);
    return;
  }

  const printDate = getFormattedPrintDate();
  const totalTasks = jobs.length;
  const issueCount = jobs.filter((j) => j.has_issue || j.status === "Has Issue").length;
  const normalCount = totalTasks - issueCount;

  const rowsHtml = jobs
    .map((j, idx) => {
      const jobNum = (j.job_number || j.id || "-").startsWith("#")
        ? (j.job_number || j.id || "-")
        : `#${j.job_number || j.id || "-"}`;

      const customer = escapeHtml(j.customer || "-");
      const sales = escapeHtml(j.sales_executive || "-");
      const origin = escapeHtml(j.origin && j.origin !== "[BELUM ADA]" ? j.origin : "-");
      const dest = escapeHtml(j.destination && j.destination !== "[BELUM ADA]" ? j.destination : "-");
      const cargo = escapeHtml(j.actual_cargo || "-");
      const pieces = escapeHtml(j.cargo_pieces || "-");
      const weight = escapeHtml(j.gross_weight || "-");
      const fisik = pieces !== "-" || weight !== "-" ? `${pieces} / ${weight}` : "-";
      const hasProblem = j.has_issue || j.status === "Has Issue";
      const statusText = escapeHtml(j.field_status || j.status || "Completed");

      return `
      <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="text-align: center; font-weight: 500; color: #64748b; padding: 7px 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0284c7; padding: 7px 8px; border: 1px solid #cbd5e1; white-space: nowrap;">${jobNum}</td>
        <td style="font-weight: 600; color: #0f172a; padding: 7px 8px; border: 1px solid #cbd5e1;">${customer}</td>
        <td style="color: #475569; padding: 7px 8px; border: 1px solid #cbd5e1;">${sales}</td>
        <td style="color: #334155; padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 10px;">${origin}</td>
        <td style="color: #334155; padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 10px;">${dest}</td>
        <td style="color: #334155; padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 10px;">${cargo}</td>
        <td style="color: #475569; padding: 7px 8px; border: 1px solid #cbd5e1; font-family: monospace; white-space: nowrap;">${fisik}</td>
        <td style="text-align: center; padding: 7px 8px; border: 1px solid #cbd5e1;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; ${
            hasProblem
              ? "background-color: #ffe4e6; color: #e11d48; border: 1px solid #fda4af;"
              : "background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;"
          }">
            ${hasProblem ? "Yes (Issue)" : "No (Aman)"}
          </span>
        </td>
        <td style="text-align: center; font-weight: 600; color: #0284c7; padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 10px;">${statusText}</td>
      </tr>
    `;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Dokumen Riwayat My Task - ${printDate}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 10.5px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-bar {
            background-color: #0f172a;
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }
          .company-name {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin: 0 0 3px 0;
          }
          .company-sub {
            font-size: 9px;
            color: #94a3b8;
            margin: 0;
          }
          .badge-report {
            background-color: #2563eb;
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .title-section {
            margin-bottom: 12px;
          }
          .title-section h1 {
            font-size: 16px;
            font-weight: 800;
            margin: 0 0 4px 0;
            color: #0f172a;
          }
          .title-section p {
            font-size: 10px;
            color: #64748b;
            margin: 0;
          }
          .meta-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            font-size: 10px;
          }
          .meta-item strong {
            display: block;
            color: #64748b;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .meta-item span {
            font-weight: 700;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 20px;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 8px 9px;
            border: 1px solid #1e3a8a;
            font-weight: 700;
            font-size: 9.5px;
            text-align: left;
          }
          td {
            vertical-align: middle;
          }
          .signatures {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sign-box {
            width: 220px;
            text-align: center;
            font-size: 10px;
          }
          .sign-line {
            height: 60px;
            border-bottom: 1px solid #94a3b8;
            margin-bottom: 6px;
          }
          .footer-note {
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 9px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          @media screen {
            .no-print-bar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #2563eb;
              color: white;
              padding: 10px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 12px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.15);
              z-index: 9999;
            }
            .no-print-bar button {
              background: white;
              color: #2563eb;
              border: none;
              padding: 6px 14px;
              border-radius: 6px;
              font-weight: bold;
              cursor: pointer;
            }
            body {
              padding-top: 50px;
              background: #f1f5f9;
            }
            .content-wrapper {
              max-width: 1100px;
              margin: 20px auto;
              background: white;
              padding: 24px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
          }
          @media print {
            .no-print-bar {
              display: none !important;
            }
            body {
              padding: 0;
              background: white;
            }
            .content-wrapper {
              padding: 0;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span>Pratinjau Dokumen PDF - Laporan Riwayat My Task</span>
          <div>
            <button onclick="window.print()">🖶 Simpan ke PDF / Cetak</button>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="header-bar">
            <div>
              <div class="company-name">PT. ANDIMA LOGISTIK INDONESIA</div>
              <div class="company-sub">Operational Logistics CRM & Cargo Field Monitoring System</div>
            </div>
            <div class="badge-report">Official My Task Report</div>
          </div>

          <div class="title-section">
            <h1>DOKUMEN DATA RIWAYAT MY TASK</h1>
            <p>Daftar lengkap riwayat penugasan operasional kargo dan verifikasi fisik lapangan oleh Field Agent.</p>
          </div>

          <div class="meta-box">
            <div class="meta-item">
              <strong>Tanggal Cetak</strong>
              <span>${printDate}</span>
            </div>
            <div class="meta-item">
              <strong>Field Agent (Pemeriksa)</strong>
              <span>${escapeHtml(agentName)}</span>
            </div>
            <div class="meta-item">
              <strong>Kategori Filter</strong>
              <span>${escapeHtml(activeFilter)}</span>
            </div>
            <div class="meta-item">
              <strong>Ringkasan Data</strong>
              <span>${totalTasks} Task (${normalCount} Normal, ${issueCount} Issue)</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">No</th>
                <th style="width: 105px;">Job Number</th>
                <th style="width: 155px;">Customer / Shipper</th>
                <th style="width: 100px;">Sales Executive</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Komoditas / Cargo</th>
                <th style="width: 95px;">Fisik (Koli / Berat)</th>
                <th style="width: 80px; text-align: center;">Problem</th>
                <th style="width: 80px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sign-box">
              <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">Dibuat Oleh (Field Agent):</div>
              <div class="sign-line"></div>
              <div style="font-weight: 700; color: #0f172a;">${escapeHtml(agentName)}</div>
              <div style="font-size: 9px; color: #94a3b8;">Field Inspector / Pelaksana</div>
            </div>

            <div class="sign-box">
              <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">Diverifikasi Oleh (Supervisor):</div>
              <div class="sign-line"></div>
              <div style="font-weight: 700; color: #0f172a;">Ms. Wulan / Adelia</div>
              <div style="font-size: 9px; color: #94a3b8;">Sales Executive / Operations Lead</div>
            </div>
          </div>

          <div class="footer-note">
            <span>Andima CRM • Dokumen Resmi Operasional Lapangan</span>
            <span>Generated on ${printDate}</span>
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
