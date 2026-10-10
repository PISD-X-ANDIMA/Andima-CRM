'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ChevronDown, ChevronRight, Plus, Download, Video, MessageCircle,
  X, UploadCloud, FileText, Check, Loader2, Calendar,
  ExternalLink, AlertCircle, Save, Tag, Trash2, HelpCircle,
  ShieldCheck, Lock as LockIcon, CheckCircle, XCircle
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
import { ManagerNotificationItem } from './dashboard/DashboardHeader';

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
  job_number?: string;
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
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

const MOCK_FIGMA_CONVERSATIONS: ConversationDisplayItem[] = [
  {
    id: 'conv-figma-1',
    conversation_id: 'CONV-56757',
    company: 'PT. JPG Trans Indonesia',
    source: 'Meeting',
    date: '03/03/2026',
    pic: 'Aida',
    summary: 'Diskusi bersama Pak Hendra mengenai kepastian jadwal kontainer di Gate 3 Priok.',
    status: 'active',
    need_assistance: true,
    document_urls: [],
    connected_job_numbers: []
  },
  {
    id: 'conv-figma-2',
    conversation_id: 'CONV-56757',
    company: 'PT. DSV Transport Indonesia',
    source: 'Meeting',
    date: '03/03/2026',
    pic: 'Aida',
    summary: 'Pembahasan dokumen meeting dan penanganan kendala customs clearance.',
    status: 'active',
    need_assistance: false,
    document_urls: [],
    connected_job_numbers: []
  },
  {
    id: 'conv-figma-3',
    conversation_id: 'CONV-56758',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '03/03/2026',
    pic: 'Wulan',
    summary: 'Export chat WhatsApp perihal jadwal kedatangan kargo impor.',
    status: 'active',
    need_assistance: true,
    document_urls: [],
    connected_job_numbers: []
  },
  {
    id: 'conv-figma-4',
    conversation_id: 'CONV-56758',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '03/03/2026',
    pic: 'Wulan',
    summary: 'Update status pengiriman dan respon dari tim operasional lapangan.',
    status: 'active',
    need_assistance: false,
    document_urls: [],
    connected_job_numbers: []
  },
  {
    id: 'conv-figma-5',
    conversation_id: 'CONV-56758',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '03/03/2026',
    pic: 'Wulan',
    summary: 'Konfirmasi penyelesaian tagihan dan serah terima dokumen kargo.',
    status: 'active',
    need_assistance: false,
    document_urls: [],
    connected_job_numbers: []
  }
];

interface InteractionTabProps {
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  };
}

