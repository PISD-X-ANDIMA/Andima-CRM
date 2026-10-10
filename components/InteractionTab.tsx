'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronDown, Plus, Download, Video, MessageCircle, 
  X, UploadCloud, FileText, Check, Loader2, Calendar, 
  ExternalLink, AlertCircle, Save, Tag, Trash2
} from 'lucide-react';
import {
  fetchApiCustomers,
  fetchApiConversations,
  createApiConversation,
  updateApiConversation,
  uploadApiFile,
  CompanyItem,
  RecordConversationItem,
  UploadedFileMetadata
} from '../backend/record_conversation';

interface AuditLogItem {
  id: string;
  user: string;
  timestamp: string;
  badge?: string;
  note?: string;
  isLatest?: boolean;
}

interface EvidenceAttachmentItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'text' | string;
  url: string;
}

interface ConversationDisplayItem {
  id: string;
  conversation_id: string;
  job_number: string;
  company: string;
  source: 'Meeting' | 'WhatsApp' | string;
  date: string;
  pic: string;
  time?: string;
  summary?: string;
  status?: string;
  urgency_level?: string;
  need_assistance?: boolean;
  document_urls?: string[];
  connected_job_numbers?: string[];
  evidence_attachments?: EvidenceAttachmentItem[];
  audit_logs?: AuditLogItem[];
  customer_id?: string;
  created_at?: string;
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr.replace(/-/g, '/');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

interface InteractionTabProps {
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  };
}

