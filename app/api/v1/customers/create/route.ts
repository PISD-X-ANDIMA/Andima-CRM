import { NextRequest } from "next/server";
import { createCustomer } from "@/lib/services/customer-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { company_name, address, pic_full_name, pic_phone_number, pic_position, pic_email } = body;

    if (!company_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Nama perusahaan wajib diisi", undefined, 400);
    }
    if (!address?.trim()) {
      return createErrorResponse("VALIDATION_001", "Alamat wajib diisi", undefined, 400);
    }
    if (!pic_full_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Nama PIC wajib diisi", undefined, 400);
    }
    if (!pic_phone_number?.trim()) {
      return createErrorResponse("VALIDATION_001", "Nomor telepon PIC wajib diisi", undefined, 400);
    }

    const result = await createCustomer({
      company_name,
      address,
      pic_full_name,
      pic_phone_number,
      pic_position,
      pic_email,
    });

    if (!result.success) {
      if (result.error?.includes("DUPLICATE_COMPANY")) {
        return createErrorResponse("DUPLICATE_001", "Nama perusahaan sudah terdaftar", undefined, 409);
      }
      return createErrorResponse("CREATE_001", result.error || "Gagal membuat customer", undefined, 500);
    }

    return createSuccessResponse({ companyId: result.companyId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Request tidak valid", undefined, 400);
  }
}
