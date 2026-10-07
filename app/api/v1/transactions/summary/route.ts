import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCustomers } from "@/lib/services/customer-service";
import type { CustomerListItem } from "@/types/customer";

export const dynamic = "force-dynamic";

/** Read-only dashboard projection; transaction and job values remain owned by A2. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() || "";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") || "5", 10) || 5));

  try {
    // Collect company pages before paginating the rows which actually have an A2 transaction.
    const transactionRows: CustomerListItem[] = [];
    let pageNumber = 1;
    let totalPages = 1;
    do {
      const result = await getCustomers({
        search,
        page: pageNumber,
        perPage: 100,
        requireTransactions: true,
      });
      transactionRows.push(...result.customers.filter((customer) => customer.transactionNo));
      totalPages = result.totalPages;
      pageNumber += 1;
    } while (pageNumber <= totalPages);

    if (search && transactionRows.length === 0) {
      return createErrorResponse("SRCH_001", "No customer or transaction found", undefined, 404);
    }

    const offset = (page - 1) * limit;
    const rows = transactionRows.slice(offset, offset + limit);
    return createSuccessResponse(rows, {
      total: transactionRows.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(transactionRows.length / limit)),
    });
  } catch {
    return createErrorResponse("SRCH_002", "The customer or transaction search failed", undefined, 500);
  }
}
