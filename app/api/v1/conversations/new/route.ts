import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customer_id") || "";
  const meetingId = request.nextUrl.searchParams.get("meeting_id") || "";
  const customerName = request.nextUrl.searchParams.get("customer_name") || "";
  const sourceMeetingId = request.nextUrl.searchParams.get("source_meeting_id") || meetingId;

  const redirectUrl = new URL("/dashboard/record-conversation", request.url);
  if (customerId) redirectUrl.searchParams.set("customer_id", customerId);
  if (customerName) redirectUrl.searchParams.set("customer_name", customerName);
  if (meetingId) redirectUrl.searchParams.set("meeting_id", meetingId);
  if (sourceMeetingId) redirectUrl.searchParams.set("source_meeting_id", sourceMeetingId);

  return NextResponse.redirect(redirectUrl);
}
