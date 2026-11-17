import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserScope } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

interface AlertRow {
  id: string;
  conversation_id: string;
  status: string;
  alerted_at: string | null;
}

interface ConversationRow {
  id: string;
  customer_id: string | null;
  created_by: string | null;
  conversation_date: string | null;
  summary: string | null;
}

interface CompanyRow {
  id: string;
  company_name: string | null;
}

interface EmployeeRow {
  id: string;
  full_name: string | null;
}

async function resolveManagerId(supabase: any, user: { id: string; email?: string | null }): Promise<string | null> {
  if (user.email) {
    const { data } = await supabase
      .from('b2_register')
      .select('id')
      .ilike('email', user.email.trim())
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  const { data } = await supabase
    .from('b2_register')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

/**
 * GET /api/record-conversation/alerts
 * Daftar need-assist alert. Default hanya Pending. `?status=all` untuk riwayat.
 * Manager only.
 */
export async function GET(request: NextRequest) {
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

  const includeAll = new URL(request.url).searchParams.get('status') === 'all';

  let alertQuery = supabase
    .from('a2_conversation_alerts')
    .select('id, conversation_id, status, alerted_at')
    .order('alerted_at', { ascending: false });
  if (!includeAll) alertQuery = alertQuery.eq('status', 'Pending');

  const { data: alertData, error: alertError } = await alertQuery;
  if (alertError) {
    return NextResponse.json({ success: false, error: alertError.message }, { status: 500 });
  }

  const alerts = (alertData || []) as AlertRow[];
  if (alerts.length === 0) {
    return NextResponse.json({ success: true, count: 0, items: [] });
  }

  const conversationIds = Array.from(new Set(alerts.map((alert) => alert.conversation_id)));

  const { data: conversationData, error: conversationError } = await supabase
    .from('a2_record_conversations')
    .select('id, customer_id, created_by, conversation_date, summary')
    .in('id', conversationIds);
  if (conversationError) {
    return NextResponse.json({ success: false, error: conversationError.message }, { status: 500 });
  }

  const conversations = (conversationData || []) as ConversationRow[];
  const conversationMap = new Map(conversations.map((row) => [row.id, row]));
  const customerIds = Array.from(new Set(conversations.map((row) => row.customer_id).filter((id): id is string => Boolean(id))));
  const employeeIds = Array.from(new Set(conversations.map((row) => row.created_by).filter((id): id is string => Boolean(id))));

  const [companyRes, employeeRes] = await Promise.all([
    customerIds.length > 0
      ? supabase.from('a1_customers').select('id, company_name').in('id', customerIds)
      : Promise.resolve({ data: [] as CompanyRow[] }),
    employeeIds.length > 0
      ? supabase.from('b2_register').select('id, full_name').in('id', employeeIds)
      : Promise.resolve({ data: [] as EmployeeRow[] }),
  ]);

  const companyMap = new Map(((companyRes.data || []) as CompanyRow[]).map((row) => [row.id, row.company_name]));
  const employeeMap = new Map(((employeeRes.data || []) as EmployeeRow[]).map((row) => [row.id, row.full_name]));

  const items = alerts.flatMap((alert) => {
    const conversation = conversationMap.get(alert.conversation_id);
    if (!conversation) return [];
    return [{
      id: alert.id,
      conversation_id: alert.conversation_id,
      status: alert.status,
      alerted_at: alert.alerted_at,
      company_name: (conversation.customer_id ? companyMap.get(conversation.customer_id) : null) || 'Company',
      sales_name: (conversation.created_by ? employeeMap.get(conversation.created_by) : null) || 'Sales Executive',
      conversation_date: conversation.conversation_date,
      summary: conversation.summary || '',
    }];
  });

  return NextResponse.json({ success: true, count: items.length, items });
}

/**
 * PATCH /api/record-conversation/alerts
 * Body: { conversationId } atau { id }. Manager only. Menandai alert Reviewed.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
  }

  const scope = await getCurrentUserScope(supabase);
  if (!scope) {
    return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
  }
  if (!scope.isManager) {
    return NextResponse.json({ success: false, error: 'Only a Manager of Customer Success can resolve a need backup.' }, { status: 403 });
  }

  let body: { conversationId?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.conversationId && !body.id) {
    return NextResponse.json({ success: false, error: 'conversationId or id is required' }, { status: 400 });
  }

  const managerId = await resolveManagerId(supabase, { id: scope.user.id, email: scope.email });
  const updateFields = {
    status: 'Reviewed',
    manager_id: managerId,
  };

  let query = supabase.from('a2_conversation_alerts').update(updateFields);
  query = body.conversationId
    ? query.eq('conversation_id', body.conversationId)
    : query.eq('id', body.id as string);

  const { data, error } = await query.select('id, conversation_id, status').maybeSingle();
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
