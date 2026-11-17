import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserScope } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

interface AlertRow {
  id: string;
  customer_id: string | null;
  sales_pic_id: string | null;
  conversation_date: string | null;
  urgency_level: string | null;
  summary: string | null;
}

interface CompanyRow {
  company_list_id: string;
  company_name: string | null;
}

interface EmployeeRow {
  id: string;
  full_name: string | null;
}

/**
 * GET /api/record-conversation/alerts
 * Daftar conversation yang ditandai need assistance dan belum diarsipkan.
 * Hanya Manager of Customer Success yang boleh membaca.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
  }

  const scope = await getCurrentUserScope(supabase);
  if (!scope) {
    return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
  }
  if (!scope.isManager) {
    return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('a2_record_conversations')
    .select('id, customer_id, sales_pic_id, conversation_date, urgency_level, summary')
    .eq('need_assistance', true)
    .eq('status', 'active')
    .order('conversation_date', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = (data || []) as AlertRow[];
  const customerIds = Array.from(new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id))));
  const employeeIds = Array.from(new Set(rows.map((row) => row.sales_pic_id).filter((id): id is string => Boolean(id))));

  const [companyRes, employeeRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('a1_company_list').select('company_list_id, company_name').in('company_list_id', customerIds).is('deleted_at', null)
      : Promise.resolve({ data: [] as CompanyRow[] }),
    employeeIds.length > 0
      ? supabase.from('d3_employee').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [] as EmployeeRow[] }),
  ]);

  const companyMap = new Map(((companyRes.data || []) as CompanyRow[]).map((row) => [row.company_list_id, row.company_name]));
  const employeeMap = new Map(((employeeRes.data || []) as EmployeeRow[]).map((row) => [row.id, row.full_name]));

  const items = rows.map((row) => ({
    id: row.id,
    company_name: (row.customer_id ? companyMap.get(row.customer_id) : null) || 'Company',
    sales_name: (row.sales_pic_id ? employeeMap.get(row.sales_pic_id) : null) || 'Sales Executive',
    conversation_date: row.conversation_date || null,
    urgency_level: row.urgency_level || 'standard',
    summary: row.summary || '',
  }));

  return NextResponse.json({ success: true, count: items.length, items });
}
