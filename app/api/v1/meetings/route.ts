import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { detectMeetingConflict, createMeeting, validateMeetingScheduleDateAndSlot } from "@/lib/services/meeting-service";
import type { MeetingDay, ScheduleType } from "@/types/customer";

const weekdays: MeetingDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toScheduleType(value: unknown): ScheduleType | null {
  if (["weekly", "week", "recurring", "repeating"].includes(String(value).toLowerCase())) return "weekly";
  if (["one_day", "one-time", "one_time", "once", "single"].includes(String(value).toLowerCase())) return "one_day";
  return null;
}

function toMeetingType(value: unknown): "offline" | "online" | null {
  const type = String(value || "").toLowerCase();
  if (type === "offline" || type.includes("location")) return "offline";
  if (type === "online" || type.includes("link")) return "online";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyId = String(body.company_id || "").trim();
    const scheduleType = toScheduleType(body.frequency);
    const meetingType = toMeetingType(body.type);
    const date = String(body.date || body.meeting_date || body.effective_start_date || "").trim();
    let startTime = String(body.start_time || "").slice(0, 5);
    let endTime = String(body.end_time || "").slice(0, 5);
    if (body.slot && (!startTime || !endTime)) {
      const match = String(body.slot).match(/^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/);
      if (match) [, startTime, endTime] = match;
    }
    if (!companyId || !scheduleType || !meetingType || !date || !startTime || !endTime) {
      return createErrorResponse("VALIDATION_001", "company_id, topic, pic_name, rep_name, type, frequency, date, start_time, and end_time are required", undefined, 400);
    }
    const day = (body.meeting_day || weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]) as MeetingDay;
    if (!weekdays.includes(day)) return createErrorResponse("VALIDATION_001", "meeting_day is invalid", undefined, 400);
    const agenda = String(body.topic || body.agenda || "").trim();
    const picName = String(body.pic_name || "").trim();
    const representativeName = String(body.rep_name || body.representative_name || "").trim();
    if (!agenda || !picName || !representativeName) {
      return createErrorResponse("VALIDATION_001", "topic, pic_name, and rep_name are required", undefined, 400);
    }
    if (typeof body.notes === "string" && body.notes.length > 500) {
      return createErrorResponse("VALIDATION_001", "notes must be 500 characters or fewer", undefined, 400);
    }

    const locationOrLink = String(body.location_link || body.location || body.meeting_link || "").trim();
    if (!locationOrLink) return createErrorResponse("VALIDATION_001", "location_link is required", undefined, 400);
    const input = {
      meeting_day: day,
      schedule_type: scheduleType,
      meeting_date: scheduleType === "one_day" ? date : null,
      effective_start_date: scheduleType === "weekly" ? date : null,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      agenda,
      pic_name: picName,
      representative_name: representativeName,
      meeting_type: meetingType,
      location: meetingType === "offline" ? locationOrLink : null,
      meeting_link: meetingType === "online" ? locationOrLink : null,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
    };
    const scheduleError = validateMeetingScheduleDateAndSlot(input);
    if (scheduleError) return createErrorResponse("SCH_004", scheduleError, undefined, 400);

    const conflict = await detectMeetingConflict(input);
    if (conflict.error) return createErrorResponse("SCH_003", "Could not verify meeting availability", undefined, 503);
    if (conflict.hasConflict) return createErrorResponse("SCH_CLASH_001", `This time overlaps with a meeting for ${conflict.conflictWith}.`, undefined, 409);

    const result = await createMeeting(companyId, input);
    if (!result.success) return createErrorResponse("CREATE_001", result.error || "Failed to create the meeting", undefined, 500);
    return createSuccessResponse({ meetingId: result.meetingId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Invalid request", undefined, 400);
  }
}
