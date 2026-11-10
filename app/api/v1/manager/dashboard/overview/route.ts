import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope, resolveCrmRoleFromPosition } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) {
      return createErrorResponse("AUTH_001", "Authentication is required", undefined, 401);
    }
    if (!userScope.isManager) {
      return createErrorResponse("AUTH_403", "Access denied. Only Manager of Customer Success can access this resource.", undefined, 403);
    }

    // 1. Calculate current week range (Monday to Sunday)
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6));
    const startDate = monday.toISOString().slice(0, 10);
    const endDate = sunday.toISOString().slice(0, 10);

    // 2. Fetch all companies
    const { data: companies } = await (supabase as any)
      .from("a1_company_list")
      .select("company_list_id, company_name, created_by")
      .is("deleted_at", null);

    const totalCustomers = (companies || []).length;

    // 3. Fetch sales executives list from b2_register + d3_positions, with fallback to d3_employee and active CRM assignees
    const { data: registers } = await (supabase as any)
      .from("b2_register")
      .select("id, full_name, email, position_id, is_active");

    const { data: positions } = await (supabase as any)
      .from("d3_positions")
      .select("id, code, title");

    const posMap = new Map<string, any>();
    (positions || []).forEach((p: any) => {
      posMap.set(p.id, p);
    });

    const salesExecNames = new Set<string>();
    (registers || []).forEach((r: any) => {
      if (r.is_active === false) return;
      const pos = r.position_id ? posMap.get(r.position_id) : null;
      const role = resolveCrmRoleFromPosition(pos);

      if (role === "sales_executive" && r.full_name) {
        salesExecNames.add(String(r.full_name).trim());
      }
    });

    // Also include sales executives from d3_employee whose position resolves to sales_executive
    try {
      const { data: employees } = await (supabase as any)
        .from("d3_employee")
        .select("id, full_name, email, position_id");

      (employees || []).forEach((e: any) => {
        const pos = e.position_id ? posMap.get(e.position_id) : null;
        const role = resolveCrmRoleFromPosition(pos);
        if (role === "sales_executive" && e.full_name) {
          salesExecNames.add(String(e.full_name).trim());
        }
      });
    } catch {}

    // Also include active Sales Executives who have assigned accounts in CRM (a1_company_list)
    (companies || []).forEach((c: any) => {
      if (c.created_by && c.created_by.trim()) {
        salesExecNames.add(String(c.created_by).trim());
      }
    });

    // Sort executives so those with active companies appear first, then alphabetically
    const execArray = Array.from(salesExecNames).sort((a, b) => {
      const aCust = (companies || []).filter((c: any) => String(c.created_by || "").toLowerCase() === a.toLowerCase()).length;
      const bCust = (companies || []).filter((c: any) => String(c.created_by || "").toLowerCase() === b.toLowerCase()).length;
      if (bCust !== aCust) return bCust - aCust;
      return a.localeCompare(b);
    });
    const totalSalesExecutives = execArray.length;

    // 4. Fetch meetings this week
    const { data: meetings } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("id, company_id, meeting_date, start_time, end_time, status, representative_name")
      .is("deleted_at", null)
      .neq("status", "cancelled");

    const meetingsThisWeek = (meetings || []).filter((m: any) => {
      if (!m.meeting_date) return false;
      return m.meeting_date >= startDate && m.meeting_date <= endDate;
    }).length;

    // 5. Fetch need backup issues (from conversations or mock fallback)
    let needBackupConversations: any[] = [];
    try {
      const { data: convs } = await (supabase as any)
        .from("a2_record_conversations")
        .select("*")
        .eq("need_assistance", true);
      if (convs) needBackupConversations = convs;
    } catch {}

    const totalNeedBackup = needBackupConversations.length;

    const compNameMap = new Map((companies || []).map((c: any) => [c.company_list_id, c.company_name]));
    const compOwnerMap = new Map((companies || []).map((c: any) => [c.company_list_id, c.created_by]));
    const regNameMap = new Map((registers || []).map((r: any) => [r.id, r.full_name]));

    // 6. Build Sales Executive table stats
    const salesExecStats = execArray.map((execName) => {
      const execCustomers = (companies || []).filter((c: any) => {
        const creator = String(c.created_by || "").toLowerCase();
        return creator === execName.toLowerCase() || creator.includes(execName.toLowerCase());
      }).length;

      const execMeetings = (meetings || []).filter((m: any) => {
        const rep = String(m.representative_name || "").toLowerCase();
        return rep === execName.toLowerCase() || rep.includes(execName.toLowerCase());
      }).length;

      const execIssues = needBackupConversations.filter((c: any) => {
        const rep = String(compOwnerMap.get(c.customer_id) || regNameMap.get(c.sales_pic_id) || regNameMap.get(c.created_by) || c.created_by || c.sales_executive || "").toLowerCase();
        return rep === execName.toLowerCase() || rep.includes(execName.toLowerCase());
      }).length;

      return {
        id: execName,
        name: execName,
        customers: execCustomers,
        meetings_this_week: execMeetings,
        open_issues: execIssues,
      };
    });

    // 7. Build Latest Issues Needing Backup from real a2 data
    const latestIssues = needBackupConversations.slice(0, 5).map((c: any) => ({
      id: c.id ? `TKT-${String(c.id).slice(0, 8).toUpperCase()}` : "ISSUE",
      company_name: compNameMap.get(c.customer_id) || c.company_name || c.customer_name || "Company",
      executive_name: compOwnerMap.get(c.customer_id) || regNameMap.get(c.sales_pic_id) || regNameMap.get(c.created_by) || c.sales_executive || c.created_by || "Sales Executive",
      meeting_date: c.conversation_date || c.meeting_date || c.date || "-",
      meeting_time: c.conversation_time || c.meeting_time || c.time || "-",
      badge: "Need backup",
    }));

    return createSuccessResponse({
      total_sales_executives: totalSalesExecutives,
      total_customers: totalCustomers,
      meetings_this_week: meetingsThisWeek,
      need_backup: totalNeedBackup,
      sales_executives: salesExecStats,
      latest_issues: latestIssues,
    });
  } catch (error: any) {
    console.error("[GET /api/v1/manager/dashboard/overview]", error);
    return createErrorResponse("MGR_001", "Failed to load dashboard metrics. Please refresh.", undefined, 500);
  }
}
