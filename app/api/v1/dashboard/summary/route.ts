import { NextRequest } from "next/server";
import { getDashboardSummary } from "@/lib/services/dashboard-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    let salesId: string | null = null;

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      salesId = user?.id || null;
    }

    const summary = await getDashboardSummary(salesId);
    return createSuccessResponse(summary);
  } catch {
    return createErrorResponse("DASHBOARD_001", "Failed to load the dashboard summary", undefined, 500);
  }
}
