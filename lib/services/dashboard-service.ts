import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardSummaryData } from "@/types/customer";

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/**
 * Menghitung 4 KPI kartu summary dashboard Sales Executive.
 */
export async function getDashboardSummary(
  salesId: string | null
): Promise<DashboardSummaryData> {
  const supabase = await createServerSupabaseClient();

  const defaultResult: DashboardSummaryData = {
    totalCustomer: 0,
    meetingThisWeek: { total: 0, completed: 0, upcoming: 0 },
    unminutedMeetingsCount: 0,
    sentMinutesCount: 0,
  };

  if (!supabase) return defaultResult;

  try {
    const { start: weekStart, end: weekEnd } = getWeekRange();
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
    const now = new Date();

    // 1. Total Customer Aktif
    let totalCustomerQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id", { count: "exact", head: true })
      .is("deleted_at", null);

    if (salesId) {
      totalCustomerQuery = totalCustomerQuery.or(
        `sales_id.eq.${salesId},sales_id.is.null`
      );
    }

    const { count: totalCustomer } = await totalCustomerQuery;

    // 2. Meeting Minggu Ini (dari a1_customer_meetings schedule_type weekly + one_day dalam range)
    // Untuk weekly, kita cek berdasarkan effective_start_date
    // Untuk one_day, kita cek berdasarkan meeting_date dalam range minggu ini
    let meetingsQuery = (supabase as any)
      .from("a1_customer_meetings")
      .select(
        "id, meeting_day, schedule_type, meeting_date, start_time, end_time, is_active, a1_company_list!inner(sales_id)"
      )
      .eq("is_active", true)
      .is("deleted_at", null);

    if (salesId) {
      meetingsQuery = meetingsQuery.or(
        `a1_company_list.sales_id.eq.${salesId},a1_company_list.sales_id.is.null`
      );
    }

    const { data: allMeetings } = await meetingsQuery;

    // Hitung meeting minggu ini
    const dayNames: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    let meetingTotal = 0;
    let meetingCompleted = 0;
    let meetingUpcoming = 0;

    if (allMeetings) {
      for (const m of allMeetings) {
        let isInWeek = false;
        let meetingDateTime: Date | null = null;

        if (m.schedule_type === "weekly") {
          // Weekly: cek apakah hari meeting ada dalam minggu ini
          const dayNum = dayNames[m.meeting_day] ?? -1;
          if (dayNum >= 0) {
            const weekMonday = new Date(weekStart);
            const diff = dayNum === 0 ? 6 : dayNum - 1;
            const meetingDate = new Date(weekMonday);
            meetingDate.setDate(weekMonday.getDate() + diff);
            const [h, min] = (m.end_time || "10:00").split(":").map(Number);
            meetingDateTime = new Date(meetingDate);
            meetingDateTime.setHours(h, min, 0, 0);
            isInWeek = true;
          }
        } else if (m.schedule_type === "one_day" && m.meeting_date) {
          isInWeek = m.meeting_date >= weekStart && m.meeting_date <= weekEnd;
          if (isInWeek) {
            const [h, min] = (m.end_time || "10:00").split(":").map(Number);
            meetingDateTime = new Date(m.meeting_date);
            meetingDateTime.setHours(h, min, 0, 0);
          }
        }

        if (isInWeek) {
          meetingTotal++;
          if (meetingDateTime && meetingDateTime < now) {
            meetingCompleted++;
          } else {
            meetingUpcoming++;
          }
        }
      }
    }

    // 3. Belum Ada Notulensi: meeting yang sudah lewat tapi belum ada notulensi
    let unminutedCount = 0;
    if (allMeetings && supabase) {
      const completedMeetingIds: string[] = [];
      for (const m of allMeetings) {
        if (m.schedule_type === "one_day" && m.meeting_date) {
          const [h, min] = (m.end_time || "10:00").split(":").map(Number);
          const mDate = new Date(m.meeting_date);
          mDate.setHours(h, min, 0, 0);
          if (mDate < now) completedMeetingIds.push(m.id);
        } else if (m.schedule_type === "weekly") {
          const dayNum = dayNames[m.meeting_day] ?? -1;
          if (dayNum >= 0) {
            const weekMonday = new Date(weekStart);
            const diff = dayNum === 0 ? 6 : dayNum - 1;
            const meetingDate = new Date(weekMonday);
            meetingDate.setDate(weekMonday.getDate() + diff);
            const [h, min] = (m.end_time || "10:00").split(":").map(Number);
            meetingDate.setHours(h, min, 0, 0);
            if (meetingDate < now) completedMeetingIds.push(m.id);
          }
        }
      }

      if (completedMeetingIds.length > 0) {
        const { count: minutedCount } = await (supabase as any)
          .from("a1_meeting_minutes")
          .select("id", { count: "exact", head: true })
          .in("meeting_id", completedMeetingIds);

        unminutedCount = completedMeetingIds.length - (minutedCount || 0);
        if (unminutedCount < 0) unminutedCount = 0;
      }
    }

    // 4. Notulensi Terkirim bulan berjalan
    let sentMinutesCountQuery = (supabase as any)
      .from("a1_meeting_minutes")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent_to_management")
      .gte("sent_at", monthStart)
      .lte("sent_at", monthEnd);

    if (salesId) {
      sentMinutesCountQuery = sentMinutesCountQuery.eq("sales_id", salesId);
    }

    const { count: sentMinutesCount } = await sentMinutesCountQuery;

    return {
      totalCustomer: totalCustomer || 0,
      meetingThisWeek: {
        total: meetingTotal,
        completed: meetingCompleted,
        upcoming: meetingUpcoming,
      },
      unminutedMeetingsCount: unminutedCount,
      sentMinutesCount: sentMinutesCount || 0,
    };
  } catch {
    return defaultResult;
  }
}
