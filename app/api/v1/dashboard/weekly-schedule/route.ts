import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCustomers } from "@/lib/services/customer-service";
import { describeSupabaseError } from "@/lib/supabase/errors";
import type { MeetingDay } from "@/types/customer";

export const dynamic = "force-dynamic";

function describeError(error: unknown): string {
  return describeSupabaseError(error);
}

const dayIndex: Record<MeetingDay, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const startDate = params.get("start_date") || "";
  const endDate = params.get("end_date") || "";
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) {
    return createErrorResponse("SCH_001", "start_date and end_date must be valid YYYY-MM-DD dates", undefined, 400);
  }
  const dayCount = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
  if (dayCount > 31) return createErrorResponse("SCH_001", "The schedule range cannot exceed 31 days", undefined, 400);
  try {
    const allCustomers = [] as Awaited<ReturnType<typeof getCustomers>>["customers"];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await getCustomers({ page, perPage: 100, requireMeetings: true });
      allCustomers.push(...result.customers);
      totalPages = result.totalPages;
      page += 1;
    } while (page <= totalPages);

    const schedule = allCustomers.flatMap((customer) => (customer.meetings || []).flatMap((meeting) => {
      if (meeting.status !== "scheduled") return [];
      const dates: string[] = [];
      if (meeting.scheduleType === "one_day") {
        if (meeting.meetingDate && meeting.meetingDate >= startDate && meeting.meetingDate <= endDate) dates.push(meeting.meetingDate);
      } else {
        for (let offset = 0; offset < dayCount; offset += 1) {
          const date = new Date(`${startDate}T12:00:00Z`);
          date.setUTCDate(date.getUTCDate() + offset);
          const key = date.toISOString().slice(0, 10);
          if (dayIndex[meeting.meetingDay] === date.getUTCDay() && key >= (meeting.effectiveStartDate || startDate)) dates.push(key);
        }
      }
      return dates.map((date) => ({
        company_id: customer.id,
        company_name: customer.companyName,
        meeting_id: meeting.id,
        date,
        start_time: meeting.startTime,
        end_time: meeting.endTime,
        topic: meeting.agenda,
        status: meeting.status,
      }));
    })).sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || "").localeCompare(b.start_time || ""));
    return createSuccessResponse(schedule, { start_date: startDate, end_date: endDate, total: schedule.length });
  } catch (error) {
    const detail = describeError(error);
    console.error("[GET /api/v1/dashboard/weekly-schedule]", error);
    const invalidSession = /invalid refresh token|refresh token not found|authentication is required/i.test(detail);
    return createErrorResponse(
      invalidSession ? "AUTH_001" : "SCH_001",
      invalidSession
        ? `Your login session is invalid or expired. Please sign in again. (${detail})`
        : `Failed to load weekly schedule: ${detail}`,
      undefined,
      invalidSession ? 401 : 500,
    );
  }
}
