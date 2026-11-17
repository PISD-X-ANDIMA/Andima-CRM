import { supabase } from './supabaseClient';
import {
  WorksheetItem,
  PaginatedResult,
  FieldTaskItem,
  NeedBackupTicket
} from './types';

/**
 * Mengambil daftar penugasan lapangan dari a3_tasks + corp_jobs + a1_customers
 * secara bertahap (server-side pagination).
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

  const { data: tasks, count, error } = await (supabase as any)
    .from('a3_tasks')
    .select('id, job_id, field_agent_id, status, issue_description, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !tasks) {
    return { data: [], total: 0, page, limit, totalPages: 1 };
  }

  const jobIds = tasks.map((t: any) => t.job_id).filter(Boolean);
  const agentIds = tasks.map((t: any) => t.field_agent_id).filter(Boolean);

  const [jobsRes, usersRes] = await Promise.all([
    jobIds.length > 0 ? (supabase as any).from('corp_jobs').select('id, job_number, customer_id').in('id', jobIds) : Promise.resolve({ data: [] }),
    agentIds.length > 0 ? (supabase as any).from('b2_register').select('id, full_name').in('id', agentIds) : Promise.resolve({ data: [] }),
  ]);

  const jobMap = new Map<string, any>((jobsRes.data || []).map((j: any) => [j.id, j]));
  const userMap = new Map<string, any>((usersRes.data || []).map((u: any) => [u.id, u.full_name]));

  const custIds = (jobsRes.data || []).map((j: any) => j.customer_id).filter(Boolean);
  const { data: custs } = custIds.length > 0
    ? await (supabase as any).from('a1_customers').select('id, company_name').in('id', custIds)
    : { data: [] };
  const custMap = new Map<string, any>((custs || []).map((c: any) => [c.id, c.company_name]));

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const mappedData = tasks.map((t: any, index: number) => {
    const job = jobMap.get(t.job_id);
    const agentName = String(userMap.get(t.field_agent_id) || 'Marsel');
    const initials = agentName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'M';

    return {
      worksheet_id: t.id,
      transaction_no: '-',
      job_no: job?.job_number || `#JOB-${index + 1}`,
      customer_id: job?.customer_id || '',
      company_name: (job?.customer_id ? custMap.get(job.customer_id) : null) || '-',
      field_agent_name: agentName,
      field_agent_role: 'Field Inspector',
      field_agent_initials: initials,
      sales_pic_name: 'Adelia',
      status_kendala: t.issue_description || 'Normal',
      has_issue: Boolean(t.issue_description) || t.status === 'has_issue',
      issue_note: t.issue_description || undefined,
      created_at: t.created_at,
      updated_at: t.updated_at,
    } as any;
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
export async function getWorksheetDetail(worksheetId: number | string, visibleCompanyIds?: string[] | null): Promise<WorksheetItem | null> {
  const { data: t, error: wsError } = await (supabase as any)
    .from('a3_tasks')
    .select('*')
    .eq('id', worksheetId)
    .maybeSingle();

  if (wsError || !t) return null;

  const [jobRes, agentRes, docsRes, handoverRes, notesRes] = await Promise.all([
    t.job_id ? (supabase as any).from('corp_jobs').select('id, job_number, customer_id, origin, destination, job_type').eq('id', t.job_id).maybeSingle() : Promise.resolve({ data: null }),
    t.field_agent_id ? (supabase as any).from('b2_register').select('id, full_name').eq('id', t.field_agent_id).maybeSingle() : Promise.resolve({ data: null }),
    (supabase as any).from('a3_task_documents').select('*').eq('task_id', t.id),
    (supabase as any).from('a3_task_handovers').select('*').eq('task_id', t.id).maybeSingle(),
    (supabase as any).from('a2_field_task_notes').select('*').eq('task_id', t.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const job = jobRes.data;
  let companyName = '-';
  if (job?.customer_id) {
    const { data: cust } = await (supabase as any).from('a1_customers').select('company_name').eq('id', job.customer_id).maybeSingle();
    if (cust) companyName = cust.company_name;
  }

  const agentName = String(agentRes.data?.full_name || 'Field Agent');
  const initials = agentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'FA';
  const handover = handoverRes.data;
  const latestNote = notesRes.data;

  return {
    worksheet_id: t.id,
    job_no: job?.job_number || `#JOB-${t.id}`,
    customer_id: job?.customer_id || '',
    company_name: companyName,
    field_agent_name: agentName,
    field_agent_role: 'Field Inspector',
    field_agent_initials: initials,
    sales_pic_name: 'Sales Executive',
    status_kendala: t.issue_description || 'Normal',
    has_issue: Boolean(t.issue_description) || t.status === 'Has Issue' || t.status === 'has_issue',
    issue_note: t.issue_description || undefined,
    physical_items: handover ? [
      { id: 'pi-1', worksheet_id: t.id, item_label: 'Gross Weight', item_value: String(handover.actual_weight_kg || 0), item_unit: 'Kg', sort_order: 1 },
      { id: 'pi-2', worksheet_id: t.id, item_label: 'Cargo Pieces', item_value: String(handover.total_koli || 0), item_unit: 'Koli', sort_order: 2 }
    ] : [],
    photos: (docsRes.data || []).filter((d: any) => d.doc_type === '4_photos').map((d: any, idx: number) => ({
      id: d.id,
      worksheet_id: t.id,
      photo_label: `Dokumentasi Fisik ${idx + 1}`,
      photo_status: 'verified',
      photo_url: d.file_url,
      file_name: d.file_url.split('/').pop() || 'photo.jpg',
      taken_at: d.created_at,
      is_verified: true,
      sort_order: idx + 1
    })),
    documents: docsRes.data || [],
    checklists: [],
    notes: latestNote?.notes || undefined,
    created_at: t.created_at,
    updated_at: t.updated_at,
  } as any;
}

/**
 * Mengambil seluruh data penugasan field agent untuk TaskOfFieldAgent
 * dari tabel a3_tasks + corp_jobs + a1_customers di Supabase
 */
