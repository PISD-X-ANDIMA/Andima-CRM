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
  { label: "Manage Account", href: "/dashboard/manage-field-agent-account" },
  { label: "Manage User Roles", href: "/dashboard/manager-customer-success/role-management" },
];

const fieldAgentMenu = [
  { label: "Field Agent", href: "/dashboard/field-agent" },
];

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) return createErrorResponse("AUTH_001", "Authentication is required", undefined, 401);

    const isFieldAgent = userScope.role === "field_agent";
    const isManager = !isFieldAgent && userScope.isManager;
    const roleTitle = isFieldAgent
      ? "Field Agent"
      : isManager
        ? "Manager of Customer Success"
        : "Sales Executive";
    const sectionHref = isFieldAgent
      ? "/dashboard/field-agent"
      : isManager
        ? "/dashboard/manager-customer-success"
        : "/dashboard/sales-executive";
    const submenus = isFieldAgent
      ? fieldAgentMenu
      : isManager
        ? managerCustomerSuccessMenu
        : salesExecutiveMenu;

    const crmChildren = [
      {
        label: roleTitle,
        href: sectionHref,
        children: submenus,
      },
    ];

    return createSuccessResponse({
      role: userScope.role,
      roleTitle,
      isManager,
      isFieldAgent,
      name: userScope.name,
      menu: [
        { label: isFieldAgent ? "Field Agent" : "CRM", href: null, children: crmChildren },
      ],
    });
  } catch {
    return createErrorResponse("NAV_001", "Failed to load navigation menu", undefined, 500);
  }
}
