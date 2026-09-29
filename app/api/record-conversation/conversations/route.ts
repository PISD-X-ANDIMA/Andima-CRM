import { NextRequest, NextResponse } from 'next/server';
import { getConversations, createConversation } from '@/backend/record_conversation/conversationService';
import { NewConversationPayload } from '@/backend/record_conversation/types';

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
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(searchParams.get('limit')) || 8);

    const result = await getConversations({
      channelType: channel,
      status: status,
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
