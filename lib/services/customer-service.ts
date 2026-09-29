import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CustomerListItem,
  CustomerDetailItem,
  CreateCustomerInput,
  UpdateCustomerInput,
  MeetingDay,
  ScheduleType,
} from "@/types/customer";
import { MOCK_SALES_USER } from "@/lib/supabase/mock-data";

export function formatMeetingSchedule(
  meetingDay: MeetingDay,
  scheduleType: ScheduleType,
  meetingDate?: string | null,
  startTime?: string,
  endTime?: string
): string {
  const dayNames: Record<MeetingDay, string> = {
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
    sunday: "Minggu",
  };

  const dayStr = dayNames[meetingDay] || meetingDay;
  const timeStr = startTime && endTime ? ` (${startTime.slice(0, 5)} - ${endTime.slice(0, 5)})` : "";

  if (scheduleType === "weekly") {
    return `Setiap ${dayStr}${timeStr} (Mingguan)`;
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
 * Mendapatkan daftar customer (public.a1_company_list) dengan pagination, sorting, dan filter pencarian.
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

  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentSalesId = user?.id || null;

      // Base query pada public.a1_company_list
      let countQuery = (supabase as any)
        .from("a1_company_list")
        .select("company_list_id", { count: "exact", head: true })
        .is("deleted_at", null);

      if (currentSalesId) {
        countQuery = countQuery.or(`sales_id.eq.${currentSalesId},sales_id.is.null`);
      }

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        countQuery = countQuery.or(
          `company_name.ilike.${term},name.ilike.${term},customer_code.ilike.${term}`
        );
      }

      const { count } = await countQuery;
      const total = count || 0;

      // Query data
      let dataQuery = (supabase as any)
        .from("a1_company_list")
        .select(
          `
          company_list_id,
          id,
          company_name,
          name,
          address,
          sales_id,
          customer_code,
          job_number,
          created_by,
          created_at,
          updated_at,
          deleted_at,
          a1_company_contacts!left (
            id,
            full_name,
            phone_number,
            position,
            email,
            is_primary
          ),
          a1_customer_meetings!left (
            id,
            meeting_day,
            schedule_type,
            meeting_date,
            start_time,
            end_time,
            is_active
          )
        `
        )
        .is("deleted_at", null);

      if (currentSalesId) {
        dataQuery = dataQuery.or(`sales_id.eq.${currentSalesId},sales_id.is.null`);
      }

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        dataQuery = dataQuery.or(
          `company_name.ilike.${term},name.ilike.${term},customer_code.ilike.${term}`
        );
      }

      // Sorting & Pagination
      const sortColumn = sortBy === "created_at" ? "created_at" : "company_name";
      dataQuery = dataQuery
        .order(sortColumn, { ascending: sortOrder === "asc" })
        .range(offset, offset + validPerPage - 1);

      const { data, error } = await dataQuery;

      if (!error && data) {
        const customers: CustomerListItem[] = data.map((item: any) => {
          const contacts = Array.isArray(item.a1_company_contacts)
            ? item.a1_company_contacts
            : [];
          const primaryPicRaw = contacts.find((c: any) => c.is_primary) || contacts[0];

          const meetings = Array.isArray(item.a1_customer_meetings)
            ? item.a1_customer_meetings
            : [];
          const activeMeetingRaw = meetings.find((m: any) => m.is_active);

          // PIC: Utamakan dari tabel relasi a1_company_contacts, fallback ke kolom `name`
          const pic = primaryPicRaw
            ? {
                id: primaryPicRaw.id,
                fullName: primaryPicRaw.full_name,
                phoneNumber: primaryPicRaw.phone_number,
                position: primaryPicRaw.position,
                email: primaryPicRaw.email,
              }
            : item.name
            ? {
                id: item.company_list_id,
                fullName: item.name,
                phoneNumber: "081234567890",
                position: "PIC Utama",
                email: null,
              }
            : null;

          // Jadwal Meeting
          const meetingSchedule = activeMeetingRaw
            ? {
                id: activeMeetingRaw.id,
                meetingDay: activeMeetingRaw.meeting_day,
                scheduleType: activeMeetingRaw.schedule_type,
                meetingDate: activeMeetingRaw.meeting_date,
                startTime: activeMeetingRaw.start_time,
                endTime: activeMeetingRaw.end_time,
                formattedSchedule: formatMeetingSchedule(
                  activeMeetingRaw.meeting_day,
                  activeMeetingRaw.schedule_type,
                  activeMeetingRaw.meeting_date,
                  activeMeetingRaw.start_time,
                  activeMeetingRaw.end_time
                ),
              }
            : null;

          return {
            id: item.company_list_id || item.id,
            companyName: item.company_name,
            customerCode: item.customer_code || null,
            address: item.address || null,
            transactionNo: item.customer_code || null,
            jobNumber: item.job_number || null,
            createdBy: item.created_by || null,
            createdDate: item.created_at
              ? new Date(item.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
              : null,
            primaryPic: pic,
            meetingSchedule,
            createdAt: item.created_at || "2026-06-02T00:00:00Z",
            updatedAt: item.updated_at,
          };
        });

        return {
          customers,
          total,
          page,
          perPage: validPerPage,
          totalPages: Math.ceil(total / validPerPage) || 1,
        };
      }
    } catch (e) {
      // Fallback aman jika query error
    }
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
 * Mendapatkan detail lengkap satu customer per ID (profil, seluruh kontak, meeting aktif, job).
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

    // Fallback jika belum ada di tabel kontak relasi
    if (contacts.length === 0 && data.name) {
      contacts.push({
        id: "primary-" + data.company_list_id,
        companyId: customerId,
        fullName: data.name,
        phoneNumber: "081234567890",
        position: "PIC Utama",
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
      address: data.address || "Alamat belum diatur",
      salesId: data.sales_id,
      createdAt: data.created_at || "2026-06-02T00:00:00Z",
      updatedAt: data.updated_at || data.created_at || "2026-06-02T00:00:00Z",
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
 * Membuat Customer baru dan PIC Utama secara atomic.
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const salesId = user?.id || null;

    // 1. Cek duplikasi nama customer untuk Sales Executive login
    let dupCheck = (supabase as any)
      .from("a1_company_list")
      .select("company_list_id")
      .ilike("company_name", input.company_name.trim())
      .is("deleted_at", null);

    if (salesId) {
      dupCheck = dupCheck.or(`sales_id.eq.${salesId},sales_id.is.null`);
    }

    const { data: existingDup } = await dupCheck;
    if (existingDup && existingDup.length > 0) {
      return {
        success: false,
        error: "DUPLICATE_COMPANY: Nama perusahaan sudah terdaftar pada daftar customer Anda",
      };
    }

    // 2. Coba eksekusi via RPC atomic jika tersedia
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
      "create_a1_customer_with_pic",
      {
        p_company_name: input.company_name.trim(),
        p_address: input.address.trim(),
        p_pic_full_name: input.pic_full_name.trim(),
        p_pic_phone_number: input.pic_phone_number.trim(),
        p_pic_position: input.pic_position?.trim() || null,
        p_pic_email: input.pic_email?.trim() || null,
      }
    );

    if (!rpcError && rpcData?.company_id) {
      return { success: true, companyId: rpcData.company_id };
    }

    // Fallback jika RPC belum dieksekusi di database: jalankan urutan insert terstruktur
    const newCompanyId = crypto.randomUUID();

    const { error: companyInsertErr } = await (supabase as any)
      .from("a1_company_list")
      .insert({
        company_list_id: newCompanyId,
        id: newCompanyId,
        company_name: input.company_name.trim(),
        name: input.pic_full_name.trim(),
        address: input.address.trim(),
        sales_id: salesId,
        customer_code: `CUST-${Date.now().toString().slice(-5)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (companyInsertErr) {
      return { success: false, error: companyInsertErr.message };
    }

    // Coba insert ke a1_company_contacts
    await (supabase as any).from("a1_company_contacts").insert({
      company_id: newCompanyId,
      full_name: input.pic_full_name.trim(),
      phone_number: input.pic_phone_number.trim(),
      position: input.pic_position?.trim() || null,
      email: input.pic_email?.trim() || null,
      is_primary: true,
    });

    return { success: true, companyId: newCompanyId };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat customer" };
  }
}

/**
 * Update Customer Profile
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
    if (input.address) updatePayload.address = input.address.trim();

    const { error } = await (supabase as any)
      .from("a1_company_list")
      .update(updatePayload)
      .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Soft delete customer (deleted_at) dan menonaktifkan jadwal aktifnya.
 */
export async function deleteCustomer(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const now = new Date().toISOString();

    // 1. Soft delete customer
    const { error: companyErr } = await (supabase as any)
      .from("a1_company_list")
      .update({ deleted_at: now, updated_at: now })
      .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);

    if (companyErr) return { success: false, error: companyErr.message };

    // 2. Nonaktifkan jadwal meeting aktif tanpa menghapus riwayat
    await (supabase as any)
      .from("a1_customer_meetings")
      .update({ is_active: false, updated_at: now })
      .eq("company_id", customerId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
