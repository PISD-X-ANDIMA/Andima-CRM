import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export interface CompanyScope {
  userId: string;
  isManager: boolean;
  /** Companies the user may see. Ignored when isManager is true. */
  companyIds: string[];
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Builds a PostgREST OR filter matching either UUID `created_by` or legacy/display `created_by_name`
 * on the `a1_customers` table.
 */
export function buildCustomerOwnerFilter(identifiers: string[], userId?: string): string {
  const parts: string[] = [];
  if (userId && UUID_REGEX.test(userId)) {
    parts.push(`created_by.eq.${userId}`);
  }
  const uuidMatches = identifiers.filter((v) => UUID_REGEX.test(v));
  for (const id of uuidMatches) {
    if (id !== userId) parts.push(`created_by.eq.${id}`);
  }
  const cleanNames = identifiers
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => `"${v.replace(/"/g, '\\"')}"`);
  if (cleanNames.length > 0) {
    parts.push(`created_by_name.in.(${cleanNames.join(",")})`);
  }
  return parts.join(",");
}

/**
 * Resolves which companies the signed-in user may read from `a1_customers`.
 * Managers see every company. Everyone else sees only companies owned by them.
 */
export async function getCompanyScope(): Promise<CompanyScope | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const userScope = await getCurrentUserScope(supabase).catch(() => null);
  if (!userScope) return null;

  if (userScope.isManager) {
    return { userId: userScope.user.id, isManager: true, companyIds: [] };
  }

  let companyIds: string[] = [];
  const ownerFilter = buildCustomerOwnerFilter(userScope.identifiers, userScope.user.id);
  let query = supabase
    .from("a1_customers")
    .select("id")
    .is("deleted_at", null);

  if (ownerFilter) {
    query = query.or(ownerFilter);
  }

  const { data: directOwned } = await query;

  if (directOwned && directOwned.length > 0) {
    companyIds = directOwned.map((row: { id: string }) => String(row.id));
  }

  return {
    userId: userScope.user.id,
    isManager: false,
    companyIds: Array.from(new Set(companyIds)),
  };
}
