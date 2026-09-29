'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Calendar, AlertTriangle, ChevronDown, ChevronRight, Plus, TrendingUp,
  MapPin, Camera, CheckSquare, Edit3, Image as Img, Map, X, UploadCloud,
  Video, MessageCircle, AlertCircle, Briefcase, Truck, Clock, Box, Image, 
  FileText, User, Check, Info, Download, CircleDot, Circle, Flag, Send,
  Loader2, Search, RotateCcw, Eye, Trash2, ExternalLink
} from 'lucide-react';
import {
  fetchApiCustomers,
  fetchApiConversations,
  createApiConversation,
  updateApiConversation,
  fetchApiWorksheets,
  fetchApiWorksheetDetail,
  fetchApiStats,
  uploadApiFile,
  CompanyItem,
  RecordConversationItem,
  WorksheetItem,
  DashboardStats,
  UpdateConversationPayload,
  UploadedFileMetadata
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

  // Conversation View & In-Place Edit States
  const [editSummary, setEditSummary] = useState<string>('');
  const [editChannelType, setEditChannelType] = useState<string>('WhatsApp');
  const [editUrgencyLevel, setEditUrgencyLevel] = useState<'high_priority' | 'average' | 'standard'>('standard');
  const [editNeedAssistance, setEditNeedAssistance] = useState<boolean>(false);
  const [editStatus, setEditStatus] = useState<'active' | 'archived'>('active');
  const [editDocumentUrls, setEditDocumentUrls] = useState<string[]>([]);
  const [isUploadingDocInView, setIsUploadingDocInView] = useState<boolean>(false);
  const [isSavingConv, setIsSavingConv] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const viewFileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter states
  const [channelFilter, setChannelFilter] = useState<string>('All Channels');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [dateFilter, setDateFilter] = useState<string>('All Dates');
  const [assistanceFilter, setAssistanceFilter] = useState<string>('All Assistance');
  const [isChannelFilterOpen, setIsChannelFilterOpen] = useState<boolean>(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState<boolean>(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState<boolean>(false);
  const [isAssistanceFilterOpen, setIsAssistanceFilterOpen] = useState<boolean>(false);
  const channelFilterRef = useRef<HTMLDivElement | null>(null);
  const statusFilterRef = useRef<HTMLDivElement | null>(null);
  const dateFilterRef = useRef<HTMLDivElement | null>(null);
  const assistanceFilterRef = useRef<HTMLDivElement | null>(null);

  // Record Conversation Modal Form States (up to 5 files)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState<boolean>(false);
  const [custSearchQuery, setCustSearchQuery] = useState<string>('');
  const custDropdownRef = useRef<HTMLDivElement | null>(null);

  const [jobNumberInput, setJobNumberInput] = useState<string>('');
  const [channelSelection, setChannelSelection] = useState<'WhatsApp' | 'Meeting' | 'Manual'>('WhatsApp');
  const [customChannelText, setCustomChannelText] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  const [needAssistance, setNeedAssistance] = useState<boolean>(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'high_priority' | 'average'>('average');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview Lightbox Modal State
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    type: string;
  } | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (custDropdownRef.current && !custDropdownRef.current.contains(target)) {
        setIsCustDropdownOpen(false);
      }
      if (channelFilterRef.current && !channelFilterRef.current.contains(target)) {
        setIsChannelFilterOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(target)) {
        setIsStatusFilterOpen(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(target)) {
        setIsDateFilterOpen(false);
      }
      if (assistanceFilterRef.current && !assistanceFilterRef.current.contains(target)) {
        setIsAssistanceFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

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
          date: dateFilter,
          needAssistance: assistanceFilter,
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
  }, [channelFilter, statusFilter, dateFilter, assistanceFilter, convPage]);

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
    setEditSummary(conv.summary || '');
    setEditChannelType(conv.channel_type || 'WhatsApp');
    setEditUrgencyLevel(
      conv.urgency_level === 'high_priority' || conv.urgency_level === 'critical'
        ? 'high_priority'
        : conv.urgency_level === 'average'
        ? 'average'
        : 'standard'
    );
    setEditNeedAssistance(Boolean(conv.need_assistance));
    setEditStatus(conv.status || 'active');
    setEditDocumentUrls(conv.document_urls ? [...conv.document_urls] : []);
    setSaveSuccessMsg(null);
    setPanel('VIEW');
  };

  // Evaluate if conversation form is dirty
  const isConvDirty = Boolean(
    activeConversation &&
    (
      editSummary.trim() !== (activeConversation.summary || '').trim() ||
      editChannelType !== activeConversation.channel_type ||
      editUrgencyLevel !== (
        activeConversation.urgency_level === 'high_priority' || activeConversation.urgency_level === 'critical'
          ? 'high_priority'
          : activeConversation.urgency_level === 'average'
          ? 'average'
          : 'standard'
      ) ||
      editNeedAssistance !== Boolean(activeConversation.need_assistance) ||
      editStatus !== activeConversation.status ||
      JSON.stringify(editDocumentUrls) !== JSON.stringify(activeConversation.document_urls || [])
    )
  );

  // Save changes to conversation
  const handleSaveConversation = async () => {
    if (!activeConversation || !isConvDirty || isSavingConv) return;
    setIsSavingConv(true);
    setSaveSuccessMsg(null);
    try {
      const payload: UpdateConversationPayload = {
        id: activeConversation.id,
        summary: editSummary.trim(),
        channel_type: editChannelType,
        urgency_level: editUrgencyLevel,
        need_assistance: editNeedAssistance,
        status: editStatus,
        document_urls: editDocumentUrls,
      };

      const res = await updateApiConversation(payload);
      if (res.success && res.data) {
        setActiveConversation(res.data);
        setConversations(prev =>
          prev.map(c => (c.id === res.data!.id ? res.data! : c))
        );
        setSaveSuccessMsg('Perubahan tersimpan!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        alert(`Gagal memperbarui percakapan: ${res.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      console.error('Error saving conversation:', err);
      alert(`Terjadi kesalahan: ${err?.message || err}`);
    } finally {
      setIsSavingConv(false);
    }
  };

  // Handle uploading additional files directly in VIEW panel (up to 5 files)
  const handleViewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editDocumentUrls.length + files.length > 5) {
      alert(`Maksimal 5 berkas per record. Anda saat ini memiliki ${editDocumentUrls.length} berkas dan hanya dapat menambah maksimal ${5 - editDocumentUrls.length} berkas lagi.`);
      return;
    }

    setIsUploadingDocInView(true);
    try {
      for (const file of files) {
        const res = await uploadApiFile(file);
        if (res.success && res.data?.file_url) {
          setEditDocumentUrls(prev => [...prev, res.data!.file_url]);
        } else {
          alert(`Gagal mengunggah file "${file.name}": ${res.error || 'Terjadi kesalahan'}`);
        }
      }
    } catch (err: any) {
      console.error('Upload in view error:', err);
      alert(`Error upload: ${err?.message || err}`);
    } finally {
      setIsUploadingDocInView(false);
      if (viewFileInputRef.current) viewFileInputRef.current.value = '';
    }
  };

  const handleRemoveDocInView = (indexToRemove: number) => {
    setEditDocumentUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle multiple file upload in Modal REC (up to 5 files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      alert(`Maksimal 5 berkas per record. Anda saat ini memiliki ${uploadedFiles.length} berkas dan hanya dapat menambah ${5 - uploadedFiles.length} berkas lagi.`);
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        const res = await uploadApiFile(file);
        if (res.success && res.data) {
          setUploadedFiles(prev => [...prev, res.data!]);
        } else {
          alert(`Gagal mengunggah file "${file.name}": ${res.error || 'Terjadi kesalahan'}`);
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Error upload: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Reset seluruh filter ke default
  const handleResetFilters = () => {
    setChannelFilter('All Channels');
    setStatusFilter('All Statuses');
    setDateFilter('All Dates');
    setAssistanceFilter('All Assistance');
    setIsChannelFilterOpen(false);
    setIsStatusFilterOpen(false);
    setIsDateFilterOpen(false);
    setIsAssistanceFilterOpen(false);
    setConvPage(1);
  };

  // Open record conversation modal with initialized customer, blank job number, and default no alert
  const handleOpenRecordModal = () => {
    if (customerList.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customerList[0].company_list_id);
    }
    setJobNumberInput(''); // Tetap kosong agar hanya menjadi bayangan (placeholder)
    setNeedAssistance(false); // Default: No (Standard Log) / no alert
    setUrgencyLevel('average');
    setUploadedFiles([]);
    setPanel('REC');
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

    const finalChannel = channelSelection === 'Manual'
      ? (customChannelText.trim() || 'Manual')
      : channelSelection;

    if (channelSelection === 'Manual' && !customChannelText.trim()) {
      alert('Harap ketik nama jenis channel manual.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCustomer = customerList.find(c => c.company_list_id === selectedCustomerId);
      const res = await createApiConversation({
        customer_id: selectedCustomerId,
        customer_code: targetCustomer?.customer_code || undefined,
        job_number: jobNumberInput.trim() ? jobNumberInput.trim() : undefined,
        channel_type: finalChannel,
        summary: summaryText,
        need_assistance: needAssistance,
        urgency_level: urgencyLevel,
        synced_to_ctrack: true,
        uploaded_files: uploadedFiles,
      });

      if (res.success) {
        // Reset form
        setSummaryText('');
        setUploadedFiles([]);
        setJobNumberInput('');
        setChannelSelection('WhatsApp');
        setCustomChannelText('');
        setNeedAssistance(false);
        setUrgencyLevel('average');
        setPanel(null);

        // Refresh page 1 of conversations & stats
        setConvPage(1);
        const [convRes, newStats] = await Promise.all([
          fetchApiConversations({
            channelType: channelFilter,
            status: statusFilter,
            date: dateFilter,
            needAssistance: assistanceFilter,
            page: 1,
            limit: 8,
          }),
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

  const selectedCustomer = customerList.find(c => c.company_list_id === selectedCustomerId);
  const filteredCustomers = customerList.filter(c => {
    const q = custSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.company_name.toLowerCase().includes(q) ||
      (c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.job_number && c.job_number.toLowerCase().includes(q))
    );
  });

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
          {/* Channel Type Filter Dropdown */}
          <div className="relative" ref={channelFilterRef}>
            <button
              type="button"
              onClick={() => {
                setIsChannelFilterOpen(v => !v);
                setIsStatusFilterOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer ${
                channelFilter !== 'All Channels' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : ''
              }`}
            >
              <span>Channel Type: <span className={channelFilter !== 'All Channels' ? 'text-blue-600 font-extrabold' : 'text-slate-800'}>{channelFilter}</span></span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isChannelFilterOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isChannelFilterOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Channels', 'WhatsApp', 'Meeting'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setChannelFilter(ch);
                      setConvPage(1);
                      setIsChannelFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      channelFilter === ch ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{ch}</span>
                    {channelFilter === ch && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter Dropdown with Calendar Popover */}
          <div className="relative" ref={dateFilterRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateFilterOpen(v => !v);
                setIsChannelFilterOpen(false);
                setIsStatusFilterOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer ${
                dateFilter !== 'All Dates' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : ''
              }`}
            >
              <Calendar size={13} className={dateFilter !== 'All Dates' ? 'text-blue-500' : 'text-slate-400'} />
              <span>
                {dateFilter === 'All Dates' ? (
                  <>Tanggal: <span className="text-slate-800">Semua</span></>
                ) : dateFilter === 'Today' ? (
                  <>Tanggal: <span className="text-blue-600 font-extrabold">Today ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</span></>
                ) : (
                  <>Tanggal: <span className="text-blue-600 font-extrabold">{dateFilter}</span></>
                )}
              </span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isDateFilterOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isDateFilterOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-3 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Rentang / Kalender</div>
                <div className="space-y-1 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('All Dates');
                      setConvPage(1);
                      setIsDateFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'All Dates' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Semua Tanggal</span>
                    {dateFilter === 'All Dates' && <Check size={13} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('Today');
                      setConvPage(1);
                      setIsDateFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === 'Today' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
                    {dateFilter === 'Today' && <Check size={13} className="text-blue-600" />}
                  </button>
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Pilih Dari Kalender:
                  </label>
                  <input
                    type="date"
                    value={dateFilter !== 'All Dates' && dateFilter !== 'Today' ? dateFilter : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateFilter(e.target.value);
                        setConvPage(1);
                        setIsDateFilterOpen(false);
                      }
                    }}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Need Assistance Filter Dropdown */}
          <div className="relative" ref={assistanceFilterRef}>
            <button
              type="button"
              onClick={() => {
                setIsAssistanceFilterOpen(v => !v);
                setIsChannelFilterOpen(false);
                setIsDateFilterOpen(false);
                setIsStatusFilterOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer ${
                assistanceFilter !== 'All Assistance' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : ''
              }`}
            >
              <span>Assistance: <span className={assistanceFilter !== 'All Assistance' ? 'text-blue-600 font-extrabold' : 'text-slate-800'}>{assistanceFilter}</span></span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isAssistanceFilterOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isAssistanceFilterOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Assistance', 'Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setAssistanceFilter(opt);
                      setConvPage(1);
                      setIsAssistanceFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      assistanceFilter === opt ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt === 'All Assistance' ? 'All Assistance' : opt === 'Yes' ? 'Yes (Butuh Asistensi)' : 'No (Tidak Butuh)'}</span>
                    {assistanceFilter === opt && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative" ref={statusFilterRef}>
            <button
              type="button"
              onClick={() => {
                setIsStatusFilterOpen(v => !v);
                setIsChannelFilterOpen(false);
                setIsDateFilterOpen(false);
                setIsAssistanceFilterOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer ${
                statusFilter !== 'All Statuses' ? 'border-blue-400 bg-blue-50/50 text-blue-700' : ''
              }`}
            >
              <span>Status: <span className={statusFilter !== 'All Statuses' ? 'text-blue-600 font-extrabold' : 'text-slate-800'}>{statusFilter}</span></span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isStatusFilterOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isStatusFilterOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Statuses', 'Active', 'Archived'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setConvPage(1);
                      setIsStatusFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      statusFilter === st ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Reset seluruh filter ke default"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        <button 
          onClick={handleOpenRecordModal} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
                      {/* Searchable Customer Dropdown */}
                      <div className="relative" ref={custDropdownRef}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Select Customer Account <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[11px] font-bold text-blue-600">
                            {customerList.length} Akun Terdaftar
                          </span>
                        </div>
                        
                        {/* Dropdown Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustDropdownOpen(v => !v);
                            setCustSearchQuery('');
                          }}
                          className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-semibold flex justify-between items-center transition-all cursor-pointer text-left ${
                            isCustDropdownOpen
                              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {selectedCustomer ? (
                            <div className="truncate pr-2">
                              <span className="font-extrabold text-slate-900 block truncate">
                                {selectedCustomer.company_name}
                              </span>
                              <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
                                {selectedCustomer.customer_code || 'CUST-ACC'} • Job: {selectedCustomer.job_number || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Pilih akun pelanggan...</span>
                          )}
                          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isCustDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                        </button>

                        {/* Searchable Menu Popup */}
                        {isCustDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-1 max-h-[300px] flex flex-col">
                            {/* Search input with icon */}
                            <div className="relative mb-2 shrink-0">
                              <Search size={14} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                autoFocus
                                type="text"
                                value={custSearchQuery}
                                onChange={(e) => setCustSearchQuery(e.target.value)}
                                placeholder="Cari nama perusahaan atau kode akun..."
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white pl-8 pr-3 py-1.5 rounded-lg text-xs font-medium text-slate-800 outline-none transition-colors"
                              />
                            </div>

                            {/* Options List */}
                            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 space-y-0.5">
                              {filteredCustomers.length === 0 ? (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                  Akun pelanggan tidak ditemukan.
                                </div>
                              ) : (
                                filteredCustomers.map((c) => {
                                  const isSelected = c.company_list_id === selectedCustomerId;
                                  return (
                                    <div
                                      key={c.company_list_id}
                                      onClick={() => {
                                        setSelectedCustomerId(c.company_list_id);
                                        // Jangan mengisi jobNumberInput agar tetap menjadi bayangan (placeholder)
                                        setIsCustDropdownOpen(false);
                                        setCustSearchQuery('');
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex justify-between items-center ${
                                        isSelected
                                          ? 'bg-blue-50 text-blue-700 font-bold'
                                          : 'hover:bg-slate-50 text-slate-700'
                                      }`}
                                    >
                                      <div className="truncate pr-2">
                                        <div className="font-extrabold truncate">{c.company_name}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                                          <span>Kode: <span className="font-semibold text-slate-600">{c.customer_code || '—'}</span></span>
                                          <span>Job: <span className="font-mono text-slate-500">{c.job_number || '—'}</span></span>
                                        </div>
                                      </div>
                                      {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Job Number (Opsional) */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Job Number <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={jobNumberInput}
                          onChange={(e) => setJobNumberInput(e.target.value)}
                          placeholder={selectedCustomer?.job_number || 'AENAT/2606/0225'}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors font-mono"
                        />
                      </div>

                      {/* Jenis Channel */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Jenis Channel <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <div 
                            onClick={() => setChannelSelection('WhatsApp')}
                            className={`border rounded-lg p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                              channelSelection === 'WhatsApp' 
                                ? 'border-blue-500 bg-blue-50/40 text-blue-600 shadow-2xs' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <MessageCircle size={15}/>
                              {channelSelection === 'WhatsApp' ? <CircleDot size={13}/> : <Circle size={13} className="text-slate-300"/>}
                            </div>
                            <div className="text-[11px] font-bold leading-tight">WhatsApp</div>
                            <div className="text-[9px] text-slate-400">Export (.txt)</div>
                          </div>

                          <div 
                            onClick={() => setChannelSelection('Meeting')}
                            className={`border rounded-lg p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                              channelSelection === 'Meeting' 
                                ? 'border-blue-500 bg-blue-50/40 text-blue-600 shadow-2xs' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <FileText size={15}/>
                              {channelSelection === 'Meeting' ? <CircleDot size={13}/> : <Circle size={13} className="text-slate-300"/>}
                            </div>
                            <div className="text-[11px] font-bold leading-tight">Meeting</div>
                            <div className="text-[9px] text-slate-400">Document/MoM</div>
                          </div>

                          <div 
                            onClick={() => setChannelSelection('Manual')}
                            className={`border rounded-lg p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                              channelSelection === 'Manual' 
                                ? 'border-blue-500 bg-blue-50/40 text-blue-600 shadow-2xs' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Edit3 size={15}/>
                              {channelSelection === 'Manual' ? <CircleDot size={13}/> : <Circle size={13} className="text-slate-300"/>}
                            </div>
                            <div className="text-[11px] font-bold leading-tight">Manual</div>
                            <div className="text-[9px] text-slate-400">Ketik Bebas</div>
                          </div>
                        </div>

                        {channelSelection === 'Manual' && (
                          <div className="mt-2.5 animate-in fade-in slide-in-from-top-1">
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                              Ketik Nama Channel Komunikasi <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={customChannelText}
                              onChange={(e) => setCustomChannelText(e.target.value)}
                              placeholder="Contoh: Telepon Langsung, Email, Visit Lapangan..."
                              className="w-full bg-white border border-blue-400 focus:border-blue-600 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>

                      {/* File Upload Box (up to 5 files per FR-02.2) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700">
                            Unggah Berkas Bukti <span className="text-slate-400 font-normal text-[11px]">(Maks. 5 file)</span>
                          </label>
                          <span className={`text-[11px] font-bold ${uploadedFiles.length >= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                            {uploadedFiles.length}/5 File
                          </span>
                        </div>

                        {/* Dropzone area */}
                        <div 
                          onClick={() => {
                            if (uploadedFiles.length < 5 && !isUploading) {
                              fileInputRef.current?.click();
                            }
                          }}
                          className={`border rounded-xl px-4 py-4 flex flex-col items-center text-center transition-all ${
                            uploadedFiles.length >= 5
                              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-75'
                              : 'border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple
                            accept=".pdf,.docx,.jpg,.jpeg,.png,.txt,image/jpeg,image/png,image/jpg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleFileChange} 
                          />
                          <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-1.5">
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16}/>}
                          </div>
                          <div className="text-xs font-bold text-slate-700 mb-0.5">
                            {uploadedFiles.length >= 5 
                              ? 'Batas maksimal 5 file telah tercapai'
                              : isUploading 
                              ? 'Mengunggah berkas ke Supabase Storage...'
                              : 'Klik untuk upload bukti meeting atau chat'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {uploadedFiles.length >= 5
                              ? 'Hapus salah satu file di bawah jika ingin mengganti'
                              : 'PDF, DOCX, JPG, PNG, TXT • Maks. 10MB per file'}
                          </div>
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {uploadedFiles.map((file, idx) => {
                              const isImage = ['jpg', 'jpeg', 'png'].includes(file.file_type.toLowerCase());
                              return (
                                <div key={idx} className="border border-slate-200 bg-white rounded-lg p-2 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
                                  <div className="flex items-center gap-2.5 truncate pr-2">
                                    {isImage ? (
                                      <img 
                                        src={file.file_url} 
                                        alt={file.file_name} 
                                        className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" 
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold text-[10px] ${
                                        file.file_type === 'pdf' ? 'bg-red-50 text-red-600' : file.file_type === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        <FileText size={15} />
                                      </div>
                                    )}
                                    <div className="truncate">
                                      <div className="text-xs font-bold text-slate-800 truncate">{file.file_name}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                        <span className="uppercase font-semibold">{file.file_type}</span>
                                        <span>•</span>
                                        <span>{file.file_size_kb ? `${file.file_size_kb} KB` : '1 MB'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModal({
                                        isOpen: true,
                                        url: file.file_url,
                                        title: file.file_name,
                                        type: file.file_type
                                      })}
                                      className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                      title="Preview berkas"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUploadedFile(idx)}
                                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                      title="Hapus berkas"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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

            {/* PANEL VIEW: Conversation Quick View & Edit Slide-over */}
            {panel === 'VIEW' && activeConversation && (
              <>
                <div className="bg-slate-900 text-white px-5 py-4 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">
                      CONVERSATION LOG <span className="w-1 h-1 rounded-full bg-slate-600"/>
                      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {editChannelType}
                      </span>
                      {activeConversation.job_number && (
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono text-[10px]">
                          #{activeConversation.job_number}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer">
                      <X size={13} /> Close
                    </button>
                  </div>
                  <h2 className="text-base font-extrabold mb-0.5">{activeConversation.company_name}</h2>
                  <div className="text-xs text-blue-400 font-bold flex items-center gap-2">
                    <span>Acc: {activeConversation.customer_code}</span>
                    {activeConversation.job_number && (
                      <span className="text-slate-400 font-normal">• Job No: <span className="text-slate-200 font-semibold">{activeConversation.job_number}</span></span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
                  <SectionTitle icon={Briefcase} title="CUSTOMER & PIC INFORMATION" />
                  <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-4 bg-white shadow-2xs">
                    <GridItem label="Company Name" value={activeConversation.company_name || '—'} />
                    <GridItem label="Customer Code" value={activeConversation.customer_code || '—'} />
                    <GridItem label="Job Number" value={activeConversation.job_number ? `#${activeConversation.job_number}` : '—'} />
                    <GridItem label="Sales PIC" value={activeConversation.sales_pic_name || 'Adelia'} />
                    <GridItem label="Conversation Date" value={formatDate(activeConversation.conversation_date)} />
                    <GridItem label="Status Sync" value={activeConversation.synced_to_ctrack ? 'C-Track Synchronized' : 'Pending'} />
                  </div>

                  <SectionTitle 
                    icon={MessageCircle} 
                    title="DISKUSI & KESIMPULAN" 
                    right={isConvDirty ? 'Perubahan Belum Disimpan' : undefined} 
                  />
                  <div className="border border-slate-200 rounded-lg p-3 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Ringkasan Catatan / Summary (Dapat Diedit):
                    </label>
                    <textarea
                      rows={4}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      placeholder="Tuliskan ringkasan hasil diskusi..."
                      className="w-full text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-md p-2.5 outline-none resize-none transition-colors leading-relaxed"
                    />
                  </div>

                  <SectionTitle icon={AlertTriangle} title="PENGATURAN PARAMETER & ASISTENSI" />
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3.5 bg-slate-50/60">
                    {/* Channel Type */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Channel Komunikasi</div>
                        <div className="text-[10px] text-slate-400">Media interaksi yang digunakan</div>
                      </div>
                      <select
                        value={editChannelType}
                        onChange={(e) => setEditChannelType(e.target.value)}
                        className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Meeting">Meeting</option>
                        {editChannelType !== 'WhatsApp' && editChannelType !== 'Meeting' && (
                          <option value={editChannelType}>{editChannelType}</option>
                        )}
                      </select>
                    </div>

                    {/* Urgency Level */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Tingkat Urgensi</div>
                        <div className="text-[10px] text-slate-400">Prioritas eskalasi penanganan</div>
                      </div>
                      <select
                        value={editUrgencyLevel}
                        onChange={(e) => setEditUrgencyLevel(e.target.value as any)}
                        className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
                      >
                        <option value="high_priority">High Priority</option>
                        <option value="average">Average</option>
                        <option value="standard">Standard</option>
                      </select>
                    </div>

                    {/* Need Assistance */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Butuh Asistensi Khusus</div>
                        <div className="text-[10px] text-slate-400">Tandai jika butuh dukungan dispatcher</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditNeedAssistance(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editNeedAssistance
                              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditNeedAssistance(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !editNeedAssistance
                              ? 'bg-slate-200 text-slate-800 border border-slate-300 shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* Status Percakapan */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Status Percakapan</div>
                        <div className="text-[10px] text-slate-400">Aktif atau diarsipkan</div>
                      </div>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'active' | 'archived')}
                        className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* C-Track Synchronized (Read-only) */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-700">C-Track Synchronized</div>
                        <div className="text-[10px] text-slate-400">Status sinkronisasi core tracking</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={13} /> {activeConversation.synced_to_ctrack ? 'Synchronized' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* LAMPIRAN BERKAS SECTION IN VIEW PANEL (up to 5 files) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <SectionTitle icon={FileText} title={`LAMPIRAN BERKAS (${editDocumentUrls.length}/5)`} />
                      {editDocumentUrls.length < 5 && (
                        <button
                          type="button"
                          onClick={() => viewFileInputRef.current?.click()}
                          disabled={isUploadingDocInView}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingDocInView ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                          <span>Tambah Berkas</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={viewFileInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,.docx,.jpg,.jpeg,.png,.txt,image/jpeg,image/png,image/jpg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleViewFileUpload}
                    />

                    {editDocumentUrls.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400 bg-slate-50">
                        Belum ada berkas lampiran.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editDocumentUrls.map((url, idx) => {
                          const fileName = url.split('/').pop()?.split('?')[0] || `Lampiran-${idx + 1}`;
                          const ext = fileName.split('.').pop()?.toLowerCase() || '';
                          const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

                          return (
                            <div key={idx} className="border border-slate-200 rounded-lg px-3 py-2.5 flex items-center justify-between bg-white shadow-2xs hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-2.5 truncate pr-2">
                                {isImage ? (
                                  <img 
                                    src={url} 
                                    alt={fileName} 
                                    className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" 
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold text-[10px] ${
                                    ext === 'pdf' ? 'bg-red-50 text-red-600' : ext === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <FileText size={15} />
                                  </div>
                                )}
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-900 truncate max-w-[240px]">{fileName}</div>
                                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{ext || 'FILE'}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    isOpen: true,
                                    url: url,
                                    title: fileName,
                                    type: ext
                                  })}
                                  className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                  title="Preview berkas"
                                >
                                  <Eye size={14} />
                                </button>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                  title="Unduh / Buka file"
                                >
                                  <Download size={14} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocInView(idx)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                  title="Hapus berkas"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {editDocumentUrls.length >= 5 && (
                      <div className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Info size={13} className="shrink-0" />
                        <span>Maksimal 5 berkas telah tercapai. Hapus salah satu berkas di atas untuk menambah yang baru.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <button 
                    type="button"
                    className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors cursor-pointer" 
                    onClick={() => setPanel(null)}
                  >
                    Tutup
                  </button>

                  <div className="flex items-center gap-2">
                    {saveSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-600 animate-in fade-in flex items-center gap-1">
                        <Check size={14} /> {saveSuccessMsg}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={!isConvDirty || isSavingConv}
                      onClick={handleSaveConversation}
                      className={`py-2 px-5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                        !isConvDirty || isSavingConv
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      {isSavingConv ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* PREVIEW MODAL / LIGHTBOX */}
      {previewModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 truncate pr-2">
                <FileText size={16} className="text-blue-500 shrink-0" />
                <span className="text-xs font-extrabold text-slate-800 truncate">{previewModal.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a 
                  href={previewModal.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ExternalLink size={12} /> Buka Tab Baru
                </a>
                <button 
                  onClick={() => setPreviewModal(null)} 
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/60 min-h-[350px]">
              {['jpg', 'jpeg', 'png'].includes(previewModal.type.toLowerCase()) ? (
                <img 
                  src={previewModal.url} 
                  alt={previewModal.title} 
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200 bg-white" 
                />
              ) : previewModal.type.toLowerCase() === 'pdf' || previewModal.type.toLowerCase() === 'txt' ? (
                <iframe 
                  src={previewModal.url} 
                  title={previewModal.title} 
                  className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{previewModal.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">Berkas bertipe {previewModal.type.toUpperCase()} dapat diunduh atau dibuka langsung melalui aplikasi viewer eksternal.</p>
                  <a 
                    href={previewModal.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    download
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Unduh Berkas
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
