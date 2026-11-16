import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

const salesExecutiveMenu = [
  { label: "Dashboard", href: "/dashboard/sales-executive" },
  { label: "Company List", href: "/dashboard/company-list" },
  { label: "Meeting Schedule", href: "/dashboard/meeting-schedule" },
  { label: "Record Conversation", href: "/dashboard/record-conversation" },
  { label: "Task of Field Agent", href: "/dashboard/task-of-field-agent" },
  { label: "Field Agent Management", href: "/dashboard/field-agent-management" },
];

const managerCustomerSuccessMenu = [
  { label: "Dashboard", href: "/dashboard/manager-customer-success" },
  { label: "Company List", href: "/dashboard/company-list" },
  { label: "Meeting Schedule", href: "/dashboard/meeting-schedule" },
  { label: "Record Conversation", href: "/dashboard/record-conversation" },
  { label: "Task of Field Agent", href: "/dashboard/task-of-field-agent" },
  { label: "Need Backup", href: "/dashboard/need-backup" },
  { label: "Manage User Roles", href: "/dashboard/manager-customer-success/role-management" },
];

const sidebarCache = new Map<string, { data: any; expiresAt: number }>();

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return createErrorResponse("AUTH_001", "Authentication is required", undefined, 401);

    const cached = sidebarCache.get(user.id);
    if (cached && Date.now() < cached.expiresAt) {
      const response = createSuccessResponse(cached.data);
      response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
      return response;
    }

    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) return createErrorResponse("AUTH_001", "Authentication is required", undefined, 401);

    const isManager = userScope.isManager;
    const roleTitle = isManager ? "Manager of Customer Success" : "Sales Executive";
    const sectionHref = isManager ? "/dashboard/manager-customer-success" : "/dashboard/sales-executive";
    const submenus = isManager ? managerCustomerSuccessMenu : salesExecutiveMenu;

    const crmChildren = [
      {
        label: roleTitle,
        href: sectionHref,
        children: submenus,
      },
    ];

    const data = {
      role: userScope.role,
      roleTitle,
      isManager,
      name: userScope.name,
      menu: [
        { label: "CRM", href: null, children: crmChildren },
      ],
    };

    sidebarCache.set(user.id, { data, expiresAt: Date.now() + 60_000 });

    const response = createSuccessResponse(data);
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    return response;
  } catch {
    return createErrorResponse("NAV_001", "Failed to load navigation menu", undefined, 500);
  }
}
