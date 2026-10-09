import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getSalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const stats = await getSalesExecutiveMetrics();
    if (stats.totalCustomers === null || stats.upcomingMeetings === null || stats.tasks === null) {
      return createErrorResponse("STAT_001", "Dashboard statistics are temporarily unavailable", undefined, 503);
    }
    return createSuccessResponse({
      total_customers: stats.totalCustomers,
      upcoming_meetings: stats.upcomingMeetings,
      task_count: stats.tasks,
      changes: null,
    });
  } catch {
    return createErrorResponse("STAT_001", "Dashboard statistics are temporarily unavailable", undefined, 500);
  }
}
