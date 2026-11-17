import { NextResponse } from "next/server";
import { a3ErrorResponse, getA3WriteClient, requireA3User } from "@/lib/a3";

export const dynamic = "force-dynamic";

/**
 * Companies a field agent can pick when entering an order, with the sales
 * owner resolved from a1_customers (created_by_name / created_by).
 */
export async function GET() {
  try {
    await requireA3User();
    const db = getA3WriteClient();

    const [{ data: companies, error }, { data: employees }] = await Promise.all([
      db
        .from("a1_customers")
        .select("id, company_name, created_by, created_by_name")
        .is("deleted_at", null)
        .order("company_name"),
      db.from("b2_register").select("id, full_name"),
    ]);
    if (error) throw error;

    const nameById = new Map((employees || []).map((e: any) => [e.id, e.full_name]));
    const data = (companies || []).map((c: any) => ({
      id: c.id,
      company_name: c.company_name,
      sales_name: c.created_by_name || nameById.get(c.created_by) || "-",
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return a3ErrorResponse(error);
  }
}
