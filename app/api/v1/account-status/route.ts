import { NextRequest, NextResponse } from 'next/server';
import { getA3Client } from '@/lib/a3';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserScope, resolveCrmRoleFromPosition } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * Account activation list. Manager sees sales + field agents, sales sees field agents only.
 * Activation changes b2_register.is_active, so it needs the service role: RLS has no update policy.
 */
async function resolveScope() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 }) };

  const scope = await getCurrentUserScope(supabase);
  if (!scope) return { error: NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 }) };

  if (scope.isManager) return { scope, manageableRoles: ['sales_executive', 'field_agent'] as const };
  if (scope.role === 'sales_executive') return { scope, manageableRoles: ['field_agent'] as const };

  return { error: NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 }) };
}

export async function GET() {
  const resolved = await resolveScope();
  if ('error' in resolved) return resolved.error;

  const { manageableRoles } = resolved;
  const db = getA3Client();

  // Fetch COM department IDs first (code 'COM' or name containing 'Commercial'/'Customer Success')
  const { data: departments } = await db
    .from('d3_departments')
    .select('id, code, name');

  const comDeptIds = new Set<string>(
    (departments || [])
      .filter((d: any) => {
        const code = String(d.code || '').toUpperCase();
        const name = String(d.name || '').toLowerCase();
        return code === 'COM' || name.includes('commercial') || name.includes('customer success');
      })
      .map((d: any) => d.id)
  );

  // Fetch positions limited to COM department (or fallback: all positions if no dept data)
  const comDeptPositionIds = new Set<string>();
  if (comDeptIds.size > 0) {
    const { data: comPositions } = await db
      .from('d3_positions')
      .select('id, code, title')
      .in('department_id', Array.from(comDeptIds));
    (comPositions || []).forEach((p: any) => comDeptPositionIds.add(p.id));
  }

  const [{ data: registers, error }, { data: positions }] = await Promise.all([
    // Filter b2_register by departement_id in COM departments (note: typo 'departement' is in DB schema)
    comDeptIds.size > 0
      ? db.from('b2_register').select('id, employee_id, full_name, email, phone, position_id, is_active').in('departement_id', Array.from(comDeptIds)).order('full_name')
      : db.from('b2_register').select('id, employee_id, full_name, email, phone, position_id, is_active').order('full_name'),
    db.from('d3_positions').select('id, code, title'),
  ]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const positionMap = new Map((positions || []).map((p: any) => [p.id, p]));
  const items = (registers || [])
    .map((row: any) => {
      const position = row.position_id ? positionMap.get(row.position_id) : null;
      return {
        id: row.id,
        employee_id: row.employee_id,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: resolveCrmRoleFromPosition(position),
        position_title: position?.title || 'Staff',
        is_active: row.is_active ?? true,
      };
    })
    // If no COM dept data, still filter by role; COM dept filter already pre-scopes the results
    .filter((row: any) => (manageableRoles as readonly string[]).includes(row.role));

  return NextResponse.json({ success: true, viewer_role: resolved.scope.role, data: items });
}

export async function PATCH(request: NextRequest) {
  const resolved = await resolveScope();
  if ('error' in resolved) return resolved.error;

  const { manageableRoles } = resolved;

  let body: { id?: string; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id || typeof body.is_active !== 'boolean') {
    return NextResponse.json({ success: false, error: 'id and is_active are required' }, { status: 400 });
  }

  const db = getA3Client();

  const { data: target, error: targetError } = await db
    .from('b2_register')
    .select('id, position_id')
    .eq('id', body.id)
    .maybeSingle();
  if (targetError) {
    return NextResponse.json({ success: false, error: targetError.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  const { data: position } = target.position_id
    ? await db.from('d3_positions').select('id, code, title').eq('id', target.position_id).maybeSingle()
    : { data: null };

  const targetRole = resolveCrmRoleFromPosition(position);
  if (!(manageableRoles as readonly string[]).includes(targetRole)) {
    return NextResponse.json({ success: false, error: 'This account is outside your management scope.' }, { status: 403 });
  }

  const { data, error } = await db
    .from('b2_register')
    .update({ is_active: body.is_active })
    .eq('id', body.id)
    .select('id, full_name, is_active')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
