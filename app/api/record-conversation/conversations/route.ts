import { NextRequest, NextResponse } from 'next/server';
import { getConversations, createConversation, updateConversation } from '@/backend/record_conversation/conversationService';
import { NewConversationPayload, UpdateConversationPayload } from '@/backend/record_conversation/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserScope } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * GET /api/record-conversation/conversations
 * Query Parameters:
 * - channel: 'All Channels' | 'WhatsApp' | 'Meeting'
 * - status: 'All Statuses' | 'Active' | 'Archived'
 * - assigned_to: string (Sales Executive name)
 * - page: number (default: 1)
 * - limit: number (default: 8)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const date = searchParams.get('date') || undefined;
    const needAssistance = searchParams.get('need_assistance') || undefined;
    let assignedTo = searchParams.get('assigned_to') || searchParams.get('executiveId') || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 8);

    // Jika tidak dispesifikasikan di query param, periksa sesi login server
    if (!assignedTo) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const userScope = await getCurrentUserScope(supabase);
          if (userScope && !userScope.isManager) {
            assignedTo = userScope.name;
          }
        }
      } catch {
        // Fallback jika session server tidak tersedia
      }
    }

    const result = await getConversations({
      channelType: channel,
      status: status,
      date: date,
      needAssistance: needAssistance,
      assignedTo: assignedTo && assignedTo !== 'all' ? assignedTo : undefined,
      page,
      limit,
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
