import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const salesExecutiveMenu = [
  { label: "Company List", href: "/dashboard/company-list" },
  { label: "Meeting Schedule", href: "/dashboard/meeting-schedule" },
  { label: "Record Conversation", href: "/dashboard/record-conversation" },
  { label: "Task of Field Agent", href: "/dashboard/task-of-field-agent" },
  { label: "Need Backup", href: "/dashboard/need-backup" },
];

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return createErrorResponse("AUTH_001", "Authentication is required", undefined, 401);

    let role = String(user.app_metadata?.role || user.user_metadata?.role || "").trim();
    if (!role) {
      const { data: profile } = await (supabase as any)
        .from("b2_register")
        .select("position_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.position_id) {
        const { data: position } = await (supabase as any)
          .from("d3_positions")
          .select("title, name")
          .eq("id", profile.position_id)
          .maybeSingle();
        role = String(position?.title || position?.name || "").trim();
      }
    }
    if (!role) role = "CRM Staff";

    const isFieldAgent = role.toLowerCase().includes("field agent");
    const crmChildren = isFieldAgent
      ? [{ label: "Field Agent", href: null, children: [] }]
      : [
          { label: "Sales Executive", href: "/dashboard/sales-executive", children: salesExecutiveMenu },
          { label: "Field Agent", href: null, children: [] },
        ];
    return createSuccessResponse({
      role,
      menu: [
        { label: "Dashboard", href: "/dashboard", children: [] },
        { label: "CCR", href: null, children: [] },
        { label: "CRM", href: null, children: crmChildren },
        { label: "HRMS", href: null, children: [] },
      ],
    });
  } catch {
    return createErrorResponse("NAV_001", "Failed to load navigation menu", undefined, 500);
  }
}
