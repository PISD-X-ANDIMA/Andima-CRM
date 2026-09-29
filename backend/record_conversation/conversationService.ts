import { supabase } from './supabaseClient';
import { CompanyItem, RecordConversationItem, NewConversationPayload, PaginatedResult } from './types';

/**
 * Mengambil daftar seluruh akun pelanggan dari a1_company_list
 * untuk dropdown pada modal "Select Customer Account"
 */
export async function getCustomers(): Promise<CompanyItem[]> {
  const { data, error } = await supabase
    .from('a1_company_list')
    .select('company_list_id, job_number, name, company_name, created_by, customer_code')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching customers from a1_company_list:', error);
    return [];
  }

  return (data || []) as CompanyItem[];
}

/**
 * Mengambil data percakapan dari a2_record_conversations secara bertahap (server-side pagination)
 * dilengkapi relasi nama perusahaan dari a1_company_list dan sales PIC dari d3_employee
 */
export async function getConversations(options?: {
  channelType?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<RecordConversationItem>> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 8);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('a2_record_conversations')
    .select(`
      id,
      job_number,
      customer_id,
      customer_code,
      sales_pic_id,
      channel_type,
      conversation_date,
      summary,
      need_assistance,
      urgency_level,
      synced_to_ctrack,
      document_urls,
      status,
      created_by,
      created_at,
      updated_at
    `, { count: 'exact' })
    .order('conversation_date', { ascending: false });

  if (options?.channelType && options.channelType !== 'All Channels') {
    query = query.eq('channel_type', options.channelType);
  }

  if (options?.status && options.status !== 'All Statuses') {
    query = query.eq('status', options.status.toLowerCase());
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (error) {
    console.error('Error fetching conversations:', error);
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  if (!data || data.length === 0) {
    return { data: [], total, page, limit, totalPages };
  }

  // Ambil data pendukung (perusahaan dan karyawan) untuk melengkapi nama di tabel
  const customerIds = Array.from(new Set(data.map((c) => c.customer_id).filter(Boolean)));
  const employeeIds = Array.from(new Set(data.map((c) => c.sales_pic_id).filter(Boolean)));

  const [companyRes, employeeRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('a1_company_list').select('company_list_id, company_name, name, customer_code').in('company_list_id', customerIds)
      : Promise.resolve({ data: [] }),
    employeeIds.length > 0
      ? supabase.from('d3_employee').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const companyMap = new Map<string, { company_name: string; name: string; customer_code: string | null }>();
  (companyRes.data || []).forEach((c: any) => {
    companyMap.set(c.company_list_id, c);
  });

  const employeeMap = new Map<string, string>();
  (employeeRes.data || []).forEach((e: any) => {
    employeeMap.set(e.id, e.full_name);
  });

  const mappedData = data.map((item: any) => {
    const comp = companyMap.get(item.customer_id);
    return {
      ...item,
      company_name: comp?.company_name || 'Perusahaan Pelanggan',
      client_contact_name: comp?.name || '',
      customer_code: item.customer_code || comp?.customer_code || 'CUST-001',
      sales_pic_name: employeeMap.get(item.sales_pic_id) || 'Adelia',
    } as RecordConversationItem;
  });

  return {
    data: mappedData,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Menyimpan percakapan baru dari Modal REC ke tabel a2_record_conversations
 * dan menyisipkan lampiran ke a2_conversation_files bila ada.
 */
export async function createConversation(payload: NewConversationPayload): Promise<{
  success: boolean;
  data?: RecordConversationItem;
  error?: string;
}> {
  try {
    // Dapatkan ID pegawai aktif dari d3_employee sebagai default pencatat / PIC
    let activeEmployeeId: string;
    const { data: empData } = await supabase
      .from('d3_employee')
      .select('id')
      .limit(1);

    if (empData && empData.length > 0) {
      activeEmployeeId = empData[0].id;
    } else {
      // Fallback safe dummy UUID
      activeEmployeeId = 'a0000000-0000-0000-0000-000000000001';
    }

    const conversationDate = payload.conversation_date || new Date().toISOString().split('T')[0];

    const insertPayload: any = {
      customer_id: payload.customer_id,
      customer_code: payload.customer_code || null,
      job_number: payload.job_number || null,
      sales_pic_id: activeEmployeeId,
      channel_type: payload.channel_type,
      conversation_date: conversationDate,
      summary: payload.summary,
      need_assistance: payload.need_assistance,
      urgency_level: payload.urgency_level,
      synced_to_ctrack: payload.synced_to_ctrack ?? true,
      document_urls: payload.uploaded_file ? [payload.uploaded_file.file_url] : null,
      status: 'active',
      created_by: activeEmployeeId,
    };

    const { data: convData, error: convError } = await supabase
      .from('a2_record_conversations')
      .insert(insertPayload)
      .select()
      .single();

    if (convError) {
      console.error('Error inserting conversation:', convError);
      return { success: false, error: convError.message };
    }

    // Jika ada file yang diunggah, masukkan ke tabel a2_conversation_files
    if (payload.uploaded_file && convData?.id) {
      const { error: fileError } = await supabase
        .from('a2_conversation_files')
        .insert({
          conversation_id: convData.id,
          file_name: payload.uploaded_file.file_name,
          file_type: payload.uploaded_file.file_type,
          file_url: payload.uploaded_file.file_url,
          file_size_kb: payload.uploaded_file.file_size_kb,
          uploaded_by: activeEmployeeId,
        });

      if (fileError) {
        console.warn('Warning: Conversation created but file record failed:', fileError);
      }
    }

    return { success: true, data: convData as RecordConversationItem };
  } catch (err: any) {
    console.error('Unexpected error in createConversation:', err);
    return { success: false, error: err.message || 'Gagal menyimpan percakapan' };
  }
}
