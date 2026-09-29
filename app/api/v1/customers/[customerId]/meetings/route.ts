import { NextRequest } from "next/server";
import {
  getMeetingByCustomerId,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "@/lib/services/meeting-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const meeting = await getMeetingByCustomerId(customerId);
    return createSuccessResponse(meeting);
  } catch {
    return createErrorResponse("GET_001", "Gagal mengambil jadwal meeting", undefined, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();

    if (!body.meeting_day || !body.schedule_type || !body.start_time || !body.end_time) {
      return createErrorResponse(
        "VALIDATION_001",
        "meeting_day, schedule_type, start_time, end_time wajib diisi",
        undefined,
        400
      );
    }

    const result = await createMeeting(customerId, {
      meeting_day: body.meeting_day,
      schedule_type: body.schedule_type,
      meeting_date: body.meeting_date,
      start_time: body.start_time,
      end_time: body.end_time,
      effective_start_date: body.effective_start_date,
    });

    if (!result.success) {
      return createErrorResponse("CREATE_001", result.error || "Gagal membuat jadwal", undefined, 500);
    }

    return createSuccessResponse({ meetingId: result.meetingId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Request tidak valid", undefined, 400);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { meetingId, ...input } = body;

    if (!meetingId) {
      return createErrorResponse("VALIDATION_001", "meetingId wajib diisi", undefined, 400);
    }

    const result = await updateMeeting(customerId, meetingId, input);
    if (!result.success) {
      return createErrorResponse("UPDATE_001", result.error || "Gagal update jadwal", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("UPDATE_002", "Request tidak valid", undefined, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { meetingId } = body;

    if (!meetingId) {
      return createErrorResponse("VALIDATION_001", "meetingId wajib diisi", undefined, 400);
    }

    const result = await deleteMeeting(customerId, meetingId);
    if (!result.success) {
      return createErrorResponse("DELETE_001", result.error || "Gagal menghapus jadwal", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("DELETE_002", "Gagal menghapus jadwal", undefined, 500);
  }
}
