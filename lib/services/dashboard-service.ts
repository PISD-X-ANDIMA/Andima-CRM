import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardSummaryData } from "@/types/customer";

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function dateAtTime(date: string, time: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/** Returns only metrics backed by A1 tables; meeting notes remain owned by Squad A2. */
export async function getDashboardSummary(_salesId: string | null): Promise<DashboardSummaryData> {
  const fallback: DashboardSummaryData = {
    totalCustomer: 0,
    meetingThisWeek: { total: 0, completed: 0, upcoming: 0 },
    unminutedMeetingsCount: 0,
    sentMinutesCount: 0,
  };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return fallback;

  try {
    const [{ count, error: customerError }, { data: meetings, error: meetingError }] = await Promise.all([
      (supabase as any).from("a1_company_list").select("company_list_id", { count: "exact", head: true }).is("deleted_at", null),
      (supabase as any).from("a1_customer_meetings")
        .select("id, schedule_type, meeting_date, meeting_day, effective_start_date, start_time, end_time, status")
        .eq("is_active", true).is("deleted_at", null).neq("status", "cancelled"),
    ]);
    if (customerError) throw customerError;
    if (meetingError) throw meetingError;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const days: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    let total = 0;
    let completed = 0;
    for (const meeting of meetings || []) {
      let occurrence: Date | null = null;
      if (meeting.schedule_type === "one_day" && meeting.meeting_date) {
        occurrence = dateAtTime(meeting.meeting_date, meeting.end_time);
      } else if (meeting.schedule_type === "weekly" && days[meeting.meeting_day] !== undefined) {
        occurrence = new Date(weekStart);
        occurrence.setDate(weekStart.getDate() + ((days[meeting.meeting_day] - weekStart.getDay() + 7) % 7));
        const [hours, minutes] = (meeting.end_time || "00:00").split(":").map(Number);
        occurrence.setHours(hours, minutes, 0, 0);
        if (meeting.effective_start_date && occurrence < dateAtTime(meeting.effective_start_date, "00:00")) occurrence = null;
      }
      if (occurrence && occurrence >= weekStart && occurrence < weekEnd) {
        total += 1;
        if (meeting.status === "completed" || occurrence < now) completed += 1;
      }
    }

    return {
      totalCustomer: count || 0,
      meetingThisWeek: { total, completed, upcoming: total - completed },
      // Record Conversation and meeting minutes are managed by Squad A2.
      unminutedMeetingsCount: 0,
      sentMinutesCount: 0,
    };
  } catch {
    return fallback;
  }
}

export async function getUpcomingMeetings(_salesId: string | null) {
  return [];
}

export async function getUnminutedMeetings(_salesId: string | null) {
  return [];
}
