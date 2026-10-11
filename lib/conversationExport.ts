import * as XLSX from 'xlsx';

export interface ExportConversationRow {
  date: string;
  company: string;
  source: string;
  pic: string;
  summary?: string;
  need_assistance?: boolean;
}

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const exportConversationsToXLSX = (rows: ExportConversationRow[]): void => {
  if (rows.length === 0) return;
  try {
    const headers = ['Tanggal', 'Customer', 'Channel', 'Sales PIC', 'Summary', 'Need Assistance'];
    const data = rows.map((r) => [
      r.date,
      r.company,
      r.source,
      r.pic,
      r.summary || '',
      r.need_assistance ? 'Yes' : 'No',
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Conversation');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `customer-conversation-${today}.xlsx`);
  } catch (err) {
    console.error('Export XLSX error:', err);
    alert('Gagal mengekspor file Excel.');
  }
};

export const exportConversationsToPDF = (rows: ExportConversationRow[]): void => {
  if (rows.length === 0) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up pencetakan diblokir oleh browser. Harap izinkan pop-up (allow pop-ups) pada browser Anda untuk mengunduh PDF.');
    return;
  }
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const rowsHtml = rows
    .map(
      (r, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; white-space: nowrap;">${escapeHtml(r.date)}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600;">${escapeHtml(r.company)}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${escapeHtml(r.source)}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${escapeHtml(r.pic)}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${escapeHtml(r.summary || '-')}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: ${r.need_assistance ? 'bold' : 'normal'}; color: ${r.need_assistance ? '#e11d48' : '#334155'};">${r.need_assistance ? 'Yes' : 'No'}</td>
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Conversation - ${today}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 16px; }
          h2 { font-size: 16px; margin: 0 0 4px 0; color: #0f172a; }
          p { margin: 0 0 16px 0; color: #64748b; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th { background-color: #f1f5f9; padding: 9px 10px; border: 1px solid #94a3b8; text-align: left; font-weight: 700; color: #1e293b; }
        </style>
      </head>
      <body>
        <h2>Daftar Record Customer Conversation</h2>
        <p>Dicetak pada: ${today} | Total: ${rows.length} record</p>
        <table>
          <thead>
            <tr>
              <th style="width: 100px;">Tanggal</th>
              <th style="width: 200px;">Customer</th>
              <th style="width: 90px;">Channel</th>
              <th style="width: 120px;">Sales PIC</th>
              <th>Summary</th>
              <th style="width: 120px; text-align: center;">Need Assistance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
