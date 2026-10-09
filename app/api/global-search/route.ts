import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ success: true, results: { jobs: [], customers: [], conversations: [] } });
    }

    const pattern = `%${query}%`;

    // 1. Search in a2_worksheets / jobs
    const jobsPromise = supabase
      .from('a2_worksheets')
      .select('id, job_number, task_title, customer, status, pic_name')
      .or(`job_number.ilike.${pattern},customer.ilike.${pattern},task_title.ilike.${pattern},pic_name.ilike.${pattern}`)
      .limit(5);

    // 2. Search in a2_record_conversations
    const convPromise = supabase
      .from('a2_record_conversations')
      .select('id, conversation_id, job_number, channel_type, sales_pic_name, summary')
      .or(`conversation_id.ilike.${pattern},job_number.ilike.${pattern},sales_pic_name.ilike.${pattern},summary.ilike.${pattern}`)
      .limit(5);

    // 3. Search in a1_customers
    const custPromise = supabase
      .from('a1_customers')
      .select('id, customer_name, customer_code, city')
      .or(`customer_name.ilike.${pattern},customer_code.ilike.${pattern}`)
      .limit(5);

    const [jobsRes, convRes, custRes] = await Promise.allSettled([jobsPromise, convPromise, custPromise]);

    const jobs = jobsRes.status === 'fulfilled' && jobsRes.value.data ? jobsRes.value.data : [];
    const conversations = convRes.status === 'fulfilled' && convRes.value.data ? convRes.value.data : [];
    const customers = custRes.status === 'fulfilled' && custRes.value.data ? custRes.value.data : [];

    return NextResponse.json({
      success: true,
      query,
      results: {
        jobs,
        conversations,
        customers
      }
    });
  } catch (error: any) {
    console.error('Global search error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
