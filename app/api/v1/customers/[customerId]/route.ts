import { NextRequest } from "next/server";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return createErrorResponse("NOT_FOUND_001", "Customer tidak ditemukan", undefined, 404);
    }
    return createSuccessResponse(customer);
  } catch {
    return createErrorResponse("GET_001", "Gagal mengambil data customer", undefined, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();

    const result = await updateCustomer(customerId, body);
    if (!result.success) {
      return createErrorResponse("UPDATE_001", result.error || "Gagal mengupdate customer", undefined, 500);
    }
    return createSuccessResponse({ customerId });
  } catch {
    return createErrorResponse("UPDATE_002", "Request tidak valid", undefined, 400);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const result = await deleteCustomer(customerId);
    if (!result.success) {
      return createErrorResponse("DELETE_001", result.error || "Gagal menghapus customer", undefined, 500);
    }
    return createSuccessResponse({ customerId });
  } catch {
    return createErrorResponse("DELETE_002", "Gagal menghapus customer", undefined, 500);
  }
}
