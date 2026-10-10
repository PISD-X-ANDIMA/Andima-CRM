import { User } from "@supabase/supabase-js";

export type CrmRole = "manager_customer_success" | "sales_executive" | "field_agent";

export interface UserScope {
  user: User;
  name: string;
  email: string | null;
  role: CrmRole;
  isManager: boolean;
  identifiers: string[];
}

/**
 * Resolves current user's role and identity identifiers for data scoping.
 */
export async function getCurrentUserScope(supabase: any): Promise<UserScope | null> {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  let name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User").trim();
  let roleStr = String(user.app_metadata?.role || user.user_metadata?.role || "").trim();

  // 1. Check a1_user_access first
  try {
    const { data: userAccess } = await supabase
      .from("a1_user_access")
      .select("crm_role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (userAccess?.crm_role) {
      roleStr = userAccess.crm_role;
    }
  } catch {}

  // 2. Check b2_register and d3_positions
  try {
    const { data: b2 } = await supabase
      .from("b2_register")
      .select("full_name, position_id")
      .eq("id", user.id)
      .maybeSingle();

    if (b2?.full_name) {
      name = String(b2.full_name).trim();
    }

    if (!roleStr && b2?.position_id) {
      const { data: pos } = await supabase
        .from("d3_positions")
        .select("code, title")
        .eq("id", b2.position_id)
        .maybeSingle();

      const code = String(pos?.code || "").trim();
      const title = String(pos?.title || "").trim().toLowerCase();

      if (code === "COM-CS-MGR" || title.includes("manager of customer success")) {
        roleStr = "manager_customer_success";
      } else if (code === "COM-SLS" || title.includes("sales executive")) {
        roleStr = "sales_executive";
      } else if (title.includes("field agent")) {
        roleStr = "field_agent";
      }
    }
  } catch {}

  // 3. Normalize role
  let role: CrmRole = "sales_executive";
  if (roleStr === "manager_customer_success" || roleStr.toLowerCase().includes("manager")) {
    role = "manager_customer_success";
  } else if (roleStr === "field_agent") {
    role = "field_agent";
  } else {
    role = "sales_executive";
  }

  // 4. Build all aliases/identifiers matching created_by in database
  const identifiers = new Set<string>();
  if (user.id) identifiers.add(user.id);
  if (name) identifiers.add(name);
  if (user.email) identifiers.add(user.email);

  return {
    user,
    name,
    email: user.email || null,
    role,
    isManager: role === "manager_customer_success",
    identifiers: Array.from(identifiers).filter(Boolean),
  };
}
