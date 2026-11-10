import { NextRequest, NextResponse } from 'next/server';
import { getConversations, createConversation, updateConversation } from '@/backend/record_conversation/conversationService';
import { NewConversationPayload, UpdateConversationPayload } from '@/backend/record_conversation/types';
import { getCompanyScope } from '@/lib/services/access-scope';

const unauthorized = () => NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });

/**
 * GET /api/record-conversation/conversations
 * Query Parameters:
 * - channel: 'All Channels' | 'WhatsApp' | 'Meeting'
 * - status: 'All Statuses' | 'Active' | 'Archived'
 * - page: number (default: 1)
 * - limit: number (default: 8)
 */
export async function GET(request: NextRequest) {
  try {
    const scope = await getCompanyScope();
    if (!scope) return unauthorized();

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const date = searchParams.get('date') || undefined;
    const needAssistance = searchParams.get('need_assistance') || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 8);

    const result = await getConversations({
      channelType: channel,
      status: status,
      date: date,
      needAssistance: needAssistance,
      page,
      limit,
      visibleCompanyIds: scope.isManager ? null : scope.companyIds,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('Error in GET /api/record-conversation/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/record-conversation/conversations
 * Body: NewConversationPayload
 */
export async function POST(request: NextRequest) {
  try {
    const scope = await getCompanyScope();
    if (!scope) return unauthorized();

    const body = (await request.json()) as NewConversationPayload;

    if (!body.customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'customer_id is required',
        },
        { status: 400 }
      );
    }

    if (!body.summary) {
      return NextResponse.json(
        {
          success: false,
          error: 'summary is required',
        },
        { status: 400 }
      );
    }

    // A sales executive may only log conversations for companies they own.
    if (!scope.isManager && !scope.companyIds.includes(body.customer_id)) {
      return NextResponse.json(
        { success: false, error: 'You can only record conversations for your own companies.' },
        { status: 403 }
      );
    }

    const result = await createConversation(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create conversation',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/record-conversation/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/record-conversation/conversations
 * Body: UpdateConversationPayload
 */
export async function PATCH(request: NextRequest) {
  try {
    const scope = await getCompanyScope();
    if (!scope) return unauthorized();

    const body = (await request.json()) as UpdateConversationPayload;

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'id is required for updating conversation',
        },
        { status: 400 }
      );
    }

    const result = await updateConversation(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update conversation',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/record-conversation/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
