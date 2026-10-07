import { NextRequest } from "next/server";
import { getCustomers } from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = request.nextUrl.searchParams.get("context");
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("limit") || searchParams.get("perPage") || "20", 10);
    const sortBy = (searchParams.get("sortBy") || "company_name") as
      | "company_name"
      | "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const result = await getCustomers({
      search,
      page,
      perPage,
      sortBy,
      sortOrder,
      requireMeetings: context === "calendar" || context === "weeklySchedule",
    });

    const response = createSuccessResponse(result.customers, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    const detail = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
        ? error.message
        : "Unknown database error";
    const contextError = context === "weeklySchedule"
      ? "SCH_001"
      : context === "calendar"
        ? "CAL_001"
        : "LIST_001";
    return createErrorResponse(
      contextError,
      context === "weeklySchedule"
        ? `Failed to fetch weekly schedule: ${detail}`
        : context === "calendar"
          ? `Schedule data is unavailable for this period: ${detail}`
          : `Failed to load the customer list: ${detail}`,
      undefined,
      500
    );
  }
}
