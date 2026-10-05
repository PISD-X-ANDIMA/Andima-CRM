import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface SalesExecutiveMetrics {
  totalCustomers: number;
  upcomingMeetings: number;
  tasks: number;
}

const EMPTY_METRICS: SalesExecutiveMetrics = { totalCustomers: 0, upcomingMeetings: 0, tasks: 0 };
const DAY_NUMBERS: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export async function getSalesExecutiveMetrics(): Promise<SalesExecutiveMetrics> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return EMPTY_METRICS;
  try {
    const [customersResult, jobsResult, meetingsResult] = await Promise.all([
      (supabase as any).from("a1_company_list").select("company_list_id", { count: "exact", head: true }).is("deleted_at", null),
      (supabase as any).from("a1_customer_jobs").select("id", { count: "exact", head: true }),
      (supabase as any).from("a1_customer_meetings").select("meeting_day, schedule_type, meeting_date, start_time, effective_start_date").eq("is_active", true).is("deleted_at", null),
    ]);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let upcomingMeetings = 0;
    for (const meeting of meetingsResult.data || []) {
      let scheduledDate: Date | null = null;
      if (meeting.schedule_type === "one_day" && meeting.meeting_date) {
        const [year, month, day] = meeting.meeting_date.split("-").map(Number);
        scheduledDate = new Date(year, month - 1, day);
      } else if (meeting.schedule_type === "weekly" && DAY_NUMBERS[meeting.meeting_day] !== undefined) {
        const offset = (DAY_NUMBERS[meeting.meeting_day] - today.getDay() + 7) % 7;
        scheduledDate = new Date(today);
        scheduledDate.setDate(today.getDate() + offset);
        const [hours, minutes] = (meeting.start_time || "09:00").split(":").map(Number);
        scheduledDate.setHours(hours, minutes, 0, 0);
        if (scheduledDate < now) scheduledDate.setDate(scheduledDate.getDate() + 7);
      }
      if (scheduledDate && meeting.schedule_type === "one_day") {
        const [hours, minutes] = (meeting.start_time || "09:00").split(":").map(Number);
        scheduledDate.setHours(hours, minutes, 0, 0);
      }
      if (meeting.effective_start_date) {
        const [year, month, day] = meeting.effective_start_date.split("-").map(Number);
        if (scheduledDate && scheduledDate < new Date(year, month - 1, day)) scheduledDate = null;
      }
      if (scheduledDate && scheduledDate >= now) upcomingMeetings++;
    }
    return { totalCustomers: customersResult.count || 0, upcomingMeetings, tasks: jobsResult.count || 0 };
  } catch {
    return EMPTY_METRICS;
  }
}