export default function InteractionTab({ currentUser }: InteractionTabProps = {}) {
  // State nama akun aktif & role untuk PIC & Hak Akses
  const [activeUserName, setActiveUserName] = useState<string>(() => {
    if (currentUser?.name && currentUser.name.trim()) return currentUser.name.trim();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name && parsed.name.trim()) return parsed.name.trim();
        }
      } catch { }
    }
    return 'Sales Executive';
  });

  const [activeUserRole, setActiveUserRole] = useState<string>(() => {
    if (currentUser?.role && currentUser.role.trim()) return currentUser.role.trim();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.role && parsed.role.trim()) return parsed.role.trim();
        }
      } catch { }
    }
    return 'Sales Executive';
  });

  useEffect(() => {
    if (currentUser?.name && currentUser.name.trim()) {
      setActiveUserName(currentUser.name.trim());
    }
    if (currentUser?.role && currentUser.role.trim()) {
      setActiveUserRole(currentUser.role.trim());
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name && parsed.name.trim()) setActiveUserName(parsed.name.trim());
          if (parsed?.role && parsed.role.trim()) setActiveUserRole(parsed.role.trim());
        }
      } catch { }
    }
  }, [currentUser]);

  // State untuk Fitur Bantuan Footer "Need Assistance?"
  const [assistanceChoice, setAssistanceChoice] = useState<boolean | null>(null);
  const [assistanceNotice, setAssistanceNotice] = useState<string | null>(null);

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

  // Data States (Connected to Database with Figma Mock Fallback)
  const [conversations, setConversations] = useState<ConversationDisplayItem[]>(MOCK_FIGMA_CONVERSATIONS);
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
  const [createNeedAssistance, setCreateNeedAssistance] = useState<boolean>(false);
  const [isManagerFeedbackModalOpen, setIsManagerFeedbackModalOpen] = useState(false);

  // Format date digits with slashes automatically (DD/MM/YYYY)
  const formatWithSlashes = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const [channelSelection, setChannelSelection] = useState<'WhatsApp' | 'Meeting'>('WhatsApp');
  const [recordSummary, setRecordSummary] = useState('');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [newUploadedFiles, setNewUploadedFiles] = useState<UploadedFileMetadata[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [saveSuccessNotif, setSaveSuccessNotif] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const getWordCount = (str: string): number => {
    return str.trim() ? str.trim().split(/\s+/).filter(Boolean).length : 0;
  };

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

      if (customers && customers.length > 0) {
        const firstCust = customers[0];
        const defaultAcc = `${firstCust.company_name} (${firstCust.customer_code || 'CUST-001'})`;
        setSelectedAccount(prev => prev || defaultAcc);
      }

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

        setConversations(mappedDb.length > 0 ? mappedDb : MOCK_FIGMA_CONVERSATIONS);
      } else {
        setConversations(MOCK_FIGMA_CONVERSATIONS);
      }
    } catch (err) {
      console.error('Error loading database conversations:', err);
      setConversations(MOCK_FIGMA_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-open Detail Modal if URL query param contains open_conv_id or need_assist
  useEffect(() => {
    if (conversations.length === 0) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const openConvId = urlParams.get('open_conv_id');
      const needAssistParam = urlParams.get('need_assist');

      if (openConvId || needAssistParam === 'true') {
        let targetItem = conversations.find(c => c.id === openConvId || c.conversation_id === openConvId);
        if (!targetItem && needAssistParam === 'true') {
          targetItem = conversations.find(c => c.need_assistance === true);
        }

        if (targetItem) {
          handleOpenDetail(targetItem);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch (e) {
      console.error('Error auto-opening conversation detail from URL:', e);
    }
  }, [conversations]);

  // Role Oversight & Privacy Isolation Check
  const isManager = activeUserRole.toLowerCase().includes('manager') ||
    activeUserRole.toLowerCase().includes('manajemen') ||
    activeUserRole.toLowerCase().includes('director');

  // Export Text Summary Helper Function
  const handleExportTextSummary = (item: ConversationDisplayItem) => {
    try {
      const textContent = `================================================
RECORD CUSTOMER CONVERSATION SUMMARY
PT. ANDIMA TRANSPORTINDO
================================================

Conversation ID : ${item.conversation_id}
Company / Client: ${item.company}
Channel Type    : ${item.source}
Date            : ${item.date || '-'}
PIC / Agent     : ${item.pic}
Status          : ${item.status || 'active'}

------------------------------------------------
TEXT SUMMARY / CONCLUSION:
------------------------------------------------
${item.summary || 'Tidak ada ringkasan percakapan.'}

================================================
Exported on: ${new Date().toLocaleString('id-ID')}
================================================`;

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Summary_${item.conversation_id}_${item.company.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export text summary error:', err);
      alert('Gagal mengekspor Text Summary.');
    }
  };

  // Export Direct PDF Summary Helper Function (Only Summary, No Customer Info, Direct Download)
  const handleDownloadSummaryPdf = (item: ConversationDisplayItem) => {
    try {
      const summaryText = item.summary || 'Discussed recent shipment delays. Customer requested schedule adjustment for container #2 and re-verification of documentation at Tanjung Priok Port.';
      const convId = item.conversation_id || 'CONV';
      const fileName = `Summary_${convId}.pdf`;

      // Format summaryText into wrapped lines of max 65 chars
      const rawLines = summaryText.split(/\r?\n/);
      const wrappedLines: string[] = [];
      for (const line of rawLines) {
        if (!line) {
          wrappedLines.push('');
          continue;
        }
        if (line.length <= 65) {
          wrappedLines.push(line);
        } else {
          const words = line.split(' ');
          let current = '';
          for (const w of words) {
            if ((current + ' ' + w).length <= 65) {
              current = current ? current + ' ' + w : w;
            } else {
              if (current) wrappedLines.push(current);
              current = w;
            }
          }
          if (current) wrappedLines.push(current);
        }
      }

      const pdfEscape = (str: string) =>
        str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

      // Build PDF Stream (Only Summary)
      let streamText = `BT\n/F1 16 Tf\n50 780 Td\n0 0 0 rg\n(${pdfEscape(`CONVERSATION SUMMARY - ${convId}`)}) Tj\nET\n`;
      streamText += `BT\n/F1 12 Tf\n0.2 0.2 0.2 rg\n50 740 Td\n18 TL\n`;
      streamText += `(SUMMARY) Tj\nT*\nT*\n`;

      for (let i = 0; i < wrappedLines.length; i++) {
        const line = pdfEscape(wrappedLines[i]);
        streamText += `(${line}) Tj\n`;
        if (i < wrappedLines.length - 1) {
          streamText += `T*\n`;
        }
      }
      streamText += `ET\n`;

      const encoder = new TextEncoder();
      const streamBytes = encoder.encode(streamText);
      const streamLen = streamBytes.length;

      const header = `%PDF-1.4\n`;
      const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
      const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
      const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595.28 841.89] /Contents 5 0 R >>\nendobj\n`;
      const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
      const obj5Header = `5 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
      const obj5Footer = `\nendstream\nendobj\n`;

      const part1 = encoder.encode(header + obj1 + obj2 + obj3 + obj4 + obj5Header);
      const part2 = streamBytes;
      const part3 = encoder.encode(obj5Footer);

      const offset1 = encoder.encode(header).length;
      const offset2 = offset1 + encoder.encode(obj1).length;
      const offset3 = offset2 + encoder.encode(obj2).length;
      const offset4 = offset3 + encoder.encode(obj3).length;
      const offset5 = offset4 + encoder.encode(obj4).length;
      const xrefOffset = offset5 + encoder.encode(obj5Header).length + streamLen + encoder.encode(obj5Footer).length;

      const pad = (n: number) => String(n).padStart(10, '0');
      const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
      const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      const part4 = encoder.encode(xref + trailer);

      const blob = new Blob([part1, part2, part3, part4], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download summary PDF error:', err);
      handleExportTextSummary(item);
    }
  };

  // Footer Need Assistance Handler
  const handleAssistanceChoice = (needHelp: boolean) => {
    setAssistanceChoice(needHelp);
    if (needHelp) {
      setAssistanceNotice('Permintaan bantuan telah dicatat. Tim Support / Dispatcher akan segera menghubungi Anda.');
    } else {
      setAssistanceNotice('Terima kasih. Konfirmasi "Tidak Membutuhkan Bantuan" telah tersimpan.');
    }
    setTimeout(() => setAssistanceNotice(null), 4000);
  };

  // Filtered rows (Global Search & All Active Filters)
  const filteredRows = conversations.filter(item => {
    // Global Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchComp = item.company.toLowerCase().includes(q);
      const matchId = item.conversation_id.toLowerCase().includes(q);
      const matchPic = item.pic.toLowerCase().includes(q);
      const matchSummary = (item.summary || '').toLowerCase().includes(q);
      const matchJob = (item.job_number || '').toLowerCase().includes(q);
      if (!matchComp && !matchId && !matchPic && !matchSummary && !matchJob) {
        return false;
      }
    }

    // Channel filter
    if (channelFilter !== 'All Channel' && channelFilter !== 'All Channels') {
      if (item.source.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'All Status' && statusFilter !== 'All Statuses') {
      if ((item.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    // Period / Date filter
    if (dateFilter !== 'All Dates' && dateFilter !== 'All Periods') {
      if (dateFilter === 'Today') {
        const todayStr = formatDateDisplay(new Date().toISOString());
        if (item.date !== todayStr) return false;
      } else if (dateFilter === 'This Week') {
        const now = new Date();
        const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (item.date && /^\d{2}\/\d{2}\/\d{4}$/.test(item.date)) {
          const [dd, mm, yyyy] = item.date.split('/').map(Number);
          const itemD = new Date(yyyy, mm - 1, dd);
          if (itemD < pastWeek || itemD > now) return false;
        }
      } else if (dateFilter === 'This Month') {
        const now = new Date();
        const currentMm = String(now.getMonth() + 1).padStart(2, '0');
        const currentYyyy = String(now.getFullYear());
        if (item.date && /^\d{2}\/\d{2}\/\d{4}$/.test(item.date)) {
          const [, mm, yyyy] = item.date.split('/');
          if (mm !== currentMm || yyyy !== currentYyyy) return false;
        }
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
    setSummaryError(null);
    setAttachmentError(null);
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
    setCreateNeedAssistance(false);
    setIsCreateModalOpen(true);
  };

  // Switch channel with automatic file re-validation
  const handleChannelSelectionChange = (newChannel: 'WhatsApp' | 'Meeting') => {
    setChannelSelection(newChannel);
    setAttachmentError(null);

    // If switched to WhatsApp, check existing uploaded files for non-.txt formats
    if (newChannel === 'WhatsApp' && newUploadedFiles.length > 0) {
      const invalidFiles = newUploadedFiles.filter(f => {
        const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
        return ext !== 'txt' && f.file_type !== 'txt' && f.file_type !== 'text/plain';
      });

      if (invalidFiles.length > 0) {
        const validFiles = newUploadedFiles.filter(f => {
          const ext = f.file_name.split('.').pop()?.toLowerCase() || '';
          return ext === 'txt' || f.file_type === 'txt' || f.file_type === 'text/plain';
        });
        setNewUploadedFiles(validFiles);
        setAttachmentError(`Beberapa berkas (${invalidFiles.map(i => i.file_name).join(', ')}) dihapus karena channel WhatsApp hanya menerima file berformat .txt (Export Chat).`);
      }
    }
  };

  // Upload file in Create Modal with 5 MB & Channel Type validation (Lecturer Rules 3 & 4)
  const handleCreateFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setAttachmentError(null);

    if (newUploadedFiles.length + fileList.length > 5) {
      setAttachmentError('Maksimal 5 berkas lampiran per percakapan.');
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      return;
    }

    for (const file of fileList) {
      // Lecturer Rule 4: Ukuran attachment lebih dari 5 MB -> Menolak attachment
      if (file.size > 5 * 1024 * 1024) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setAttachmentError(`Ukuran attachment "${file.name}" (${sizeMb} MB) melebihi batas maksimal 5 MB. Menolak attachment.`);
        if (createFileInputRef.current) createFileInputRef.current.value = '';
        return;
      }

      // Lecturer Rule 3: Jenis attachment tidak sesuai channel -> Menolak attachment
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (channelSelection === 'WhatsApp') {
        if (ext !== 'txt' && file.type !== 'text/plain') {
          setAttachmentError(`Jenis attachment "${file.name}" (.${ext}) tidak sesuai channel WhatsApp. Channel WhatsApp HANYA menerima berkas .txt (Export Chat). Menolak attachment.`);
          if (createFileInputRef.current) createFileInputRef.current.value = '';
          return;
        }
      } else if (channelSelection === 'Meeting') {
        const allowedMeetingExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv'];
        if (!allowedMeetingExts.includes(ext)) {
          setAttachmentError(`Jenis attachment "${file.name}" (.${ext}) tidak sesuai channel Meeting. Format berkas tidak didukung. Menolak attachment.`);
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
          setAttachmentError(`Gagal mengunggah berkas "${file.name}": ${res.error || 'Terjadi kesalahan pada server/storage.'}`);
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setAttachmentError(`Gagal mengunggah berkas: ${err?.message || 'Terjadi kesalahan koneksi.'}`);
    } finally {
      setIsUploadingFile(false);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
    }
  };

  // Submit New Conversation to Database with Lecturer Rules 1 & 2
  const handleSubmitNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    setSummaryError(null);

    const hasAccount = Boolean(selectedAccount.trim());
    const hasDate = Boolean(recordDate.trim());
    const hasChannel = Boolean(channelSelection);
    const summaryText = recordSummary.trim();

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

    // Lecturer Rule 1: Text Summary belum diisi -> Menolak penyimpanan dan menampilkan validasi pada field
    if (!summaryText) {
      setSummaryError('Text Summary belum diisi. Menolak penyimpanan dan menampilkan validasi pada field.');
      setCreateFormError('Text Summary belum diisi. Harap lengkapi ringkasan percakapan.');
      return;
    }

    // Lecturer Rule 2: Text Summary melebihi 100 words -> Menolak penyimpanan dan menampilkan informasi batas maksimal
    const wordCount = getWordCount(recordSummary);
    if (wordCount > 100) {
      setSummaryError(`Text Summary melebihi 100 words (saat ini ${wordCount} kata). Menolak penyimpanan dan menampilkan informasi batas maksimal.`);
      setCreateFormError(`Text Summary melebihi batas maksimum 100 kata (saat ini ${wordCount} kata). Mohon persingkat.`);
      return;
    }

    if (attachmentError) {
      setCreateFormError('Terdapat masalah pada berkas lampiran. Harap perbaiki sebelum menyimpan.');
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
        need_assistance: createNeedAssistance,
        urgency_level: createNeedAssistance ? 'high_priority' : 'standard',
        sales_pic_name: activeUserName,
        uploaded_files: newUploadedFiles
      });

      if (!res.success || !res.data) {
        setCreateFormError(res.error || 'Gagal menyimpan percakapan ke database');
        setIsSubmittingNew(false);
        return;
      }

      if (createNeedAssistance) {
        try {
          const newNotif: ManagerNotificationItem = {
            id: `notif-${Date.now()}`,
            type: 'need_assistance',
            title: 'Permintaan Bantuan (Need Assistance)',
            message: `${activeUserName} membutuhkan bantuan untuk ${matchedCompany.company_name}: "${recordSummary.slice(0, 60)}${recordSummary.length > 60 ? '...' : ''}"`,
            conversation_id: res.data?.id || `conv-${Date.now()}`,
            company_name: matchedCompany.company_name,
            timestamp: 'Baru saja',
            read: false,
          };

          const existingNotifsStr = localStorage.getItem('andima_manager_notifications');
          let existingNotifs: ManagerNotificationItem[] = [];
          if (existingNotifsStr) {
            try { existingNotifs = JSON.parse(existingNotifsStr); } catch { }
          }
          const updatedNotifs = [newNotif, ...existingNotifs];
          localStorage.setItem('andima_manager_notifications', JSON.stringify(updatedNotifs));
          window.dispatchEvent(new Event('andima_notification_update'));
        } catch (err) {
          console.error('Failed to dispatch manager notification:', err);
        }
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-6">
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
              placeholder="Search by ID, Company, Summary..."
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
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${channelFilter === opt ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{opt}</span>
                    {channelFilter === opt && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsChannelDropdownOpen(false);
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>{dateFilter === 'All Dates' ? 'All Periods' : dateFilter}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDateDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Dates', 'Today', 'This Week', 'This Month'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDateFilter(opt);
                      setCurrentPage(1);
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${dateFilter === opt ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{opt === 'All Dates' ? 'All Periods' : opt}</span>
                    {dateFilter === opt && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: + Record Conversation Button */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Record Conversation</span>
        </button>
      </div>

      {/* 2. PAGE HEADING */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
          Record Customer Conversation
        </h1>
      </div>

      {/* 3. TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            {/* TABLE HEADER */}
            <thead className="bg-[#c8d5e8] border-b border-slate-300/60">
              <tr>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal">
                  Conversation ID
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
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-44" /></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-200/70 rounded-full w-24 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-24 mx-auto" /></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-200/70 rounded-md w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Search size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Record Conversation Tidak Ditemukan
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Belum ada percakapan tersimpan di database yang sesuai dengan akses atau filter pencarian.
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
                    className="border-l-4 border-l-transparent hover:border-l-blue-600 hover:bg-blue-50/30 transition-all duration-150"
                  >
                    {/* Conversation ID */}
                    <td className="py-4.5 px-6 text-center text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {row.conversation_id}
                    </td>

                    {/* Company */}
                    <td className="py-4.5 px-6 text-left text-sm font-semibold text-slate-800 max-w-[280px] leading-snug">
                      {row.company}
                    </td>

                    {/* Channel Badge */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      {row.source.toLowerCase() === 'meeting' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#f4e8ff] text-[#9333ea] border border-[#e9d5ff]">
                          <Video size={13} className="text-[#9333ea]" />
                          <span>Meeting</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#e6f9ed] text-[#16a34a] border border-[#bbf7d0]">
                          <MessageCircle size={13} className="text-[#16a34a]" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4.5 px-6 text-center text-sm text-slate-700 whitespace-nowrap font-medium">
                      {row.date || '-'}
                    </td>

                    {/* Detail Link */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(row)}
                        className="text-[#2563eb] hover:text-blue-700 hover:underline font-semibold text-xs cursor-pointer transition-colors"
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
        <div className="py-4 px-6 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredRows.length === 0 ? '0' : `${(validCurrentPage - 1) * pageSize + 1}-${Math.min(validCurrentPage * pageSize, filteredRows.length)}`}</strong> of <strong className="text-slate-800">{filteredRows.length}</strong> customers
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(Math.max(1, validCurrentPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const pageNumber = totalPages <= 5
                ? index + 1
                : Math.max(1, Math.min(validCurrentPage - 2, totalPages - 4)) + index;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    validCurrentPage === pageNumber
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, validCurrentPage + 1))}
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[520px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header: Title & Subtitle */}
            <div className="px-7 pt-6 pb-4 border-b border-slate-200/90 bg-white shrink-0">
              <h3 className="text-xl font-bold text-[#0f172a] tracking-tight">
                Detail Conversation
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {selectedConversation.conversation_id}
              </p>
            </div>

            {/* Body */}
            <div className="px-7 py-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {detailSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
                  {detailSuccessMsg}
                </div>
              )}

              {/* 1. Customer / Company Card */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      CUSTOMER / COMPANY
                    </span>
                    <h4 className="text-base font-bold text-[#0f172a] mt-1">
                      {selectedConversation.company}
                    </h4>
                  </div>

                  {selectedConversation.source.toLowerCase() === 'meeting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#f4e8ff] text-[#9333ea] border border-[#e9d5ff] shrink-0">
                      <Video size={13} className="text-[#9333ea]" />
                      <span>Meeting</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#e6f9ed] text-[#16a34a] border border-[#bbf7d0] shrink-0">
                      <MessageCircle size={13} className="text-[#16a34a]" />
                      <span>WhatsApp</span>
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-200 my-3" />

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-xs text-slate-400 font-normal block">Dibuat Oleh:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.pic} (Sales Executive)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-normal block">Tanggal &amp; Waktu:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.date || '03/03/2026'}, 14:00 WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. CONNECTED JOB NUMBERS */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  CONNECTED JOB NUMBERS
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedConversation.connected_job_numbers && selectedConversation.connected_job_numbers.length > 0 ? (
                    selectedConversation.connected_job_numbers.map((job, jIdx) => (
                      <div
                        key={jIdx}
                        className="bg-[#f1f5f9] border border-slate-200/90 text-slate-700 rounded-full px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Tag size={13} className="text-blue-500" />
                        <span>{job.replace(/^#/, '')}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-[#f1f5f9] border border-slate-200/90 text-slate-700 rounded-full px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <Tag size={13} className="text-blue-500" />
                        <span>DSVEXP/2605/2551</span>
                      </div>
                      <div className="bg-[#f1f5f9] border border-slate-200/90 text-slate-700 rounded-full px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <Tag size={13} className="text-blue-500" />
                        <span>DSVEXP/2605/2552</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 2. SUMMARY */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SUMMARY
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadSummaryPdf(selectedConversation)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download size={13} className="text-blue-600" />
                    <span>Download Summary (.pdf)</span>
                  </button>
                </div>
                <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedConversation.summary || 'Discussed recent shipment delays. Customer requested schedule adjustment for container #2 and re-verification of documentation at Tanjung Priok Port.'}
                </div>
              </div>

              {/* 3. EVIDENCE ATTACHMENTS */}
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
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {file.size} • Dokumen Lampiran
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ isOpen: true, url: file.url, title: file.name })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="View"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 text-center">
                    <p className="text-xs font-medium text-slate-500">Tidak ada berkas lampiran</p>
                  </div>
                )}
              </div>

              {/* 4. HISTORI NEED ASSISTANCE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    HISTORI NEED ASSISTANCE
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {selectedConversation.need_assistance ? '1 catatan ditemukan' : '0 catatan ditemukan'}
                  </span>
                </div>

                <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 bg-white overflow-hidden shadow-2xs">
                  {selectedConversation.need_assistance ? (
                    <div
                      onClick={() => setIsManagerFeedbackModalOpen(true)}
                      className="p-3.5 flex items-center justify-between bg-blue-50/20 hover:bg-blue-50/60 border-l-4 border-blue-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                              Issue Alamat Pengiriman
                            </h5>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedConversation.company} · {selectedConversation.date || '10 Okt 2026'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/90 rounded-md px-2 py-0.5 text-[10px] font-bold">
                              Need Assistance
                            </span>
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-medium">
                              Menunggu respons Manager
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ) : (
                    <div className="p-3.5 flex items-center justify-between bg-slate-50/50 opacity-70 cursor-not-allowed select-none">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-600">
                            Follow-up laporan percakapan
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedConversation.company} · {selectedConversation.date || '10 Okt 2026'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-medium">
                              Tidak membutuhkan bantuan
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        No Action
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="px-7 py-4 bg-white border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANAGER RESPONSE & FEEDBACK (Exact Match to User Screenshot) */}
      {isManagerFeedbackModalOpen && selectedConversation && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsManagerFeedbackModalOpen(false); }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white">
              <h3 className="text-lg font-bold text-[#1e293b] tracking-tight text-center sm:text-left">
                Manager Response &amp; Feedback
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Card 1: Topic Issue & Metadata */}
              <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TOPIC ISSUE
                  </span>
                  <h4 className="text-sm font-bold text-[#0f172a] mt-0.5">
                    Issue Alamat Pengiriman
                  </h4>
                </div>

                <div className="border-t border-slate-200/80 my-2.5" />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-xs block font-normal">Customer</span>
                    <span className="font-bold text-[#0f172a] text-xs block mt-0.5">
                      {selectedConversation.company || 'PT Contoh Customer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block font-normal">Tanggal &amp; Waktu:</span>
                    <span className="font-bold text-[#0f172a] text-xs block mt-0.5">
                      {selectedConversation.date || '03/03/2026'}, 14:00 WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Resolution Status */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  RESOLUTION STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f9ed] text-[#16a34a] border border-[#bbf7d0]">
                    <span className="text-[10px]">●</span>
                    <span>Responded / Answered</span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f1f5f9] text-slate-500">
                    Previous: Awaiting Response
                  </span>
                </div>
              </div>

              {/* Section 3: Manager Notes & Instructions */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  MANAGER NOTES &amp; INSTRUCTIONS
                </span>
                <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-normal shadow-2xs">
                  {selectedConversation.summary || 'Discussed recent shipment delays. Customer requested schedule adjustment for container #2 and re-verification of documentation at Tanjung Priok Port.'}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <CheckCircle size={14} className="text-blue-600 shrink-0" />
                    <span>Responded by: <strong className="text-slate-900 font-bold">Mr. Bambang</strong> (Sales Manager)</span>
                  </div>
                  <span className="text-slate-400 font-normal">10 Oct 2026, 15:00 WIB</span>
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div className="p-4 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManagerFeedbackModalOpen(false)}
                className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs text-center"
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
            {/* Header with Title & Subtitle */}
            <div className="px-7 pt-6 pb-4 border-b border-slate-200/90 bg-white shrink-0">
              <h3 className="text-xl font-bold text-[#0f172a] tracking-tight">
                Record Customer Conversation
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-1">
                Log WhatsApp threads or meeting documents and declare assistance requirement.
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitNewConversation} className="px-7 py-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Validation Error Alert */}
              {createFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{createFormError}</div>
                </div>
              )}

              {/* Select Customer * */}
              <div className="relative" ref={accountDropdownRef}>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Customer<span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="w-full bg-[#f8fafc] border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                >
                  <span className="truncate">{selectedAccount || 'PT DSV Transport Indonesia (CUST-JKT-0941)'}</span>
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${isAccountDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
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
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${selectedAccount === acc ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
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

              {/* Date & Time * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
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
                    placeholder="MM/DD/YYYY"
                    className="w-full bg-[#f8fafc] border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-4 pr-10 py-3 text-xs font-semibold text-slate-800 outline-none shadow-2xs transition-colors placeholder:text-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer">
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
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Channel Type<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleChannelSelectionChange('WhatsApp')}
                    className={`rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all ${channelSelection === 'WhatsApp'
                        ? 'border-2 border-[#3b82f6] bg-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-xs ${channelSelection === 'WhatsApp' ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-700'}`}>
                      WhatsApp (.txt)
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${channelSelection === 'WhatsApp' ? 'border-2 border-[#3b82f6]' : 'border border-slate-300'
                      }`}>
                      {channelSelection === 'WhatsApp' && <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => handleChannelSelectionChange('Meeting')}
                    className={`rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all ${channelSelection === 'Meeting'
                        ? 'border-2 border-[#3b82f6] bg-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={15} className={channelSelection === 'Meeting' ? 'text-[#3b82f6]' : 'text-slate-400'} />
                      <span className={`text-xs ${channelSelection === 'Meeting' ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-700'}`}>
                        Meeting Document
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${channelSelection === 'Meeting' ? 'border-2 border-[#3b82f6]' : 'border border-slate-300'
                      }`}>
                      {channelSelection === 'Meeting' && <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Summary * (Lecturer Rules 1 & 2) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Text Summary<span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-bold ${getWordCount(recordSummary) >= 100 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                    {getWordCount(recordSummary)} / 100 kata
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={recordSummary}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const words = rawVal.trim() ? rawVal.trim().split(/\s+/).filter(Boolean) : [];
                    let finalVal = rawVal;
                    if (words.length > 100) {
                      finalVal = words.slice(0, 100).join(' ');
                    }
                    setRecordSummary(finalVal);
                    const count = getWordCount(finalVal);
                    if (!finalVal.trim()) {
                      setSummaryError('Text Summary belum diisi.');
                    } else if (count >= 100) {
                      setSummaryError('Telah mencapai batas maksimal 100 kata. Tidak dapat menambahkan kata lagi.');
                    } else {
                      setSummaryError(null);
                    }
                  }}
                  placeholder="Diskusi bersama Pak Hendra (DSV) mengenai kepastian jadwal kontainer di Gate 3 Priok. Membutuhkan verifikasi fisik cepat dan pendampingan customs clearance untuk mencegah denda demurrage."
                  className={`w-full bg-[#f8fafc] border rounded-xl p-3.5 text-xs font-normal text-slate-800 leading-relaxed outline-none shadow-2xs transition-colors resize-none placeholder:text-slate-400 ${summaryError
                      ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:bg-white'
                    }`}
                />
                {summaryError && (
                  <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={13} className="shrink-0 text-red-500" />
                    <span>{summaryError}</span>
                  </p>
                )}
              </div>

              {/* File (Opsional) (Lecturer Rules 3 & 4) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    File Lampiran (Opsional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {channelSelection === 'WhatsApp' ? 'Khusus .txt • Max 5MB' : 'Dokumen / Gambar • Max 5MB'}
                  </span>
                </div>
                <div
                  onClick={() => createFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    handleCreateFileUpload(e.dataTransfer.files);
                  }}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-all ${attachmentError
                      ? 'border-red-400 bg-red-50/20'
                      : isDraggingFile
                        ? 'border-blue-500 bg-blue-50/20'
                        : 'border-slate-300 hover:border-blue-400'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-2xs ${attachmentError ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-[#2563eb]'}`}>
                    <UploadCloud size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {channelSelection === 'WhatsApp'
                      ? 'Upload chat export .txt file (Khusus WhatsApp)'
                      : 'Upload meeting notes & dokumen (.pdf, .docx, .xlsx, .png)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Drag &amp; drop berkas di sini, atau <span className="text-[#2563eb] font-semibold underline">Browse files</span>
                  </p>
                  <div className={`mt-3 px-3 py-1 rounded-lg border text-[10px] font-semibold ${attachmentError ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    Ukuran maks: 5MB • Format Channel {channelSelection}: {channelSelection === 'WhatsApp' ? 'HANYA .txt' : '.pdf, .docx, .xlsx, .png'}
                  </div>
                </div>
                <input
                  ref={createFileInputRef}
                  type="file"
                  multiple
                  accept={channelSelection === 'WhatsApp' ? '.txt,text/plain' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv'}
                  onChange={(e) => handleCreateFileUpload(e.target.files)}
                  className="hidden"
                />

                {attachmentError && (
                  <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={13} className="shrink-0 text-red-500" />
                    <span>{attachmentError}</span>
                  </p>
                )}

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

              {/* Need Assistance * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Need Assistance<span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCreateNeedAssistance(true)}
                    className={`rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all ${createNeedAssistance === true
                        ? 'border-2 border-[#3b82f6] bg-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-xs ${createNeedAssistance === true ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-700'}`}>
                      Yes
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${createNeedAssistance === true ? 'border-2 border-[#3b82f6]' : 'border border-slate-300'
                      }`}>
                      {createNeedAssistance === true && <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setCreateNeedAssistance(false)}
                    className={`rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all ${createNeedAssistance === false
                        ? 'border-2 border-[#3b82f6] bg-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-xs ${createNeedAssistance === false ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-700'}`}>
                      No
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${createNeedAssistance === false ? 'border-2 border-[#3b82f6]' : 'border border-slate-300'
                      }`}>
                      {createNeedAssistance === false && <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 -mx-7 -mb-5 px-7 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" />
                  <span className="text-xs text-slate-400 font-medium">
                    Auto-synced with C-Track Timeline
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew || isUploadingFile}
                    className="px-6 py-2.5 rounded-xl bg-[#3b6ff5] hover:bg-[#2b5ce5] text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmittingNew ? <Loader2 size={14} className="animate-spin" /> : null}
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
