import { NextRequest } from "next/server";
import { createCustomer } from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { company_name, address, pic_full_name } = body;

    if (!company_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Company name is required", undefined, 400);
    }
    if (!address?.trim()) {
      return createErrorResponse("VALIDATION_001", "Address is required", undefined, 400);
    }
    if (!pic_full_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "PIC name is required", undefined, 400);
    }
    const result = await createCustomer({
      company_name,
      address,
      pic_full_name,
    });

    if (!result.success) {
      if (result.error?.includes("DUPLICATE_COMPANY")) {
        return createErrorResponse("DUPLICATE_001", "This company is already registered", undefined, 409);
      }
      return createErrorResponse("CREATE_001", result.error || "Failed to create the customer", undefined, 500);
    }

    return createSuccessResponse({ companyId: result.companyId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Invalid request", undefined, 400);
  }
}
