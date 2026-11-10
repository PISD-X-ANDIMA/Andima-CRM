import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { describeSupabaseError } from "@/lib/supabase/errors";

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; message: string; code?: string; visibleRows?: number | null };

function describeError(error: any) {
  return {
    message: describeSupabaseError(error),
    code: typeof error?.code === "string" ? error.code : undefined,
    errorFields: error && typeof error === "object" ? Object.keys(error) : undefined,
    httpStatus: typeof error?.status === "number" ? error.status : undefined,
    messageWasEmpty: typeof error?.message === "string" && !error.message.trim(),
  };
}

/** Authenticated diagnostic endpoint. It returns schema/access checks, never credentials or customer data. */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: false, checks: [{ name: "Supabase configuration", ok: false, message: "Server URL or public key is missing." }] }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    if (authError?.code === "refresh_token_not_found" || /invalid refresh token|refresh token not found/i.test(authError?.message || "")) {
      // This is a session recovery action only; it does not inspect or enforce roles.
      await supabase.auth.signOut({ scope: "local" });
    }
    const diagnostic = authError ? describeError(authError) : { message: "No authenticated Supabase session was found." };
    return NextResponse.json({ success: false, checks: [{ name: "Authentication", ok: false, ...diagnostic }] }, { status: 401 });
  }

  const checks: Check[] = [];
  const companyColumns = [
    "company_list_id", "company_name", "address", "name",
    "pic_phone_number", "customer_code", "job_number", "created_by", "created_at", "deleted_at",
  ];
  const probes = [
    {
      name: "Company List table and RLS access",
      query: () => (supabase as any).from("a1_company_list")
        .select("company_list_id", { count: "exact", head: true }),
    },
    ...companyColumns.map((column) => ({
      name: `Company List column: ${column}`,
      query: () => (supabase as any).from("a1_company_list")
        .select(column, { count: "exact", head: true }),
    })),
    {
      name: "Company List application projection",
      query: () => (supabase as any).from("a1_company_list")
        .select("company_list_id, company_name, address, name, pic_phone_number, customer_code, job_number, created_by, created_at, deleted_at", { count: "exact", head: true })
        .is("deleted_at", null),
    },
    {
      name: "Meeting Schedule schema and access",
      query: () => (supabase as any).from("a1_customer_meetings")
        .select("id, company_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, agenda, pic_name, representative_name, meeting_type, location, meeting_link, notes, status, is_active, deleted_at", { count: "exact", head: true })
        .eq("is_active", true).is("deleted_at", null),
    },
    {
      name: "A2 worksheet access",
      query: () => (supabase as any).from("a2_worksheets")
        .select("transaction_no, job_no", { count: "exact", head: true }),
    },
  ];

  for (const probe of probes) {
    try {
      const { count, error } = await probe.query();
      if (error) checks.push({ name: probe.name, ok: false, ...describeError(error) });
      else checks.push({ name: probe.name, ok: true, message: "Query succeeded.", visibleRows: count ?? null });
    } catch (error) {
      checks.push({ name: probe.name, ok: false, ...describeError(error) });
    }
  }

  return NextResponse.json({
    success: checks.every((check) => check.ok),
    authenticated: true,
    checks,
  }, { status: checks.every((check) => check.ok) ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
