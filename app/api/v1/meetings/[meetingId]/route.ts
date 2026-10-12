import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  updateMeeting,
  deleteMeeting,
  detectMeetingConflict,
  validateMeetingScheduleDateAndSlot,
} from "@/lib/services/meeting-service";

interface RouteContext {
  params: Promise<{ meetingId: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { meetingId } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

    const { data: meeting, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("*, a1_company_list(company_name, pic_phone_number, address)")
      .eq("id", meetingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !meeting) {
      return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
    }

    return createSuccessResponse({
      id: meeting.id,
      company_id: meeting.company_id,
      company_name: meeting.a1_company_list?.company_name || null,
      meeting_day: meeting.meeting_day,
      schedule_type: meeting.schedule_type,
      meeting_date: meeting.meeting_date,
      effective_start_date: meeting.effective_start_date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      agenda: meeting.agenda,
      topic: meeting.agenda,
      pic_name: meeting.pic_name,
      representative_name: meeting.representative_name,
      rep_name: meeting.representative_name,
      meeting_type: meeting.meeting_type,
      type: meeting.meeting_type,
      location: meeting.location,
      meeting_link: meeting.meeting_link,
      location_link: meeting.location || meeting.meeting_link,
      notes: meeting.notes,
      status: meeting.status,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at,
    });
  } catch {
    return createErrorResponse("CAL_001", "Failed to load meeting details", undefined, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { meetingId } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return createErrorResponse("UPDATE_002", "Invalid request body", undefined, 400);
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

    const { data: existing, error: existingError } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("company_id, status, meeting_type, location, meeting_link, start_time, end_time, schedule_type, meeting_day, meeting_date, effective_start_date, representative_name")
      .eq("id", meetingId)
      .maybeSingle();

    if (existingError || !existing) return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
    if (existing.status === "completed") {
      return createErrorResponse("MEETING_LOCKED_001", "Completed meetings cannot be edited or have their status changed.", undefined, 409);
    }

    const input: Record<string, any> = { ...body };
    if (body.topic && !body.agenda) input.agenda = body.topic;
    if (body.rep_name && !body.representative_name) input.representative_name = body.rep_name;
    if (body.type && !body.meeting_type) input.meeting_type = body.type;
    if (body.frequency && !body.schedule_type) {
      input.schedule_type = ["weekly", "recurring"].includes(String(body.frequency).toLowerCase()) ? "weekly" : "one_day";
    }

    const startTime = input.start_time ?? existing.start_time;
    const endTime = input.end_time ?? existing.end_time;
    if (startTime && endTime && endTime <= startTime) {
      return createErrorResponse("VALIDATION_001", "End time must be after start time", undefined, 400);
    }

    const scheduleChanged = ["meeting_day", "schedule_type", "meeting_date", "effective_start_date", "start_time", "end_time", "representative_name"].some((field) => input[field] !== undefined);
    if (scheduleChanged) {
      const scheduleError = validateMeetingScheduleDateAndSlot({
        meeting_day: input.meeting_day ?? existing.meeting_day,
        schedule_type: input.schedule_type ?? existing.schedule_type,
        meeting_date: input.meeting_date !== undefined ? input.meeting_date : existing.meeting_date,
        effective_start_date: input.effective_start_date !== undefined ? input.effective_start_date : existing.effective_start_date,
        start_time: startTime,
        end_time: endTime,
      });
      if (scheduleError) return createErrorResponse("SCH_004", scheduleError, undefined, 400);

      const conflict = await detectMeetingConflict({
        meeting_day: input.meeting_day ?? existing.meeting_day,
        schedule_type: input.schedule_type ?? existing.schedule_type,
        meeting_date: input.meeting_date !== undefined ? input.meeting_date : existing.meeting_date,
        effective_start_date: input.effective_start_date !== undefined ? input.effective_start_date : existing.effective_start_date,
        start_time: startTime,
        end_time: endTime,
        representative_name: input.representative_name ?? existing.representative_name,
      }, meetingId);
      if (conflict.error) return createErrorResponse("SCH_003", "Could not verify meeting availability", undefined, 503);
      if (conflict.hasConflict) return createErrorResponse("MEET_001", `This time overlaps with a meeting for ${conflict.conflictWith}.`, undefined, 409);
    }

    const result = await updateMeeting(existing.company_id, meetingId, input);
    if (!result.success) {
      return createErrorResponse("UPDATE_001", result.error || "Failed to update the schedule", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("UPDATE_002", "Invalid request", undefined, 400);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { meetingId } = await params;
    const supabase = await createServerSupabaseClient();
    if (!supabase) return createErrorResponse("DATABASE_001", "Database client unavailable", undefined, 503);

    const { data: existing, error } = await (supabase as any)
      .from("a1_customer_meetings")
      .select("company_id, status")
      .eq("id", meetingId)
      .maybeSingle();

    if (error || !existing) return createErrorResponse("NOT_FOUND_001", "Meeting not found", undefined, 404);
    if (existing.status === "completed") {
      return createErrorResponse("MEETING_LOCKED_001", "Completed meetings cannot be deleted.", undefined, 409);
    }

    const result = await deleteMeeting(existing.company_id, meetingId);
    if (!result.success) {
      return createErrorResponse("DELETE_001", result.error || "Failed to delete the schedule", undefined, 500);
    }

    return createSuccessResponse({ meetingId });
  } catch {
    return createErrorResponse("DELETE_002", "Failed to delete the schedule", undefined, 500);
  }
}
