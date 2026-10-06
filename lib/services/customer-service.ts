import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CustomerListItem,
  CustomerDetailItem,
  CreateCustomerInput,
  UpdateCustomerInput,
  MeetingDay,
  ScheduleType,
} from "@/types/customer";

export function formatMeetingSchedule(
  meetingDay: MeetingDay,
  scheduleType: ScheduleType,
  meetingDate?: string | null,
  startTime?: string,
  endTime?: string
): string {
  const dayNames: Record<MeetingDay, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const dayStr = dayNames[meetingDay] || meetingDay;
  const timeStr = startTime && endTime ? ` (${startTime.slice(0, 5)} - ${endTime.slice(0, 5)})` : "";

  if (scheduleType === "weekly") {
    return `Every ${dayStr}${timeStr} (Weekly)`;
  }

  if (meetingDate) {
    return `${dayStr}, ${meetingDate}${timeStr} (One Day)`;
  }

  return `${dayStr}${timeStr} (One Day)`;
}

export interface GetCustomersOptions {
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: "company_name" | "created_at";
  sortOrder?: "asc" | "desc";
}

/**
 * Retrieves customers from public.a1_company_list with pagination, sorting, and search filtering.
 */
export async function getCustomers(options: GetCustomersOptions = {}): Promise<{
  customers: CustomerListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const {
    search = "",
    page = 1,
    perPage = 10,
    sortBy = "company_name",
    sortOrder = "asc",
  } = options;

  const validPerPage = Math.min(Math.max(perPage, 1), 100);
  const offset = (page - 1) * validPerPage;

  type CompanyRow = {
    company_list_id: string;
    company_name: string;
    address: string | null;
    name: string | null;
    customer_code: string | null;
    job_number: string | null;
    created_by: string | null;
    created_at: string | null;
  };

  const supabase = await createServerSupabaseClient();

  if (supabase) {
    let countQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id", { count: "exact", head: true })
      .is("deleted_at", null);
    let dataQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id, company_name, address, name, customer_code, job_number, created_by, created_at");
    dataQuery = dataQuery.is("deleted_at", null);

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      const searchFilter = `company_name.ilike.${term},name.ilike.${term}`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;
    const total = count || 0;
    const { data, error } = await dataQuery
      .order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false })
      .range(offset, offset + validPerPage - 1);
    if (error) throw error;

    const rows = (data || []) as CompanyRow[];
    const companyIds = rows.map((item) => item.company_list_id);

    const meetingsByCompany = new Map<string, any[]>();
    if (companyIds.length) {
      try {
        const meetingQuery = (columns: string) => (supabase as any)
          .from("a1_customer_meetings")
          .select(columns)
          .in("company_id", companyIds)
          .eq("is_active", true)
          .is("deleted_at", null);
        let result = await meetingQuery("id, company_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, is_active, agenda, pic_name, representative_name, meeting_type, location, meeting_link, notes, status");
        if (result.error) result = await meetingQuery("id, company_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, is_active");
        for (const meeting of result.data || []) {
          const companyMeetings = meetingsByCompany.get(meeting.company_id) || [];
          companyMeetings.push(meeting);
          meetingsByCompany.set(meeting.company_id, companyMeetings);
        }
      } catch { /* optional meeting relation */ }
    }

    const customers: CustomerListItem[] = rows.map((item) => ({
      id: item.company_list_id,
      companyName: item.company_name,
      customerCode: item.customer_code,
      address: item.address,
      transactionNo: item.customer_code,
      jobNumber: item.job_number,
      createdBy: item.created_by,
      createdDate: item.created_at,
      primaryPic: item.name ? {
        id: item.company_list_id, fullName: item.name, phoneNumber: "",
      } : null,
      meetings: (meetingsByCompany.get(item.company_list_id) || []).map((meeting) => ({
          id: meeting.id,
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
          formattedSchedule: formatMeetingSchedule(meeting.meeting_day, meeting.schedule_type, meeting.meeting_date, meeting.start_time, meeting.end_time),
        })),
      meetingSchedule: (() => {
        const meetings = meetingsByCompany.get(item.company_list_id) || [];
        if (!meetings.length) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextMeeting = meetings
          .filter((meeting) => meeting.status !== "cancelled")
          .map((meeting) => {
            let occurrence: Date | null = null;
            if (meeting.schedule_type === "one_day" && meeting.meeting_date) {
              const [year, month, day] = meeting.meeting_date.split("-").map(Number);
              occurrence = new Date(year, month - 1, day);
            } else if (meeting.schedule_type === "weekly") {
              const weekdays: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
              const weekday = weekdays[meeting.meeting_day];
              if (weekday !== undefined) {
                occurrence = new Date(today);
                occurrence.setDate(today.getDate() + ((weekday - today.getDay() + 7) % 7));
                const [hours, minutes] = (meeting.start_time || "09:00").split(":").map(Number);
                occurrence.setHours(hours, minutes, 0, 0);
                if (occurrence < now) occurrence.setDate(occurrence.getDate() + 7);
              }
            }
            if (occurrence && meeting.effective_start_date) {
              const [year, month, day] = meeting.effective_start_date.split("-").map(Number);
              const effectiveStart = new Date(year, month - 1, day);
              while (meeting.schedule_type === "weekly" && occurrence < effectiveStart) occurrence.setDate(occurrence.getDate() + 7);
              if (meeting.schedule_type === "one_day" && occurrence < effectiveStart) occurrence = null;
            }
            if (occurrence && meeting.schedule_type === "one_day") {
              const [hours, minutes] = (meeting.start_time || "09:00").split(":").map(Number);
              occurrence.setHours(hours, minutes, 0, 0);
            }
            return { meeting, occurrence };
          })
          .filter((item) => item.occurrence && item.occurrence >= now)
          .sort((a, b) => a.occurrence!.getTime() - b.occurrence!.getTime())[0]?.meeting;
        if (!nextMeeting) return null;
        return {
          id: nextMeeting.id,
          meetingDay: nextMeeting.meeting_day,
          scheduleType: nextMeeting.schedule_type,
          meetingDate: nextMeeting.meeting_date,
          startTime: nextMeeting.start_time,
          endTime: nextMeeting.end_time,
          effectiveStartDate: nextMeeting.effective_start_date,
          agenda: nextMeeting.agenda,
          picName: nextMeeting.pic_name,
          representativeName: nextMeeting.representative_name,
          meetingType: nextMeeting.meeting_type,
          location: nextMeeting.location,
          meetingLink: nextMeeting.meeting_link,
          notes: nextMeeting.notes,
          status: nextMeeting.status,
          occurrenceDate: (() => {
            const date = nextMeeting.schedule_type === "one_day"
              ? new Date(`${nextMeeting.meeting_date}T00:00:00`)
              : new Date(nextMeeting.effective_start_date || today);
            if (nextMeeting.schedule_type === "weekly") {
              const weekday: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
              date.setDate(date.getDate() + ((weekday[nextMeeting.meeting_day] - date.getDay() + 7) % 7));
              const [hours, minutes] = (nextMeeting.start_time || "09:00").split(":").map(Number);
              date.setHours(hours, minutes, 0, 0);
              while (date < now) date.setDate(date.getDate() + 7);
            }
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          })(),
          formattedSchedule: formatMeetingSchedule(nextMeeting.meeting_day, nextMeeting.schedule_type, nextMeeting.meeting_date, nextMeeting.start_time, nextMeeting.end_time),
        };
      })(),
      createdAt: item.created_at || "",
    }));

    return {
      customers,
      total,
      page,
      perPage: validPerPage,
      totalPages: Math.ceil(total / validPerPage) || 1,
    };
  }
  return {
    customers: [],
    total: 0,
    page: 1,
    perPage: validPerPage,
    totalPages: 1,
  };
}

