import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-response";
import { getCustomers } from "@/lib/services/customer-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return createErrorResponse("CAL_001", "month must use YYYY-MM format", undefined, 400);
  try {
    const meetings = [] as { company_id: string; company_name: string; meeting_id: string; date: string; day: string; start_time: string; end_time: string; status: string }[];
    const firstDay = new Date(`${month}-01T00:00:00Z`);
    const daysInMonth = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0)).getUTCDate();
    let page = 1;
    let totalPages = 1;
    do {
      const result = await getCustomers({ page, perPage: 100, requireMeetings: true });
      for (const customer of result.customers) {
        for (const meeting of customer.meetings || []) {
          if (meeting.status === "cancelled") continue;
          const dates: string[] = [];
          if (meeting.scheduleType === "one_day") {
            if (meeting.meetingDate?.startsWith(`${month}-`)) dates.push(meeting.meetingDate);
          } else {
            for (let day = 1; day <= daysInMonth; day += 1) {
              const date = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), day));
              const key = date.toISOString().slice(0, 10);
              if (date.getUTCDay() === ({ sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 } as const)[meeting.meetingDay]
                && key >= (meeting.effectiveStartDate || "0000-00-00")) dates.push(key);
            }
          }
          for (const date of dates) meetings.push({ company_id: customer.id, company_name: customer.companyName, meeting_id: meeting.id, date, day: meeting.meetingDay, start_time: meeting.startTime, end_time: meeting.endTime, status: meeting.status || "scheduled" });
        }
      }
      totalPages = result.totalPages;
      page += 1;
    } while (page <= totalPages);
    return createSuccessResponse({ month, meetings });
  } catch {
    return createErrorResponse("CAL_001", "Failed to load the meeting calendar", undefined, 500);
  }
}
