import { NextResponse } from 'next/server';
import { getCustomers } from '@/backend/record_conversation/conversationService';
import { getCompanyScope } from '@/lib/services/access-scope';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/record-conversation/customers
 * Mengambil daftar seluruh akun pelanggan dari a1_company_list
 * untuk dropdown seleksi pelanggan pada modal atau form eksternal.
 */
export async function GET() {
  try {
    const scope = await getCompanyScope();
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Please sign in to continue.' }, { status: 401 });
    }

    const dbClient = createAdminSupabaseClient() || (await createServerSupabaseClient()) || undefined;
    const customers = await getCustomers(
      scope.isManager || scope.companyIds.length === 0 ? null : scope.companyIds,
      dbClient
    );
    const response = NextResponse.json({
      success: true,
      data: customers,
    });
    response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
    return response;
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
