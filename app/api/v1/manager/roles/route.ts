import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/manager/roles
 * Fetches personnel records (b2_register + d3_positions) and assigned access roles from a1_user_access.
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

    const positionMap = new Map<string, { code: string; title: string }>();
    for (const p of positions || []) {
      positionMap.set(p.id, { code: p.code, title: p.title });
    }

    // 3. Fetch explicit roles recorded in a1_user_access
    const { data: accessList } = await (supabase as any)
      .from("a1_user_access")
      .select("id, user_id, crm_role, assigned_by, is_active, notes, updated_at");

    const accessMap = new Map<string, any>();
    for (const a of accessList || []) {
      accessMap.set(a.user_id, a);
    }

    // 4. Combine data
    const users = (registers || []).map((u: any) => {
      const pos = u.position_id ? positionMap.get(u.position_id) : null;
      const access = accessMap.get(u.id);

      // Determine effective CRM role
      let effectiveRole = "sales_executive";
      if (access?.crm_role) {
        effectiveRole = access.crm_role;
      } else if (pos?.code === "COM-CS-MGR" || pos?.title?.toLowerCase().includes("manager of customer success")) {
        effectiveRole = "manager_customer_success";
      } else if (pos?.title?.toLowerCase().includes("field agent")) {
        effectiveRole = "field_agent";
      } else if (pos?.code === "COM-SLS" || pos?.title?.toLowerCase().includes("sales executive")) {
        effectiveRole = "sales_executive";
      }

      return {
        id: u.id,
        employee_id: u.employee_id,
        name: u.full_name || "Unnamed User",
        email: u.email,
        phone: u.phone,
        hrms_position_title: pos?.title || "Staff",
        hrms_position_code: pos?.code || null,
        crm_role: effectiveRole,
        is_active: access ? access.is_active : (u.is_active ?? true),
        notes: access?.notes || null,
        access_id: access?.id || null,
        updated_at: access?.updated_at || u.created_at,
      };
    });

    return createSuccessResponse(users, { total: users.length });
  } catch (error: any) {
    console.error("[GET /api/v1/manager/roles]", error);
    return createErrorResponse("DATA_001", error.message || "Failed to load personnel data", undefined, 500);
  }
}

/**
 * POST /api/v1/manager/roles
 * Saves or updates user role permissions in a1_user_access.
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
    const { user_id, crm_role, is_active, notes } = body;

    if (!user_id || !crm_role) {
      return createErrorResponse("VALIDATION_001", "user_id and crm_role are required.", undefined, 400);
    }

    const allowedRoles = ["manager_customer_success", "sales_executive", "field_agent"];
    if (!allowedRoles.includes(crm_role)) {
      return createErrorResponse("VALIDATION_002", "Invalid role specified.", undefined, 400);
    }

    // Upsert into a1_user_access
    const { data, error } = await (supabase as any)
      .from("a1_user_access")
      .upsert({
        user_id,
        crm_role,
        is_active: is_active ?? true,
        notes: notes || null,
        assigned_by: userScope.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(data);
  } catch (error: any) {
    console.error("[POST /api/v1/manager/roles]", error);
    return createErrorResponse("SAVE_001", error.message || "Failed to update user role", undefined, 500);
  }
}
