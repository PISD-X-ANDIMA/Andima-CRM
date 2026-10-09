import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCustomers } from "@/lib/services/customer-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const format = params.get("format") || "xlsx";
  const search = params.get("search")?.trim() || "";
  if (!["xlsx", "excel", "pdf"].includes(format.toLowerCase())) return createErrorResponse("EXPORT_001", "format must be xlsx or pdf", undefined, 400);
  try {
    const customers = [] as Awaited<ReturnType<typeof getCustomers>>["customers"];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await getCustomers({ page, perPage: 100, search });
      customers.push(...result.customers);
      totalPages = result.totalPages;
      page += 1;
    } while (page <= totalPages);
    const rows = customers.map((customer) => ({
      company_name: customer.companyName,
      address: customer.address || "",
      pic_name: customer.primaryPic?.fullName || "",
      pic_number: customer.primaryPic?.phoneNumber || "",
      meeting_schedule: customer.meetingSchedule?.formattedSchedule || "-",
      created_at: customer.createdAt,
    }));
    return createSuccessResponse(rows, { format: format.toLowerCase(), search, total: rows.length });
  } catch {
    return createErrorResponse("EXPORT_001", "Failed to prepare company export data", undefined, 500);
  }
}
