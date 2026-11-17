import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/backend/record_conversation/statsService';
import { getCompanyScope } from '@/lib/services/access-scope';

/**
 * GET /api/record-conversation/stats
 * Mengembalikan ringkasan statistik kartu metrik dashboard:
 * - totalManagedCustomers
 * - upcomingMeetingsCount
 * - activeFieldIssuesCount
 */
export async function GET() {
  try {
    const scope = await getCompanyScope();
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
    }

    const stats = await getDashboardStats(
      scope.isManager || scope.companyIds.length === 0 ? null : scope.companyIds
    );
    const response = NextResponse.json({
      success: true,
      data: stats,
    });
    response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
    return response;
  } catch (error: any) {
    console.error('Error in GET /api/record-conversation/stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
