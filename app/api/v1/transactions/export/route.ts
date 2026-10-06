import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() || "";
  if (!from || !to || from > to) return createErrorResponse("VALIDATION_001", "A valid date range is required.", undefined, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return createErrorResponse("VALIDATION_001", "Dates must use YYYY-MM-DD format.", undefined, 400);

  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable.", undefined, 503);

  try {
    const endExclusive = new Date(`${to}T00:00:00Z`);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endExclusiveDate = `${endExclusive.getFullYear()}-${String(endExclusive.getMonth() + 1).padStart(2, "0")}-${String(endExclusive.getDate()).padStart(2, "0")}`;
    let companyQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id, company_name, name, customer_code, job_number, created_by, created_at")
      .is("deleted_at", null)
      .gte("created_at", `${from}T00:00:00Z`)
      .lt("created_at", `${endExclusiveDate}T00:00:00Z`)
      .order("created_at", { ascending: false });
    if (search) companyQuery = companyQuery.or(`company_name.ilike.%${search}%,name.ilike.%${search}%`);
    const companiesResult = await companyQuery;
    if (companiesResult.error) throw companiesResult.error;
    const companies = (companiesResult.data || []).map((company: any) => ({
      id: company.company_list_id,
      companyName: company.company_name,
      customerCode: company.customer_code,
      jobNumber: company.job_number,
      createdDate: company.created_at,
      primaryPic: company.name ? { fullName: company.name } : null,
    }));
    return createSuccessResponse(companies);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown database error";
    return createErrorResponse("EXPORT_001", `Failed to load company records: ${detail}`, undefined, 500);
  }
}
