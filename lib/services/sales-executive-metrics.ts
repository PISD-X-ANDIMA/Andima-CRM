import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cancelExpiredOneTimeMeetings } from "@/lib/services/meeting-service";
import { getCurrentUserScope } from "@/lib/auth/roles";

export interface SalesExecutiveMetrics {
  totalCustomers: number | null;
  activeCustomers: number | null;
  upcomingMeetings: number | null;
  meetingsThisWeek: number | null;
  tasks: number | null;
  customerPercentage?: number | null;
  meetingPercentage?: number | null;
  taskPercentage?: number | null;
  changes?: {
    customer: number | null;
    meeting: number | null;
    task: number | null;
  } | null;
}

const EMPTY_METRICS: SalesExecutiveMetrics = {
  totalCustomers: null,
  activeCustomers: null,
  upcomingMeetings: null,
  meetingsThisWeek: null,
  tasks: null,
  customerPercentage: null,
  meetingPercentage: null,
  taskPercentage: null,
  changes: null,
};
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

export async function getSalesExecutiveMetrics(executiveId?: string): Promise<SalesExecutiveMetrics> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return EMPTY_METRICS;
  try {
    await cancelExpiredOneTimeMeetings();
    const userScope = await getCurrentUserScope(supabase);

    let custCountQuery = (supabase as any).from("a1_company_list").select("company_list_id", { count: "exact", head: true }).is("deleted_at", null);
    let custIdQuery = (supabase as any).from("a1_company_list").select("company_list_id").is("deleted_at", null);

    const isFiltered = Boolean(executiveId) || (userScope && !userScope.isManager);
    if (executiveId) {
      custCountQuery = custCountQuery.eq("created_by", executiveId);
      custIdQuery = custIdQuery.eq("created_by", executiveId);
    } else if (userScope && !userScope.isManager) {
      custCountQuery = custCountQuery.in("created_by", userScope.identifiers);
      custIdQuery = custIdQuery.in("created_by", userScope.identifiers);
    }

    const { data: userCompanies } = isFiltered ? await custIdQuery : { data: [] };
    const userCompanyIds = (userCompanies || []).map((c: any) => c.company_list_id);

    let meetQuery = (supabase as any)
      .from("a1_customer_meetings")
      .select("meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date")
      .eq("is_active", true)
      .is("deleted_at", null)
      .eq("status", "scheduled");

    if (isFiltered) {
      meetQuery = meetQuery.in("company_id", userCompanyIds.length ? userCompanyIds : ["00000000-0000-0000-0000-000000000000"]);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let recentCustQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo);

    if (executiveId) {
      recentCustQuery = recentCustQuery.eq("created_by", executiveId);
    } else if (userScope && !userScope.isManager) {
      recentCustQuery = recentCustQuery.in("created_by", userScope.identifiers);
    }

    let taskCountQuery = (supabase as any)
      .from("a2_worksheets")
      .select("worksheet_id", { count: "exact", head: true });

    if (isFiltered) {
      taskCountQuery = taskCountQuery.in(
        "customer_id",
        userCompanyIds.length ? userCompanyIds : ["00000000-0000-0000-0000-000000000000"]
      );
    }

    const [customersResult, meetingsResult, tasksResult, recentCustResult] = await Promise.all([
      custCountQuery,
      meetQuery,
      taskCountQuery,
      recentCustQuery,
    ]);

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

    const totalCust = customersResult.error ? null : customersResult.count || 0;
    const recentCust = recentCustResult.error ? 0 : recentCustResult.count || 0;
    const previousCust = totalCust !== null ? Math.max(0, totalCust - recentCust) : 0;
    const customerPercentage = totalCust !== null
      ? (previousCust > 0 ? Math.round(((totalCust - previousCust) / previousCust) * 100) : (totalCust > 0 ? 100 : 0))
      : null;

    const meetingPercentage = upcomingMeetings > 0 ? Math.round((meetingsThisWeek / upcomingMeetings) * 100) : 0;
    const totalTasks = tasksResult.error ? null : tasksResult.count || 0;
    const taskPercentage = totalTasks !== null ? (totalCust && totalCust > 0 ? Math.min(100, Math.round((totalTasks / totalCust) * 100)) : 0) : null;

    return {
      totalCustomers: totalCust,
      activeCustomers: null,
      upcomingMeetings: meetingsResult.error ? null : upcomingMeetings,
      meetingsThisWeek: meetingsResult.error ? null : meetingsThisWeek,
      tasks: totalTasks,
      customerPercentage,
      meetingPercentage,
      taskPercentage,
      changes: {
        customer: customerPercentage,
        meeting: meetingPercentage,
        task: taskPercentage,
      },
    };
  } catch {
    return EMPTY_METRICS;
  }
}
