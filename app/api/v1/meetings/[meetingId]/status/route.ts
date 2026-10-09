import { NextRequest } from "next/server";
import { createErrorResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PATCH as updateCustomerMeeting } from "@/app/api/v1/customers/[customerId]/meetings/route";

interface RouteContext { params: Promise<{ meetingId: string }> }

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { meetingId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || !["scheduled", "completed", "cancelled"].includes(body.status)) {
    return createErrorResponse("VALIDATION_001", "A valid meeting status is required", undefined, 400);
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);
  const { data, error } = await (supabase as any)
    .from("a1_customer_meetings")
    .select("company_id")
    .eq("id", meetingId)
    .maybeSingle();
  if (error || !data?.company_id) return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
  const delegatedRequest = new NextRequest(request.url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId, status: body.status }),
  });
  return updateCustomerMeeting(delegatedRequest, { params: Promise.resolve({ customerId: data.company_id }) });
}
