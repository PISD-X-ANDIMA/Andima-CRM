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
}

/**
 * Mendapatkan jadwal meeting aktif untuk customer tertentu.
 */
export async function getMeetingByCustomerId(
  customerId: string
): Promise<CustomerMeetingItem | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("*")
      .eq("company_id", customerId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      companyId: data.company_id,
      meetingDay: data.meeting_day,
      scheduleType: data.schedule_type,
      meetingDate: data.meeting_date,
      startTime: data.start_time,
      endTime: data.end_time,
      effectiveStartDate: data.effective_start_date,
      isActive: data.is_active,
      formattedSchedule: formatMeetingSchedule(
        data.meeting_day,
        data.schedule_type,
        data.meeting_date,
        data.start_time,
        data.end_time
      ),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Memeriksa apakah ada jadwal meeting customer lain yang bentrok.
 */
export async function detectMeetingConflict(
  salesId: string,
  input: MeetingInput,
  excludeCompanyId?: string
): Promise<{ hasConflict: boolean; conflictWith?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { hasConflict: false };

  try {
    const { data: allMeetings } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("id, company_id, meeting_day, start_time, end_time, a1_company_list!inner(company_name, sales_id)")
      .eq("a1_company_list.sales_id", salesId)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (!allMeetings) return { hasConflict: false };

    for (const m of allMeetings) {
      if (excludeCompanyId && m.company_id === excludeCompanyId) continue;
      if (m.meeting_day !== input.meeting_day) continue;

      const newStart = input.start_time;
      const newEnd = input.end_time;
      const existStart = m.start_time;
      const existEnd = m.end_time;

      const overlap = newStart < existEnd && newEnd > existStart;
      if (overlap) {
        return {
          hasConflict: true,
          conflictWith: m.a1_company_list?.company_name || "Customer Lain",
        };
      }
    }

    return { hasConflict: false };
  } catch {
    return { hasConflict: false };
  }
}

/**
 * Membuat jadwal meeting baru untuk customer.
 */
export async function createMeeting(
  customerId: string,
  input: MeetingInput
): Promise<{ success: boolean; meetingId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    // Nonaktifkan jadwal aktif lama jika ada
    await (supabase as any)
      .from("a1_customer_meetings")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("company_id", customerId)
      .eq("is_active", true);

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
 * Update jadwal meeting.
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
 * Soft delete / deactivate jadwal meeting (menghentikan pengulangan masa depan).
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
