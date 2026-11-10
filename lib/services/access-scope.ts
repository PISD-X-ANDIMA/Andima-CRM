import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export interface CompanyScope {
  userId: string;
  isManager: boolean;
  /** Companies the user may see. Ignored when isManager is true. */
  companyIds: string[];
}

/**
 * Resolves the d3_employee row that owns CRM records for the signed-in user.
 * b2_register holds the HR employee number; d3_employee is what
 * a2_company_sales.sales_pic_id references.
 */
async function resolveEmployeeId(supabase: any, user: { id: string; email?: string | null }): Promise<string | null> {
  let register: any = null;

  const { data: byId } = await supabase
    .from("b2_register")
    .select("id, employee_id, email")
    .eq("id", user.id)
    .maybeSingle();
  register = byId ?? null;

  if (!register && user.email) {
    const { data: byEmail } = await supabase
      .from("b2_register")
      .select("id, employee_id, email")
      .ilike("email", user.email.trim())
      .maybeSingle();
    register = byEmail ?? null;
  }

  if (register?.employee_id) {
    const { data: byEmployeeNumber } = await supabase
      .from("d3_employee")
      .select("id")
      .eq("employee_id", String(register.employee_id))
      .maybeSingle();
    if (byEmployeeNumber?.id) return String(byEmployeeNumber.id);
  }

  if (user.email) {
    const { data: byEmployeeEmail } = await supabase
      .from("d3_employee")
      .select("id")
      .ilike("email", user.email.trim())
      .maybeSingle();
    if (byEmployeeEmail?.id) return String(byEmployeeEmail.id);
  }

  return null;
}

/**
 * Resolves which companies the signed-in user may read.
 * Managers see every company. Everyone else sees only companies mapped to
 * their d3_employee row in a2_company_sales.
 * Returns null when there is no valid session.
 */
export async function getCompanyScope(): Promise<CompanyScope | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const userScope = await getCurrentUserScope(supabase).catch(() => null);
  if (!userScope) return null;

  if (userScope.isManager) {
    return { userId: userScope.user.id, isManager: true, companyIds: [] };
  }

  const employeeId = await resolveEmployeeId(supabase, {
    id: userScope.user.id,
    email: userScope.user.email,
  });
  if (!employeeId) return { userId: userScope.user.id, isManager: false, companyIds: [] };

  const { data, error } = await supabase
    .from("a2_company_sales")
    .select("company_id")
    .eq("sales_pic_id", employeeId)
    .eq("is_active", true);

  if (error) return { userId: userScope.user.id, isManager: false, companyIds: [] };

  return {
    userId: userScope.user.id,
    isManager: false,
    companyIds: Array.from(new Set((data || []).map((row: { company_id: string }) => String(row.company_id)))),
  };
}
