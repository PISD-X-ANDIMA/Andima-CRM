import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const formatted = `${day}-${month}-${year} ${hours}:${minutes}:${seconds} WIB`;
  const displayFormatted = now.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return NextResponse.json({
    success: true,
    serverTimestamp: now.toISOString(),
    formattedTimestamp: formatted,
    displayTimestamp: displayFormatted,
    epoch: now.getTime(),
  });
}