/**
 * Retrieves a company's profile and all active meeting schedules by ID.
 */
export async function getCustomerById(
  customerId: string
): Promise<CustomerDetailItem | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    // Load the legacy Company List columns first. Related tables and migration-added
    // columns are optional so a saved customer remains viewable on the shared schema.
    const { data, error } = await (supabase as any)
      .from("a1_company_list")
      .select("company_list_id, company_name, name, address, customer_code, job_number, created_by, created_at, updated_at")
      .eq("company_list_id", customerId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return null;

    const { data: meetingRows, error: meetingError } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("*")
      .eq("company_id", customerId)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (meetingError) throw meetingError;

    const primaryPic = data.name ? {
      id: data.company_list_id,
      fullName: data.name,
      phoneNumber: "",
    } : null;

    const meetings = (meetingRows || []).map((meeting: any) => ({
      id: meeting.id,
      companyId: customerId,
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
      formattedSchedule: formatMeetingSchedule(meeting.meeting_day, meeting.schedule_type, meeting.meeting_date, meeting.start_time, meeting.end_time),
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at,
    }));
    const activeMeeting = meetings.find((meeting: any) => meeting.status !== "cancelled") || null;

    /*
     * Transaction/job data belongs to its own source table, which is not in the
     * confirmed A1 schema. Do not query an unprovisioned table or invent rows.
     */
    const jobs: CustomerDetailItem["jobs"] = [];

    return {
      id: data.company_list_id,
      companyName: data.company_name,
      customerCode: data.customer_code,
      transactionNo: data.customer_code,
      jobNumber: data.job_number,
      createdBy: data.created_by,
      address: data.address || "Address not provided",
      salesId: null,
      createdAt: data.created_at || "",
      updatedAt: data.updated_at || data.created_at || "",
      primaryPic,
      meetings,
      activeMeeting,
      // No transaction/job table exists in the confirmed A1 schema.
      jobs,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a company with its single PIC in the legacy name column.
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!user && !isDevelopment) {
      return { success: false, error: "No login session found. Please sign in again." };
    }

    const metadata = user?.user_metadata as Record<string, unknown> | undefined;
    const createdBy =
      (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
      (typeof metadata?.name === "string" && metadata.name.trim()) ||
      user?.email ||
      (isDevelopment ? "Uji Coba" : null);
    if (!createdBy) {
      return { success: false, error: "User identity is unavailable for the customer record." };
    }

    const { data: existing, error: duplicateCheckError } = await (supabase as any)
      .from("a1_company_list")
      .select("company_list_id")
      .ilike("company_name", input.company_name.trim())
      .is("deleted_at", null);
    if (duplicateCheckError) return { success: false, error: duplicateCheckError.message };
    if (existing?.length) {
      return {
        success: false,
        error: "DUPLICATE_COMPANY: This company is already on your customer list",
      };
    }

    // Insert using the columns available on the existing Company List table.
    const newCompanyId = crypto.randomUUID();
    const { error: companyInsertErr } = await (supabase as any)
      .from("a1_company_list")
      .insert({
        company_list_id: newCompanyId,
        company_name: input.company_name.trim(),
        address: input.address.trim(),
        name: input.pic_full_name.trim(),
        created_by: createdBy,
      });
    if (companyInsertErr) return { success: false, error: companyInsertErr.message };

    return { success: true, companyId: newCompanyId };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the customer",
    };
  }
}

/**
 * Updates the customer profile.
 */
export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.company_name) updatePayload.company_name = input.company_name.trim();
    if (input.address !== undefined) updatePayload.address = input.address.trim();
    if (input.pic_full_name) updatePayload.name = input.pic_full_name.trim();

    const { error } = await (supabase as any)
      .from("a1_company_list")
      .update(updatePayload)
      .eq("company_list_id", customerId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Soft-deletes a customer (deleted_at) and deactivates its active schedule.
 */
export async function deleteCustomer(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const now = new Date().toISOString();

    // 1. Soft-delete the customer.
    const { error: companyErr } = await (supabase as any)
      .from("a1_company_list")
      .update({ deleted_at: now, updated_at: now })
      .eq("company_list_id", customerId);

    if (companyErr) return { success: false, error: companyErr.message };

    // 2. Deactivate the meeting schedule without deleting its history.
    await (supabase as any)
      .from("a1_customer_meetings")
      .update({ is_active: false, updated_at: now })
      .eq("company_id", customerId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
