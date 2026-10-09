import { NextRequest } from "next/server";
import { getDashboardSummary } from "@/lib/services/dashboard-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const summary = await getDashboardSummary();
    return createSuccessResponse(summary);
  } catch {
    return createErrorResponse("DASHBOARD_001", "Failed to load the dashboard summary", undefined, 500);
  }
}
