import { NextRequest, NextResponse } from 'next/server';
import { getWorksheets } from '@/backend/record_conversation/worksheetService';
import { getCompanyScope } from '@/lib/services/access-scope';

/**
 * GET /api/record-conversation/worksheets
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 8)
 * Mengambil daftar penugasan lembar kerja lapangan (Field Agent Worksheets) secara bertahap
 */
export async function GET(request: NextRequest) {
  try {
    const scope = await getCompanyScope();
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 8);

    const result = await getWorksheets({
      page,
      limit,
      visibleCompanyIds: scope.isManager ? null : scope.companyIds,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('Error in GET /api/record-conversation/worksheets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
