import type { CrmRole } from "./roles";

/**
 * Single role-to-route table for dashboard pages.
 * Unlisted /dashboard paths are denied on purpose: register every new page here.
 */
const DASHBOARD_ROUTES: ReadonlyArray<{ prefix: string; roles: readonly CrmRole[] }> = [
  { prefix: "/dashboard/sales-executive", roles: ["sales_executive"] },
  { prefix: "/dashboard/manager-customer-success", roles: ["manager_customer_success"] },
  { prefix: "/dashboard/field-agent", roles: ["field_agent"] },
  { prefix: "/dashboard/company-list", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/meeting-schedule", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/record-conversation", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/task-of-field-agent", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/field-agent-management", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/field-agent-access", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/manage-field-agent-account", roles: ["manager_customer_success", "sales_executive"] },
  { prefix: "/dashboard/need-backup", roles: ["manager_customer_success"] },
  { prefix: "/dashboard/profile", roles: ["manager_customer_success", "sales_executive", "field_agent"] },
  { prefix: "/dashboard/settings", roles: ["manager_customer_success", "sales_executive", "field_agent"] },
];

export const ROLE_HOME: Record<CrmRole, string> = {
  manager_customer_success: "/dashboard/manager-customer-success",
  sales_executive: "/dashboard/sales-executive",
  field_agent: "/dashboard/field-agent",
};

export function roleHome(role: CrmRole): string {
  return ROLE_HOME[role];
}

export function canAccessPath(role: CrmRole, pathname: string): boolean {
  const clean = (pathname.split("?")[0] || "").replace(/\/+$/, "") || "/dashboard";
  if (clean === "/dashboard") return true;

  const rule = DASHBOARD_ROUTES
    .filter((entry) => clean === entry.prefix || clean.startsWith(`${entry.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!rule) return false;
  return rule.roles.includes(role);
}
