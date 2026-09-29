import { NextRequest, NextResponse } from 'next/server';
import { getWorksheetDetail } from '@/backend/record_conversation/worksheetService';

/**
 * GET /api/record-conversation/worksheets/[id]
 * Mengambil detail lengkap 1 lembar kerja beserta 4 tabel relasi anak:
 * 1. physical_items (a2_worksheet_physical_items)
 * 2. photos (a2_worksheet_photos)
 * 3. documents (a2_worksheet_documents)
 * 4. checklists (a2_worksheet_checklists)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const worksheetId = Number(resolvedParams.id);

    if (isNaN(worksheetId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid worksheet ID. Must be a numeric ID.',
        },
        { status: 400 }
      );
    }

    const detail = await getWorksheetDetail(worksheetId);

    if (!detail) {
      return NextResponse.json(
        {
          success: false,
          error: `Worksheet with ID #${worksheetId} not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error: any) {
    console.error(`Error in GET /api/record-conversation/worksheets/[id]:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
