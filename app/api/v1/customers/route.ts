import { NextRequest } from "next/server";
import { getCustomers } from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);
    const sortBy = (searchParams.get("sortBy") || "company_name") as
      | "company_name"
      | "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const result = await getCustomers({ search, page, perPage, sortBy, sortOrder });

    return createSuccessResponse(result.customers, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  } catch {
    return createErrorResponse(
      "SEARCH_002",
      "Gagal melakukan pencarian customer",
      undefined,
      500
    );
  }
}
