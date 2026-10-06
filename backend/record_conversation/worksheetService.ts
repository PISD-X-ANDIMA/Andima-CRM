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
}): Promise<PaginatedResult<WorksheetItem>> {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 8);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

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
    .order('worksheet_id', { ascending: false })
    .range(from, to);

  const { data, count, error } = await query;

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
      ? supabase.from('a1_company_list').select('company_list_id, company_name').in('company_list_id', customerIds)
      : Promise.resolve({ data: [] }),
    allEmpIds.length > 0
      ? supabase.from('d3_employee').select('id, full_name, email').in('id', allEmpIds)
      : Promise.resolve({ data: [] }),
  ]);

  const companyMap = new Map<string, string>();
  (companyRes.data || []).forEach((c: any) => {
    companyMap.set(c.company_list_id, c.company_name);
  });

  const employeeMap = new Map<string, string>();
  (employeeRes.data || []).forEach((e: any) => {
    employeeMap.set(e.id, e.full_name);
  });

  const mappedData = data.map((item: any) => {
    const agentName = employeeMap.get(item.field_agent_id) || 'Marsel';
    const initials = agentName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'M';

    return {
      ...item,
      company_name: companyMap.get(item.customer_id) || 'PT DSV TRANSPORT INDONESIA',
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
export async function getWorksheetDetail(worksheetId: number): Promise<WorksheetItem | null> {
  const { data: wsData, error: wsError } = await supabase
    .from('a2_worksheets')
    .select('*')
    .eq('worksheet_id', worksheetId)
    .single();

  if (wsError || !wsData) {
    console.error(`Error fetching worksheet detail #${worksheetId}:`, wsError);
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
      ? supabase.from('a1_company_list').select('company_name').eq('company_list_id', wsData.customer_id).single()
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
    company_name: compRes.data?.company_name || 'PT DSV Transport Indonesia',
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
export async function getFieldAgentTasks(): Promise<FieldTaskItem[] | null> {
  try {
    const { data: wsData, error: wsError } = await supabase
      .from('a2_worksheets')
      .select(`
        *,
        a1_company_list ( company_list_id, company_name ),
        field_agent:d3_employee!a2_worksheets_field_agent_id_fkey ( id, full_name, employee_id ),
        a2_worksheet_photos ( * ),
        a2_worksheet_documents ( * ),
        a2_worksheet_checklists ( * ),
        a2_worksheet_physical_items ( * )
      `)
      .order('worksheet_id', { ascending: true });

    if (wsError || !wsData || wsData.length === 0) {
      return null;
    }

    return wsData.map((w: any) => {
      const photos = w.a2_worksheet_photos || [];
      const docs = w.a2_worksheet_documents || [];
      const checklists = w.a2_worksheet_checklists || [];
      const physicalItems = w.a2_worksheet_physical_items || [];
      
      const grossWeightItem = physicalItems.find((p: any) => 
        p.item_label?.toLowerCase().includes('gross') || p.item_label?.toLowerCase().includes('weight')
      );
      const piecesItem = physicalItems.find((p: any) => 
        p.item_label?.toLowerCase().includes('piece') || p.item_label?.toLowerCase().includes('coil')
      );

      const jobFormatted = w.job_no 
        ? (w.job_no.startsWith('#') ? w.job_no : `#${w.job_no}`) 
        : `#JOB-${w.worksheet_id}`;
        
      const isIssue = Boolean(w.has_issue || w.status_kendala === 'kendala_terdeteksi');
      const issueCategory = w.issue_category || (isIssue ? 'Physical Load Difference' : undefined);

      return {
        id: `ws-${w.worksheet_id}`,
        task_id_code: w.task_id_code || `TSK-2506-${String(w.worksheet_id).padStart(4, '0')}`,
        job_number: jobFormatted,
        customer_name: w.a1_company_list?.company_name || 'PT. YOSSAVA TRANS LOGISTIK',
        field_agent_name: w.field_agent?.full_name || undefined,
        status: (w.progress_status as any) || (w.field_agent_id ? 'Assigned' : 'Unassigned'),
        has_issue: isIssue,
        issue_type: issueCategory,
        issue_category: issueCategory,
        issue_note: w.issue_note || (isIssue ? 'Pemeriksaan fisik menemukan ketidaksesuaian manifest kargo.' : undefined),
        issue_document_status: w.issue_document_status || (isIssue ? `Manifest Mismatch (B/L ${jobFormatted.replace('#', '')})` : undefined),
        variance_tolerance: w.variance_tolerance || '0%',
        photo_count: photos.length,
        doc_count: docs.length,
        issue_photos: photos.map((p: any) => p.photo_url).filter(Boolean),
        issue_files: photos.map((p: any, idx: number) => ({
          name: p.file_name || `Foto_Bukti_${idx + 1}.jpg`,
          size: '2.4 MB',
          type: 'JPEG',
          badge: p.badge_tag || (p.is_verified ? 'OPS Stamped' : 'Digital Sign'),
          url: p.photo_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800'
        })),
        result_photos: photos.map((p: any) => p.photo_url).filter(Boolean),
        result_docs: docs.map((d: any) => ({
          name: d.doc_name,
          size: d.file_size_kb ? `${(d.file_size_kb / 1024).toFixed(1)} MB` : '1.2 MB',
          url: d.doc_url
        })),
        handover_datetime: w.handover_datetime,
        handover_location: w.handover_location || 'Area Cargo MM2100, Cikarang Barat',
        shipper: w.shipper || 'PT. Astra Component Logistics',
        consignee: w.consignee || 'Toyota Tsusho Asia',
        mawb: w.mawb,
        hawb: w.hawb,
        gross_weight: grossWeightItem?.item_value || '2,450 Kg',
        cargo_pieces: piecesItem?.item_value || '12 Coils',
        packaging_type: 'Export Standard Pallet',
        checklists: checklists.length > 0 ? checklists.map((c: any) => ({
          label: c.check_label,
          is_verified: c.is_verified
        })) : [
          { label: 'Quantity & Gross Weight verification', is_verified: !isIssue },
          { label: 'Visual packaging condition sound', is_verified: !isIssue },
          { label: 'Container seal number matches manifest', is_verified: true },
          { label: 'Customs & port documentation match', is_verified: true },
          { label: 'Safe for flight airfreight protocol', is_verified: true }
        ],
        timeline: [
          {
            id: `tl-1`,
            title: 'Job Order Created',
            description: `Created for ${jobFormatted}`,
            timestamp: w.create_date || '2026-09-29',
            author: 'Adelia (Sales PIC)',
            status: 'completed'
          },
          ...(w.field_agent?.full_name ? [{
            id: `tl-2`,
            title: 'Field Inspector Assigned',
            description: `Assigned to ${w.field_agent.full_name}`,
            timestamp: w.create_date || '2026-09-29',
            author: 'Dispatcher',
            status: 'completed' as const
          }] : [])
        ]
      };
    });
  } catch (err) {
    console.error('Error in getFieldAgentTasks:', err);
    return null;
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