export async function getFieldAgentTasks(visibleCompanyIds?: string[] | null): Promise<FieldTaskItem[]> {
  try {
    const { data: tasks, error } = await (supabase as any)
      .from('a3_tasks')
      .select('id, job_id, field_agent_id, status, issue_description, completed_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error || !tasks) return [];

    const taskIds = tasks.map((t: any) => t.id).filter(Boolean);
    const jobIds = tasks.map((t: any) => t.job_id).filter(Boolean);
    const agentIds = tasks.map((t: any) => t.field_agent_id).filter(Boolean);

    const [jobsRes, usersRes, handoversRes, docsRes, notesRes] = await Promise.all([
      jobIds.length > 0 ? (supabase as any).from('corp_jobs').select('id, job_number, customer_id, origin, destination, job_type').in('id', jobIds) : Promise.resolve({ data: [] }),
      agentIds.length > 0 ? (supabase as any).from('b2_register').select('id, full_name').in('id', agentIds) : Promise.resolve({ data: [] }),
      taskIds.length > 0 ? (supabase as any).from('a3_task_handovers').select('*').in('task_id', taskIds) : Promise.resolve({ data: [] }),
      taskIds.length > 0 ? (supabase as any).from('a3_task_documents').select('*').in('task_id', taskIds) : Promise.resolve({ data: [] }),
      taskIds.length > 0 ? (supabase as any).from('a2_field_task_notes').select('*').in('task_id', taskIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);

    const jobMap = new Map<string, any>((jobsRes.data || []).map((j: any) => [j.id, j]));
    const userMap = new Map<string, any>((usersRes.data || []).map((u: any) => [u.id, u.full_name]));
    const handoverMap = new Map<string, any>((handoversRes.data || []).map((h: any) => [h.task_id, h]));

    const docsByTask = new Map<string, any[]>();
    (docsRes.data || []).forEach((d: any) => {
      const list = docsByTask.get(d.task_id) || [];
      list.push(d);
      docsByTask.set(d.task_id, list);
    });

    const latestNoteMap = new Map<string, any>();
    (notesRes.data || []).forEach((n: any) => {
      if (!latestNoteMap.has(n.task_id)) {
        latestNoteMap.set(n.task_id, n);
      }
    });

    const custIds = (jobsRes.data || []).map((j: any) => j.customer_id).filter(Boolean);
    const { data: custs } = custIds.length > 0 ? await (supabase as any).from('a1_customers').select('id, company_name').in('id', custIds) : { data: [] };
    const custMap = new Map<string, any>((custs || []).map((c: any) => [c.id, c.company_name]));

    const allowedCompanyIds = Array.isArray(visibleCompanyIds) ? new Set(visibleCompanyIds) : null;

    return tasks
      .filter((t: any) => {
        const job = jobMap.get(t.job_id);
        if (!allowedCompanyIds || !job?.customer_id) return true;
        return allowedCompanyIds.has(job.customer_id);
      })
      .map((t: any, index: number) => {
        const job = jobMap.get(t.job_id);
        const handover = handoverMap.get(t.id);
        const docs = docsByTask.get(t.id) || [];
        const latestNote = latestNoteMap.get(t.id);
        const isIssue = Boolean(t.issue_description) || t.status === 'Has Issue' || t.status === 'has_issue';

        const photoDocs = docs.filter((d: any) => d.doc_type === '4_photos');
        const regularDocs = docs.filter((d: any) => d.doc_type !== '4_photos');

        return {
          id: `tsk-${t.id}`,
          task_id_code: `TSK-${String(t.id).slice(0, 8).toUpperCase()}`,
          job_number: job?.job_number || `#JOB-${index + 1}`,
          customer_name: (job?.customer_id ? custMap.get(job.customer_id) : null) || '-',
          field_agent_name: userMap.get(t.field_agent_id) || 'Field Agent',
          status: (t.status as any) || (t.field_agent_id ? 'Assigned' : 'Unassigned'),
          has_issue: isIssue,
          issue_type: isIssue ? 'Physical Load Difference' : undefined,
          issue_category: isIssue ? 'Physical Load Difference' : undefined,
          issue_note: t.issue_description || undefined,
          gross_weight: handover?.actual_weight_kg ? `${handover.actual_weight_kg} Kg` : '0 Kg',
          cargo_pieces: handover?.total_koli ? `${handover.total_koli} Koli` : '0 Koli',
          handover_location: job?.destination || 'Area Operasional Kargo',
          handover_datetime: handover?.handover_time || t.completed_at || t.created_at,
          photo_count: photoDocs.length,
          doc_count: regularDocs.length,
          result_photos: photoDocs.map((p: any) => p.file_url),
          result_docs: regularDocs.map((d: any) => ({ name: d.doc_type, size: 'PDF', url: d.file_url })),
          notes: latestNote?.notes || undefined,
          notes_timestamp: latestNote?.created_at || undefined,
          notes_author: latestNote?.sales_id ? userMap.get(latestNote.sales_id) || 'Sales Executive' : 'Sales Executive',
          notes_role: 'Sales Executive',
        };
      }) as any;
  } catch (err) {
    console.warn('Error fetching field agent tasks:', err);
    return [];
  }
}

/**
 * Menyimpan catatan pelengkap dari Sales Executive ke tabel a2_field_task_notes di Supabase.
 * Batasan: Maksimal 50 kata tanpa mengubah laporan fisik inspeksi kargo lapangan.
 */
export async function saveFieldTaskNote(payload: {
  taskId: string;
  notes: string;
  salesId?: string | null;
  salesName?: string | null;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cleanId = payload.taskId.replace(/^tsk-/, '');
    const trimmed = payload.notes.trim();
    if (!trimmed) {
      return { success: false, error: 'Catatan tidak boleh kosong.' };
    }

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount > 50) {
      return {
        success: false,
        error: `Catatan melebihi batas maksimal 50 kata (${wordCount}/50 kata). Harap ringkas catatan Anda.`,
      };
    }

    let salesUuid = payload.salesId || null;
    if (!salesUuid && payload.salesName) {
      const { data: userMatch } = await (supabase as any)
        .from('b2_register')
        .select('id')
        .ilike('full_name', `%${payload.salesName.trim()}%`)
        .limit(1)
        .maybeSingle();
      if (userMatch?.id) salesUuid = userMatch.id;
    }

    const { data, error } = await (supabase as any)
      .from('a2_field_task_notes')
      .insert({
        task_id: cleanId,
        sales_id: salesUuid,
        notes: trimmed,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting into a2_field_task_notes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error in saveFieldTaskNote:', err);
    return { success: false, error: err.message || 'Gagal menyimpan catatan lapangan.' };
  }
}

/**
 * Menyimpan tiket Need Backup ke tabel a2_record_conversations di Supabase
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
    const { data, error } = await (supabase as any)
      .from('a2_record_conversations')
      .insert([
        {
          channel: payload.category || 'Ticket',
          summary: payload.description,
          need_assist: true,
          created_at: new Date().toISOString(),
        }
      ]);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Mengambil tiket Need Backup dari tabel a2_record_conversations di Supabase (need_assist = true)
 */
export async function getNeedBackupTickets(): Promise<NeedBackupTicket[] | null> {
  try {
    const [{ data, error }, { data: companies }, { data: users }, { data: jobs }] = await Promise.all([
      (supabase as any)
        .from('a2_record_conversations')
        .select('*')
        .eq('need_assist', true)
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('a1_customers')
        .select('id, company_name'),
      (supabase as any)
        .from('b2_register')
        .select('id, full_name'),
      (supabase as any)
        .from('corp_jobs')
        .select('id, job_number, customer_id'),
    ]);

    if (error || !data) return null;

    const compMap = new Map<string, any>((companies || []).map((c: any) => [c.id, c.company_name]));
    const userMap = new Map<string, any>((users || []).map((u: any) => [u.id, u.full_name]));
    const jobByCust = new Map<string, any>((jobs || []).map((j: any) => [j.customer_id, j.job_number]));

    return data.map((item: any, idx: number) => {
      const d = item.conversation_date ? new Date(item.conversation_date) : item.created_at ? new Date(item.created_at) : new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return {
        id: item.id || `bck-${idx + 1}`,
        ticket_id: `BCK-${String(item.id || idx + 1).slice(0, 8).toUpperCase()}`,
        job_number: jobByCust.get(item.customer_id) || `#JOB-${idx + 1}`,
        customer_name: compMap.get(item.customer_id) || 'Perusahaan',
        category: item.channel || 'Operasional',
        priority: 'High',
        date: `${day}-${month}-${year}`,
        status: 'Open',
        sla_description: 'SLA Respon < 4 Jam',
        description: item.summary || '',
        requested_by: userMap.get(item.created_by) || 'Sales Executive',
        created_at: item.created_at,
      };
    });
  } catch (err) {
    console.error('Error fetching need backup tickets from a2_record_conversations:', err);
    return null;
  }
}

/**
 * Memperbarui status tiket Need Backup pada tabel a2_record_conversations
 */
export async function updateNeedBackupStatus(ticketId: string, status: 'Open' | 'Inprogress' | 'Resolved') {
  try {
    const isResolved = status === 'Resolved';
    const { data, error } = await (supabase as any)
      .from('a2_record_conversations')
      .update({ need_assist: !isResolved, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
