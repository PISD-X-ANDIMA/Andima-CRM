import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("AUTH_004", "Authentication service is unavailable", undefined, 503);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return createErrorResponse("AUTH_004", "No active login session was found", undefined, 401);
  return createSuccessResponse({ id: user.id, email: user.email || null, metadata: user.user_metadata || {} });
}
