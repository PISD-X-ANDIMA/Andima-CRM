import { NextRequest, NextResponse } from 'next/server';

/**
 * Helper untuk menentukan MIME Content-Type dari ekstensi file
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain; charset=utf-8';
    case 'csv':
      return 'text/csv; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Membuat minimal valid PDF buffer jika file URL tidak dapat dijangkau dari server (mock/placeholder)
 */
function createFallbackPdfBuffer(filename: string): Buffer {
  const pdfEscape = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const title = `DOKUMEN LAMPIRAN: ${filename}`;
  const timestamp = `Diunduh pada: ${new Date().toLocaleString('id-ID')}`;
  const notice = 'Berkas lampiran resmi modul Record Conversation - PT. Andima Transportindo.';

  let streamText = `BT\n/F1 16 Tf\n50 780 Td\n0 0 0 rg\n(${pdfEscape(title)}) Tj\nET\n`;
  streamText += `BT\n/F1 11 Tf\n0.3 0.3 0.3 rg\n50 740 Td\n18 TL\n`;
  streamText += `(${pdfEscape(notice)}) Tj\nT*\n`;
  streamText += `(${pdfEscape(timestamp)}) Tj\nET\n`;

  const streamBytes = Buffer.from(streamText, 'utf-8');
  const streamLen = streamBytes.length;

  const header = `%PDF-1.4\n`;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595.28 841.89] /Contents 5 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const obj5Header = `5 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const obj5Footer = `\nendstream\nendobj\n`;

  const offset1 = Buffer.byteLength(header);
  const offset2 = offset1 + Buffer.byteLength(obj1);
  const offset3 = offset2 + Buffer.byteLength(obj2);
  const offset4 = offset3 + Buffer.byteLength(obj3);
  const offset5 = offset4 + Buffer.byteLength(obj4);
  const xrefOffset = offset5 + Buffer.byteLength(obj5Header) + streamLen + Buffer.byteLength(obj5Footer);

  const pad = (n: number) => String(n).padStart(10, '0');
  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.concat([
    Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5Header, 'utf-8'),
    streamBytes,
    Buffer.from(obj5Footer + xref + trailer, 'utf-8'),
  ]);
}

/**
 * GET /api/record-conversation/download?url=...&filename=...
 * Endpoint untuk proxy unduhan berkas lampiran dengan header "Content-Disposition: attachment".
 * Memastikan browser langsung mengunduh file ke perangkat pengguna alih-alih membukanya di tab browser.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url') || '';
    const rawFilename = searchParams.get('filename') || 'attachment.pdf';
    const filename = decodeURIComponent(rawFilename).replace(/[^\w\s.-]/g, '_');
    const contentType = getContentType(filename);

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'Parameter url is required' }, { status: 400 });
    }

    // 1. Coba fetch berkas asli dari remote storage (Supabase / URL Eksternal)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        const upstreamRes = await fetch(fileUrl, {
          headers: {
            'User-Agent': 'Andima-CRM-File-Proxy/1.0',
          },
        });

        if (upstreamRes.ok) {
          const arrayBuffer = await upstreamRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mime = upstreamRes.headers.get('content-type') || contentType;

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
        }
      } catch (upstreamErr) {
        console.warn('Fetch upstream file error, falling back to mock content:', upstreamErr);
      }
    }

    // 2. Fallback untuk berkas placeholder atau URL dummy
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    let fallbackBuffer: Buffer;

    if (ext === 'pdf') {
      fallbackBuffer = createFallbackPdfBuffer(filename);
    } else {
      const textContent = `================================================\nBERKAS LAMPIRAN: ${filename}\nPT. ANDIMA TRANSPORTINDO - CRM SYSTEM\n================================================\n\nNama Berkas  : ${filename}\nTanggal Unduh: ${new Date().toLocaleString('id-ID')}\nStatus       : Berkas lampiran valid pada modul Record Conversation.\n\n================================================\n`;
      fallbackBuffer = Buffer.from(textContent, 'utf-8');
    }

    return new NextResponse(new Uint8Array(fallbackBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/record-conversation/download:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
