import { supabase } from './supabaseClient';
import {
  WorksheetItem,
  WorksheetPhysicalItem,
  WorksheetPhotoItem,
  WorksheetDocumentItem,
  WorksheetChecklistItem,
  PaginatedResult,
  FieldTaskItem,
  NeedBackupTicket,
} from './types';

/**
 * Mengambil daftar penugasan lapangan dari a2_worksheets secara bertahap (server-side pagination)
 * untuk tabel "Field Agent Tasks & Worksheets (Job Reference Tracing)"
 */
export async function getWorksheets(options?: {
  page?: number;
  limit?: number;
  visibleCompanyIds?: string[] | null;
}): Promise<PaginatedResult<WorksheetItem>> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 8);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (Array.isArray(options?.visibleCompanyIds) && options.visibleCompanyIds.length === 0) {
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  let query = supabase
    .from('a2_worksheets')
    .select(`
      worksheet_id,
      transaction_no,
      job_no,
      customer_id,
      created_by_user_id,
      create_date,
      status_kendala,
      field_agent_id,
      sales_pic_id,
      shipper,
      consignee,
      mawb,
      hawb,
      handover_datetime,
      handover_location,
      pihak_penyerah,
      pihak_penerima,
      is_dangerous_goods,
      special_handling,
      has_issue,
      issue_note,
      is_exported_pdf,
      updated_at,
      conversation_id
    `, { count: 'exact' })
    .order('worksheet_id', { ascending: false });

  // A sales executive only sees worksheets for companies they own.
  if (Array.isArray(options?.visibleCompanyIds)) {
    query = query.in('customer_id', options.visibleCompanyIds);
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.warn('Warning fetching worksheets (a2_worksheets deprecated in favor of a3_tasks):', error.message);
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (error) {
    console.error('Error fetching worksheets:', error);
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  if (!data || data.length === 0) {
    return { data: [], total, page, limit, totalPages };
  }

  const customerIds = Array.from(new Set(data.map((w) => w.customer_id).filter(Boolean)));
  const agentIds = Array.from(new Set(data.map((w) => w.field_agent_id).filter(Boolean)));
  const salesIds = Array.from(new Set(data.map((w) => w.sales_pic_id).filter(Boolean)));
  const allEmpIds = Array.from(new Set([...agentIds, ...salesIds]));

  const [companyRes, employeeRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('a1_customers').select('id, company_name').in('id', customerIds).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    allEmpIds.length > 0
      ? supabase.from('d3_employee').select('id, full_name, email').in('id', allEmpIds)
      : Promise.resolve({ data: [] }),
  ]);

  const companyMap = new Map<string, string>();
  (companyRes.data || []).forEach((c: any) => {
    companyMap.set(c.id, c.company_name);
  });

  const employeeMap = new Map<string, string>();
  (employeeRes.data || []).forEach((e: any) => {
    employeeMap.set(e.id, e.full_name);
  });

  // Rows whose company was removed from the Company List are not shown.
  const mappedData = data.filter((item: any) => companyMap.has(item.customer_id)).map((item: any) => {
    const agentName = employeeMap.get(item.field_agent_id) || 'Marsel';
    const initials = agentName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'M';

    return {
      ...item,
      company_name: companyMap.get(item.customer_id) || '-',
      field_agent_name: agentName,
      field_agent_role: 'Field Inspector',
      field_agent_initials: initials,
      sales_pic_name: employeeMap.get(item.sales_pic_id) || 'Adelia',
    } as WorksheetItem;
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
 * Mengambil detail lengkap satu worksheet beserta seluruh tabel anak
 * untuk disajikan pada Panel AGT (Field Agent Worksheet Detail)
 */
export async function getWorksheetDetail(worksheetId: number, visibleCompanyIds?: string[] | null): Promise<WorksheetItem | null> {
  if (Array.isArray(visibleCompanyIds) && visibleCompanyIds.length === 0) return null;

  const { data: wsData, error: wsError } = await supabase
    .from('a2_worksheets')
    .select('*')
    .eq('worksheet_id', worksheetId)
    .single();

  if (wsError || !wsData) {
    console.error(`Error fetching worksheet detail #${worksheetId}:`, wsError);
    return null;
  }

  if (Array.isArray(visibleCompanyIds) && !visibleCompanyIds.includes(wsData.customer_id)) {
    return null;
  }

  // Ambil 4 tabel relasi anak secara paralel
  const [itemsRes, photosRes, docsRes, checksRes, compRes, empRes] = await Promise.all([
    supabase
      .from('a2_worksheet_physical_items')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('a2_worksheet_photos')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('a2_worksheet_documents')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('created_at', { ascending: true }),
    supabase
      .from('a2_worksheet_checklists')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('sort_order', { ascending: true }),
    wsData.customer_id
      ? supabase.from('a1_customers').select('company_name').eq('id', wsData.customer_id).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null }),
    wsData.field_agent_id
      ? supabase.from('d3_employee').select('full_name').eq('id', wsData.field_agent_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const agentName = empRes.data?.full_name || 'Marsel';
  const initials = agentName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'M';

  return {
    ...wsData,
    company_name: compRes.data?.company_name || '-',
    field_agent_name: agentName,
    field_agent_role: 'Field Inspector',
    field_agent_initials: initials,
    sales_pic_name: 'Adelia',
    physical_items: (itemsRes.data || []) as WorksheetPhysicalItem[],
    photos: (photosRes.data || []) as WorksheetPhotoItem[],
    documents: (docsRes.data || []) as WorksheetDocumentItem[],
    checklists: (checksRes.data || []) as WorksheetChecklistItem[],
  };
}

/**
 * Mengambil seluruh data penugasan field agent untuk TaskOfFieldAgent
 * langsung dari tabel a2_worksheets dan relasinya di Supabase.
 */
export async function getFieldAgentTasks(visibleCompanyIds?: string[] | null): Promise<FieldTaskItem[] | null> {
  if (Array.isArray(visibleCompanyIds) && visibleCompanyIds.length === 0) return [];
  try {
    const { data: tasks, error: taskErr } = await supabase
      .from('a3_tasks')
      .select(`
        id,
        job_id,
        field_agent_id,
        status,
        issue_description,
        created_at,
        completed_at
      `)
      .order('created_at', { ascending: false });

    if (taskErr || !tasks || tasks.length === 0) {
      return [];
    }

    const jobIds = tasks.map((t: any) => t.job_id).filter(Boolean);
    const agentIds = tasks.map((t: any) => t.field_agent_id).filter(Boolean);

    const [jobsRes, usersRes] = await Promise.all([
      jobIds.length > 0 ? supabase.from('corp_jobs').select('id, job_number, customer_id').in('id', jobIds) : Promise.resolve({ data: [] }),
      agentIds.length > 0 ? supabase.from('b2_register').select('id, full_name').in('id', agentIds) : Promise.resolve({ data: [] }),
    ]);

    const jobMap = new Map((jobsRes.data || []).map((j: any) => [j.id, j]));
    const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u.full_name]));

    const custIds = (jobsRes.data || []).map((j: any) => j.customer_id).filter(Boolean);
    const { data: custs } = custIds.length > 0 ? await supabase.from('a1_customers').select('id, company_name').in('id', custIds) : { data: [] };
    const custMap = new Map((custs || []).map((c: any) => [c.id, c.company_name]));

    const allowedCompanyIds = Array.isArray(visibleCompanyIds) ? new Set(visibleCompanyIds) : null;

    return tasks
      .filter((t: any) => {
        const job = jobMap.get(t.job_id);
        if (!allowedCompanyIds || !job?.customer_id) return true;
        return allowedCompanyIds.has(job.customer_id);
      })
      .map((t: any, index: number) => {
        const job = jobMap.get(t.job_id);
        const isIssue = Boolean(t.issue_description) || t.status === 'has_issue';
        return {
          id: `tsk-${t.id}`,
          task_id_code: `TSK-${String(t.id).slice(0, 8).toUpperCase()}`,
          job_number: job?.job_number || `#JOB-${index + 1}`,
          customer_name: (job?.customer_id ? custMap.get(job.customer_id) : null) || '-',
          field_agent_name: userMap.get(t.field_agent_id) || undefined,
          status: (t.status as any) || (t.field_agent_id ? 'Assigned' : 'Unassigned'),
          has_issue: isIssue,
          issue_type: isIssue ? 'Physical Load Difference' : undefined,
          issue_category: isIssue ? 'Physical Load Difference' : undefined,
          issue_note: t.issue_description || undefined,
        };
      }) as any;
  } catch (err) {
    console.warn('Error fetching field agent tasks:', err);
    return [];
  }
}

/**
 * Menyimpan tiket Need Backup ke tabel a2_need_backups di Supabase
 */
export async function submitNeedBackup(payload: {
  taskId: string;
  jobNumber: string;
  customerName: string;
  category: string;
  priority: 'Normal' | 'High / Urgent';
  description: string;
  requestedBy: string;
}) {
  try {
    const isWsId = payload.taskId.startsWith('ws-');
    const wsNumber = isWsId ? parseInt(payload.taskId.replace('ws-', ''), 10) : 1;

    const { data, error } = await supabase.from('a2_need_backups').insert([
      {
        worksheet_id: wsNumber,
        job_no: payload.jobNumber,
        customer_name: payload.customerName,
        category: payload.category,
        priority: payload.priority,
        sla_description: payload.priority === 'High / Urgent' ? 'SLA Tindakan Segera (< 30 Menit)' : 'SLA Respon < 4 Jam',
        description: payload.description,
        requested_by: payload.requestedBy,
        status: 'Pending'
      }
    ]);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Mengambil tiket Need Backup dari Supabase a2_need_backups
 */
export async function getNeedBackupTickets(): Promise<NeedBackupTicket[] | null> {
  try {
    const { data, error } = await supabase
      .from('a2_need_backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((item: any, idx: number) => {
      let status: 'Open' | 'Inprogress' | 'Resolved' = 'Open';
      const s = (item.status || '').toLowerCase();
      if (s.includes('resolv') || s.includes('selesai') || s.includes('done')) {
        status = 'Resolved';
      } else if (s.includes('prog') || s.includes('proses') || s.includes('tangani')) {
        status = 'Inprogress';
      }

      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      const p = (item.priority || '').toLowerCase();
      if (p.includes('high') || p.includes('urgent')) priority = 'High';
      else if (p.includes('low')) priority = 'Low';

      const d = item.created_at ? new Date(item.created_at) : new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return {
        id: item.id || `bck-${idx + 1}`,
        ticket_id: item.ticket_id || `BCK-2026-001`,
        job_number: item.job_no?.startsWith('#') ? item.job_no : `#${item.job_no || 'AENAT/2609/0305'}`,
        customer_name: item.customer_name || '',
        category: item.category || 'Selisih Koli',
        priority,
        date: `${day}-${month}-${year}`,
        status,
        sla_description: item.sla_description || 'SLA Respon < 4 Jam',
        description: item.description || '',
        requested_by: item.requested_by || 'Adelia',
        created_at: item.created_at
      };
    });
  } catch (err) {
    console.error('Error fetching need backup tickets from Supabase:', err);
    return null;
  }
}

/**
 * Memperbarui status tiket Need Backup
 */
export async function updateNeedBackupStatus(ticketId: string, status: 'Open' | 'Inprogress' | 'Resolved') {
  try {
    const { data, error } = await supabase
      .from('a2_need_backups')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

