import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCustomers } from "@/lib/services/customer-service";

export const dynamic = "force-dynamic";

/** Read-only dashboard projection; scoped to the signed-in Sales Executive unless manager or force_all. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() || "";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") || "5", 10) || 5));
  const assignedTo = params.get("assigned_to")?.trim() || "";
  const forceAll = params.get("force_all") === "true" || params.get("forceAll") === "true";

  try {
    const result = await getCustomers({
      search,
      page,
      perPage: limit,
      executiveId: assignedTo || undefined,
      forceAll,
    });

    if (search && result.customers.length === 0) {
      return createErrorResponse("SRCH_001", "No customer or PIC found", undefined, 404);
    }

    return createSuccessResponse(result.customers, {
      total: result.total,
      page: result.page,
      limit: result.perPage,
      totalPages: result.totalPages,
    });
  } catch {
    return createErrorResponse("SRCH_002", "The customer search failed", undefined, 500);
  }
}
