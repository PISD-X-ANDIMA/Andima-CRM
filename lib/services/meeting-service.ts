import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomerMeetingItem, MeetingDay, ScheduleType } from "@/types/customer";
import { formatMeetingSchedule } from "./customer-service";

export interface MeetingInput {
  meeting_day: MeetingDay;
  schedule_type: ScheduleType;
  meeting_date?: string | null;
  start_time: string;
  end_time: string;
  effective_start_date?: string | null;
  agenda: string;
  pic_name: string;
  representative_name: string;
  meeting_type: "offline" | "online";
  location?: string | null;
  meeting_link?: string | null;
  notes?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
}

/**
 * Retrieves the active meeting schedule for a customer.
 */
export async function getMeetingsByCustomerId(
  customerId: string
): Promise<CustomerMeetingItem[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("*")
      .eq("company_id", customerId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("meeting_date", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true });

    if (error || !data) return [];

    return data.map((meeting: any): CustomerMeetingItem => ({
      id: meeting.id,
      companyId: meeting.company_id,
      meetingDay: meeting.meeting_day,
      scheduleType: meeting.schedule_type,
      meetingDate: meeting.meeting_date,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
      effectiveStartDate: meeting.effective_start_date,
      agenda: meeting.agenda,
      picName: meeting.pic_name,
      representativeName: meeting.representative_name,
      meetingType: meeting.meeting_type,
      location: meeting.location,
      meetingLink: meeting.meeting_link,
      notes: meeting.notes,
      status: meeting.status,
      isActive: meeting.is_active,
      formattedSchedule: formatMeetingSchedule(
        meeting.meeting_day,
        meeting.schedule_type,
        meeting.meeting_date,
        meeting.start_time,
        meeting.end_time
      ),
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Checks whether another customer's meeting schedule conflicts.
 */
export async function detectMeetingConflict(
  input: Pick<MeetingInput, "meeting_day" | "schedule_type" | "meeting_date" | "effective_start_date" | "start_time" | "end_time">,
  excludeMeetingId?: string
): Promise<{ hasConflict: boolean; conflictWith?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { hasConflict: false, error: "Database client unavailable" };

  try {
    let query = (supabase as any)
      .from("a1_customer_meetings")
      .select("id, company_id, meeting_day, schedule_type, meeting_date, effective_start_date, start_time, end_time, a1_company_list!inner(company_name)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .neq("status", "cancelled");
    if (excludeMeetingId) query = query.neq("id", excludeMeetingId);
    const { data: allMeetings, error } = await query;
    if (error) return { hasConflict: false, error: error.message };

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const getFirstWeeklyDate = (date: string, weekday: string) => {
      const firstDate = new Date(`${date}T00:00:00Z`);
      const targetDay = weekdays.indexOf(weekday);
      firstDate.setUTCDate(firstDate.getUTCDate() + ((targetDay - firstDate.getUTCDay() + 7) % 7));
      return `${firstDate.getUTCFullYear()}-${String(firstDate.getUTCMonth() + 1).padStart(2, "0")}-${String(firstDate.getUTCDate()).padStart(2, "0")}`;
    };
    const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && aEnd > bStart;
    const inputStartDate = input.schedule_type === "one_day"
      ? input.meeting_date
      : input.effective_start_date
        ? getFirstWeeklyDate(input.effective_start_date, input.meeting_day)
        : null;
    if (!inputStartDate) return { hasConflict: false };

    for (const m of allMeetings) {
      let repeatsOnCommonDate = false;
      if (input.schedule_type === "one_day") {
        repeatsOnCommonDate = m.schedule_type === "one_day"
          ? m.meeting_date === input.meeting_date
          : Boolean(m.meeting_day === weekdays[new Date(`${input.meeting_date}T00:00:00Z`).getUTCDay()]
            && m.effective_start_date
            && input.meeting_date! >= getFirstWeeklyDate(m.effective_start_date, m.meeting_day));
      } else if (m.schedule_type === "one_day") {
        const existingDate = m.meeting_date;
        repeatsOnCommonDate = Boolean(existingDate
          && weekdays[new Date(`${existingDate}T00:00:00Z`).getUTCDay()] === input.meeting_day
          && existingDate >= inputStartDate);
      } else {
        const existingFirstDate = m.effective_start_date
          ? getFirstWeeklyDate(m.effective_start_date, m.meeting_day)
          : null;
        // Two weekly meetings only intersect when they repeat on the same weekday.
        repeatsOnCommonDate = m.meeting_day === input.meeting_day
          && Boolean(existingFirstDate)
          && input.start_time < m.end_time
          && input.end_time > m.start_time;
        if (repeatsOnCommonDate) {
          // Both schedules recur indefinitely; the later first occurrence is their first shared date.
          repeatsOnCommonDate = true;
        }
      }
      if (repeatsOnCommonDate && overlaps(input.start_time, input.end_time, m.start_time, m.end_time)) {
        return {
          hasConflict: true,
          conflictWith: m.a1_company_list?.company_name || "Another company",
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    return { hasConflict: false, error: error instanceof Error ? error.message : "Failed to check meeting conflicts" };
  }
}

/**
 * Creates a new meeting schedule for a customer.
 */
export async function createMeeting(
  customerId: string,
  input: MeetingInput
): Promise<{ success: boolean; meetingId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const { data, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .insert({
        company_id: customerId,
        meeting_day: input.meeting_day,
        schedule_type: input.schedule_type,
        meeting_date: input.meeting_date || null,
        start_time: input.start_time || "09:00:00",
        end_time: input.end_time || "10:00:00",
        effective_start_date: input.effective_start_date || null,
        agenda: input.agenda,
        pic_name: input.pic_name,
        representative_name: input.representative_name,
        meeting_type: input.meeting_type,
        location: input.location || null,
        meeting_link: input.meeting_link || null,
        notes: input.notes || null,
        status: "scheduled",
        is_active: true,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, meetingId: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Updates a meeting schedule.
 */
export async function updateMeeting(
  customerId: string,
  meetingId: string,
  input: Partial<MeetingInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.meeting_day) updatePayload.meeting_day = input.meeting_day;
    if (input.schedule_type) updatePayload.schedule_type = input.schedule_type;
    if (input.meeting_date !== undefined) updatePayload.meeting_date = input.meeting_date;
    if (input.start_time) updatePayload.start_time = input.start_time;
    if (input.end_time) updatePayload.end_time = input.end_time;
    if (input.effective_start_date !== undefined)
      updatePayload.effective_start_date = input.effective_start_date;
    if (input.agenda !== undefined) updatePayload.agenda = input.agenda;
    if (input.pic_name !== undefined) updatePayload.pic_name = input.pic_name;
    if (input.representative_name !== undefined) updatePayload.representative_name = input.representative_name;
    if (input.meeting_type !== undefined) updatePayload.meeting_type = input.meeting_type;
    if (input.location !== undefined) updatePayload.location = input.location || null;
    if (input.meeting_link !== undefined) updatePayload.meeting_link = input.meeting_link || null;
    if (input.notes !== undefined) updatePayload.notes = input.notes || null;
    if (input.status !== undefined) updatePayload.status = input.status;

    const { error } = await (supabase as any)
      .from("a1_customer_meetings")
      .update(updatePayload)
      .eq("id", meetingId)
      .eq("company_id", customerId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Soft-deletes or deactivates a meeting schedule to stop future recurrences.
 */
export async function deleteMeeting(
  customerId: string,
  meetingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const { error } = await (supabase as any)
      .from("a1_customer_meetings")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("company_id", customerId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
