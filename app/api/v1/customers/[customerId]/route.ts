import { NextRequest } from "next/server";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";
import { isValidPicPhoneNumber } from "@/lib/validation/pic-phone";
import { describeSupabaseError } from "@/lib/supabase/errors";

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
  } catch (error) {
    console.error("[GET /api/v1/customers/:customerId]", error);
    return createErrorResponse("GET_001", `Failed to load company data: ${describeSupabaseError(error)}`, undefined, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    const input = {
      ...body,
      pic_full_name: body.pic_name ?? body.pic_full_name,
      pic_phone_number: body.pic_number ?? body.pic_phone_number,
    };

    for (const field of ["company_name", "address", "pic_full_name", "pic_phone_number"] as const) {
      if (input[field] !== undefined && (typeof input[field] !== "string" || !input[field].trim())) {
        return createErrorResponse("CUSTOMER_001", "All company, address, and PIC fields are required", undefined, 400);
      }
    }

    if (input.pic_phone_number !== undefined && (typeof input.pic_phone_number !== "string" || !isValidPicPhoneNumber(input.pic_phone_number))) {
      return createErrorResponse("CUSTOMER_002", "Use a PIC phone number beginning with 0 or +62", undefined, 400);
    }

    const result = await updateCustomer(customerId, input);
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

/** PUT alias retained for the published A1 customer CRUD contract. */
export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
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
