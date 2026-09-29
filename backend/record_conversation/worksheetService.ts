import { supabase } from './supabaseClient';
import {
  WorksheetItem,
  WorksheetPhysicalItem,
  WorksheetPhotoItem,
  WorksheetDocumentItem,
  WorksheetChecklistItem,
  PaginatedResult,
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
