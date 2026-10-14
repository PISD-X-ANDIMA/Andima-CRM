import { NextRequest, NextResponse } from 'next/server';
import { getCustomers } from '@/backend/record_conversation/conversationService';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserScope } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * GET /api/record-conversation/customers
 * Mengambil daftar akun pelanggan dari a1_company_list
 * untuk dropdown seleksi pelanggan pada modal atau form eksternal.
 * Mendukung filter scoping per sales executive (?assigned_to=NamaSales).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let assignedTo = searchParams.get('assigned_to') || searchParams.get('executiveId') || undefined;

    // Jika tidak dispesifikasikan di query param, periksa sesi login server
    if (!assignedTo) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const userScope = await getCurrentUserScope(supabase);
          if (userScope && !userScope.isManager) {
            assignedTo = userScope.name;
          }
        }
      } catch {
        // Fallback jika session server tidak tersedia
      }
    }

    const customers = await getCustomers(assignedTo);
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
