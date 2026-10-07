import { NextRequest } from "next/server";
import { createCustomer, getCustomers } from "@/lib/services/customer-service";
import { cancelExpiredOneTimeMeetings } from "@/lib/services/meeting-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { isValidPicPhoneNumber } from "@/lib/validation/pic-phone";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = request.nextUrl.searchParams.get("context");
  try {
    await cancelExpiredOneTimeMeetings();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const requestedLimit = Number.parseInt(searchParams.get("limit") || searchParams.get("perPage") || "20", 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const perPage = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
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

/** Canonical create endpoint; the /customers/create route remains as a legacy alias. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return createErrorResponse("CREATE_002", "Invalid request body", undefined, 400);
  }
  const companyName = body.company_name;
  const address = body.address;
  const picName = body.pic_name ?? body.pic_full_name;
  const picNumber = body.pic_number ?? body.pic_phone_number;
  if (typeof companyName !== "string" || !companyName.trim()) return createErrorResponse("CUSTOMER_001", "Company name is required", undefined, 400);
  if (typeof address !== "string" || !address.trim()) return createErrorResponse("CUSTOMER_001", "Address is required", undefined, 400);
  if (typeof picName !== "string" || !picName.trim()) return createErrorResponse("CUSTOMER_001", "PIC name is required", undefined, 400);
  if (typeof picNumber !== "string" || !picNumber.trim()) return createErrorResponse("CUSTOMER_001", "PIC phone number is required", undefined, 400);
  if (!isValidPicPhoneNumber(picNumber)) return createErrorResponse("CUSTOMER_002", "Use a PIC phone number beginning with 0 or +62", undefined, 400);

  const result = await createCustomer({ company_name: companyName, address, pic_full_name: picName, pic_phone_number: picNumber });
  if (!result.success) {
    if (result.error?.includes("No login session")) return createErrorResponse("AUTH_001", "Your profile session has expired. Please sign in again.", undefined, 401);
    if (result.error?.includes("DUPLICATE_COMPANY")) return createErrorResponse("CUSTOMER_003", "This company is already registered", undefined, 409);
    return createErrorResponse("CUSTOMER_004", result.error || "Failed to save customer data", undefined, 500);
  }
  return createSuccessResponse({ companyId: result.companyId }, undefined, 201);
}
