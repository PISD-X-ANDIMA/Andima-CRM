import { supabase } from './supabaseClient';
import { CompanyItem, RecordConversationItem, NewConversationPayload, UpdateConversationPayload, PaginatedResult } from './types';

/**
 * Mengambil daftar seluruh akun pelanggan dari a1_company_list
 * untuk dropdown pada modal "Select Customer Account"
 */
export async function getCustomers(visibleCompanyIds?: string[] | null): Promise<CompanyItem[]> {
  if (Array.isArray(visibleCompanyIds) && visibleCompanyIds.length === 0) return [];

  let query = supabase
    .from('a1_customers')
    .select('id, company_name, created_by_name, created_by')
    .is('deleted_at', null);
  if (Array.isArray(visibleCompanyIds)) query = query.in('id', visibleCompanyIds);
  const { data, error } = await query.order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching customers from a1_customers:', error);
    return [];
  }

  return (data || []).map((c: any) => ({
    company_list_id: c.id,
    job_number: '',
    name: c.company_name,
    company_name: c.company_name,
    created_by: c.created_by_name || c.created_by || '',
    customer_code: null,
  })) as CompanyItem[];
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
  visibleCompanyIds?: string[] | null;
}): Promise<PaginatedResult<RecordConversationItem>> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 8);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (Array.isArray(options?.visibleCompanyIds) && options.visibleCompanyIds.length === 0) {
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  let query = supabase
    .from('a2_record_conversations')
    .select(`
      id,
      customer_id,
      channel,
      conversation_date,
      summary,
      need_assist,
      created_by,
      meeting_id,
      attachment_url,
      created_at,
      updated_at
    `, { count: 'exact' })
    .order('conversation_date', { ascending: false });

  if (options?.channelType && options.channelType !== 'All Channels') {
    query = query.eq('channel', options.channelType);
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
    query = query.eq('need_assist', options.needAssistance === 'Yes' || options.needAssistance === 'true');
  }

  // A sales executive only sees conversations for companies they own.
  if (Array.isArray(options?.visibleCompanyIds)) {
    query = query.in('customer_id', options.visibleCompanyIds);
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
  const customerIds = Array.from(new Set(data.map((c: any) => c.customer_id).filter(Boolean)));
  const employeeIds = Array.from(new Set(data.map((c: any) => c.created_by).filter(Boolean)));

  const [companyRes, employeeRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('a1_customers').select('id, company_name').in('id', customerIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    employeeIds.length > 0
      ? supabase.from('d3_employee').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const companyMap = new Map<string, { company_name: string; customer_code: string | null }>();
  (companyRes.data || []).forEach((c: any) => {
    companyMap.set(c.id, c);
  });

  const employeeMap = new Map<string, string>();
  (employeeRes.data || []).forEach((e: any) => {
    employeeMap.set(e.id, e.full_name);
  });

  // Need-assist alert status lets the UI know whether a ticket is still open.
  const conversationIds = data.map((item: any) => item.id).filter(Boolean);
  const alertRes = conversationIds.length > 0
    ? await supabase.from('a2_conversation_alerts').select('conversation_id, status').in('conversation_id', conversationIds)
    : { data: [] as { conversation_id: string; status: string }[] };
  const alertMap = new Map<string, 'Pending' | 'Reviewed'>();
  (alertRes.data || []).forEach((alert: any) => {
    alertMap.set(alert.conversation_id, alert.status === 'Reviewed' ? 'Reviewed' : 'Pending');
  });

  // Rows whose company was removed from the Company List are not shown.
  const mappedData = data.filter((item: any) => companyMap.has(item.customer_id)).map((item: any) => {
    const comp = companyMap.get(item.customer_id);
    return {
      id: String(item.id),
      job_number: null,
      customer_id: item.customer_id,
      customer_code: comp?.customer_code || 'CUST-001',
      sales_pic_id: item.created_by || '',
      channel_type: item.channel || 'WhatsApp',
      conversation_date: item.conversation_date || (item.created_at ? item.created_at.slice(0, 10) : ''),
      summary: item.summary || '',
      need_assistance: Boolean(item.need_assist),
      alert_status: alertMap.get(item.id) || null,
      urgency_level: item.need_assist ? 'high_priority' : 'standard',
      synced_to_ctrack: true,
      document_urls: item.attachment_url ? [item.attachment_url] : null,
      status: 'active',
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
      company_name: comp?.company_name || '-',
      client_contact_name: comp?.company_name || '',
      sales_pic_name: employeeMap.get(item.created_by) || 'Sales Executive',
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
    // Dapatkan ID pegawai dari d3_employee (cocokkan nama jika ada)
    let activeEmployeeId: string | null = null;
    if (payload.sales_pic_name) {
      const { data: matchedEmp } = await supabase
        .from('d3_employee')
        .select('id')
        .ilike('full_name', `%${payload.sales_pic_name.trim()}%`)
        .limit(1);
      if (matchedEmp && matchedEmp.length > 0 && matchedEmp[0]?.id) {
        activeEmployeeId = matchedEmp[0].id;
      }
    }

    if (!activeEmployeeId) {
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
      meeting_id: payload.meeting_id || null,
      channel: payload.channel_type || 'WhatsApp',
      conversation_date: conversationDate,
      summary: payload.summary,
      need_assist: Boolean(payload.need_assistance),
      attachment_url: fileUrls.length > 0 ? fileUrls[0] : null,
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

    if (payload.need_assistance && convData?.id) {
      try {
        await supabase.from('a2_conversation_alerts').insert({
          conversation_id: convData.id,
          status: 'Pending',
          alerted_at: new Date().toISOString(),
        });
      } catch (alertErr) {
        console.warn('Warning creating conversation alert:', alertErr);
      }
    }

    // Single attachment is stored directly in a2_record_conversations.attachment_url

    return {
      success: true,
      data: {
        ...(convData as RecordConversationItem),
        sales_pic_name: payload.sales_pic_name,
      },
    };
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
    if (payload.channel_type !== undefined) updateFields.channel = payload.channel_type;
    if (payload.need_assistance !== undefined) updateFields.need_assist = payload.need_assistance;
    if (payload.document_urls !== undefined && Array.isArray(payload.document_urls) && payload.document_urls.length > 0) {
      updateFields.attachment_url = payload.document_urls[0];
    }

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

    if (payload.need_assistance === true && data?.id) {
      try {
        await (supabase as any)
          .from('a2_conversation_alerts')
          .upsert({
            conversation_id: data.id,
            status: 'Pending',
            alerted_at: new Date().toISOString(),
          }, { onConflict: 'conversation_id' });
      } catch (alertErr) {
        console.warn('Warning syncing conversation alert on update:', alertErr);
      }
    }

    // Ambil data pendukung relasi untuk company_name dan sales_pic_name
    let companyName = '-';
    let customerCode = data.customer_code || 'CUST-001';
    let salesPicName = 'Adelia';

    if (data.customer_id) {
      const { data: comp } = await supabase
        .from('a1_customers')
        .select('company_name')
        .eq('id', data.customer_id)
        .maybeSingle();
      if (comp) {
        companyName = comp.company_name;
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
