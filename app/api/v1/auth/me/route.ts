import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("AUTH_004", "Authentication service is unavailable", undefined, 503);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return createErrorResponse("AUTH_001", "Profile session expired", undefined, 401);
  let name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User").trim();
  let profilePhoto: string | null = user.user_metadata?.avatar_url || user.user_metadata?.profile_photo || null;
  let role = "sales_executive";

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (userScope) {
      role = userScope.role;
      if (userScope.name) name = userScope.name;
    }
  } catch {}

  try {
    const { data: b2 } = await (supabase as any)
      .from("b2_register")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (b2?.full_name) {
      name = String(b2.full_name).trim();
    }
  } catch {}

  return createSuccessResponse({
    id: user.id,
    email: user.email || null,
    name,
    role,
    profile_photo: profilePhoto,
    metadata: user.user_metadata || {},
  });
}

