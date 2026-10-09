import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("AUTH_004", "Authentication service is unavailable", undefined, 503);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return createErrorResponse("AUTH_004", "No active login session was found", undefined, 401);
  let profile: any = null;
  let role = String(user.app_metadata?.role || user.user_metadata?.role || "").trim();
  try {
    const { data } = await (supabase as any).from("b2_register").select("id, full_name, position_id, departement_id").eq("id", user.id).maybeSingle();
    profile = data;
    if (!role && profile?.position_id) {
      const { data: position } = await (supabase as any).from("d3_positions").select("title, name").eq("id", profile.position_id).maybeSingle();
      role = String(position?.title || position?.name || "").trim();
    }
  } catch {
    // Auth metadata still identifies the authenticated user if HR profile tables are unavailable.
  }
  const requestedRole = request.nextUrl.searchParams.get("role");
  if (requestedRole && role && !role.toLowerCase().includes(requestedRole.toLowerCase().replaceAll("_", " "))) {
    return createErrorResponse("AUTH_004", "The signed-in user does not have the requested role", undefined, 403);
  }
  return createSuccessResponse({ id: user.id, name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User", email: user.email || null, role: role || "CRM Staff" });
}
