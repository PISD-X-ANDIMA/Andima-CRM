import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope, resolveCrmRoleFromPosition } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/manager/roles
 * Fetches personnel records directly from b2_register and joins with d3_positions.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) {
      return createErrorResponse("AUTH_001", "Authentication required", undefined, 401);
    }

    if (!userScope.isManager) {
      return createErrorResponse("AUTH_003", "Only the Manager of Customer Success has permission to manage team roles.", undefined, 403);
    }

    // 1. Fetch registered users from b2_register
    const { data: registers, error: regError } = await (supabase as any)
      .from("b2_register")
      .select("id, employee_id, full_name, email, phone, position_id, is_active, created_at")
      .order("created_at", { ascending: false });

    if (regError) throw regError;

    // 2. Fetch positions from d3_positions
    const { data: positions } = await (supabase as any)
      .from("d3_positions")
      .select("id, code, title");

    const positionMap = new Map<string, { id: string; code: string; title: string }>();
    for (const p of positions || []) {
      positionMap.set(p.id, {
        id: p.id,
        code: String(p.code || ""),
        title: String(p.title || ""),
      });
    }

    // 3. Map personnel directly from b2_register + d3_positions
    const users = (registers || []).map((u: any) => {
      const pos = u.position_id ? positionMap.get(u.position_id) : null;
      const effectiveRole = resolveCrmRoleFromPosition(pos);

      return {
        id: u.id,
        employee_id: u.employee_id,
        name: u.full_name || "Unnamed User",
        email: u.email,
        phone: u.phone,
        position_id: u.position_id,
        hrms_position_title: pos?.title || "Staff",
        hrms_position_code: pos?.code || null,
        crm_role: effectiveRole,
        is_active: u.is_active ?? true,
        notes: null,
        access_id: u.id,
        updated_at: u.created_at,
      };
    });

    const registeredNames = new Set(users.map((u: any) => String(u.name || "").toLowerCase()));

    // Also include active Sales Executives who have assigned accounts in CRM (a1_company_list)
    try {
      const { data: companies } = await (supabase as any)
        .from("a1_company_list")
        .select("created_by")
        .is("deleted_at", null);

      const defaultSalesPos = (positions || []).find((p: any) => {
        const code = String(p.code || "").toLowerCase();
        const title = String(p.title || "").toLowerCase();
        return code === "com-sls" || title.includes("sales executive");
      });

      const activeExecs = new Set<string>();
      (companies || []).forEach((c: any) => {
        if (c.created_by && c.created_by.trim()) {
          activeExecs.add(String(c.created_by).trim());
        }
      });

      activeExecs.forEach((execName) => {
        if (!registeredNames.has(execName.toLowerCase())) {
          registeredNames.add(execName.toLowerCase());
          users.push({
            id: `crm-se-${execName.toLowerCase().replace(/\s+/g, "-")}`,
            employee_id: `SE-${execName.slice(0, 3).toUpperCase()}`,
            name: execName,
            email: `${execName.toLowerCase().split(" ")[0]}se@andima.co.id`,
            phone: "-",
            position_id: defaultSalesPos?.id || null,
            hrms_position_title: defaultSalesPos?.title || "Sales Executive",
            hrms_position_code: defaultSalesPos?.code || "COM-SLS",
            crm_role: "sales_executive",
            is_active: true,
            notes: null,
            access_id: `crm-se-${execName.toLowerCase().replace(/\s+/g, "-")}`,
            updated_at: new Date().toISOString(),
          });
        }
      });
    } catch {}

    return createSuccessResponse(users, { total: users.length });
  } catch (error: any) {
    console.error("[GET /api/v1/manager/roles]", error);
    return createErrorResponse("DATA_001", error.message || "Failed to load personnel data", undefined, 500);
  }
}

/**
 * POST /api/v1/manager/roles
 * Updates user position in b2_register linked to d3_positions.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) {
      return createErrorResponse("AUTH_001", "Authentication required", undefined, 401);
    }

    if (!userScope.isManager) {
      return createErrorResponse("AUTH_003", "Only the Manager of Customer Success has permission to modify team roles.", undefined, 403);
    }

    const body = await request.json();
    const { user_id, crm_role, is_active } = body;

    if (!user_id || !crm_role) {
      return createErrorResponse("VALIDATION_001", "user_id and crm_role are required.", undefined, 400);
    }

    const allowedRoles = ["manager_customer_success", "sales_executive", "field_agent"];
    if (!allowedRoles.includes(crm_role)) {
      return createErrorResponse("VALIDATION_002", "Invalid role specified.", undefined, 400);
    }

    // Find position in d3_positions corresponding to selected role
    const { data: positions } = await (supabase as any)
      .from("d3_positions")
      .select("id, code, title");

    let targetPositionId: string | null = null;
    if (Array.isArray(positions)) {
      const match = positions.find((p: any) => {
        const code = String(p.code || "").toLowerCase();
        const title = String(p.title || "").toLowerCase();
        if (crm_role === "manager_customer_success") {
          return code === "com-cs-mgr" || title.includes("manager of customer success") || title.includes("customer success manager");
        }
        if (crm_role === "sales_executive") {
          return code === "com-sls" || code.startsWith("sls") || title.includes("sales executive") || title.includes("sales");
        }
        if (crm_role === "field_agent") {
          return code === "com-fa" || title.includes("field agent");
        }
        return false;
      });

      if (match) {
        targetPositionId = match.id;
      }
    }

    const updatePayload: Record<string, any> = {
      is_active: is_active ?? true,
    };
    if (targetPositionId) {
      updatePayload.position_id = targetPositionId;
    }

    const { data, error } = await (supabase as any)
      .from("b2_register")
      .update(updatePayload)
      .eq("id", user_id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return createSuccessResponse(data || { user_id, crm_role, updated: true });
  } catch (error: any) {
    console.error("[POST /api/v1/manager/roles]", error);
    return createErrorResponse("SAVE_001", error.message || "Failed to update user role", undefined, 500);
  }
}
