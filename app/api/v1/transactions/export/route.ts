import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCurrentUserScope } from "@/lib/auth/roles";
import { buildCustomerOwnerFilter } from "@/lib/services/access-scope";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() || "";
  const assignedTo = request.nextUrl.searchParams.get("assigned_to")?.trim() || "";

  if (!from || !to || from > to) return createErrorResponse("VALIDATION_001", "A valid date range is required.", undefined, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return createErrorResponse("VALIDATION_001", "Dates must use YYYY-MM-DD format.", undefined, 400);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable.", undefined, 503);

  try {
    const userScope = await getCurrentUserScope(supabase);
    const endExclusive = new Date(`${to}T00:00:00Z`);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endExclusiveDate = `${endExclusive.getFullYear()}-${String(endExclusive.getMonth() + 1).padStart(2, "0")}-${String(endExclusive.getDate()).padStart(2, "0")}`;

    let companyQuery = (supabase as any)
      .from("a1_customers")
      .select("id, company_name, pic_name, pic_phone, created_by, created_by_name, created_at")
      .is("deleted_at", null)
      .gte("created_at", `${from}T00:00:00Z`)
      .lt("created_at", `${endExclusiveDate}T00:00:00Z`)
      .order("created_at", { ascending: false });

    const ownerFilter = assignedTo
      ? buildCustomerOwnerFilter([assignedTo], assignedTo)
      : userScope && !userScope.isManager
        ? buildCustomerOwnerFilter(userScope.identifiers, userScope.user.id)
        : "";

    if (ownerFilter) {
      companyQuery = companyQuery.or(ownerFilter);
    }

    if (search) {
      companyQuery = companyQuery.or(`company_name.ilike.%${search}%,pic_name.ilike.%${search}%,created_by_name.ilike.%${search}%`);
    }

    const companiesResult = await companyQuery;
    if (companiesResult.error) throw companiesResult.error;

    const companies = (companiesResult.data || []).map((company: any) => ({
      id: company.id,
      companyName: company.company_name,
      customerCode: null,
      jobNumber: null,
      createdDate: company.created_at,
      createdBy: company.created_by_name || company.created_by,
      primaryPic: company.pic_name ? { fullName: company.pic_name, phoneNumber: company.pic_phone || "" } : null,
    }));
    return createSuccessResponse(companies);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown database error";
    return createErrorResponse("EXPORT_001", `Failed to load transaction records: ${detail}`, undefined, 500);
  }
}
