"use client";

import * as XLSX from "xlsx";

export type ExportCell = string | number;

export function downloadXlsx(filename: string, sheetName: string, headers: string[], rows: ExportCell[][], widths: number[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } }) };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}

export function openPdfPrintWindow() {
  return window.open("", "_blank", "width=1100,height=800");
}

export function printTableAsPdf(title: string, subtitle: string, headers: string[], rows: ExportCell[][], popup = openPdfPrintWindow()) {
  const escape = (value: ExportCell) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  const tableHead = headers.map((cell) => `<th>${escape(cell)}</th>`).join("");
  const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell || "—")}</td>`).join("")}</tr>`).join("");
  if (!popup) throw new Error("Allow pop-ups to create the PDF export.");
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    @page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#172033;margin:0}
    h1{font-size:22px;margin:0 0 5px}p{color:#64748b;margin:0 0 18px}.meta{font-size:10px;color:#64748b;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}
    th{background:#eaf1f7;text-align:left;font-weight:700}th,td{border:1px solid #cbd5e1;padding:8px;vertical-align:top;overflow-wrap:anywhere}
    tbody tr:nth-child(even){background:#f8fafc}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><h1>${escape(title)}</h1><p>${escape(subtitle)}</p><div class="meta">${rows.length} records · Generated ${escape(new Date().toLocaleString("en-GB"))}</div><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  popup.document.close();
}
