import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getSalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const assignedTo = request.nextUrl.searchParams.get("assigned_to") || undefined;
    const stats = await getSalesExecutiveMetrics(assignedTo);
    if (stats.totalCustomers === null || stats.upcomingMeetings === null || stats.tasks === null) {
      return createErrorResponse("STAT_001", "Dashboard statistics are temporarily unavailable", undefined, 503);
    }
    return createSuccessResponse({
      total_customers: stats.totalCustomers,
      customer_percentage: stats.customerPercentage ?? 0,
      upcoming_meetings: stats.upcomingMeetings,
      meeting_percentage: stats.meetingPercentage ?? 0,
      task_count: stats.tasks,
      task_percentage: stats.taskPercentage ?? 0,
      changes: stats.changes ?? {
        customer: stats.customerPercentage ?? 0,
        meeting: stats.meetingPercentage ?? 0,
        task: stats.taskPercentage ?? 0,
      },
    });
  } catch {
    return createErrorResponse("STAT_001", "Gagal memuat data statistik, coba lagi nanti", undefined, 500);
  }
}
