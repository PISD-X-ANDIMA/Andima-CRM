import { NextRequest } from "next/server";
import {
  getMeetingsByCustomerId,
  detectMeetingConflict,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "@/lib/services/meeting-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const meetings = await getMeetingsByCustomerId(customerId);
    return createSuccessResponse(meetings, { total: meetings.length });
  } catch {
    return createErrorResponse("CAL_001", "Schedule data is unavailable for this period", undefined, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();

    if (!body.meeting_day || !body.schedule_type || !body.start_time || !body.end_time) {
      return createErrorResponse(
        "VALIDATION_001",
        "meeting_day, schedule_type, start_time, and end_time are required",
        undefined,
        400
      );
    }

    if (!(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(body.meeting_day)) || !["one_day", "weekly"].includes(body.schedule_type)) {
      return createErrorResponse("VALIDATION_001", "A valid meeting day and frequency are required", undefined, 400);
    }

    if (!body.meeting_date && body.schedule_type === "one_day") {
      return createErrorResponse("VALIDATION_001", "meeting_date is required for a one-day meeting", undefined, 400);
    }
    if (!body.effective_start_date && body.schedule_type === "weekly") {
      return createErrorResponse("VALIDATION_001", "effective_start_date is required for a weekly meeting", undefined, 400);
    }
    if (body.end_time <= body.start_time) {
      return createErrorResponse("VALIDATION_001", "End time must be after start time", undefined, 400);
    }
    if (!body.agenda?.trim() || !body.pic_name?.trim() || !body.representative_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Agenda, PIC name, and Andima representative are required", undefined, 400);
    }
    if (!["offline", "online"].includes(body.meeting_type)) {
      return createErrorResponse("VALIDATION_001", "A valid meeting type is required", undefined, 400);
    }
    if (body.meeting_type === "offline" && !body.location?.trim()) {
      return createErrorResponse("VALIDATION_001", "Location is required for an offline meeting", undefined, 400);
    }
    if (body.meeting_type === "online" && !body.meeting_link?.trim()) {
      return createErrorResponse("VALIDATION_001", "Meeting link is required for an online meeting", undefined, 400);
    }
    if ((body.notes || "").length > 500) {
      return createErrorResponse("VALIDATION_001", "Notes must be 500 characters or fewer", undefined, 400);
    }

    const conflict = await detectMeetingConflict(body);
    if (conflict.error) return createErrorResponse("CONFLICT_CHECK_001", "Could not verify meeting availability", undefined, 503);
    if (conflict.hasConflict) return createErrorResponse("MEET_001", `This time overlaps with a meeting for ${conflict.conflictWith}.`, undefined, 409);

    const result = await createMeeting(customerId, {
      meeting_day: body.meeting_day,
      schedule_type: body.schedule_type,
      meeting_date: body.meeting_date,
      start_time: body.start_time,
      end_time: body.end_time,
      effective_start_date: body.effective_start_date,
      agenda: body.agenda.trim(),
      pic_name: body.pic_name.trim(),
      representative_name: body.representative_name.trim(),
      meeting_type: body.meeting_type,
      location: body.location?.trim() || null,
      meeting_link: body.meeting_link?.trim() || null,
      notes: body.notes?.trim() || null,
    });

    if (!result.success) {
      return createErrorResponse("CREATE_001", result.error || "Failed to create the schedule", undefined, 500);
    }

    return createSuccessResponse({ meetingId: result.meetingId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Invalid request", undefined, 400);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { meetingId, ...input } = body;

    if (!meetingId) {
      return createErrorResponse("VALIDATION_001", "meetingId is required", undefined, 400);
    }
    if (input.status !== undefined && !["scheduled", "completed", "cancelled"].includes(input.status)) {
      return createErrorResponse("VALIDATION_001", "A valid meeting status is required", undefined, 400);
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 500);
    const { data: existing, error: existingError } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("status, meeting_type, location, meeting_link, start_time, end_time, schedule_type, meeting_day, meeting_date, effective_start_date")
      .eq("id", meetingId)
      .eq("company_id", customerId)
      .maybeSingle();
    if (existingError || !existing) return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
    if (existing.status === "completed") {
      return createErrorResponse("MEETING_LOCKED_001", "Completed meetings cannot be edited or have their status changed.", undefined, 409);
    }

    if (input.agenda !== undefined && !input.agenda?.trim()) {
      return createErrorResponse("VALIDATION_001", "Agenda is required", undefined, 400);
    }
    if (input.pic_name !== undefined && !input.pic_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "PIC name is required", undefined, 400);
    }
    if (input.representative_name !== undefined && !input.representative_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Andima representative is required", undefined, 400);
    }
    if (input.meeting_type && !["offline", "online"].includes(input.meeting_type)) {
      return createErrorResponse("VALIDATION_001", "A valid meeting type is required", undefined, 400);
    }
    const meetingType = input.meeting_type ?? existing.meeting_type;
    const location = input.location !== undefined ? input.location : existing.location;
    const meetingLink = input.meeting_link !== undefined ? input.meeting_link : existing.meeting_link;
    if (meetingType === "offline" && !location?.trim()) {
      return createErrorResponse("VALIDATION_001", "Location is required for an offline meeting", undefined, 400);
    }
    if (meetingType === "online" && !meetingLink?.trim()) {
      return createErrorResponse("VALIDATION_001", "Meeting link is required for an online meeting", undefined, 400);
    }
    if (input.notes !== undefined && input.notes.length > 500) {
      return createErrorResponse("VALIDATION_001", "Notes must be 500 characters or fewer", undefined, 400);
    }
    const startTime = input.start_time ?? existing.start_time;
    const endTime = input.end_time ?? existing.end_time;
    if (startTime && endTime && endTime <= startTime) {
      return createErrorResponse("VALIDATION_001", "End time must be after start time", undefined, 400);
    }
    if (input.schedule_type && !["one_day", "weekly"].includes(input.schedule_type)) {
      return createErrorResponse("VALIDATION_001", "A valid meeting frequency is required", undefined, 400);
    }
    if (input.schedule_type === "one_day" && !input.meeting_date) {
      return createErrorResponse("VALIDATION_001", "Meeting date is required for a one-time meeting", undefined, 400);
    }
    if (input.schedule_type === "weekly" && !input.effective_start_date) {
      return createErrorResponse("VALIDATION_001", "Start date is required for a weekly meeting", undefined, 400);
    }

    const scheduleChanged = ["meeting_day", "schedule_type", "meeting_date", "effective_start_date", "start_time", "end_time"].some((field) => input[field] !== undefined);
    if (scheduleChanged) {
      const conflict = await detectMeetingConflict({
        meeting_day: input.meeting_day ?? existing.meeting_day,
        schedule_type: input.schedule_type ?? existing.schedule_type,
        meeting_date: input.meeting_date !== undefined ? input.meeting_date : existing.meeting_date,
        effective_start_date: input.effective_start_date !== undefined ? input.effective_start_date : existing.effective_start_date,
        start_time: startTime,
        end_time: endTime,
      }, meetingId);
      if (conflict.error) return createErrorResponse("CONFLICT_CHECK_001", "Could not verify meeting availability", undefined, 503);
      if (conflict.hasConflict) return createErrorResponse("MEET_001", `This time overlaps with a meeting for ${conflict.conflictWith}.`, undefined, 409);
    }

    const result = await updateMeeting(customerId, meetingId, input);
    if (!result.success) {
      return createErrorResponse("UPDATE_001", result.error || "Failed to update the schedule", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("UPDATE_002", "Invalid request", undefined, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const { meetingId } = body;

    if (!meetingId) {
      return createErrorResponse("VALIDATION_001", "meetingId is required", undefined, 400);
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 500);
    const { data: existing, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("status")
      .eq("id", meetingId)
      .eq("company_id", customerId)
      .maybeSingle();
    if (error || !existing) return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
    if (existing.status === "completed") {
      return createErrorResponse("MEETING_LOCKED_001", "Completed meetings cannot be deleted.", undefined, 409);
    }

    const result = await deleteMeeting(customerId, meetingId);
    if (!result.success) {
      return createErrorResponse("DELETE_001", result.error || "Failed to delete the schedule", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("DELETE_002", "Failed to delete the schedule", undefined, 500);
  }
}
