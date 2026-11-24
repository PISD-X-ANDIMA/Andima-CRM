import { NextRequest, NextResponse } from 'next/server';
import { getFieldAgentTasks, saveFieldTaskNote } from '@/backend/record_conversation/worksheetService';
import { getCompanyScope } from '@/lib/services/access-scope';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/record-conversation/tasks
 * Field agent tasks visible to the signed-in user. A sales executive only sees
 * companies whose sales_id matches their account.
 */
export async function GET() {
  const scope = await getCompanyScope();
  if (!scope) {
    return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
  }

  try {
    // Managers see every task; a sales executive only sees their own companies.
    const tasks = await getFieldAgentTasks(scope.isManager ? null : scope.companyIds);
    const response = NextResponse.json({ success: true, data: tasks ?? [] });
    response.headers.set('Cache-Control', 'private, max-age=3, stale-while-revalidate=30');
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load field agent tasks.' }, { status: 500 });
  }
}

/**
 * PATCH /api/record-conversation/tasks
 * Sales review: approve (Completed), request completion (Review), or archive.
 * Body: { taskId, action: 'approve' | 'request' | 'archive', notes? }
 */
export async function PATCH(request: NextRequest) {
  const scope = await getCompanyScope();
  if (!scope) {
    return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskId = typeof body.taskId === 'string' ? body.taskId.replace(/^tsk-/, '') : '';
    const action = body.action;
    if (!taskId || !['approve', 'request', 'archive'].includes(action)) {
      return NextResponse.json({ success: false, error: 'taskId and a valid action are required.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    const { data: task } = await supabase
      .from('a3_tasks')
      .select('id, job_id, status')
      .eq('id', taskId)
      .maybeSingle();
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }
    if (task.status !== 'Completed' && task.status !== 'Has Issue') {
      return NextResponse.json({ success: false, error: 'Only submitted reports can be reviewed.' }, { status: 409 });
    }

    if (!scope.isManager) {
      const { data: job } = await supabase
        .from('corp_jobs')
        .select('customer_id')
        .eq('id', task.job_id)
        .maybeSingle();
      if (!job?.customer_id || !scope.companyIds.includes(job.customer_id)) {
        return NextResponse.json({ success: false, error: 'This report is outside your company scope.' }, { status: 403 });
      }
    }

    const reviewStatus = action === 'approve' ? 'Completed' : action === 'archive' ? 'Archived' : 'Review';
    const { error: updateError } = await supabase
      .from('a3_tasks')
      .update({ review_status: reviewStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (updateError) throw updateError;

    if (typeof body.notes === 'string' && body.notes.trim()) {
      await saveFieldTaskNote({ taskId, notes: body.notes, salesId: scope.userId || null });
    }

    return NextResponse.json({ success: true, data: { taskId, review_status: reviewStatus } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/record-conversation/tasks
 * Saves a complementary note from a Sales Executive into a2_field_task_notes (Max 50 words).
 */
export async function POST(request: NextRequest) {
  const scope = await getCompanyScope();
  if (!scope) {
    return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, notes } = body;

    if (!taskId || typeof notes !== 'string') {
      return NextResponse.json(
        { success: false, error: 'taskId and notes are required.' },
        { status: 400 }
      );
    }

    if (!scope.isManager) {
      const supabase = await createServerSupabaseClient();
      if (!supabase) {
        return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
      }
      const cleanId = String(taskId).replace(/^tsk-/, '');
      const { data: task } = await supabase
        .from('a3_tasks')
        .select('id, job_id')
        .eq('id', cleanId)
        .maybeSingle();
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
      }
      const { data: job } = await supabase
        .from('corp_jobs')
        .select('customer_id')
        .eq('id', task.job_id)
        .maybeSingle();
      if (!job?.customer_id || !scope.companyIds.includes(job.customer_id)) {
        return NextResponse.json({ success: false, error: 'This report is outside your company scope.' }, { status: 403 });
      }
    }

    const result = await saveFieldTaskNote({
      taskId,
      notes,
      salesId: scope.userId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save note.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