export default function InteractionTab({ currentUser }: InteractionTabProps = {}) {
  // State nama akun aktif untuk PIC (otomatis dari akun yang login)
  const [activeUserName, setActiveUserName] = useState<string>(() => {
    if (currentUser?.name && currentUser.name.trim()) return currentUser.name.trim();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name && parsed.name.trim()) return parsed.name.trim();
        }
      } catch {}
    }
    return 'Sales Executive';
  });

  useEffect(() => {
    if (currentUser?.name && currentUser.name.trim()) {
      setActiveUserName(currentUser.name.trim());
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name && parsed.name.trim()) {
            setActiveUserName(parsed.name.trim());
          }
        }
      } catch {}
    }
  }, [currentUser]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All Channel');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Dropdown Open States
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const channelDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateDropdownRef = useRef<HTMLDivElement | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Data States (Connected to Database)
  const [conversations, setConversations] = useState<ConversationDisplayItem[]>([]);
  const [customerList, setCustomerList] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal States
  const [selectedConversation, setSelectedConversation] = useState<ConversationDisplayItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditDetailMode, setIsEditDetailMode] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editJobNumbers, setEditJobNumbers] = useState<string[]>([]);
  const [editAttachments, setEditAttachments] = useState<EvidenceAttachmentItem[]>([]);
  const [editAuditLogs, setEditAuditLogs] = useState<AuditLogItem[]>([]);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [detailSuccessMsg, setDetailSuccessMsg] = useState<string | null>(null);

  // Create Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [isJobNumberDropdownOpen, setIsJobNumberDropdownOpen] = useState(false);
  const [recordDate, setRecordDate] = useState('');

  // Format date digits with slashes automatically (DD/MM/YYYY)
  const formatWithSlashes = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const [channelSelection, setChannelSelection] = useState<'WhatsApp' | 'Meeting'>('WhatsApp');
  const [recordSummary, setRecordSummary] = useState('');
  const [newUploadedFiles, setNewUploadedFiles] = useState<UploadedFileMetadata[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [saveSuccessNotif, setSaveSuccessNotif] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const accountDropdownRef = useRef<HTMLDivElement | null>(null);
  const jobNumberDropdownRef = useRef<HTMLDivElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-dismiss save success notification after 4 seconds
  useEffect(() => {
    if (saveSuccessNotif) {
      const timer = setTimeout(() => {
        setSaveSuccessNotif(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessNotif]);

  // Lightbox Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  } | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as Node;
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(target)) {
        setIsChannelDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setIsDateDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
      if (jobNumberDropdownRef.current && !jobNumberDropdownRef.current.contains(target)) {
        setIsJobNumberDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // Load database conversations & customer list
  const loadData = async () => {
    setLoading(true);
    try {
      const [customers, convRes] = await Promise.all([
        fetchApiCustomers(),
        fetchApiConversations({ limit: 100 })
      ]);

      setCustomerList(customers || []);

      if (convRes.data && convRes.data.length > 0) {
        const mappedDb: ConversationDisplayItem[] = convRes.data.map((c: RecordConversationItem) => {
          let convCode = c.id;
          if (c.id && !c.id.startsWith('CONV-') && c.id.length > 8) {
            convCode = `CONV-${c.id.slice(0, 8).toUpperCase()}`;
          }

          const attachments: EvidenceAttachmentItem[] = (c.document_urls && c.document_urls.length > 0)
            ? c.document_urls.map((url, uIdx) => {
                const fileName = url.split('/').pop()?.split('?')[0] || `Attachment_${uIdx + 1}`;
                const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
                return {
                  id: `att-db-${c.id}-${uIdx}`,
                  name: decodeURIComponent(fileName),
                  size: 'Dokumen',
                  type: isImg ? 'image' : 'pdf',
                  url
                };
              })
            : [];

          const displayJob = c.job_number
            ? (c.job_number.startsWith('#') ? c.job_number : `#${c.job_number}`)
            : '-';

          return {
            id: c.id,
            conversation_id: convCode,
            job_number: displayJob,
            company: c.company_name || 'Tanpa Perusahaan',
            source: c.channel_type === 'WhatsApp' ? 'WhatsApp' : 'Meeting',
            date: formatDateDisplay(c.conversation_date),
            pic: c.sales_pic_name || 'Sales Executive',
            summary: c.summary || '',
            status: c.status || 'active',
            urgency_level: c.urgency_level || 'standard',
            need_assistance: c.need_assistance,
            document_urls: c.document_urls || [],
            connected_job_numbers: displayJob !== '-' ? [displayJob] : [],
            evidence_attachments: attachments,
            customer_id: c.customer_id,
            created_at: c.created_at,
          };
        });

        setConversations(mappedDb);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error loading database conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered rows
  const filteredRows = conversations.filter(item => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchJob = item.job_number.toLowerCase().includes(q);
      const matchComp = item.company.toLowerCase().includes(q);
      const matchId = item.conversation_id.toLowerCase().includes(q);
      const matchPic = item.pic.toLowerCase().includes(q);
      const matchSummary = (item.summary || '').toLowerCase().includes(q);
      if (!matchJob && !matchComp && !matchId && !matchPic && !matchSummary) {
        return false;
      }
    }

    // Channel filter
    if (channelFilter !== 'All Channel') {
      if (item.source.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      if ((item.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    // Date filter
    if (dateFilter !== 'All Dates') {
      if (dateFilter === 'Today') {
        const todayStr = formatDateDisplay(new Date().toISOString());
        if (item.date !== todayStr) return false;
      } else if (item.date !== dateFilter) {
        return false;
      }
    }

    return true;
  });

  // Calculate Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

  // Real Customer Options from Database
  const accountOptions = customerList.map(
    c => `${c.company_name} (${c.customer_code || 'CUST-001'})`
  );

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Conversation ID', 'Job Number', 'Company', 'Source', 'Date', 'PIC', 'Summary', 'Status'];
      const rows = filteredRows.map(r => [
        `"${r.conversation_id}"`,
        `"${r.job_number}"`,
        `"${r.company.replace(/"/g, '""')}"`,
        `"${r.source}"`,
        `"${r.date}"`,
        `"${r.pic}"`,
        `"${(r.summary || '').replace(/"/g, '""')}"`,
        `"${r.status || 'active'}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Record_Customer_Conversation_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal mengekspor data.');
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (item: ConversationDisplayItem) => {
    setSelectedConversation(item);
    setIsEditDetailMode(false);
    setEditSummary(item.summary || '');
    setEditStatus(item.status || 'active');

    if (item.connected_job_numbers && item.connected_job_numbers.length > 0) {
      setEditJobNumbers([...item.connected_job_numbers]);
    } else if (item.job_number && item.job_number !== '-') {
      setEditJobNumbers([item.job_number]);
    } else {
      setEditJobNumbers([]);
    }

    if (item.evidence_attachments && item.evidence_attachments.length > 0) {
      setEditAttachments(item.evidence_attachments);
    } else if (item.document_urls && item.document_urls.length > 0) {
      const mappedDocs: EvidenceAttachmentItem[] = item.document_urls.map((url, idx) => {
        const fileName = url.split('/').pop()?.split('?')[0] || `Attachment_${idx + 1}`;
        const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
        return {
          id: `att-doc-${idx}-${Date.now()}`,
          name: decodeURIComponent(fileName),
          size: 'Dokumen',
          type: isImage ? 'image' : 'pdf',
          url
        };
      });
      setEditAttachments(mappedDocs);
    } else {
      setEditAttachments([]);
    }

    setEditAuditLogs(item.audit_logs || []);
    setDetailSuccessMsg(null);
    setIsDetailModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateFormError(null);
    if (accountOptions.length > 0) {
      setSelectedAccount(accountOptions[0]);
    } else {
      setSelectedAccount('');
    }
    setJobNumberInput('');

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setRecordDate(`${dd}/${mm}/${yyyy}`);

    setChannelSelection('WhatsApp');
    setRecordSummary('');
    setNewUploadedFiles([]);
    setIsCreateModalOpen(true);
  };

  // Upload file in Create Modal
  const handleCreateFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (newUploadedFiles.length + fileList.length > 5) {
      setCreateFormError('Maksimal 5 berkas per percakapan.');
      return;
    }

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        setCreateFormError(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimum 10 MB.`);
        if (createFileInputRef.current) createFileInputRef.current.value = '';
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (channelSelection === 'WhatsApp') {
        if (ext !== 'txt' && file.type !== 'text/plain') {
          setCreateFormError(`Untuk channel WhatsApp, berkas "${file.name}" harus berformat .txt (export chat).`);
          if (createFileInputRef.current) createFileInputRef.current.value = '';
          return;
        }
      } else if (channelSelection === 'Meeting') {
        if (ext !== 'pdf' && !file.type.includes('pdf')) {
          setCreateFormError(`Untuk channel Meeting, berkas "${file.name}" harus berformat PDF (.pdf).`);
          if (createFileInputRef.current) createFileInputRef.current.value = '';
          return;
        }
      }
    }

    setIsUploadingFile(true);
    try {
      for (const file of fileList) {
        const res = await uploadApiFile(file);
        if (res.success && res.data) {
          setNewUploadedFiles(prev => [...prev, res.data!]);
        } else {
          setNewUploadedFiles(prev => [
            ...prev,
            {
              file_name: file.name,
              file_type: file.type || (channelSelection === 'WhatsApp' ? 'text/plain' : 'application/pdf'),
              file_url: URL.createObjectURL(file),
              file_size_kb: Math.round(file.size / 1024)
            }
          ]);
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
    } finally {
      setIsUploadingFile(false);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
    }
  };

  // Submit New Conversation to Database
  const handleSubmitNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    const hasAccount = Boolean(selectedAccount.trim());
    const hasDate = Boolean(recordDate.trim());
    const hasChannel = Boolean(channelSelection);
    const hasSummary = Boolean(recordSummary.trim());

    if (!hasAccount && !hasDate && !hasChannel && !hasSummary) {
      setCreateFormError('Data wajib Record Conversation tidak diisi. Harap lengkapi Customer/Company, Tanggal/Waktu, Channel, Isi/Ringkasan, dan Berkas Lampiran.');
      return;
    }

    if (!hasAccount) {
      setCreateFormError('Customer/Company harus dipilih.');
      return;
    }

    if (!hasDate) {
      setCreateFormError('Tanggal/Waktu harus diisi.');
      return;
    }

    if (!hasChannel) {
      setCreateFormError('Channel harus dipilih.');
      return;
    }

    if (!hasSummary) {
      setCreateFormError('Isi/Ringkasan harus diisi.');
      return;
    }

    // MANDATORY FILE UPLOAD CHECK (Wajib diisi, bukan optional)
    if (newUploadedFiles.length === 0) {
      setCreateFormError(
        channelSelection === 'WhatsApp'
          ? 'Berkas export chat berformat .txt wajib diunggah untuk channel WhatsApp.'
          : 'Berkas notula meeting berformat .pdf wajib diunggah untuk channel Meeting.'
      );
      return;
    }

    const summaryWords = recordSummary.trim().split(/\s+/).filter(Boolean);
    if (summaryWords.length > 200) {
      setCreateFormError(`Isi ringkasan percakapan melebihi batas maksimum 200 kata (saat ini ${summaryWords.length} kata). Mohon persingkat.`);
      return;
    }

    // Match customer from DB customerList
    let matchedCompany = customerList.find(c => {
      const optionStr = `${c.company_name} (${c.customer_code || 'CUST-001'})`;
      return optionStr === selectedAccount || c.company_name.toLowerCase() === selectedAccount.toLowerCase();
    });

    if (!matchedCompany && customerList.length > 0) {
      matchedCompany = customerList[0];
    }

    if (!matchedCompany) {
      setCreateFormError('Tidak dapat menemukan data akun Customer dari database.');
      return;
    }

    // Convert date string DD/MM/YYYY to YYYY-MM-DD for database
    let formattedDateForDb = new Date().toISOString().split('T')[0];
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(recordDate)) {
      const [dd, mm, yyyy] = recordDate.split('/');
      formattedDateForDb = `${yyyy}-${mm}-${dd}`;
    }

    const rawJob = jobNumberInput.trim();

    setIsSubmittingNew(true);
    try {
      const res = await createApiConversation({
        customer_id: matchedCompany.company_list_id,
        customer_code: matchedCompany.customer_code || undefined,
        job_number: rawJob ? rawJob.replace(/^#/, '') : undefined,
        channel_type: channelSelection,
        conversation_date: formattedDateForDb,
        summary: recordSummary.trim(),
        need_assistance: false,
        urgency_level: 'standard',
        sales_pic_name: activeUserName,
        uploaded_files: newUploadedFiles
      });

      if (!res.success || !res.data) {
        setCreateFormError(res.error || 'Gagal menyimpan percakapan ke database');
        setIsSubmittingNew(false);
        return;
      }

      await loadData();
      setRecordSummary('');
      setNewUploadedFiles([]);
      setJobNumberInput('');
      setIsCreateModalOpen(false);
      setSaveSuccessNotif(true);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setCreateFormError(`Gagal menyimpan percakapan ke database: ${err?.message || err}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Save Edit Detail to Database
  const handleSaveDetail = async () => {
    if (!selectedConversation) return;
    setIsSavingDetail(true);
    setDetailSuccessMsg(null);
    try {
      const res = await updateApiConversation({
        id: selectedConversation.id,
        summary: editSummary.trim(),
        status: editStatus as any,
        document_urls: editAttachments.map(a => a.url),
        job_number: editJobNumbers.length > 0 ? editJobNumbers[0].replace(/^#/, '') : undefined
      });

      if (res.success) {
        setDetailSuccessMsg('Perubahan berhasil disimpan ke database');
        await loadData();
        setIsEditDetailMode(false);
        setSaveSuccessNotif(true);
      } else {
        alert(`Gagal memperbarui percakapan: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Error saving detail:', err);
      alert(`Gagal menyimpan: ${err?.message || err}`);
    } finally {
      setIsSavingDetail(false);
    }
  };

  return (
    <div className="w-full pb-10">
      {/* Save Record Success Notification Toast */}
      {saveSuccessNotif && (
        <div
          onClick={() => setSaveSuccessNotif(false)}
          className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 cursor-pointer select-none border border-slate-700/60"
          title="Klik untuk menutup"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={14} className="text-emerald-400 stroke-[3]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-xs">Record Conversation Tersimpan</span>
            <span className="text-[11px] text-slate-300 font-normal">Data percakapan berhasil diperbarui ke database</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSaveSuccessNotif(false);
            }}
            className="ml-2 text-slate-400 hover:text-white p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. TOP CONTROLS AND ACTION BAR CARD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Job Number, Customer, PIC, ID..."
              className="w-full bg-[#f4f6fa] border border-slate-200/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Channel Type Dropdown */}
          <div className="relative" ref={channelDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsChannelDropdownOpen(!isChannelDropdownOpen);
                setIsDateDropdownOpen(false);
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>{channelFilter === 'All Channel' ? 'Channel Type' : `Channel: ${channelFilter}`}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isChannelDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isChannelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Channel', 'Meeting', 'WhatsApp'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setChannelFilter(opt);
                      setCurrentPage(1);
                      setIsChannelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      channelFilter === opt ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {channelFilter === opt && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            title="Export CSV"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export</span>
          </button>
        </div>

        {/* Right: + Record Conversation Button */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-[#0062ff] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Record Conversation</span>
        </button>
      </div>

      {/* 2. PAGE HEADING */}
      <h1 className="text-2xl font-bold text-[#0f172a] mt-7 mb-5 tracking-tight">
        Record Customer Conversation
      </h1>

      {/* 3. TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            {/* TABLE HEADER */}
            <thead className="bg-[#c6d2e6] border-b border-slate-300/60">
              <tr>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Conversation ID
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Job Number
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-left tracking-normal">
                  Company
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Channel
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Date
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  PIC
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Detail
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`conv-skeleton-${idx}`} className="animate-pulse border-b border-slate-100">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-24 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-32 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-44" /></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-200/70 rounded-full w-24 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-24 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-20 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Search size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Record Conversation Tidak Ditemukan
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Belum ada percakapan tersimpan di database yang sesuai dengan filter pencarian.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Buat Record Conversation Baru</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, idx) => (
                  <tr 
                    key={`${row.id || 'row'}-${idx}`} 
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Conversation ID */}
                    <td className="py-4.5 px-6 text-center text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {row.conversation_id}
                    </td>

                    {/* Job Number */}
                    <td className="py-4.5 px-6 text-center text-sm font-bold text-slate-900 whitespace-nowrap">
                      {row.job_number}
                    </td>

                    {/* Company */}
                    <td className="py-4.5 px-6 text-left text-sm font-semibold text-slate-800 max-w-[260px] leading-snug">
                      {row.company}
                    </td>

                    {/* Channel Badge */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      {row.source.toLowerCase() === 'meeting' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#f4e8ff] text-[#9333ea] border border-[#e9d5ff]">
                          <Video size={13} className="text-[#9333ea]" />
                          <span>Meeting</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#e6f9ed] text-[#16a34a] border border-[#bbf7d0]">
                          <MessageCircle size={13} className="text-[#16a34a]" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4.5 px-6 text-center text-sm text-slate-700 whitespace-nowrap font-normal">
                      {row.date || '-'}
                    </td>

                    {/* PIC */}
                    <td className="py-4.5 px-6 text-center text-sm text-slate-700 whitespace-nowrap font-medium">
                      {row.pic}
                    </td>

                    {/* Detail Link */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(row)}
                        className="text-[#2563eb] hover:text-blue-700 hover:underline font-medium text-sm cursor-pointer transition-colors"
                      >
                        See more..
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. DYNAMIC PAGINATION FOOTER */}
        <div className="py-3.5 px-6 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredRows.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}</strong> to <strong className="text-slate-800">{Math.min(validCurrentPage * pageSize, filteredRows.length)}</strong> of <strong className="text-slate-800">{filteredRows.length}</strong> conversations
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  validCurrentPage === p
                    ? 'bg-[#1d4ed8] text-white shadow-2xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button 
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. "SEE MORE.." DETAIL MODAL */}
      {isDetailModalOpen && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header with Logo */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-slate-200/80 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#07111e] rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-xs border border-slate-700/20 select-none">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-ANDIMA-wzx4gpZx20EFE5IYcH3jqabixELIo3.png"
                    alt="Logo ANDIMA"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/Logo-ANDIMA.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0f172a] tracking-tight">
                    Detail Conversation
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {selectedConversation.conversation_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {detailSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
                  {detailSuccessMsg}
                </div>
              )}

              {/* 1. Customer / Company Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      CUSTOMER / COMPANY
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedConversation.company}
                    </h4>
                  </div>

                  {selectedConversation.source.toLowerCase() === 'meeting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f4e8ff] text-[#9333ea] border border-[#e9d5ff] shrink-0">
                      <Video size={13} className="text-[#9333ea]" />
                      <span>Meeting</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f9ed] text-[#16a34a] border border-[#bbf7d0] shrink-0">
                      <MessageCircle size={13} className="text-[#16a34a]" />
                      <span>WhatsApp</span>
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 my-3" />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-xs text-slate-400 font-normal block">Dibuat Oleh:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.pic}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-normal block">Tanggal:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.date || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Connected Job Numbers */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  CONNECTED JOB NUMBERS
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedConversation.connected_job_numbers && selectedConversation.connected_job_numbers.length > 0 ? (
                    selectedConversation.connected_job_numbers.map((job, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs"
                      >
                        <Tag size={13} className="text-[#2563eb]" />
                        <span>{job}</span>
                      </div>
                    ))
                  ) : selectedConversation.job_number && selectedConversation.job_number !== '-' ? (
                    <div className="inline-flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs">
                      <Tag size={13} className="text-[#2563eb]" />
                      <span>{selectedConversation.job_number}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Belum ada Job Number terhubung</span>
                  )}
                </div>
              </div>

              {/* 3. Full Resume / Summary */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  FULL RESUME / CONCLUSION
                </label>
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-normal shadow-2xs">
                  {selectedConversation.summary || 'Tidak ada isi/ringkasan percakapan.'}
                </div>
              </div>

              {/* 4. Evidence Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    EVIDENCE ATTACHMENTS ({(selectedConversation.evidence_attachments || []).length})
                  </span>
                </div>

                {selectedConversation.evidence_attachments && selectedConversation.evidence_attachments.length > 0 ? (
                  selectedConversation.evidence_attachments.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors mb-2"
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {file.size}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ isOpen: true, url: file.url, title: file.name })}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="View"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-400">
                    Tidak ada berkas terlampir pada percakapan ini.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. "+ RECORD CONVERSATION" CREATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[540px] overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header with Logo */}
            <div className="px-6 py-4 flex items-start justify-between border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#07111e] rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-xs border border-slate-700/20 select-none">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-ANDIMA-wzx4gpZx20EFE5IYcH3jqabixELIo3.png"
                    alt="Logo ANDIMA"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/Logo-ANDIMA.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    Record Customer Conversation
                  </h3>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Log WhatsApp threads or meeting documents directly to database.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitNewConversation} className="px-6 py-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Validation Error Alert */}
              {createFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{createFormError}</div>
                </div>
              )}

              {/* Select Customer * */}
              <div className="relative" ref={accountDropdownRef}>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Select Customer<span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                >
                  <span className="truncate">{selectedAccount || 'Pilih Customer...'}</span>
                  <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isAccountDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 flex flex-col gap-1.5">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder="Cari customer / perusahaan..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-40 space-y-0.5">
                      {accountOptions
                        .filter((acc) => acc.toLowerCase().includes(customerSearchQuery.toLowerCase().trim()))
                        .map((acc) => (
                          <button
                            key={acc}
                            type="button"
                            onClick={() => {
                              setSelectedAccount(acc);
                              setIsAccountDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                              selectedAccount === acc ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{acc}</span>
                            {selectedAccount === acc && <Check size={14} className="text-blue-600 shrink-0" />}
                          </button>
                        ))}
                      {accountOptions.filter((acc) => acc.toLowerCase().includes(customerSearchQuery.toLowerCase().trim())).length === 0 && (
                        <div className="p-2 text-center text-xs text-slate-400">
                          Tidak ada customer yang cocok &quot;{customerSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Number (Optional) */}
              <div className="relative" ref={jobNumberDropdownRef}>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Job Number (Optional)</span>
                  {jobNumberInput && (
                    <span className="text-[10px] text-blue-600 font-semibold truncate max-w-[180px]">
                      Terpilih: {jobNumberInput}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={jobNumberInput}
                    onFocus={() => setIsJobNumberDropdownOpen(true)}
                    onChange={(e) => {
                      setJobNumberInput(e.target.value);
                      setIsJobNumberDropdownOpen(true);
                    }}
                    placeholder="Ketik Job Number... (mis. #AENAT/2609/0305)"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-9 py-2.5 text-xs font-medium text-slate-800 outline-none shadow-2xs transition-colors placeholder:text-slate-400"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  {jobNumberInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setJobNumberInput('');
                        setIsJobNumberDropdownOpen(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title="Hapus pencarian"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isJobNumberDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1.5 animate-in fade-in slide-in-from-top-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                      <span>Rekomendasi Job Number DB</span>
                      <span>{
                        Array.from(new Set(conversations.map(c => c.job_number).filter(j => j && j !== '-')))
                          .filter(j => j.toLowerCase().includes(jobNumberInput.toLowerCase().trim())).length
                      } opsi</span>
                    </div>
                    {Array.from(new Set(conversations.map(c => c.job_number).filter(j => j && j !== '-')))
                      .filter(j => j.toLowerCase().includes(jobNumberInput.toLowerCase().trim())).length > 0 ? (
                        Array.from(new Set(conversations.map(c => c.job_number).filter(j => j && j !== '-')))
                          .filter(j => j.toLowerCase().includes(jobNumberInput.toLowerCase().trim())).map((job) => (
                            <button
                              key={job}
                              type="button"
                              onClick={() => {
                                setJobNumberInput(job);
                                setIsJobNumberDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                                jobNumberInput === job ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Tag size={13} className="text-blue-500 shrink-0" />
                                <span className="truncate">{job}</span>
                              </div>
                              {jobNumberInput === job && <Check size={14} className="text-blue-600 shrink-0" />}
                            </button>
                          ))
                    ) : (
                      <div className="p-2 text-center text-xs text-slate-400">
                        Tidak ada Job Number tersimpan yang cocok dengan &quot;{jobNumberInput}&quot;
                      </div>
                    )}
                    {jobNumberInput.trim() && (
                      <button
                        type="button"
                        onClick={() => setIsJobNumberDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100 rounded-lg mt-1 flex items-center gap-1.5 cursor-pointer border border-blue-100"
                      >
                        <Plus size={13} />
                        <span className="truncate">Gunakan Job Number baru: &quot;{jobNumberInput.trim()}&quot;</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Time * */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={recordDate}
                    onChange={(e) => {
                      const formatted = formatWithSlashes(e.target.value);
                      setRecordDate(formatted);
                    }}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-4 pr-10 py-2.5 text-xs font-medium text-slate-800 outline-none shadow-2xs transition-colors placeholder:text-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="date"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [yyyy, mm, dd] = val.split('-');
                          setRecordDate(`${dd}/${mm}/${yyyy}`);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title="Pilih tanggal dari kalender"
                    />
                    <Calendar size={16} className="text-blue-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Channel Type * */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Channel Type<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setChannelSelection('WhatsApp');
                      setNewUploadedFiles(prev => prev.filter(f => (f.file_name.split('.').pop()?.toLowerCase() || '') === 'txt'));
                    }}
                    className={`rounded-xl py-2.5 px-4 flex items-center justify-between cursor-pointer transition-all ${
                      channelSelection === 'WhatsApp'
                        ? 'border-2 border-[#2563eb] bg-white shadow-2xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <span className={`text-xs ${channelSelection === 'WhatsApp' ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-600'}`}>
                      WhatsApp (.txt)
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      channelSelection === 'WhatsApp' ? 'border-2 border-[#2563eb]' : 'border border-slate-300'
                    }`}>
                      {channelSelection === 'WhatsApp' && <div className="w-2 h-2 rounded-full bg-[#2563eb]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setChannelSelection('Meeting');
                      setNewUploadedFiles(prev => prev.filter(f => (f.file_name.split('.').pop()?.toLowerCase() || '') === 'pdf'));
                    }}
                    className={`rounded-xl py-2.5 px-4 flex items-center justify-between cursor-pointer transition-all ${
                      channelSelection === 'Meeting'
                        ? 'border-2 border-[#2563eb] bg-white shadow-2xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={15} className={channelSelection === 'Meeting' ? 'text-[#2563eb]' : 'text-slate-400'} />
                      <span className={`text-xs ${channelSelection === 'Meeting' ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-600'}`}>
                        Meeting Document (.pdf)
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      channelSelection === 'Meeting' ? 'border-2 border-[#2563eb]' : 'border border-slate-300'
                    }`}>
                      {channelSelection === 'Meeting' && <div className="w-2 h-2 rounded-full bg-[#2563eb]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Summary * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Text Summary<span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-medium ${
                    recordSummary.trim().split(/\s+/).filter(Boolean).length > 200
                      ? 'text-red-500 font-bold'
                      : 'text-slate-400'
                  }`}>
                    {recordSummary.trim().split(/\s+/).filter(Boolean).length} / 200 kata
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={recordSummary}
                  onChange={(e) => setRecordSummary(e.target.value)}
                  placeholder="Diskusi koordinasi pengiriman kargo dan verifikasi kontainer..."
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl p-3 text-xs font-normal text-slate-800 leading-relaxed outline-none shadow-2xs transition-colors resize-none placeholder:text-slate-400"
                />
              </div>

              {/* File Upload (Mandatory) */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  File Attachment <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => createFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    handleCreateFileUpload(e.dataTransfer.files);
                  }}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 bg-[#f8fafc] flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDraggingFile ? 'border-blue-500 bg-blue-50/20' : 'border-slate-300/80 hover:border-blue-400'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] mb-2 shadow-2xs">
                    <UploadCloud size={20} className="text-[#2563eb]" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {channelSelection === 'WhatsApp'
                      ? 'Upload WhatsApp chat export file (.txt)'
                      : 'Upload meeting notes or document (.pdf)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Drag and drop your file here, or <span className="text-[#2563eb] font-semibold underline">Browse files</span>
                  </p>
                  <div className="mt-2.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-[10px] text-slate-500 font-medium">
                    {channelSelection === 'WhatsApp'
                      ? 'Wajib diisi • Khusus berkas berformat .txt (Maks 10MB)'
                      : 'Wajib diisi • Khusus berkas berformat .pdf (Maks 10MB)'}
                  </div>
                </div>
                <input
                  ref={createFileInputRef}
                  type="file"
                  multiple
                  accept={channelSelection === 'WhatsApp' ? '.txt,text/plain' : '.pdf,application/pdf'}
                  onChange={(e) => handleCreateFileUpload(e.target.files)}
                  className="hidden"
                />

                {newUploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newUploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText size={13} className="text-blue-600 shrink-0" />
                          <span className="truncate font-medium text-slate-700">{file.file_name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({file.file_size_kb || 12} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 -mx-6 -mb-4 px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-3xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" />
                  <span className="text-xs text-slate-400 font-medium">
                    Auto-synced with Supabase Database
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew || isUploadingFile}
                    className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmittingNew ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save Record</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PREVIEW MODAL */}
      {previewModal?.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">{previewModal.title}</span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px] bg-slate-50">
              <iframe
                src={previewModal.url}
                className="w-full h-96 rounded-lg border border-slate-200"
                title={previewModal.title}
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
