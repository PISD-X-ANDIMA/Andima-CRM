import { NextResponse } from "next/server";
import { ApiResponseError, ApiResponseSuccess } from "@/types/customer";

export const ERROR_CODES = {
  NAV_001: "Failed to load navigation menu",
  AUTH_001: "Authentication is required or the session has expired.",
  AUTH_004: "Profile session expired. Please sign in again.",
  STAT_001: "Statistical data unavailable",
  SCH_001: "Failed to fetch weekly schedule",
  SCH_002: "Meeting schedule data is invalid or incomplete",
  SCH_003: "Could not verify meeting availability",
  SCH_CLASH_001: "Meeting schedule overlaps another meeting for this representative",
  SRCH_001: "No customer or PIC found",
  SRCH_002: "The customer or transaction search failed",
  LIST_001: "Failed to load the customer list",
  CAL_001: "Schedule data is unavailable for this period",
  MEET_001: "Meeting schedule overlap",
  INT_001: "Record Conversation module is unavailable",
  CUSTOMER_001: "Customer data is incomplete",
  CUSTOMER_002: "PIC phone number format is invalid",
  CUSTOMER_003: "Company name is already registered",
  CUSTOMER_004: "Customer data could not be saved",
  CONTACT_001: "PIC name and phone number are required",
  CONTACT_002: "The primary PIC is invalid or the last contact cannot be deleted",
  CONTACT_003: "Failed to save the PIC contact",
  CONTACT_004: "Failed to delete the PIC contact",
  SEARCH_001: "No data found",
  SEARCH_002: "The search query failed",
  EXPORT_001: "Failed to export customer data to Excel",
  EXPORT_002: "There is no data to export",
  MEETING_001: "The meeting day is required",
  MEETING_002: "Schedule type must be weekly or one_day",
  MEETING_003: "Failed to save the meeting schedule",
  MEETING_004: "Failed to delete the meeting schedule",
  TASK_001: "Failed to load the customer task/job list",
  TASK_002: "Customer job not found",
  DASHBOARD_001: "Failed to load the dashboard module",
  DASHBOARD_002: "You do not have access to this module",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES | string;

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponseSuccess<T>["meta"],
  status = 200
): NextResponse<ApiResponseSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  errors?: Record<string, string[]>,
  status = 400
): NextResponse<ApiResponseError> {
  return NextResponse.json(
    {
      success: false,
      code,
      message: customMessage || (ERROR_CODES as Record<string, string>)[code] || "An error occurred",
      errors,
    },
    { status }
  );
}
