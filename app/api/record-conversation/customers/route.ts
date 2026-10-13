import { NextResponse } from 'next/server';
import { getCustomers } from '@/backend/record_conversation/conversationService';

/**
 * GET /api/record-conversation/customers
 * Mengambil daftar seluruh akun pelanggan dari a1_company_list
 * untuk dropdown seleksi pelanggan pada modal atau form eksternal.
 */
export async function GET() {
  try {
    const customers = await getCustomers();
    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    console.error('Error in GET /api/record-conversation/customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
