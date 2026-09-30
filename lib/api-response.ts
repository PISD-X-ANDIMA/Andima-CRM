import { NextResponse } from "next/server";
import { ApiResponseError, ApiResponseSuccess } from "@/types/customer";

export const ERROR_CODES = {
  CUSTOMER_001: "Customer data is required",
  CUSTOMER_002: "Failed to save customer data",
  CUSTOMER_003: "Failed to delete customer",
  CUSTOMER_004: "You do not have access to this customer",
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
