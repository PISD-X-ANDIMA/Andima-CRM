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

export function resolveCrmRoleFromPosition(pos?: {
  code?: string | null;
  title?: string | null;
  name?: string | null;
} | null): CrmRole | "no_role" {
  if (!pos) return "no_role";
  const code = String(pos.code || "").trim().toLowerCase();
  const title = String(pos.title || pos.name || "").trim().toLowerCase();

  if (
    code === "com-cs-mgr" ||
    title.includes("manager of customer success") ||
    title.includes("customer success manager") ||
    title.includes("cs manager")
  ) {
    return "manager_customer_success";
  }
  if (code === "com-fa" || title.includes("field agent")) {
    return "field_agent";
  }
  if (
    code === "com-sls" ||
    code.startsWith("sls") ||
    title.includes("sales executive") ||
    title.includes("sales")
  ) {
    return "sales_executive";
  }
  return "no_role";
}

/**
 * Resolves current user's role and identity identifiers for data scoping.
 * Queries b2_register and joins with d3_positions directly.
 */
export async function getCurrentUserScope(supabase: any): Promise<UserScope | null> {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  let name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User").trim();
  let roleStr = String(user.app_metadata?.role || user.user_metadata?.role || "").trim();

  // Check b2_register and d3_positions
  try {
    let b2: any = null;
    const { data: b2ById } = await supabase
      .from("b2_register")
      .select("id, full_name, position_id, email")
      .eq("id", user.id)
      .maybeSingle();

    if (b2ById) {
      b2 = b2ById;
    } else if (user.email) {
      const { data: b2ByEmail } = await supabase
        .from("b2_register")
        .select("id, full_name, position_id, email")
        .ilike("email", user.email.trim())
        .maybeSingle();
      if (b2ByEmail) b2 = b2ByEmail;
    }

    if (!b2 && name && name !== "User") {
      const { data: b2ByName } = await supabase
        .from("b2_register")
        .select("id, full_name, position_id, email")
        .ilike("full_name", name.trim())
        .maybeSingle();
      if (b2ByName) b2 = b2ByName;
    }

    if (b2?.full_name) {
      name = String(b2.full_name).trim();
    }

    if (b2?.position_id) {
      const { data: pos } = await supabase
        .from("d3_positions")
        .select("id, code, title")
        .eq("id", b2.position_id)
        .maybeSingle();

      const resolved = resolveCrmRoleFromPosition(pos);
      if (resolved !== "no_role") {
        roleStr = resolved;
      }
    }
  } catch (err) {
    console.warn("[getCurrentUserScope] Error reading b2_register / d3_positions:", err);
  }

  // Normalize role
  let role: CrmRole = "sales_executive";
  if (roleStr === "manager_customer_success" || roleStr.toLowerCase().includes("manager")) {
    role = "manager_customer_success";
  } else if (roleStr === "field_agent") {
    role = "field_agent";
  } else {
    role = "sales_executive";
  }

  // Build all aliases/identifiers matching created_by in database
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
