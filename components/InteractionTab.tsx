'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Calendar, AlertTriangle, ChevronDown, ChevronRight, Plus, TrendingUp,
  MapPin, Camera, CheckSquare, Edit3, Image as Img, Map, X, UploadCloud,
  Video, MessageCircle, AlertCircle, Briefcase, Truck, Clock, Box, Image, 
  FileText, User, Check, Info, Download, CircleDot, Circle, Flag, Send,
  Loader2
} from 'lucide-react';
import {
  fetchApiCustomers,
  fetchApiConversations,
  createApiConversation,
  fetchApiWorksheets,
  fetchApiWorksheetDetail,
  fetchApiStats,
  uploadApiFile,
  CompanyItem,
  RecordConversationItem,
  WorksheetItem,
  DashboardStats
} from '../backend/record_conversation';

const colorMap: Record<string, string> = {
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
};

const dotColorMap: Record<string, string> = {
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
  orange: 'bg-orange-500',
};

const Badge = ({ t, c, dot, icon: I }: any) => {
  if (t === '—') return <span className="text-slate-400 font-bold">{t}</span>;
  const colorClass = colorMap[c] || 'bg-slate-50 text-slate-700 border-slate-200';
  const dotClass = dotColorMap[c] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colorClass} border`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
      {I && <I size={12} />}
      {t}
    </span>
  );
};

const SectionTitle = ({ icon: I, title, right }: any) => (
  <div className="flex justify-between items-center mb-3 mt-8 first:mt-0">
    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
      <I size={16} className="text-blue-600" /> {title}
    </div>
    {right && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{right}</div>}
  </div>
);

const BoxRow = ({ label, value, blue }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-semibold text-slate-400">{label}</span>
    <span className={`text-sm font-extrabold ${blue ? 'text-blue-600' : 'text-slate-900'}`}>{value}</span>
  </div>
);

const GridItem = ({ label, value }: any) => (
  <div>
    <div className="text-xs font-semibold text-slate-400 mb-1">{label}</div>
    <div className="text-sm font-extrabold text-slate-900">{value}</div>
  </div>
);

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '20 Sep 2026, 10:30';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
  } catch {
    return dateStr;
  }
}

export default function InteractionTab() {
  // Panel state: null | 'REC' | 'AGT' | 'VIEW'
  const [panel, setPanel] = useState<'REC' | 'AGT' | 'VIEW' | null>(null);

  // Dynamic data states from Supabase
  const [stats, setStats] = useState<DashboardStats>({
    totalManagedCustomers: 24,
    managedCustomersGrowth: '+3',
    upcomingMeetingsCount: 3,
    upcomingMeetingNote: 'Hari ini 14:00 WIB dengan DSV Transport',
    activeFieldIssuesCount: 1,
    activeFieldIssuesNote: 'Memerlukan verifikasi di Gerbang 3 Priok',
  });
  const [conversations, setConversations] = useState<RecordConversationItem[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
  const [customerList, setCustomerList] = useState<CompanyItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingWorksheets, setLoadingWorksheets] = useState<boolean>(true);

  // Pagination states (8 items per page)
  const [convPage, setConvPage] = useState<number>(1);
  const [convTotal, setConvTotal] = useState<number>(0);
  const [convTotalPages, setConvTotalPages] = useState<number>(1);

  const [wsPage, setWsPage] = useState<number>(1);
  const [wsTotal, setWsTotal] = useState<number>(0);
  const [wsTotalPages, setWsTotalPages] = useState<number>(1);

  // Slide-over detail states
  const [activeWorksheet, setActiveWorksheet] = useState<WorksheetItem | null>(null);
  const [loadingWorksheetDetail, setLoadingWorksheetDetail] = useState<boolean>(false);
  const [activeConversation, setActiveConversation] = useState<RecordConversationItem | null>(null);

  // Filter states
  const [channelFilter, setChannelFilter] = useState<string>('All Channels');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  // Record Conversation Modal Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [channelType, setChannelType] = useState<'WhatsApp' | 'Meeting'>('WhatsApp');
  const [summaryText, setSummaryText] = useState<string>('');
  const [needAssistance, setNeedAssistance] = useState<boolean>(true);
  const [urgencyLevel, setUrgencyLevel] = useState<'high_priority' | 'average'>('high_priority');
  const [uploadedFile, setUploadedFile] = useState<{
    file_name: string;
    file_type: string;
    file_url: string;
    file_size_kb: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load initial static data (Stats & Customers)
  useEffect(() => {
    async function loadInitial() {
      try {
        const [statsData, custData] = await Promise.all([
          fetchApiStats(),
          fetchApiCustomers(),
        ]);
        setStats(statsData);
        setCustomerList(custData);
        if (custData.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custData[0].company_list_id);
        }
      } catch (err) {
        console.error('Failed to load initial stats & customers:', err);
      }
    }
    loadInitial();
  }, []);

  // Fetch worksheets when wsPage changes (8 items per page)
  useEffect(() => {
    async function fetchPagedWorksheets() {
      setLoadingWorksheets(true);
      try {
        const wsRes = await fetchApiWorksheets({ page: wsPage, limit: 8 });
        setWorksheets(wsRes.data);
        setWsTotal(wsRes.total);
        setWsTotalPages(wsRes.totalPages);
      } catch (err) {
        console.error('Failed to load worksheets:', err);
      } finally {
        setLoadingWorksheets(false);
      }
    }
    fetchPagedWorksheets();
  }, [wsPage]);

  // Fetch conversations whenever filters or convPage change (8 items per page)
  useEffect(() => {
    async function fetchFilteredConversations() {
      setLoadingConversations(true);
      try {
        const convRes = await fetchApiConversations({
          channelType: channelFilter,
          status: statusFilter,
          page: convPage,
          limit: 8,
        });
        setConversations(convRes.data);
        setConvTotal(convRes.total);
        setConvTotalPages(convRes.totalPages);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    }
    fetchFilteredConversations();
  }, [channelFilter, statusFilter, convPage]);

  // Open worksheet detail slide-over
  const handleOpenWorksheet = async (wsId: number) => {
    setPanel('AGT');
    setLoadingWorksheetDetail(true);
    try {
      const detail = await fetchApiWorksheetDetail(wsId);
      setActiveWorksheet(detail);
    } catch (err) {
      console.error('Error opening worksheet detail:', err);
    } finally {
      setLoadingWorksheetDetail(false);
    }
  };

  // Open conversation detail slide-over
  const handleOpenConversation = (conv: RecordConversationItem) => {
    setActiveConversation(conv);
    setPanel('VIEW');
  };

  // Handle simulated file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadApiFile(file);
      if (res.success && res.data) {
        setUploadedFile(res.data);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle modal submit
  const handleSubmitConversation = async () => {
    if (!selectedCustomerId) {
      alert('Pilih akun pelanggan terlebih dahulu.');
      return;
    }
    if (!summaryText.trim()) {
      alert('Harap isi kesimpulan percakapan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCustomer = customerList.find(c => c.company_list_id === selectedCustomerId);
      const res = await createApiConversation({
        customer_id: selectedCustomerId,
        customer_code: targetCustomer?.customer_code || undefined,
        job_number: targetCustomer?.job_number || undefined,
        channel_type: channelType,
        summary: summaryText,
        need_assistance: needAssistance,
        urgency_level: urgencyLevel,
        synced_to_ctrack: true,
        uploaded_file: uploadedFile,
      });

      if (res.success) {
        // Reset form
        setSummaryText('');
        setUploadedFile(null);
        setPanel(null);

        // Refresh page 1 of conversations & stats
        setConvPage(1);
        const [convRes, newStats] = await Promise.all([
          fetchApiConversations({ channelType: channelFilter, status: statusFilter, page: 1, limit: 8 }),
          fetchApiStats(),
        ]);
        setConversations(convRes.data);
        setConvTotal(convRes.total);
        setConvTotalPages(convRes.totalPages);
        setStats(newStats);
      } else {
        alert(`Gagal menyimpan percakapan: ${res.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full pb-20">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { 
            t: 'Total Pelanggan yang Dikelola', 
            v: `${stats.totalManagedCustomers} Akun`, 
            i: Building2, 
            d: stats.managedCustomersGrowth, 
            d_txt: 'kerja aktif bulan ini', 
            d_i: TrendingUp, 
            c: 'blue' 
          },
          { 
            t: 'Rapat Mendatang', 
            v: `${stats.upcomingMeetingsCount} Jadwal`, 
            i: Calendar, 
            d: 'Hari ini 14:00 WIB', 
            d_txt: 'dengan DSV Transport', 
            d_i: Calendar, 
            c: 'slate' 
          },
          { 
            t: 'Kendala Lapangan Aktif', 
            v: `${stats.activeFieldIssuesCount} Kendala`, 
            i: AlertTriangle, 
            d: 'Memerlukan verifikasi', 
            d_txt: 'di Gerbang 3 Priok', 
            d_i: MapPin, 
            c: 'red', 
            badge: stats.activeFieldIssuesCount > 0 ? 'Kritis' : undefined 
          }
        ].map(s => (
          <div key={s.t} className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-semibold text-slate-500 leading-snug max-w-[72%]">{s.t}</span>
              <div className={`w-6 h-6 rounded-md ${s.c === 'red' ? 'bg-red-50 text-red-600' : s.c === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'} flex items-center justify-center shrink-0`}>
                <s.i size={13} />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1.5">
              <div className="text-xl font-extrabold text-slate-900 leading-none">{s.v}</div>
              {s.badge && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold mb-0.5">{s.badge}</span>}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <span className={`flex items-center gap-0.5 font-bold ${s.c === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
                {s.c !== 'slate' && <s.d_i size={11} />} {s.d}
              </span>
              {s.d_txt}
            </div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-2">
          {/* Channel Type Filter */}
          <div className="relative">
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setConvPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 pr-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-colors appearance-none cursor-pointer outline-none"
            >
              <option value="All Channels">Channel Type: All Channels</option>
              <option value="WhatsApp">Channel Type: WhatsApp</option>
              <option value="Meeting">Channel Type: Meeting</option>
            </select>
            <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Today Indicator */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs transition-colors">
            <Calendar size={12} className="text-slate-500" />
            <span className="font-bold text-slate-700">Today ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setConvPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 pr-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-colors appearance-none cursor-pointer outline-none"
            >
              <option value="All Statuses">Status: All Statuses</option>
              <option value="Active">Status: Active</option>
              <option value="Archived">Status: Archived</option>
            </select>
            <ChevronDown size={12} className="text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <button 
          onClick={() => {
            if (customerList.length > 0 && !selectedCustomerId) {
              setSelectedCustomerId(customerList[0].company_list_id);
            }
            setPanel('REC');
          }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} /> Record Conversation
        </button>
      </div>

      {/* CONVERSATION TABLE */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Conversation</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="border-b border-slate-200">
                <tr>
                  {['PELANGGAN', 'SUMBER', 'TANGGAL', 'BUTUH ASISTEN', 'PRIORITAS', 'AKSI'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h !== 'PELANGGAN' && 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingConversations ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                      <Loader2 size={16} className="animate-spin inline mr-2 text-blue-500" />
                      Memuat data percakapan...
                    </td>
                  </tr>
                ) : conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada percakapan tercatat.
                    </td>
                  </tr>
                ) : (
                  conversations.map(r => {
                    const isMeeting = r.channel_type === 'Meeting';
                    const srcColor = isMeeting ? 'purple' : 'emerald';
                    const astColor = r.need_assistance ? 'red' : 'slate';
                    const astText = r.need_assistance ? 'Yes' : 'No';

                    let prioText = '—';
                    let prioColor = 'slate';
                    let PrioIcon: any = null;
                    if (r.urgency_level === 'high_priority' || r.urgency_level === 'critical') {
                      prioText = 'High';
                      prioColor = 'red';
                      PrioIcon = AlertCircle;
                    } else if (r.urgency_level === 'average') {
                      prioText = 'Average';
                      prioColor = 'orange';
                      PrioIcon = Flag;
                    }

                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-xs text-slate-900">{r.company_name}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Acc: {r.customer_code}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge t={r.channel_type} c={srcColor} icon={isMeeting ? Video : MessageCircle} />
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                          {formatDate(r.conversation_date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge t={astText} c={astColor} dot />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge t={prioText} c={prioColor} icon={PrioIcon} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleOpenConversation(r)} 
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar (Identical to FollowUpTab) */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-xl">
            <div className="text-xs font-medium text-slate-500">
              Showing {convTotal === 0 ? 0 : (convPage - 1) * 8 + 1}–{Math.min(convPage * 8, convTotal)} of <span className="font-bold text-slate-700">{convTotal}</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <button 
                disabled={convPage <= 1}
                onClick={() => setConvPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} className="rotate-180 text-slate-600" />
              </button>
              {Array.from({ length: convTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setConvPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    p === convPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button 
                disabled={convPage >= convTotalPages}
                onClick={() => setConvPage(p => Math.min(convTotalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSHEETS TABLE */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Field Agent Tasks & Worksheets <span className="font-normal text-slate-400">(Job Reference Tracing)</span>
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="border-b border-slate-200">
                <tr>
                  {['NOMOR TRANSAKSI', 'NOMOR PEKERJAAN', 'NAMA PELANGGAN', 'DIBUAT OLEH / PIC', 'STATUS KENDALA', 'AKSI'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'STATUS KENDALA' || h === 'AKSI' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loadingWorksheets ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                      <Loader2 size={16} className="animate-spin inline mr-2 text-blue-500" />
                      Memuat data tugas lapangan...
                    </td>
                  </tr>
                ) : worksheets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada lembar kerja lapangan.
                    </td>
                  </tr>
                ) : (
                  worksheets.map(r => {
                    const isIssue = r.status_kendala === 'kendala_terdeteksi' || r.has_issue;
                    const stText = isIssue ? 'Kendala Terdeteksi' : 'Normal';
                    const stColor = isIssue ? 'red' : 'blue';

                    return (
                      <tr key={r.worksheet_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.transaction_no}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">#{r.job_no}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.company_name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {r.field_agent_initials || 'M'}
                            </div>
                            <div className="text-xs font-semibold text-slate-700">
                              {r.field_agent_name} <span className="text-slate-400 font-normal">({r.field_agent_role || 'Field Inspector'})</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge t={stText} c={stColor} dot />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleOpenWorksheet(r.worksheet_id)} 
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md transition-colors shadow-sm"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar (Identical to FollowUpTab) */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-xl">
            <div className="text-xs font-medium text-slate-500">
              Showing {wsTotal === 0 ? 0 : (wsPage - 1) * 8 + 1}–{Math.min(wsPage * 8, wsTotal)} of <span className="font-bold text-slate-700">{wsTotal}</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <button 
                disabled={wsPage <= 1}
                onClick={() => setWsPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} className="rotate-180 text-slate-600" />
              </button>
              {Array.from({ length: wsTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setWsPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    p === wsPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button 
                disabled={wsPage >= wsTotalPages}
                onClick={() => setWsPage(p => Math.min(wsTotalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PANELS & MODALS */}
      {panel && (
        <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 ${panel === 'REC' ? 'flex items-center justify-center p-4' : 'flex justify-end'}`}>
          <div className={`bg-white shadow-2xl flex flex-col ${panel === 'REC' ? 'w-full max-w-2xl max-h-[90vh] rounded-2xl' : 'h-full w-full max-w-[600px] animate-in slide-in-from-right'}`}>
            
            {/* PANEL REC: Record Conversation Modal */}
            {panel === 'REC' && (
              <>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><MessageCircle size={18}/></div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Rekaman Komunikasi Pelanggan</h2>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">Log WhatsApp threads or meeting documents and declare assistance requirement.</div>
                    </div>
                  </div>
                  <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0"><X size={18}/></button>
                </div>

                {/* Modal Body — 2 columns */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    {/* Left column */}
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-700">Select Customer Account <span className="text-red-500">*</span></label>
                          <a href="#" className="text-[11px] font-bold text-blue-600 hover:underline">View Account Details</a>
                        </div>
                        <div className="relative">
                          <select 
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-semibold outline-none appearance-none"
                          >
                            {customerList.map((c) => (
                              <option key={c.company_list_id} value={c.company_list_id}>
                                {c.company_name} ({c.customer_code || 'CUST-ACC'})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Jenis Channel <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            onClick={() => setChannelType('WhatsApp')}
                            className={`border rounded-lg px-3 py-2.5 flex justify-between items-center cursor-pointer transition-colors ${channelType === 'WhatsApp' ? 'border-blue-500 bg-blue-50/40 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <MessageCircle size={13}/> WhatsApp (.txt)
                            </div>
                            {channelType === 'WhatsApp' ? <CircleDot size={13}/> : <Circle size={13} className="text-slate-300"/>}
                          </div>

                          <div 
                            onClick={() => setChannelType('Meeting')}
                            className={`border rounded-lg px-3 py-2.5 flex justify-between items-center cursor-pointer transition-colors ${channelType === 'Meeting' ? 'border-blue-500 bg-blue-50/40 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <FileText size={13} className={channelType === 'Meeting' ? 'text-blue-500' : 'text-slate-400'}/> Meeting Document
                            </div>
                            {channelType === 'Meeting' ? <CircleDot size={13}/> : <Circle size={13} className="text-slate-300"/>}
                          </div>
                        </div>
                      </div>

                      {/* File Upload Box */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-5 flex flex-col items-center text-center cursor-pointer transition-colors"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleFileChange} 
                        />
                        <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2.5">
                          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18}/>}
                        </div>
                        <div className="text-xs font-extrabold text-slate-700 mb-1">
                          {uploadedFile ? uploadedFile.file_name : 'Upload chat export .txt or meeting notes PDF'}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mb-2">
                          {uploadedFile ? (
                            <span className="text-emerald-600 font-semibold">{uploadedFile.file_size_kb} KB • Terunggah</span>
                          ) : (
                            <>Drag & drop here, or <span className="text-slate-600 underline">Browse files</span></>
                          )}
                        </div>
                        <div className="border border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-semibold px-2.5 py-0.5 rounded">
                          Max 15MB • UTF-8 format
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Kesimpulan <span className="text-red-500">*</span></label>
                        <textarea 
                          value={summaryText}
                          onChange={(e) => setSummaryText(e.target.value)}
                          placeholder="Diskusi bersama klien mengenai jadwal dan penanganan operasional..."
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 leading-relaxed outline-none focus:border-blue-400 min-h-[80px] resize-none" 
                        />
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-xs font-extrabold text-slate-800 block mb-1.5">Apakah percakapan ini membutuhkan bantuan (Need Assistance)?</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            onClick={() => setNeedAssistance(false)}
                            className={`border rounded-lg px-3 py-2.5 flex gap-2 items-center cursor-pointer transition-colors ${!needAssistance ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {!needAssistance ? <CircleDot size={14} className="shrink-0"/> : <Circle size={14} className="text-slate-300 shrink-0"/>}
                            <span className="text-xs font-bold">No (Standard Log)</span>
                          </div>

                          <div 
                            onClick={() => setNeedAssistance(true)}
                            className={`border rounded-lg px-3 py-2.5 flex gap-2 items-center cursor-pointer transition-colors ${needAssistance ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {needAssistance ? <CircleDot size={14} className="shrink-0"/> : <Circle size={14} className="text-slate-300 shrink-0"/>}
                            <span className="text-xs font-bold">Yes (Send Alert)</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-extrabold text-slate-800 block mb-2">Pilih Level Urgensi (Urgency Level)</label>
                        <div className="space-y-2">
                          <div 
                            onClick={() => setUrgencyLevel('high_priority')}
                            className={`border px-3 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${urgencyLevel === 'high_priority' ? 'border-red-200 bg-red-50/40' : 'border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className="flex gap-2.5">
                              {urgencyLevel === 'high_priority' ? <CircleDot size={15} className="text-red-500 shrink-0 mt-0.5"/> : <Circle size={15} className="text-slate-300 shrink-0 mt-0.5"/>}
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-extrabold text-slate-900">Tingkat Kritis</span>
                                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">High Priority</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-400">For urgent customer escalations or operational blocks</div>
                              </div>
                            </div>
                            <span className="text-red-500 font-extrabold text-base ml-2">!</span>
                          </div>

                          <div 
                            onClick={() => setUrgencyLevel('average')}
                            className={`border px-3 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${urgencyLevel === 'average' ? 'border-orange-200 bg-orange-50/40' : 'border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className="flex gap-2.5">
                              {urgencyLevel === 'average' ? <CircleDot size={15} className="text-orange-500 shrink-0 mt-0.5"/> : <Circle size={15} className="text-slate-300 shrink-0 mt-0.5"/>}
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-extrabold text-slate-800">Tingkat Standar</span>
                                  <span className="text-[10px] font-bold text-orange-600 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded-full">Average</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-400">For standard assistance and follow-up support</div>
                              </div>
                            </div>
                            <Flag size={14} className="text-orange-400 ml-2"/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Auto-synced with C-Track Timeline
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 rounded-lg text-xs font-bold transition-colors" 
                      onClick={() => setPanel(null)}
                    >
                      Batal
                    </button>
                    <button 
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" 
                      onClick={handleSubmitConversation}
                    >
                      {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13}/>}
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PANEL AGT: Field Agent Worksheet Detail Slide-over */}
            {panel === 'AGT' && (
              <>
                <div className="bg-slate-900 text-white px-5 py-4 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">
                      C-TRACK FIELD APP <span className="w-1 h-1 rounded-full bg-slate-600"/> 
                      {activeWorksheet?.status_kendala === 'kendala_terdeteksi' || activeWorksheet?.has_issue ? (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Kendala Terdeteksi
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Normal
                        </span>
                      )}
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold">
                      <X size={13} /> Close
                    </button>
                  </div>
                  <h2 className="text-base font-extrabold mb-0.5">Field Agent Worksheet</h2>
                  <div className="text-xs text-blue-400 font-bold">
                    #{activeWorksheet?.job_no || 'AENAT/2605/2551'}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
                  {loadingWorksheetDetail ? (
                    <div className="py-20 text-center text-xs text-slate-400">
                      <Loader2 size={24} className="animate-spin inline mr-2 text-blue-500" />
                      <div>Memuat data detail worksheet...</div>
                    </div>
                  ) : activeWorksheet ? (
                    <>
                      <SectionTitle icon={Briefcase} title="JOB INFORMATION" right={`ID: #${activeWorksheet.job_no}`} />
                      <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-4">
                        <GridItem label="Job Number" value={`#${activeWorksheet.job_no}`} />
                        <GridItem label="Transaction ID" value={activeWorksheet.transaction_no} />
                        <GridItem label="Sales" value={activeWorksheet.sales_pic_name || 'Adelia'} />
                        <GridItem label="Created By" value={activeWorksheet.field_agent_name || 'Marsel'} />
                      </div>

                      <SectionTitle icon={Truck} title="SHIPMENT INFORMATION" />
                      <div className="border border-slate-200 rounded-lg p-3 space-y-0.5">
                        <BoxRow label="Customer:" value={activeWorksheet.company_name || 'PT DSV Transport Indonesia'} />
                        <BoxRow label="Shipper:" value={activeWorksheet.shipper || 'PT Example Shipper'} />
                        <BoxRow label="Consignee:" value={activeWorksheet.consignee || 'PT Example Consignee'} />
                        <BoxRow label="MAWB:" value={activeWorksheet.mawb || '123-45678901'} />
                        <BoxRow label="HAWB:" value={activeWorksheet.hawb || 'HAWB-00123'} blue />
                      </div>

                      <SectionTitle icon={Clock} title="WAKTU SERAH TERIMA" />
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Calendar size={13} className="text-blue-300" /> Handover Time:
                          </div>
                          <div className="text-xs font-extrabold text-slate-900">
                            {formatDateTime(activeWorksheet.handover_datetime)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <MapPin size={13} className="text-red-300" /> Handover Location:
                          </div>
                          <div className="text-xs font-extrabold text-slate-900">
                            {activeWorksheet.handover_location || 'Gate 3 Priok'}
                          </div>
                        </div>
                      </div>

                      <SectionTitle icon={Box} title="DATA FISIK BARANG" />
                      <div className="grid grid-cols-3 gap-2">
                        {activeWorksheet.physical_items && activeWorksheet.physical_items.length > 0 ? (
                          activeWorksheet.physical_items.map((pi) => (
                            <div key={pi.id} className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-center">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{pi.item_label}</div>
                              <div className="text-sm font-extrabold text-slate-900">
                                {pi.item_value} {pi.item_unit || ''}
                              </div>
                            </div>
                          ))
                        ) : (
                          [['JUMLAH COIL','12','slate'],['ACTUAL PIECES','12 Pcs','slate'],['GROSS WEIGHT','2,450 Kg','blue']].map(([l,v,c]) => (
                            <div key={l} className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-center">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{l}</div>
                              <div className={`text-sm font-extrabold ${c === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{v}</div>
                            </div>
                          ))
                        )}
                      </div>

                      <SectionTitle 
                        icon={Camera} 
                        title="FOTO BUKTI LAPANGAN" 
                        right={
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-emerald-200">
                            <Check size={11}/> {activeWorksheet.photos?.filter(p => p.is_verified).length || 4}/{activeWorksheet.photos?.length || 4} Verified
                          </span>
                        } 
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {activeWorksheet.photos && activeWorksheet.photos.length > 0 ? (
                          activeWorksheet.photos.map((p, i) => (
                            <div key={p.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                              <div className="h-20 flex flex-col items-center justify-center text-slate-300 gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-400">
                                  <Image size={15} />
                                </div>
                                <div className="text-[9px] font-bold tracking-widest">{p.file_name || `DSC_041${i}.JPG • 10:32`}</div>
                              </div>
                              <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-600">{p.photo_label}</span>
                                <span className="text-[10px] font-extrabold text-emerald-600">{p.photo_status || 'OK'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          [
                            { l: '1. Foto Keseluruhan', s: 'OK', c: 'emerald' },
                            { l: '2. Marking / Label', s: 'Match', c: 'emerald' },
                            { l: '3. Foto Seal', s: 'Intact', c: 'emerald' },
                            { l: '4. Area Kerusakan', s: 'No damage', c: 'emerald' }
                          ].map((p, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                              <div className="h-20 flex flex-col items-center justify-center text-slate-300 gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-400"><Image size={15} /></div>
                                <div className="text-[9px] font-bold tracking-widest">DSC_041{i}.JPG • 10:32</div>
                              </div>
                              <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-600">{p.l}</span>
                                <span className={`text-[10px] font-extrabold text-${p.c}-600`}>{p.s}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <SectionTitle icon={FileText} title="DOKUMEN PENDUKUNG & NAMA PETUGAS" />
                      <div className="space-y-2 mb-3">
                        {activeWorksheet.documents && activeWorksheet.documents.length > 0 ? (
                          activeWorksheet.documents.map((d) => (
                            <div key={d.id} className="border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                  <FileText size={15} />
                                </div>
                                <div>
                                  <div className="text-xs font-extrabold text-slate-900">{d.doc_name}</div>
                                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                    {d.doc_type} • {d.file_size_kb ? `${d.file_size_kb} KB` : '1.2 MB'} • {d.doc_description || 'Verified'}
                                  </div>
                                </div>
                              </div>
                              <a href={d.doc_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                                <Download size={15} />
                              </a>
                            </div>
                          ))
                        ) : (
                          [
                            { n: 'Packing List.pdf', s: 'PDF • 1.4 MB • Verified' },
                            { n: 'MSDS.pdf', s: 'PDF • 883 KB • Material Safety Sheet' }
                          ].map(d => (
                            <div key={d.n} className="border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                                <div><div className="text-xs font-extrabold text-slate-900">{d.n}</div><div className="text-[11px] font-semibold text-slate-400 mt-0.5">{d.s}</div></div>
                              </div>
                              <Download size={15} className="text-slate-300" />
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 bg-slate-50">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENYERAH</div>
                          <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                            <User size={12} className="text-slate-400"/> {activeWorksheet.pihak_penyerah || 'Budi Santoso'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENERIMA</div>
                          <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                            <User size={12} className="text-blue-400"/> {activeWorksheet.pihak_penerima || activeWorksheet.field_agent_name || 'Marsel'}
                          </div>
                        </div>
                      </div>

                      <SectionTitle icon={CheckSquare} title="CHECKLIST CENTANG & STATUS MASALAH" />
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="p-1">
                          {activeWorksheet.checklists && activeWorksheet.checklists.length > 0 ? (
                            activeWorksheet.checklists.map((c) => (
                              <div key={c.id} className="flex justify-between items-center px-3 py-2 text-xs">
                                <span className="font-semibold text-slate-600 flex items-center gap-2">
                                  <Check size={13} className="text-emerald-500" /> {c.check_label}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {c.is_verified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                            ))
                          ) : (
                            ['Quantity & weight match', 'Visual condition good', 'Safe for flight', 'Document conformity', 'Airline standard conformity'].map(t => (
                              <div key={t} className="flex justify-between items-center px-3 py-2 text-xs">
                                <span className="font-semibold text-slate-600 flex items-center gap-2"><Check size={13} className="text-emerald-500" /> {t}</span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex gap-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            Dangerous Goods: <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">{activeWorksheet.is_dangerous_goods ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            Special Handling: <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1"><Info size={12} /> {activeWorksheet.special_handling || 'YES (Reefer)'}</span>
                          </div>
                        </div>
                      </div>

                      <SectionTitle icon={Info} title="ISSUE" />
                      {activeWorksheet.has_issue || activeWorksheet.status_kendala === 'kendala_terdeteksi' ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={13} />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-red-900 mb-0.5">Kendala Operasional Terdeteksi</div>
                            <div className="text-[11px] font-semibold text-red-700/90 leading-relaxed">
                              {activeWorksheet.issue_note || 'Peti kemas tertahan pemeriksaan verifikasi di Gerbang 3 Priok. Membutuhkan clearance dokumen manifest segera.'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={13} /></div>
                          <div>
                            <div className="text-xs font-extrabold text-emerald-900 mb-0.5">No operational issue detected.</div>
                            <div className="text-[11px] font-semibold text-emerald-700/80 leading-relaxed">Seluruh parameter kuantitas, segel, dan fisik kargo telah terverifikasi normal.</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                <div className="px-5 py-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
                  <button className="w-1/3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors" onClick={() => setPanel(null)}>
                    Close Panel
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download size={13} /> Export PDF
                  </button>
                </div>
              </>
            )}

            {/* PANEL VIEW: Conversation Quick View Slide-over */}
            {panel === 'VIEW' && activeConversation && (
              <>
                <div className="bg-slate-900 text-white px-5 py-4 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">
                      CONVERSATION LOG <span className="w-1 h-1 rounded-full bg-slate-600"/>
                      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {activeConversation.channel_type}
                      </span>
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold">
                      <X size={13} /> Close
                    </button>
                  </div>
                  <h2 className="text-base font-extrabold mb-0.5">{activeConversation.company_name}</h2>
                  <div className="text-xs text-blue-400 font-bold">Acc: {activeConversation.customer_code}</div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
                  <SectionTitle icon={Briefcase} title="CUSTOMER & PIC INFORMATION" />
                  <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-4">
                    <GridItem label="Company Name" value={activeConversation.company_name || '—'} />
                    <GridItem label="Customer Code" value={activeConversation.customer_code || '—'} />
                    <GridItem label="Sales PIC" value={activeConversation.sales_pic_name || 'Adelia'} />
                    <GridItem label="Conversation Date" value={formatDate(activeConversation.conversation_date)} />
                  </div>

                  <SectionTitle icon={MessageCircle} title="DISKUSI & KESIMPULAN" />
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs font-medium text-slate-700 leading-relaxed">
                    {activeConversation.summary}
                  </div>

                  <SectionTitle icon={AlertTriangle} title="STATUS ASISTENSI & URGENSI" />
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Need Assistance:</span>
                      <Badge 
                        t={activeConversation.need_assistance ? 'Yes' : 'No'} 
                        c={activeConversation.need_assistance ? 'red' : 'slate'} 
                        dot 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Urgency Level:</span>
                      <Badge 
                        t={activeConversation.urgency_level === 'high_priority' ? 'High Priority' : activeConversation.urgency_level === 'average' ? 'Average' : 'Standard'} 
                        c={activeConversation.urgency_level === 'high_priority' ? 'red' : activeConversation.urgency_level === 'average' ? 'orange' : 'slate'} 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">C-Track Synchronized:</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={13} /> {activeConversation.synced_to_ctrack ? 'Synchronized' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {activeConversation.document_urls && activeConversation.document_urls.length > 0 && (
                    <>
                      <SectionTitle icon={FileText} title="LAMPIRAN FILE" />
                      <div className="space-y-2">
                        {activeConversation.document_urls.map((url, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                <FileText size={15} />
                              </div>
                              <div className="text-xs font-extrabold text-slate-900 truncate max-w-[280px]">
                                {url.split('/').pop() || `Attachment-${idx + 1}`}
                              </div>
                            </div>
                            <a href={url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                              <Download size={15} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="px-5 py-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
                  <button 
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors" 
                    onClick={() => setPanel(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
