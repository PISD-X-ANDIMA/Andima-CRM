import { NextRequest } from "next/server";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { isValidPicPhoneNumber } from "@/lib/validation/pic-phone";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return createErrorResponse("NOT_FOUND_001", "Customer not found", undefined, 404);
    }
    return createSuccessResponse(customer);
  } catch {
    return createErrorResponse("GET_001", "Failed to load customer data", undefined, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();

    for (const field of ["company_name", "address", "pic_full_name", "pic_phone_number"] as const) {
      if (body[field] !== undefined && (typeof body[field] !== "string" || !body[field].trim())) {
        return createErrorResponse("CUSTOMER_001", "All company, address, and PIC fields are required", undefined, 400);
      }
    }

    if (body.pic_phone_number !== undefined && (typeof body.pic_phone_number !== "string" || !isValidPicPhoneNumber(body.pic_phone_number))) {
      return createErrorResponse("CUSTOMER_002", "Use a PIC phone number beginning with 0 or +62", undefined, 400);
    }

    const result = await updateCustomer(customerId, body);
    if (!result.success) {
      if (result.error?.includes("No login session")) {
        return createErrorResponse("AUTH_001", "Your profile session has expired. Please sign in again.", undefined, 401);
      }
      if (result.error?.includes("DUPLICATE_COMPANY")) {
        return createErrorResponse("CUSTOMER_003", "This company is already registered", undefined, 409);
      }
      return createErrorResponse("CUSTOMER_004", result.error || "Failed to save customer data", undefined, 500);
    }
    return createSuccessResponse({ customerId });
  } catch {
    return createErrorResponse("UPDATE_002", "Invalid request", undefined, 400);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const result = await deleteCustomer(customerId);
    if (!result.success) {
      return createErrorResponse("DELETE_001", result.error || "Failed to delete the customer", undefined, 500);
    }
    return createSuccessResponse({ customerId });
  } catch {
    return createErrorResponse("DELETE_002", "Failed to delete the customer", undefined, 500);
  }
}
