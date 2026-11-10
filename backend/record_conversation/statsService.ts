import { supabase } from './supabaseClient';
import { DashboardStats } from './types';

/**
 * Mengambil ringkasan statistik untuk kartu metrik atas pada Record Conversation page:
 * 1. Total Pelanggan yang Dikelola (dari a1_company_list)
 * 2. Rapat Mendatang (dari a2_record_conversations berjenis Meeting)
 * 3. Kendala Lapangan Aktif (dari a2_worksheets berstatus kendala_terdeteksi)
 */
export async function getDashboardStats(visibleCompanyIds?: string[] | null): Promise<DashboardStats> {
  if (Array.isArray(visibleCompanyIds) && visibleCompanyIds.length === 0) {
    return {
      totalManagedCustomers: 0,
      managedCustomersGrowth: '0',
      upcomingMeetingsCount: 0,
      upcomingMeetingNote: 'Tidak ada data',
      activeFieldIssuesCount: 0,
      activeFieldIssuesNote: 'Tidak ada data',
    };
  }
  try {
    let companyQuery = supabase.from('a1_company_list').select('company_list_id', { count: 'exact', head: true }).is('deleted_at', null);
    let meetingQuery = supabase.from('a2_record_conversations').select('id', { count: 'exact', head: true }).eq('channel_type', 'Meeting');
    let issueQuery = supabase.from('a2_worksheets').select('worksheet_id', { count: 'exact', head: true }).or('status_kendala.eq.kendala_terdeteksi,has_issue.eq.true');

    if (Array.isArray(visibleCompanyIds)) {
      companyQuery = companyQuery.in('company_list_id', visibleCompanyIds);
      meetingQuery = meetingQuery.in('customer_id', visibleCompanyIds);
      issueQuery = issueQuery.in('customer_id', visibleCompanyIds);
    }

    const [companyRes, meetingRes, issueRes] = await Promise.all([companyQuery, meetingQuery, issueQuery]);

    const totalCustomers = companyRes.count ?? 0;
    const meetingCount = meetingRes.count ?? 0;
    const issueCount = issueRes.count ?? 0;

    return {
      totalManagedCustomers: totalCustomers,
      managedCustomersGrowth: '+0',
      upcomingMeetingsCount: meetingCount,
      upcomingMeetingNote: meetingCount > 0 ? `${meetingCount} percakapan meeting tercatat` : 'Belum ada meeting',
      activeFieldIssuesCount: issueCount,
      activeFieldIssuesNote: issueCount > 0 ? `${issueCount} kendala memerlukan penanganan` : 'Tidak ada kendala aktif',
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalManagedCustomers: 0,
      managedCustomersGrowth: '0',
      upcomingMeetingsCount: 0,
      upcomingMeetingNote: 'Tidak ada data',
      activeFieldIssuesCount: 0,
      activeFieldIssuesNote: 'Tidak ada data',
    };
  }
}
