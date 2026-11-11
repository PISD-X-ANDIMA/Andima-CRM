import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseOperationError } from "@/lib/supabase/errors";
import { isValidPicPhoneNumber } from "@/lib/validation/pic-phone";
import { getCurrentUserScope } from "@/lib/auth/roles";
import { getCompanyScope, buildCustomerOwnerFilter } from "@/lib/services/access-scope";
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
  requireMeetings?: boolean;
  requireTransactions?: boolean;
  executiveId?: string;
  forceAll?: boolean;
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
    requireMeetings = false,
    requireTransactions = false,
  } = options;

  const validPerPage = Math.min(Math.max(perPage, 1), 100);
  const offset = (page - 1) * validPerPage;

  type CompanyRow = {
    id: string;
    company_name: string;
    address: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    created_by: string | null;
    created_by_name: string | null;
    created_at: string | null;
  };

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase server configuration is missing. Check the deployment environment variables.");
  }

  {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw createSupabaseOperationError("Login session verification failed", authError);
    let countQuery = (supabase as any)
      .from("a1_customers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);
    let dataQuery = (supabase as any)
      .from("a1_customers")
      .select("id, company_name, address, pic_name, pic_phone, created_by, created_by_name, created_at")
      .is("deleted_at", null);

    const scope = await getCompanyScope();
    if (!scope) {
      return { customers: [], total: 0, page, perPage: validPerPage, totalPages: 1 };
    }
    if (scope.isManager) {
      if (options.executiveId && options.executiveId.toLowerCase() !== "all") {
        const execFilter = options.executiveId.trim();
        countQuery = countQuery.ilike("created_by_name", `%${execFilter}%`);
        dataQuery = dataQuery.ilike("created_by_name", `%${execFilter}%`);
      }
    } else {
      if (scope.companyIds.length === 0) {
        return { customers: [], total: 0, page, perPage: validPerPage, totalPages: 1 };
      }
      countQuery = countQuery.in("id", scope.companyIds);
      dataQuery = dataQuery.in("id", scope.companyIds);
    }

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      const searchFilter = `company_name.ilike.${term},pic_name.ilike.${term},pic_phone.ilike.${term},created_by_name.ilike.${term}`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw createSupabaseOperationError("a1_customers count query failed", countError);
    const total = count || 0;
    const { data, error } = await dataQuery
      .order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false })
      .range(offset, offset + validPerPage - 1);
    if (error) throw createSupabaseOperationError("a1_customers row query failed", error);

    const rows = (data || []) as CompanyRow[];
    const companyIds = rows.map((item) => item.id);

    const jobByCompany = new Map<string, { transactionNo: string | null; jobNumber: string | null }>();
    if (companyIds.length) {
      const { data: jobRows, error: jobError } = await (supabase as any)
        .from("corp_jobs")
        .select("id, customer_id, job_number")
        .in("customer_id", companyIds)
        .order("created_at", { ascending: false });
      if (jobError && requireTransactions) throw createSupabaseOperationError("corp_jobs query failed", jobError);
      if (!jobError) {
        for (const job of jobRows || []) {
          if (job.customer_id && !jobByCompany.has(job.customer_id)) {
            jobByCompany.set(job.customer_id, {
              transactionNo: null,
              jobNumber: job.job_number || null,
            });
          }
        }
      }
    }

    const meetingsByCompany = new Map<string, any[]>();
    if (companyIds.length) {
      try {
        const meetingQuery = (columns: string) => (supabase as any)
          .from("a1_meetings")
          .select(columns)
          .in("customer_id", companyIds)
          .eq("is_active", true)
          .is("deleted_at", null);
        let result = await meetingQuery("id, customer_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, is_active, agenda, pic_name, representative_name, meeting_type, location, meeting_link, notes, status");
        if (result.error) result = await meetingQuery("id, customer_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, is_active");
        if (result.error && requireMeetings) throw createSupabaseOperationError("a1_meetings query failed", result.error);
        for (const meeting of result.data || []) {
          const companyMeetings = meetingsByCompany.get(meeting.customer_id) || [];
          companyMeetings.push(meeting);
          meetingsByCompany.set(meeting.customer_id, companyMeetings);
        }
      } catch (error) {
        if (requireMeetings) throw error;
      }
    }

    const customers: CustomerListItem[] = rows.map((item) => ({
      id: item.id,
      companyName: item.company_name,
      customerCode: null,
      address: item.address,
      transactionNo: jobByCompany.get(item.id)?.transactionNo || null,
      jobNumber: jobByCompany.get(item.id)?.jobNumber || null,
      createdBy: item.created_by_name || item.created_by,
      createdDate: item.created_at,
      primaryPic: item.pic_name ? {
        id: item.id, fullName: item.pic_name, phoneNumber: item.pic_phone || "",
      } : null,
      meetings: (meetingsByCompany.get(item.id) || []).map((meeting) => ({
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
        const meetings = meetingsByCompany.get(item.id) || [];
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
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) return null;
    const { data, error } = await (supabase as any)
      .from("a1_customers")
      .select("id, company_name, pic_name, pic_phone, address, created_by, created_by_name, created_at, updated_at")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw createSupabaseOperationError("a1_customers detail query failed", error);
    if (!data) return null;
    const ownerTokens = [data.created_by, data.created_by_name].filter(Boolean);
    if (!userScope.isManager && ownerTokens.length > 0 && !ownerTokens.some((token: string) => userScope.identifiers.includes(token))) {
      return null;
    }

    const { data: meetingRows, error: meetingError } = await (supabase as any)
      .from("a1_meetings")
      .select("*")
      .eq("customer_id", customerId)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (meetingError) throw createSupabaseOperationError("a1_meetings detail query failed", meetingError);

    const primaryPic = data.pic_name ? {
      id: data.id,
      fullName: data.pic_name,
      phoneNumber: data.pic_phone || "",
    } : null;

    let transactionNo: string | null = null;
    let worksheetJobNumber: string | null = null;
    const { data: corpJob } = await (supabase as any)
      .from("corp_jobs")
      .select("id, job_number")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    worksheetJobNumber = corpJob?.job_number || null;

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

    const jobs: CustomerDetailItem["jobs"] = [];

    return {
      id: data.id,
      companyName: data.company_name,
      customerCode: null,
      transactionNo,
      jobNumber: worksheetJobNumber,
      createdBy: data.created_by_name || data.created_by,
      address: data.address || "Address not provided",
      createdAt: data.created_at || "",
      updatedAt: data.updated_at || data.created_at || "",
      primaryPic,
      meetings,
      activeMeeting,
      jobs,
    };
  } catch (error) {
    throw createSupabaseOperationError("Customer detail lookup failed", error);
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
  if (!isValidPicPhoneNumber(input.pic_phone_number)) {
    return { success: false, error: "A valid PIC phone number is required" };
  }

  try {
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) {
      return { success: false, error: "No login session found. Please sign in again." };
    }

    const createdByName = userScope.name || userScope.user.email || userScope.user.id;
    if (!createdByName) {
      return { success: false, error: "User identity is unavailable for the customer record." };
    }

    const dupQuery = (supabase as any)
      .from("a1_customers")
      .select("id, created_by, created_by_name")
      .ilike("company_name", input.company_name.trim().replace(/[\\%_]/g, "\\$&"))
      .is("deleted_at", null);

    const { data: existing, error: duplicateCheckError } = await dupQuery;
    if (duplicateCheckError) return { success: false, error: duplicateCheckError.message };
    if (existing?.length) {
      return {
        success: false,
        error: "DUPLICATE_COMPANY: This company is already registered",
      };
    }

    const { data: regUser } = await (supabase as any)
      .from("b2_register")
      .select("id")
      .eq("id", userScope.user.id)
      .maybeSingle();

    const newCompanyId = crypto.randomUUID();
    const { error: companyInsertErr } = await (supabase as any)
      .from("a1_customers")
      .insert({
        id: newCompanyId,
        company_name: input.company_name.trim(),
        address: input.address.trim(),
        pic_name: input.pic_full_name.trim(),
        pic_phone: input.pic_phone_number.trim(),
        created_by: regUser?.id ?? null,
        created_by_name: createdByName,
      });
    if (companyInsertErr) return { success: false, error: companyInsertErr.message.includes("duplicate") ? "DUPLICATE_COMPANY: This company is already on the company list" : companyInsertErr.message };

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
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) {
      return { success: false, error: "No login session found. Please sign in again." };
    }
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.company_name) {
      const cleanName = input.company_name.trim();
      updatePayload.company_name = cleanName;

      const { data: existingDup, error: dupCheckErr } = await (supabase as any)
        .from("a1_customers")
        .select("id")
        .ilike("company_name", cleanName.replace(/[\\%_]/g, "\\$&"))
        .neq("id", customerId)
        .is("deleted_at", null);

      if (dupCheckErr) return { success: false, error: dupCheckErr.message };
      if (existingDup && existingDup.length > 0) {
        return {
          success: false,
          error: "DUPLICATE_COMPANY: This company is already on the company list",
        };
      }
    }
    if (input.address !== undefined) updatePayload.address = input.address.trim();
    if (input.pic_full_name) updatePayload.pic_name = input.pic_full_name.trim();
    if (input.pic_phone_number !== undefined) updatePayload.pic_phone = input.pic_phone_number.trim();

    let updateQuery = (supabase as any)
      .from("a1_customers")
      .update(updatePayload)
      .eq("id", customerId);

    if (!userScope.isManager) {
      const ownerFilter = buildCustomerOwnerFilter(userScope.identifiers, userScope.user.id);
      if (ownerFilter) updateQuery = updateQuery.or(ownerFilter);
    }

    const { error } = await updateQuery;

    if (error) return { success: false, error: error.message.includes("duplicate") ? "DUPLICATE_COMPANY: This company is already on the company list" : error.message };

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
    const userScope = await getCurrentUserScope(supabase);
    if (!userScope) return { success: false, error: "No login session found. Please sign in again." };

    if (!userScope.isManager) {
      const { data: existing } = await (supabase as any)
        .from("a1_customers")
        .select("created_by, created_by_name")
        .eq("id", customerId)
        .maybeSingle();
      const ownerTokens = [existing?.created_by, existing?.created_by_name].filter(Boolean);
      if (!existing || (ownerTokens.length > 0 && !ownerTokens.some((token: string) => userScope.identifiers.includes(token)))) {
        return { success: false, error: "Unauthorized: You can only delete your own customer." };
      }
    }

    const now = new Date().toISOString();

    const { error: meetingErr } = await (supabase as any)
      .from("a1_meetings")
      .update({ is_active: false, updated_at: now })
      .eq("customer_id", customerId)
      .eq("status", "scheduled")
      .eq("is_active", true);
    if (meetingErr) return { success: false, error: meetingErr.message };

    const { error: companyErr } = await (supabase as any)
      .from("a1_customers")
      .update({ deleted_at: now, updated_at: now })
      .eq("id", customerId);

    if (companyErr) return { success: false, error: companyErr.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
