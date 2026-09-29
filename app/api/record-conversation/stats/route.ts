import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/backend/record_conversation/statsService';

/**
 * GET /api/record-conversation/stats
 * Mengembalikan ringkasan statistik kartu metrik dashboard:
 * - totalManagedCustomers
 * - upcomingMeetingsCount
 * - activeFieldIssuesCount
 */
export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
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
