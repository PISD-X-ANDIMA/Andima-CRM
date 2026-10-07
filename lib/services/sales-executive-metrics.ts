import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelExpiredOneTimeMeetings } from "@/lib/services/meeting-service";

export interface SalesExecutiveMetrics {
  totalCustomers: number | null;
  activeCustomers: number | null;
  upcomingMeetings: number | null;
  meetingsThisWeek: number | null;
  tasks: number | null;
}

const EMPTY_METRICS: SalesExecutiveMetrics = { totalCustomers: null, activeCustomers: null, upcomingMeetings: null, meetingsThisWeek: null, tasks: null };
const DAY_NUMBERS: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function nextOccurrence(meeting: any, now: Date): Date | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let occurrence: Date | null = null;
  if (meeting.schedule_type === "one_day" && meeting.meeting_date) {
    const [year, month, day] = meeting.meeting_date.split("-").map(Number);
    occurrence = new Date(year, month - 1, day);
  } else if (meeting.schedule_type === "weekly" && DAY_NUMBERS[meeting.meeting_day] !== undefined) {
    occurrence = new Date(today);
    occurrence.setDate(today.getDate() + ((DAY_NUMBERS[meeting.meeting_day] - today.getDay() + 7) % 7));
  }
  if (!occurrence) return null;
  const [hours, minutes] = (meeting.start_time || "09:00").split(":").map(Number);
  occurrence.setHours(hours, minutes, 0, 0);
  if (meeting.effective_start_date) {
    const [year, month, day] = meeting.effective_start_date.split("-").map(Number);
    const effectiveStart = new Date(year, month - 1, day);
    while (meeting.schedule_type === "weekly" && occurrence < effectiveStart) occurrence.setDate(occurrence.getDate() + 7);
    if (meeting.schedule_type === "one_day" && occurrence < effectiveStart) return null;
  }
  if (meeting.schedule_type === "weekly" && occurrence < now) occurrence.setDate(occurrence.getDate() + 7);
  return occurrence;
}

export async function getSalesExecutiveMetrics(): Promise<SalesExecutiveMetrics> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return EMPTY_METRICS;
  try {
    await cancelExpiredOneTimeMeetings();
    const [customersResult, meetingsResult, tasksResult] = await Promise.all([
      (supabase as any).from("a1_company_list").select("company_list_id", { count: "exact", head: true }).is("deleted_at", null),
      (supabase as any).from("a1_customer_meetings").select("meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date").eq("is_active", true).is("deleted_at", null).eq("status", "scheduled"),
      // Squad A2 owns worksheet/task data; only read its row count for the dashboard KPI.
      (supabase as any).from("a2_worksheets").select("*", { count: "exact", head: true }),
    ]);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let upcomingMeetings = 0;
    let meetingsThisWeek = 0;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    for (const meeting of meetingsResult.data || []) {
      const scheduledDate = nextOccurrence(meeting, now);
      if (scheduledDate && scheduledDate >= now) upcomingMeetings++;

      const thisWeekDate = nextOccurrence(meeting, new Date(weekStart));
      if (thisWeekDate && thisWeekDate >= weekStart && thisWeekDate < weekEnd) meetingsThisWeek++;
    }
    return {
      totalCustomers: customersResult.error ? null : customersResult.count || 0,
      // No customer status column exists in the shared Company List schema.
      activeCustomers: null,
      upcomingMeetings: meetingsResult.error ? null : upcomingMeetings,
      meetingsThisWeek: meetingsResult.error ? null : meetingsThisWeek,
      tasks: tasksResult.error ? null : tasksResult.count || 0,
    };
  } catch {
    return EMPTY_METRICS;
  }
}
