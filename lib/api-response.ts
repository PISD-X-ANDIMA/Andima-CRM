import { NextResponse } from "next/server";
import { ApiResponseError, ApiResponseSuccess } from "@/types/customer";

export const ERROR_CODES = {
  CUSTOMER_001: "Data customer wajib diisi",
  CUSTOMER_002: "Gagal menyimpan data customer",
  CUSTOMER_003: "Gagal menghapus customer",
  CUSTOMER_004: "Customer tidak dapat diakses",
  CONTACT_001: "Nama dan nomor telepon PIC wajib diisi",
  CONTACT_002: "PIC utama tidak valid atau dilarang menghapus PIC terakhir",
  CONTACT_003: "Gagal menyimpan contact PIC",
  CONTACT_004: "Gagal menghapus contact PIC",
  SEARCH_001: "Data tidak ditemukan",
  SEARCH_002: "Query pencarian gagal",
  EXPORT_001: "Gagal mengekspor data customer ke Excel",
  EXPORT_002: "Tidak ada data untuk diekspor",
  MEETING_001: "Hari meeting wajib diisi",
  MEETING_002: "Tipe jadwal harus berupa weekly atau one_day",
  MEETING_003: "Gagal menyimpan jadwal meeting",
  MEETING_004: "Gagal menghapus jadwal meeting",
  TASK_001: "Gagal membuka daftar task / job customer",
  TASK_002: "Job customer tidak ditemukan",
  DASHBOARD_001: "Modul dashboard gagal dimuat",
  DASHBOARD_002: "Anda tidak memiliki akses ke modul ini",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

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
      message: customMessage || ERROR_CODES[code] || "Terjadi kesalahan",
      errors,
    },
    { status }
  );
}
