import { supabase } from './supabaseClient';
import { CompanyItem, RecordConversationItem, NewConversationPayload, UpdateConversationPayload, PaginatedResult } from './types';

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
  date?: string;
  needAssistance?: string;
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

  if (options?.date && options.date !== 'All Dates') {
    if (options.date === 'Today') {
      const todayStr = new Date().toISOString().split('T')[0];
      query = query.eq('conversation_date', todayStr);
    } else {
      query = query.eq('conversation_date', options.date);
    }
  }

  if (options?.needAssistance && options.needAssistance !== 'All Assistance') {
    query = query.eq('need_assistance', options.needAssistance === 'Yes');
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
    // Dapatkan ID pegawai dari d3_employee (ambil baris paling atas) atau dari baris yang sudah ada
    let activeEmployeeId: string | null = null;
    const { data: empData, error: empError } = await supabase
      .from('d3_employee')
      .select('id')
      .limit(1);

    if (empData && empData.length > 0 && empData[0]?.id) {
      activeEmployeeId = empData[0].id;
    } else {
      if (empError) {
        console.warn('Query ke d3_employee dibatasi RLS/permission:', empError.message);
      }
      // Fallback: ambil sales_pic_id valid yang sudah ada di a2_record_conversations (hindari dummy UUID)
      const { data: convFallback } = await supabase
        .from('a2_record_conversations')
        .select('sales_pic_id')
        .not('sales_pic_id', 'is', null)
        .neq('sales_pic_id', 'a0000000-0000-0000-0000-000000000001')
        .limit(1);

      if (convFallback && convFallback.length > 0 && convFallback[0]?.sales_pic_id) {
        activeEmployeeId = convFallback[0].sales_pic_id;
      } else {
        // Fallback default: ID karyawan yang terdaftar di d3_employee
        activeEmployeeId = '9c274330-44f1-474d-91c0-523aac3ea9cf';
      }
    }

    if (!activeEmployeeId) {
      return {
        success: false,
        error: 'Gagal mengambil sales_pic_id valid dari tabel d3_employee',
      };
    }

    const conversationDate = payload.conversation_date || new Date().toISOString().split('T')[0];

    // Kumpulkan seluruh berkas dari uploaded_files atau uploaded_file
    const fileUrls: string[] = [];
    const filesToInsert: any[] = [];

    if (payload.uploaded_files && payload.uploaded_files.length > 0) {
      payload.uploaded_files.forEach(f => {
        if (f.file_url) fileUrls.push(f.file_url);
        filesToInsert.push(f);
      });
    } else if (payload.uploaded_file && payload.uploaded_file.file_url) {
      fileUrls.push(payload.uploaded_file.file_url);
      filesToInsert.push(payload.uploaded_file);
    }

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
      document_urls: fileUrls.length > 0 ? fileUrls : null,
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
    if (filesToInsert.length > 0 && convData?.id) {
      const records = filesToInsert.map(f => ({
        conversation_id: convData.id,
        file_name: f.file_name,
        file_type: f.file_type,
        file_url: f.file_url,
        file_size_kb: f.file_size_kb,
        uploaded_by: activeEmployeeId,
      }));

      const { error: fileError } = await supabase
        .from('a2_conversation_files')
        .insert(records);

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

/**
 * Memperbarui percakapan (summary, channel, urgency, assistance, status, job_number, document_urls) di a2_record_conversations
 */
export async function updateConversation(payload: UpdateConversationPayload): Promise<{
  success: boolean;
  data?: RecordConversationItem;
  error?: string;
}> {
  try {
    if (!payload.id) {
      return { success: false, error: 'ID percakapan diperlukan untuk pembaruan' };
    }

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (payload.summary !== undefined) updateFields.summary = payload.summary;
    if (payload.channel_type !== undefined) updateFields.channel_type = payload.channel_type;
    if (payload.urgency_level !== undefined) updateFields.urgency_level = payload.urgency_level;
    if (payload.need_assistance !== undefined) updateFields.need_assistance = payload.need_assistance;
    if (payload.status !== undefined) updateFields.status = payload.status;
    if (payload.job_number !== undefined) updateFields.job_number = payload.job_number;
    if (payload.document_urls !== undefined) updateFields.document_urls = payload.document_urls;

    const { data, error } = await supabase
      .from('a2_record_conversations')
      .update(updateFields)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return { success: false, error: error.message };
    }

    // Ambil data pendukung relasi untuk company_name dan sales_pic_name
    let companyName = 'Perusahaan Pelanggan';
    let customerCode = data.customer_code || 'CUST-001';
    let salesPicName = 'Adelia';

    if (data.customer_id) {
      const { data: comp } = await supabase
        .from('a1_company_list')
        .select('company_name, customer_code')
        .eq('company_list_id', data.customer_id)
        .single();
      if (comp) {
        companyName = comp.company_name;
        if (comp.customer_code) customerCode = comp.customer_code;
      }
    }

    if (data.sales_pic_id) {
      const { data: emp } = await supabase
        .from('d3_employee')
        .select('full_name')
        .eq('id', data.sales_pic_id)
        .single();
      if (emp) {
        salesPicName = emp.full_name;
      }
    }

    const updatedItem: RecordConversationItem = {
      ...data,
      company_name: companyName,
      customer_code: customerCode,
      sales_pic_name: salesPicName,
    };

    return { success: true, data: updatedItem };
  } catch (err: any) {
    console.error('Unexpected error in updateConversation:', err);
    return { success: false, error: err.message || 'Gagal memperbarui percakapan' };
  }
}
