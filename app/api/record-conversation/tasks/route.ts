import { NextResponse } from 'next/server';
import { getFieldAgentTasks } from '@/backend/record_conversation/worksheetService';
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
    return NextResponse.json({ success: true, data: tasks ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load field agent tasks.' }, { status: 500 });
  }
}
