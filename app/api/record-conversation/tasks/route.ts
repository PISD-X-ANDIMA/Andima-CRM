import { NextRequest, NextResponse } from 'next/server';
import { getFieldAgentTasks, saveFieldTaskNote } from '@/backend/record_conversation/worksheetService';
import { getCompanyScope } from '@/lib/services/access-scope';

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
    const tasks = await getFieldAgentTasks(scope.isManager ? null : scope.companyIds);
    const response = NextResponse.json({ success: true, data: tasks ?? [] });
    response.headers.set('Cache-Control', 'private, max-age=3, stale-while-revalidate=30');
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load field agent tasks.' }, { status: 500 });
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
