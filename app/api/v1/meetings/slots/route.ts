import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelExpiredOneTimeMeetings } from "@/lib/services/meeting-service";

export const dynamic = "force-dynamic";

const slots = Array.from({ length: 9 }, (_, index) => ({
  start_time: `${String(index + 8).padStart(2, "0")}:00`,
  end_time: `${String(index + 9).padStart(2, "0")}:00`,
}));
const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function jakartaNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "00";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return createErrorResponse("VALIDATION_001", "date is required in YYYY-MM-DD format", undefined, 400);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return createErrorResponse("VALIDATION_001", "date is invalid", undefined, 400);
  }
  const now = jakartaNow();
  if (date < now.date) return createErrorResponse("SCH_004", "Past dates do not have bookable slots", undefined, 400);
  const supabase = await createServerSupabaseClient();
  if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

  try {
    await cancelExpiredOneTimeMeetings();
    const { data, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("id, company_id, meeting_day, schedule_type, meeting_date, effective_start_date, start_time, end_time, status, a1_company_list!inner(company_name)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .neq("status", "cancelled");
    if (error) throw error;
    const matching = (data || []).filter((meeting: any) => {
      if (meeting.schedule_type === "one_day") return meeting.meeting_date === date;
      return meeting.schedule_type === "weekly"
        && meeting.meeting_day === weekdays[parsed.getUTCDay()]
        && (!meeting.effective_start_date || date >= meeting.effective_start_date);
    });
    const result = slots.map((slot) => {
      const startMinutes = Number(slot.start_time.slice(0, 2)) * 60;
      const endMinutes = startMinutes + 60;
      const meeting = matching.find((item: any) => {
        const meetingStart = Number(String(item.start_time).slice(0, 2)) * 60 + Number(String(item.start_time).slice(3, 5));
        const meetingEnd = Number(String(item.end_time).slice(0, 2)) * 60 + Number(String(item.end_time).slice(3, 5));
        return meetingStart < endMinutes && meetingEnd > startMinutes;
      });
      const past = date === now.date && startMinutes <= now.minutes;
      return {
        ...slot,
        available: !meeting && !past,
        status: past ? "past" : meeting ? meeting.status : "available",
        meeting: meeting ? {
          id: meeting.id,
          company_id: meeting.company_id,
          company_name: meeting.a1_company_list?.company_name || null,
          start_time: String(meeting.start_time).slice(0, 5),
          end_time: String(meeting.end_time).slice(0, 5),
          status: meeting.status,
        } : null,
      };
    });
    return createSuccessResponse({ date, slots: result });
  } catch {
    return createErrorResponse("CAL_001", "Failed to load available meeting slots", undefined, 500);
  }
}
