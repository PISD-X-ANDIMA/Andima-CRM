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
  };

  const supabase = await createServerSupabaseClient();

  if (supabase) {
    let countQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id", { count: "exact", head: true });
    let dataQuery = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id, company_name, address, name, customer_code, job_number, created_by");

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
      .order("company_name", { ascending: sortOrder === "asc" })
      .range(offset, offset + validPerPage - 1);
    if (error) throw error;

    const rows = (data || []) as CompanyRow[];
    const companyIds = rows.map((item) => item.company_list_id);

    // These additive tables may not be present in older shared database instances.
    // Keep the list usable with the legacy PIC value when either lookup is unavailable.
    let contactsByCompany = new Map<string, any>();
    let meetingsByCompany = new Map<string, any>();
    if (companyIds.length) {
      try {
        const { data: contacts } = await (supabase as any)
          .from("a1_company_contacts")
          .select("id, company_id, full_name, phone_number, position, email, is_primary")
          .in("company_id", companyIds)
          .is("deleted_at", null)
          .order("is_primary", { ascending: false });
        for (const contact of contacts || []) {
          if (!contactsByCompany.has(contact.company_id)) contactsByCompany.set(contact.company_id, contact);
        }
      } catch { /* optional contact relation */ }
      try {
        const { data: meetings } = await (supabase as any)
          .from("a1_customer_meetings")
          .select("id, company_id, meeting_day, schedule_type, meeting_date, start_time, end_time, effective_start_date, is_active")
          .in("company_id", companyIds)
          .eq("is_active", true)
          .is("deleted_at", null);
        for (const meeting of meetings || []) meetingsByCompany.set(meeting.company_id, meeting);
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
      createdDate: null,
      primaryPic: contactsByCompany.get(item.company_list_id) ? {
        id: contactsByCompany.get(item.company_list_id).id,
        fullName: contactsByCompany.get(item.company_list_id).full_name,
        phoneNumber: contactsByCompany.get(item.company_list_id).phone_number || "",
        position: contactsByCompany.get(item.company_list_id).position,
        email: contactsByCompany.get(item.company_list_id).email,
      } : item.name ? {
        id: item.company_list_id, fullName: item.name, phoneNumber: "", position: null, email: null,
      } : null,
      meetingSchedule: meetingsByCompany.get(item.company_list_id) ? (() => {
        const meeting = meetingsByCompany.get(item.company_list_id);
        return {
          id: meeting.id,
          meetingDay: meeting.meeting_day,
          scheduleType: meeting.schedule_type,
          meetingDate: meeting.meeting_date,
          startTime: meeting.start_time,
          endTime: meeting.end_time,
          effectiveStartDate: meeting.effective_start_date,
          formattedSchedule: formatMeetingSchedule(meeting.meeting_day, meeting.schedule_type, meeting.meeting_date, meeting.start_time, meeting.end_time),
        };
      })() : null,
      createdAt: "",
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
 * Retrieves a customer's profile, contacts, active meeting schedule, and jobs by ID.
 */
export async function getCustomerById(
  customerId: string
): Promise<CustomerDetailItem | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentSalesId = user?.id || null;

    let query = (supabase as any)
      .from("a1_company_list")
      .select(
        `
        company_list_id,
        id,
        company_name,
        name,
        address,
        sales_id,
        created_at,
        updated_at,
        deleted_at,
        a1_company_contacts (
          id,
          full_name,
          phone_number,
          position,
          email,
          is_primary,
          created_at,
          updated_at
        ),
        a1_customer_meetings (
          id,
          meeting_day,
          schedule_type,
          meeting_date,
          start_time,
          end_time,
          effective_start_date,
          is_active,
          created_at,
          updated_at
        ),
        a1_customer_jobs (
          id,
          transaction_no,
          job_number,
          title,
          status,
          agent_id,
          scheduled_date,
          created_at
        )
      `
      )
      .or(`company_list_id.eq.${customerId},id.eq.${customerId}`)
      .is("deleted_at", null);

    if (currentSalesId) {
      query = query.or(`sales_id.eq.${currentSalesId},sales_id.is.null`);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    const contacts = Array.isArray(data.a1_company_contacts)
      ? data.a1_company_contacts.map((c: any) => ({
          id: c.id,
          companyId: customerId,
          fullName: c.full_name,
          phoneNumber: c.phone_number,
          position: c.position,
          email: c.email,
          isPrimary: c.is_primary,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
      : [];

    // Fall back to the legacy PIC fields when no related contact exists.
    if (contacts.length === 0 && data.name) {
      contacts.push({
        id: "primary-" + data.company_list_id,
        companyId: customerId,
        fullName: data.name,
        phoneNumber: "",
        position: "Primary PIC",
        email: null,
        isPrimary: true,
      });
    }

    const primaryPic = contacts.find((c: any) => c.isPrimary) || contacts[0] || null;

    const meetings = Array.isArray(data.a1_customer_meetings)
      ? data.a1_customer_meetings
      : [];
    const activeMeetingRaw = meetings.find((m: any) => m.is_active);

    const activeMeeting = activeMeetingRaw
      ? {
          id: activeMeetingRaw.id,
          companyId: customerId,
          meetingDay: activeMeetingRaw.meeting_day,
          scheduleType: activeMeetingRaw.schedule_type,
          meetingDate: activeMeetingRaw.meeting_date,
          startTime: activeMeetingRaw.start_time,
          endTime: activeMeetingRaw.end_time,
          effectiveStartDate: activeMeetingRaw.effective_start_date,
          isActive: activeMeetingRaw.is_active,
          formattedSchedule: formatMeetingSchedule(
            activeMeetingRaw.meeting_day,
            activeMeetingRaw.schedule_type,
            activeMeetingRaw.meeting_date,
            activeMeetingRaw.start_time,
            activeMeetingRaw.end_time
          ),
          createdAt: activeMeetingRaw.created_at,
          updatedAt: activeMeetingRaw.updated_at,
        }
      : null;

    const jobs = Array.isArray(data.a1_customer_jobs)
      ? data.a1_customer_jobs.map((j: any) => ({
          id: j.id,
          companyId: customerId,
          transactionNo: j.transaction_no,
          jobNumber: j.job_number,
          title: j.title,
          status: j.status,
          agentId: j.agent_id,
          scheduledDate: j.scheduled_date,
          createdAt: j.created_at,
        }))
      : [];

    return {
      id: data.company_list_id || data.id,
      companyName: data.company_name,
      address: data.address || "Address not provided",
      salesId: data.sales_id,
      createdAt: data.created_at || "",
      updatedAt: data.updated_at || data.created_at || "",
      primaryPic,
      contacts,
      activeMeeting,
      jobs,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a customer and stores its primary PIC.
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
      .ilike("company_name", input.company_name.trim());
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
        customer_code: `CUST-${Date.now().toString().slice(-5)}`,
      });
    if (companyInsertErr) return { success: false, error: companyInsertErr.message };

    // Store the PIC phone number and details in the related contacts table.
    await (supabase as any).from("a1_company_contacts").insert({
      company_id: newCompanyId,
      full_name: input.pic_full_name.trim(),
      phone_number: input.pic_phone_number.trim(),
      position: input.pic_position?.trim() || null,
      email: input.pic_email?.trim() || null,
      is_primary: true,
    });

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
      .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);

    if (error) return { success: false, error: error.message };

    if (input.pic_full_name || input.pic_phone_number !== undefined || input.pic_position !== undefined || input.pic_email !== undefined) {
      const contacts = await (supabase as any)
        .from("a1_company_contacts")
        .select("id")
        .eq("company_id", customerId)
        .eq("is_primary", true)
        .is("deleted_at", null)
        .limit(1);
      if (contacts.error) return { success: false, error: contacts.error.message };
      const existingContact = contacts.data?.[0];
      if (existingContact) {
        const contactUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.pic_full_name !== undefined) contactUpdate.full_name = input.pic_full_name.trim();
        if (input.pic_phone_number !== undefined) contactUpdate.phone_number = input.pic_phone_number.trim();
        if (input.pic_position !== undefined) contactUpdate.position = input.pic_position.trim() || null;
        if (input.pic_email !== undefined) contactUpdate.email = input.pic_email.trim() || null;
        const { error: contactError } = await (supabase as any)
          .from("a1_company_contacts")
          .update(contactUpdate)
          .eq("id", existingContact.id)
          .eq("company_id", customerId);
        if (contactError) return { success: false, error: contactError.message };
      } else if (input.pic_full_name && input.pic_phone_number) {
        const { error: contactError } = await (supabase as any)
          .from("a1_company_contacts")
          .insert({ company_id: customerId, full_name: input.pic_full_name.trim(), phone_number: input.pic_phone_number.trim(), position: input.pic_position?.trim() || null, email: input.pic_email?.trim() || null, is_primary: true });
        if (contactError) return { success: false, error: contactError.message };
      }
    }

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
      .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);

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
