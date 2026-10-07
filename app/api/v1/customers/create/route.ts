import { NextRequest } from "next/server";
import { createCustomer } from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { isValidPicPhoneNumber } from "@/lib/validation/pic-phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { company_name, address, pic_full_name, pic_phone_number } = body;

    if (!company_name?.trim()) {
      return createErrorResponse("CUSTOMER_001", "Company name is required", undefined, 400);
    }
    if (!address?.trim()) {
      return createErrorResponse("CUSTOMER_001", "Address is required", undefined, 400);
    }
    if (!pic_full_name?.trim()) {
      return createErrorResponse("CUSTOMER_001", "PIC name is required", undefined, 400);
    }
    if (!pic_phone_number?.trim()) {
      return createErrorResponse("CUSTOMER_001", "PIC phone number is required", undefined, 400);
    }
    if (!isValidPicPhoneNumber(pic_phone_number)) {
      return createErrorResponse("CUSTOMER_002", "Use a PIC phone number beginning with 0 or +62", undefined, 400);
    }
    const result = await createCustomer({
      company_name,
      address,
      pic_full_name,
      pic_phone_number,
    });

    if (!result.success) {
      if (result.error?.includes("No login session")) {
        return createErrorResponse("AUTH_001", "Your profile session has expired. Please sign in again.", undefined, 401);
      }
      if (result.error?.includes("DUPLICATE_COMPANY")) {
        return createErrorResponse("CUSTOMER_003", "This company is already registered", undefined, 409);
      }
      return createErrorResponse("CUSTOMER_004", result.error || "Failed to save customer data", undefined, 500);
    }

    return createSuccessResponse({ companyId: result.companyId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Invalid request", undefined, 400);
  }
}
