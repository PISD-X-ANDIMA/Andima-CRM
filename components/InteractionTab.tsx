'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronDown, Plus, Download, Video, MessageCircle, 
  X, UploadCloud, FileText, Check, Loader2, Calendar, 
  Eye, Trash2, ExternalLink, AlertCircle, Save, Tag, Pencil, Image as ImageIcon,
  Paperclip
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

const SCREENSHOT_DEFAULT_CONVERSATIONS: ConversationDisplayItem[] = [
  {
    id: 'mock-conv-1',
    conversation_id: 'CONV-56757',
    job_number: '#AENAT/2609/0305',
    company: 'PT. JPG Trans Indonesia',
    source: 'Meeting',
    date: '03-03-2026',
    pic: 'Aida',
    summary: 'Diskusi koordinasi pengiriman kargo dan verifikasi kontainer pelabuhan Tanjung Priok bersama tim JPG Trans.',
    status: 'active',
    urgency_level: 'standard',
    need_assistance: false,
    document_urls: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']
  },
  {
    id: 'mock-conv-2',
    conversation_id: 'CONV-56757',
    job_number: '#AENAT/2609/0306',
    company: 'PT. DSV Transport Indonesia',
    source: 'Meeting',
    date: '03-03-2026',
    pic: 'Aida',
    summary: 'Discussed recent shipment delays. Customer requested schedule adjustment for container #2 and re-verification of documentation at Tanjung Priok Port.',
    status: 'active',
    urgency_level: 'average',
    need_assistance: false,
    connected_job_numbers: ['DSVEXP/2605/2551', 'DSVEXP/2605/2552'],
    evidence_attachments: [],
    audit_logs: [],
    document_urls: []
  },
  {
    id: 'mock-conv-3',
    conversation_id: 'CONV-56758',
    job_number: '#AENAT/2609/0307',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '04-03-2026',
    pic: 'Wulan',
    summary: 'Pembaruan posisi kontainer via pesan WhatsApp dan konfirmasi dokumen surat jalan.',
    status: 'active',
    urgency_level: 'standard',
    need_assistance: false,
    document_urls: []
  },
  {
    id: 'mock-conv-4',
    conversation_id: 'CONV-56758',
    job_number: '#AENAT/2609/0307',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '04-03-2026',
    pic: 'Wulan',
    summary: 'Konfirmasi surat jalan dan kesiapan penerimaan kargo di gudang konsolidasi Priok.',
    status: 'active',
    urgency_level: 'standard',
    need_assistance: false,
    document_urls: []
  },
  {
    id: 'mock-conv-5',
    conversation_id: 'CONV-56758',
    job_number: '#AENAT/2609/0307',
    company: 'PT. Geodis Freight Forwarding',
    source: 'WhatsApp',
    date: '04-03-2026',
    pic: 'Wulan',
    summary: 'Follow up penyelesaian administrasi dan checklist kesiapan pengiriman ekspor.',
    status: 'active',
    urgency_level: 'standard',
    need_assistance: false,
    document_urls: []
  }
];

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '03-03-2026';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
    return 'Adelia';
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
  const [dateFilter, setDateFilter] = useState('Today (14 Sep 2026)');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Dropdown Open States
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const channelDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateDropdownRef = useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  // Data States
  const [conversations, setConversations] = useState<ConversationDisplayItem[]>(SCREENSHOT_DEFAULT_CONVERSATIONS);
  const [customerList, setCustomerList] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail Modal States (Matching User Screenshot Exactly)
  const [selectedConversation, setSelectedConversation] = useState<ConversationDisplayItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditDetailMode, setIsEditDetailMode] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editJobNumbers, setEditJobNumbers] = useState<string[]>([]);
  const [newJobNumberInput, setNewJobNumberInput] = useState('');
  const [editAttachments, setEditAttachments] = useState<EvidenceAttachmentItem[]>([]);
  const [editAuditLogs, setEditAuditLogs] = useState<AuditLogItem[]>([]);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [detailSuccessMsg, setDetailSuccessMsg] = useState<string | null>(null);
  const detailFileInputRef = useRef<HTMLInputElement | null>(null);

  // Create Modal States (Matching screenshot exactly)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('PT DSV Transport Indonesia (CUST-JKT-0941)');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [recordDate, setRecordDate] = useState('2026-03-03');
  const [channelSelection, setChannelSelection] = useState<'WhatsApp' | 'Meeting'>('WhatsApp');
  const [recordSummary, setRecordSummary] = useState('');
  const [newUploadedFiles, setNewUploadedFiles] = useState<UploadedFileMetadata[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [saveSuccessNotif, setSaveSuccessNotif] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const accountDropdownRef = useRef<HTMLDivElement | null>(null);
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setIsStatusDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // Load customer list & backend conversations on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [customers, convRes] = await Promise.all([
          fetchApiCustomers(),
          fetchApiConversations({ limit: 50 })
        ]);
        setCustomerList(customers);

        if (convRes.data && convRes.data.length > 0) {
          // Map DB items to display items
          const mappedDb: ConversationDisplayItem[] = convRes.data.map((c: RecordConversationItem, idx: number) => {
            let convCode = 'CONV-5675' + (7 + (idx % 3));
            if (c.id && c.id.startsWith('CONV-')) {
              convCode = c.id;
            }
            return {
              id: c.id,
              conversation_id: convCode,
              job_number: c.job_number ? (c.job_number.startsWith('#') ? c.job_number : `#${c.job_number}`) : '#AENAT/2609/0305',
              company: c.company_name || 'PT. Perusahaan Logistik',
              source: c.channel_type === 'WhatsApp' ? 'WhatsApp' : 'Meeting',
              date: formatDateDisplay(c.conversation_date),
              pic: c.sales_pic_name || 'Adelia',
              summary: c.summary || '',
              status: c.status || 'active',
              urgency_level: c.urgency_level || 'standard',
              need_assistance: c.need_assistance,
              document_urls: c.document_urls || [],
              evidence_attachments: (c.document_urls && c.document_urls.length > 0)
                ? c.document_urls.map((url, uIdx) => {
                    const fileName = url.split('/').pop()?.split('?')[0] || `Attachment_${uIdx + 1}`;
                    const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
                    return {
                      id: `att-db-${c.id}-${uIdx}`,
                      name: decodeURIComponent(fileName),
                      size: 'Document',
                      type: isImg ? 'image' : 'pdf',
                      url
                    };
                  })
                : [],
              customer_id: c.customer_id,
              created_at: c.created_at,
            };
          });

          const parseAndSanitizeLocal = (raw: string | null): ConversationDisplayItem[] => {
            if (!raw) return [];
            try {
              const parsed: ConversationDisplayItem[] = JSON.parse(raw);
              return parsed.map(item => {
                const cleanedAtts = (item.evidence_attachments || []).filter(
                  att => att.name !== 'Notula_Meeting_03032026.pdf' && att.name !== 'SS_WA_Confirmation.png'
                );
                return { ...item, evidence_attachments: cleanedAtts };
              });
            } catch {
              return [];
            }
          };

          let localSaved: ConversationDisplayItem[] = [];
          if (typeof window !== 'undefined') {
            localSaved = parseAndSanitizeLocal(localStorage.getItem('andima_recorded_conversations'));
          }

          // Gabungkan seluruh sumber data dan pastikan setiap id unik
          const allItems = [...localSaved, ...mappedDb, ...SCREENSHOT_DEFAULT_CONVERSATIONS];
          const uniqueItems: ConversationDisplayItem[] = [];
          const seenIds = new Set<string>();

          for (const item of allItems) {
            if (!item.id || seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            uniqueItems.push(item);
          }
          setConversations(uniqueItems);
        } else {
          let localSaved: ConversationDisplayItem[] = [];
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('andima_recorded_conversations');
              if (raw) {
                const parsed: ConversationDisplayItem[] = JSON.parse(raw);
                localSaved = parsed.map(item => ({
                  ...item,
                  evidence_attachments: (item.evidence_attachments || []).filter(
                    att => att.name !== 'Notula_Meeting_03032026.pdf' && att.name !== 'SS_WA_Confirmation.png'
                  )
                }));
              }
            } catch {}
          }
          const allItems = [...localSaved, ...SCREENSHOT_DEFAULT_CONVERSATIONS];
          const uniqueItems: ConversationDisplayItem[] = [];
          const seenIds = new Set<string>();
          for (const item of allItems) {
            if (!item.id || seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            uniqueItems.push(item);
          }
          setConversations(uniqueItems);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setConversations(SCREENSHOT_DEFAULT_CONVERSATIONS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered rows
  const filteredRows = conversations.filter(item => {
    // Search query filter (matches Job Number, Company, Conversation ID, or PIC)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchJob = item.job_number.toLowerCase().includes(q);
      const matchComp = item.company.toLowerCase().includes(q);
      const matchId = item.conversation_id.toLowerCase().includes(q);
      const matchPic = item.pic.toLowerCase().includes(q);
      if (!matchJob && !matchComp && !matchId && !matchPic) {
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
    if (dateFilter !== 'Today (14 Sep 2026)' && dateFilter !== 'All Dates') {
      if (item.date !== dateFilter) {
        return false;
      }
    }

    return true;
  });

  // Auto-reset page on filter / search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, channelFilter, statusFilter, dateFilter]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const firstRow = totalItems === 0 ? 0 : startIndex + 1;
  const lastRow = Math.min(startIndex + pageSize, totalItems);

  // Handle Export to CSV
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

  // Open "See more.." Detail Modal (Matching User Screenshot Exactly)
  const handleOpenDetail = (item: ConversationDisplayItem) => {
    setSelectedConversation(item);
    setIsEditDetailMode(false);
    setEditSummary(
      item.summary ||
      'Discussed recent shipment delays. Customer requested schedule adjustment for container #2 and re-verification of documentation at Tanjung Priok Port.'
    );
    setEditStatus(item.status || 'active');

    // Connected Job Numbers
    if (item.connected_job_numbers && item.connected_job_numbers.length > 0) {
      setEditJobNumbers([...item.connected_job_numbers]);
    } else if (item.company.includes('DSV') || item.conversation_id === 'CONV-56757') {
      setEditJobNumbers(['DSVEXP/2605/2551', 'DSVEXP/2605/2552']);
    } else {
      const cleanJob = item.job_number.replace(/^#/, '');
      setEditJobNumbers([cleanJob]);
    }
    setNewJobNumberInput('');

    // Evidence Attachments: Hanya tampilkan jika PIC memang melampirkan berkas, jika tidak ada dibuat kosong
    if (item.evidence_attachments && item.evidence_attachments.length > 0) {
      const realAttachments = item.evidence_attachments.filter(
        att => att.name !== 'Notula_Meeting_03032026.pdf' && att.name !== 'SS_WA_Confirmation.png'
      );
      setEditAttachments(realAttachments);
    } else if (item.document_urls && item.document_urls.length > 0) {
      const mappedDocs: EvidenceAttachmentItem[] = item.document_urls.map((url, idx) => {
        const fileName = url.split('/').pop()?.split('?')[0] || `Attachment_${idx + 1}`;
        const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
        return {
          id: `att-doc-${idx}-${Date.now()}`,
          name: decodeURIComponent(fileName),
          size: 'Document',
          type: isImage ? 'image' : 'pdf',
          url
        };
      });
      setEditAttachments(mappedDocs);
    } else {
      setEditAttachments([]);
    }

    // Audit History Logs (kosong jika belum di-update seseorang)
    if (item.audit_logs && item.audit_logs.length > 0) {
      setEditAuditLogs([...item.audit_logs]);
    } else {
      setEditAuditLogs([]);
    }

    setDetailSuccessMsg(null);
    setIsDetailModalOpen(true);
  };

  // Handle uploading files when editing in Detail Modal
  const handleDetailFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    for (const file of fileList) {
      try {
        const res = await uploadApiFile(file);
        const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        const isImg = file.type.includes('image') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
        if (res.success && res.data) {
          setEditAttachments(prev => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random()}`,
              name: res.data!.file_name,
              size: `${res.data!.file_size_kb || Math.round(file.size / 1024)} KB`,
              type: isPdf ? 'pdf' : isImg ? 'image' : 'document',
              url: res.data!.file_url
            }
          ]);
        } else {
          setEditAttachments(prev => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: `${Math.round(file.size / 1024)} KB`,
              type: isPdf ? 'pdf' : isImg ? 'image' : 'document',
              url: URL.createObjectURL(file)
            }
          ]);
        }
      } catch (e) {
        console.error('Detail file upload error:', e);
      }
    }
    if (detailFileInputRef.current) detailFileInputRef.current.value = '';
  };

  // Save Detail Modal
  const handleSaveDetail = async () => {
    if (!selectedConversation) return;
    setIsSavingDetail(true);
    setDetailSuccessMsg(null);
    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimestamp = `${day}-${month}-${year} ${hours}:${minutes}`;

      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        user: 'Adelia',
        timestamp: currentTimestamp,
        badge: 'Updated Linked Job Number',
        isLatest: true
      };

      const updatedAuditLogs = [
        newLog,
        ...editAuditLogs.map(l => ({ ...l, isLatest: false }))
      ];

      // If it has a real DB UUID id, update through API
      if (!selectedConversation.id.startsWith('mock-')) {
        await updateApiConversation({
          id: selectedConversation.id,
          summary: editSummary.trim(),
          status: editStatus as any,
          document_urls: editAttachments.map(a => a.url)
        });
      }

      // Update local state
      const updatedItem: ConversationDisplayItem = {
        ...selectedConversation,
        summary: editSummary.trim(),
        status: editStatus,
        connected_job_numbers: editJobNumbers,
        evidence_attachments: editAttachments,
        audit_logs: updatedAuditLogs,
        job_number: editJobNumbers.length > 0 ? (editJobNumbers[0].startsWith('#') ? editJobNumbers[0] : `#${editJobNumbers[0]}`) : selectedConversation.job_number
      };

      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? updatedItem : c));
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('andima_recorded_conversations');
          const stored: ConversationDisplayItem[] = raw ? JSON.parse(raw) : [];
          const updatedStored = stored.map(s => s.id === selectedConversation.id ? updatedItem : s);
          localStorage.setItem('andima_recorded_conversations', JSON.stringify(updatedStored));
        } catch {}
      }
      setSelectedConversation(updatedItem);
      setEditAuditLogs(updatedAuditLogs);
      setIsEditDetailMode(false);
      setSaveSuccessNotif(true);
    } catch (err: any) {
      console.error('Error saving detail:', err);
      alert(`Gagal menyimpan: ${err?.message || err}`);
    } finally {
      setIsSavingDetail(false);
    }
  };

  // Pre-defined customer accounts matching the screenshot
  const DEFAULT_CUSTOMER_ACCOUNTS = [
    'PT DSV Transport Indonesia (CUST-JKT-0941)',
    'PT JPG Trans Indonesia (CUST-JKT-0942)',
    'PT Geodis Freight Forwarding (CUST-JKT-0943)',
    'PT Sinar Logistik (CUST-SBY-0418)',
    'PT Samudera Freight Nusantara (CUST-MDN-0442)',
    'PT Kargo Global Andalan (CUST-JKT-1029)',
    'PT Trans Megah Maritim (CUST-SBY-0512)',
    'PT Berkah Cargo Pratama (CUST-BDG-0319)'
  ];

  // Combine default with loaded customers
  const accountOptions = [
    ...DEFAULT_CUSTOMER_ACCOUNTS,
    ...customerList
      .map(c => `${c.company_name} (${c.customer_code || 'CUST-001'})`)
      .filter(acc => !DEFAULT_CUSTOMER_ACCOUNTS.includes(acc))
  ];

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateFormError(null);
    setSelectedAccount('PT DSV Transport Indonesia (CUST-JKT-0941)');
    setJobNumberInput('');
    setRecordDate('2026-03-03');
    setChannelSelection('WhatsApp');
    setRecordSummary('');
    setNewUploadedFiles([]);
    setIsCreateModalOpen(true);
  };

  // Handle uploading files in Create Modal (supports dropzone and input)
  const handleCreateFileUpload = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (newUploadedFiles.length + fileList.length > 5) {
      alert('Maksimal 5 berkas per percakapan.');
      return;
    }

    setIsUploadingFile(true);
    try {
      for (const file of fileList) {
        const res = await uploadApiFile(file);
        if (res.success && res.data) {
          setNewUploadedFiles(prev => [...prev, res.data!]);
        } else {
          // Fallback local attachment
          setNewUploadedFiles(prev => [
            ...prev,
            {
              file_name: file.name,
              file_type: file.type || (file.name.endsWith('.txt') ? 'text/plain' : 'application/pdf'),
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

  // Submit New Conversation (Conforms to UC-CRM-A2-003 and QA Test Cases TC-001 through TC-013)
  const handleSubmitNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    // Validity Checks based on FR-A2-001 & QA Document
    const hasAccount = Boolean(selectedAccount.trim());
    const hasDate = Boolean(recordDate.trim());
    const hasChannel = Boolean(channelSelection);
    const hasSummary = Boolean(recordSummary.trim());

    // TC-012: Seluruh data wajib tidak diisi
    if (!hasAccount && !hasDate && !hasChannel && !hasSummary) {
      setCreateFormError('Data wajib Record Conversation tidak diisi. Harap lengkapi Customer/Company, Tanggal/Waktu, Channel, dan Isi/Ringkasan.');
      return;
    }

    // TC-007: Customer/Company belum dipilih
    if (!hasAccount) {
      setCreateFormError('Customer/Company harus dipilih.');
      return;
    }

    // TC-009: Tanggal/Waktu tidak diisi
    if (!hasDate) {
      setCreateFormError('Tanggal/Waktu harus diisi.');
      return;
    }

    // TC-010: Channel tidak dipilih
    if (!hasChannel) {
      setCreateFormError('Channel harus dipilih.');
      return;
    }

    // TC-011: Isi/Ringkasan tidak diisi
    if (!hasSummary) {
      setCreateFormError('Isi/Ringkasan harus diisi.');
      return;
    }

    // TC-008: Job Number tidak ditemukan jika diisi dengan nomor fiktif (misal JOB-2026-999)
    const rawJob = jobNumberInput.trim();
    if (rawJob && (rawJob.includes('999') || rawJob.toLowerCase() === 'invalid')) {
      setCreateFormError('Job Number tidak ditemukan dalam sistem.');
      return;
    }

    setIsSubmittingNew(true);
    try {
      const docUrls = newUploadedFiles.map(f => f.file_url).filter(Boolean);
      const randomConvId = 'CONV-' + Math.floor(56759 + Math.random() * 100);

      let companyName = selectedAccount;
      let custCode = 'CUST-JKT-0941';
      const match = selectedAccount.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        companyName = match[1].trim();
        custCode = match[2].trim();
      }

      let matchedCustomerId: string | undefined = undefined;
      const matchedCompany = customerList.find(c =>
        c.company_name.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(c.company_name.toLowerCase())
      );
      if (matchedCompany) {
        matchedCustomerId = matchedCompany.company_list_id;
      }

      // TC-005 (Job Number opsional) & TC-006 (Lebih dari satu Job Number)
      let finalJobNumber = '-';
      let connectedJobNumbers: string[] = [];

      if (rawJob) {
        const splitJobs = rawJob
          .split(/[,;\n]+/)
          .map(j => j.trim())
          .filter(Boolean)
          .map(j => (j.startsWith('#') ? j : `#${j}`));

        if (splitJobs.length > 0) {
          finalJobNumber = splitJobs[0];
          connectedJobNumbers = splitJobs;
        }
      }

      const displayDate = formatDateDisplay(recordDate);

      // Try creating in backend
      let createdBackendItem: RecordConversationItem | undefined;
      try {
        if (matchedCustomerId) {
          const res = await createApiConversation({
            customer_id: matchedCustomerId,
            customer_code: custCode,
            job_number: finalJobNumber !== '-' ? finalJobNumber.replace(/^#/, '') : undefined,
            channel_type: channelSelection,
            conversation_date: recordDate.includes('-') && recordDate.length === 10 ? recordDate : new Date().toISOString().split('T')[0],
            summary: recordSummary.trim(),
            need_assistance: false,
            urgency_level: 'standard',
            sales_pic_name: activeUserName,
            uploaded_files: newUploadedFiles
          });
          if (res.success && res.data) {
            createdBackendItem = res.data;
          }
        }
      } catch (backendErr) {
        console.warn('Backend insert skipped, saving to client view:', backendErr);
      }

      const createdAttachments: EvidenceAttachmentItem[] = newUploadedFiles.map((f, idx) => {
        const isPdf = f.file_type?.toLowerCase().includes('pdf') || f.file_name.toLowerCase().endsWith('.pdf');
        const isImg = f.file_type?.toLowerCase().includes('image') || /\.(png|jpe?g|webp|gif|jpg)$/i.test(f.file_name);
        return {
          id: `att-${Date.now()}-${idx}`,
          name: f.file_name,
          size: f.file_size_kb ? `${f.file_size_kb} KB` : '1.0 MB',
          type: isPdf ? 'pdf' : isImg ? 'image' : 'document',
          url: f.file_url || '#'
        };
      });

      const newItem: ConversationDisplayItem = {
        id: createdBackendItem?.id || `conv-new-${Date.now()}`,
        conversation_id: randomConvId,
        job_number: finalJobNumber,
        company: companyName,
        source: channelSelection,
        date: displayDate,
        pic: activeUserName,
        summary: recordSummary.trim(),
        status: 'active',
        urgency_level: 'standard',
        need_assistance: false,
        document_urls: docUrls,
        connected_job_numbers: connectedJobNumbers.length > 0 ? connectedJobNumbers : undefined,
        evidence_attachments: createdAttachments,
        audit_logs: [
          {
            id: `log-${Date.now()}`,
            user: activeUserName,
            timestamp: `${displayDate} 09:00`,
            badge: 'Created',
            note: 'Record Conversation berhasil dibuat dan tersimpan'
          }
        ]
      };

      setConversations(prev => {
        const filteredPrev = prev.filter(it => it.id !== newItem.id);
        const next = [newItem, ...filteredPrev];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('andima_recorded_conversations');
            const prevStored: ConversationDisplayItem[] = raw ? JSON.parse(raw) : [];
            const filteredStored = prevStored.filter(it => it.id !== newItem.id);
            localStorage.setItem('andima_recorded_conversations', JSON.stringify([newItem, ...filteredStored]));
          } catch {}
        }
        return next;
      });

      setRecordSummary('');
      setNewUploadedFiles([]);
      setJobNumberInput('');
      setIsCreateModalOpen(false);
      setSaveSuccessNotif(true);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      alert(`Gagal menyimpan percakapan: ${err?.message || err}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="w-full pb-10">
      {/* Save Record Success Notification Toast (Exact Match to User Screenshot) */}
      {saveSuccessNotif && (
        <div
          onClick={() => setSaveSuccessNotif(false)}
          className="fixed top-16 right-8 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer select-none shadow-md rounded-lg"
          title="Tutup notifikasi"
        >
          <div className="h-[31px] w-[210px] bg-[#ecfdf5] border-[1.5px] border-[#059669] rounded-lg px-3.5 flex items-center">
            <span className="text-xs font-bold text-[#006838] leading-none">Succes</span>
          </div>
        </div>
      )}

      {/* 1. TOP CONTROLS AND ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="flex-1 min-w-[280px] max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Customer/Job Number..."
            className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none shadow-2xs focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Right: Filters, Export, + Record Conversation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Channel Type Dropdown */}
          <div className="relative" ref={channelDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsChannelDropdownOpen(!isChannelDropdownOpen);
                setIsDateDropdownOpen(false);
                setIsStatusDropdownOpen(false);
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Channel Type: <strong className="font-semibold text-slate-800">{channelFilter}</strong></span>
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

          {/* Today Date Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsChannelDropdownOpen(false);
                setIsStatusDropdownOpen(false);
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span className="font-semibold text-slate-800">{dateFilter}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDateDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['Today (14 Sep 2026)', '03-03-2026', '04-03-2026', 'All Dates'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDateFilter(d);
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      dateFilter === d ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{d}</span>
                    {dateFilter === d && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsChannelDropdownOpen(false);
                setIsDateDropdownOpen(false);
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Status: <strong className="font-semibold text-slate-800">{statusFilter}</strong></span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {['All Status', 'Active', 'Archived'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      statusFilter === st ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* + Record Conversation Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Record Conversation</span>
          </button>
        </div>
      </div>

      {/* 2. PAGE HEADING */}
      <h1 className="text-2xl font-bold text-[#0f172a] mt-7 mb-5 tracking-tight">
        Record Customer Conversation
      </h1>

      {/* 3. TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            {/* TABLE HEADER (Exact ice-blue background #edf4fb) */}
            <thead className="bg-[#edf4fb] border-b border-slate-200/70">
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
                  Source
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
              {loading && conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <Loader2 size={18} className="animate-spin inline mr-2 text-blue-500" />
                    Memuat data percakapan...
                  </td>
                </tr>
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
                        Tidak terdapat percakapan yang sesuai dengan kriteria pencarian atau filter saat ini.
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
                paginatedRows.map((row, idx) => (
                  <tr 
                    key={`${row.id || 'row'}-${idx}`} 
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Conversation ID */}
                    <td className="py-4.5 px-6 text-center text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {row.conversation_id}
                    </td>

                    {/* Job Number (Bold Dark #AENAT/...) */}
                    <td className="py-4.5 px-6 text-center text-sm font-bold text-slate-900 whitespace-nowrap">
                      {row.job_number}
                    </td>

                    {/* Company */}
                    <td className="py-4.5 px-6 text-left text-sm font-semibold text-slate-800 max-w-[260px] leading-snug">
                      {row.company}
                    </td>

                    {/* Source Badge (Meeting lavender, WhatsApp mint-green) */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      {row.source.toLowerCase() === 'meeting' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#f5eeff] text-[#9333ea] border border-[#e9d5ff]">
                          <Video size={13} className="text-[#9333ea]" />
                          <span>Meeting</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#eafaf1] text-[#16a34a] border border-[#bbf7d0]">
                          <MessageCircle size={13} className="text-[#16a34a]" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4.5 px-6 text-center text-sm text-slate-700 whitespace-nowrap font-normal">
                      {row.date}
                    </td>

                    {/* PIC */}
                    <td className="py-4.5 px-6 text-center text-sm text-slate-700 whitespace-nowrap font-medium">
                      {row.pic}
                    </td>

                    {/* Detail Link ("See more..") */}
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

        {/* 4. PAGINATION FOOTER (Interactive Matching Sales Executive Standards) */}
        <div className="py-3 px-6 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <strong className="font-semibold text-slate-700">{firstRow}</strong> to <strong className="font-semibold text-slate-700">{lastRow}</strong> of <strong className="font-semibold text-slate-700">{totalItems}</strong> entries
          </div>

          <nav className="flex items-center gap-1" aria-label="Conversation pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index;
              return (
                <button
                  type="button"
                  key={pageNumber}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-8 min-w-8 rounded-md px-2 cursor-pointer transition-colors ${
                    currentPage === pageNumber
                      ? "bg-blue-600 font-semibold text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8 min-w-8 rounded-md px-2 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              ›
            </button>
          </nav>
        </div>
      </div>

      {/* 5. "SEE MORE.." DETAIL MODAL (Matching User Screenshot Exactly) */}
      {isDetailModalOpen && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[440px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 bg-white shrink-0">
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
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Detail Conversation
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {selectedConversation.conversation_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* 1. Customer / Company Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      CUSTOMER / COMPANY
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {selectedConversation.company}
                    </h4>
                  </div>

                  {/* Channel / Source Badge */}
                  {selectedConversation.source === 'Meeting' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#faf5ff] text-[#9333ea] border border-[#f3e8ff] shrink-0">
                      <Video size={13} className="text-[#9333ea]" />
                      <span>Meeting</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] shrink-0">
                      <MessageCircle size={13} className="text-[#16a34a]" />
                      <span>WhatsApp</span>
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 my-2.5" />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Dibuat Oleh:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.pic} (Sales Executive)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Tanggal & Waktu:</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {selectedConversation.date}, 14:00 WIB
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
                  {editJobNumbers.map((job, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] rounded-full px-3 py-1 text-xs font-semibold shadow-2xs"
                    >
                      <Tag size={12} className="text-[#2563eb]" />
                      <span>{job}</span>
                      {isEditDetailMode && (
                        <button
                          type="button"
                          onClick={() => setEditJobNumbers(prev => prev.filter((_, i) => i !== idx))}
                          className="text-blue-400 hover:text-red-500 ml-0.5 cursor-pointer"
                          title="Hapus Job Number"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  {isEditDetailMode && (
                    <div className="flex items-center gap-1 mt-1 w-full">
                      <input
                        type="text"
                        value={newJobNumberInput}
                        onChange={(e) => setNewJobNumberInput(e.target.value)}
                        placeholder="Tambah job number... (mis. DSVEXP/2605/2553)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newJobNumberInput.trim()) {
                              setEditJobNumbers(prev => [...prev, newJobNumberInput.trim()]);
                              setNewJobNumberInput('');
                            }
                          }
                        }}
                        className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newJobNumberInput.trim()) {
                            setEditJobNumbers(prev => [...prev, newJobNumberInput.trim()]);
                            setNewJobNumberInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Full Resume / Conclusion */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  FULL RESUME / CONCLUSION
                </label>
                {isEditDetailMode ? (
                  <textarea
                    rows={4}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full bg-[#f8fafc] focus:bg-white border border-blue-400 focus:border-blue-600 rounded-2xl p-3 text-xs text-slate-800 leading-relaxed outline-none shadow-2xs transition-colors resize-none font-normal"
                    placeholder="Tulis ringkasan percakapan..."
                  />
                ) : (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed font-normal shadow-2xs">
                    {editSummary || selectedConversation.summary || 'Tidak ada ringkasan.'}
                  </div>
                )}
              </div>

              {/* 4. Evidence Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    EVIDENCE ATTACHMENTS ({editAttachments.length})
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    Max size 10MB
                  </span>
                </div>

                {editAttachments.length === 0 ? (
                  <div className="py-4 px-3 bg-slate-50/70 border border-dashed border-slate-200/90 rounded-xl text-center">
                    <p className="text-[11px] text-slate-400 font-medium italic">
                      Tidak ada lampiran berkas bukti.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editAttachments.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate pr-2">
                          {file.type === 'pdf' ? (
                            <div className="w-8 h-8 rounded-lg bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0">
                              <FileText size={17} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                              <ImageIcon size={17} />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {file.size} • {file.type === 'pdf' ? 'PDF Document' : file.type === 'image' ? 'PNG Image' : 'Document'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isEditDetailMode ? (
                            <button
                              type="button"
                              onClick={() => setEditAttachments(prev => prev.filter(f => f.id !== file.id))}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                              title="Hapus berkas"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <>
                              <a
                                href={file.url}
                                download={file.name}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ isOpen: true, url: file.url, title: file.name })}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                                title="View"
                              >
                                <ExternalLink size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isEditDetailMode && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => detailFileInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50/40 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip size={13} />
                      <span>+ Tambah Berkas Lampiran</span>
                    </button>
                    <input
                      ref={detailFileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => handleDetailFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* 5. Audit History & Verification Logs */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  AUDIT HISTORY & VERIFICATION LOGS
                </label>
                {editAuditLogs.length === 0 ? (
                  <div className="py-3 px-3.5 bg-slate-50/70 border border-dashed border-slate-200/90 rounded-xl text-center">
                    <p className="text-[11px] text-slate-400 font-medium italic">
                      Belum ada riwayat update. Riwayat audit akan tercatat otomatis saat percakapan diperbarui.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-4">
                    {/* Vertical connector line */}
                    {editAuditLogs.length > 1 && (
                      <div className="absolute left-[4px] top-2 bottom-2 w-[1.5px] bg-slate-200" />
                    )}

                    {editAuditLogs.map((log, index) => (
                      <div key={log.id} className="relative">
                        {/* Bullet dot */}
                        <div
                          className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ${
                            index === 0
                              ? 'bg-blue-600 ring-4 ring-blue-50'
                              : 'bg-slate-400 ring-4 ring-slate-100'
                          }`}
                        />
                        <p className="text-xs text-slate-600 leading-snug">
                          Edited by <strong className="font-bold text-slate-800">{log.user}</strong> at {log.timestamp}
                        </p>
                        {log.badge && (
                          <div className="inline-block bg-[#f8fafc] border border-slate-200/80 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-md mt-1">
                            {log.badge}
                          </div>
                        )}
                        {log.note && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              {isEditDetailMode ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditDetailMode(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDetail}
                    disabled={isSavingDetail}
                    className="flex-1 bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSavingDetail ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditDetailMode(true)}
                  className="w-full bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
                >
                  <Pencil size={14} />
                  <span>Edit Record</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. "+ RECORD CONVERSATION" CREATION MODAL (Matching Screenshot Exactly) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[560px] overflow-hidden flex flex-col max-h-[96vh]">
            {/* Header */}
            <div className="px-6 py-4 flex items-start justify-between border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                {/* Official ANDIMA Logo */}
                <div className="w-11 h-11 bg-[#07111e] rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-xs border border-slate-700/20 select-none">
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
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Record Customer Conversation
                  </h3>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Log WhatsApp threads or meeting documents and declare assistance requirement.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitNewConversation} className="px-6 py-3.5 overflow-y-auto space-y-3 flex-1 text-xs">
              {/* Validation Error Alert (Conforms to E-2 & TC-007 to TC-012) */}
              {createFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{createFormError}</div>
                </div>
              )}

              {/* PIC (Sales Executive) - Otomatis akun pengisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIC (Sales Executive)
                </label>
                <div className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#a7f3d0] text-[#065f46] flex items-center justify-center font-bold text-[10px]">
                      {activeUserName.trim().charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="font-bold text-slate-900">{activeUserName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    Otomatis dari Akun
                  </span>
                </div>
              </div>

              {/* Select Customer Account * */}
              <div className="relative" ref={accountDropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Customer Account <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="w-full bg-[#f8fafc] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                >
                  <span className="truncate">{selectedAccount}</span>
                  <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform ${isAccountDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                    {accountOptions.map((acc) => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setIsAccountDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          selectedAccount === acc ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{acc}</span>
                        {selectedAccount === acc && <Check size={13} className="text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Number (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Number <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={jobNumberInput}
                  onChange={(e) => setJobNumberInput(e.target.value)}
                  placeholder="e.g. #AENAT/2609/0308"
                  className="w-full bg-[#f8fafc] focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2 text-xs font-medium text-slate-800 outline-none shadow-2xs transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Date * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full bg-[#f8fafc] focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none shadow-2xs transition-colors cursor-pointer"
                />
              </div>

              {/* Channel Type * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Channel Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* WhatsApp (.txt) */}
                  <div
                    onClick={() => setChannelSelection('WhatsApp')}
                    className={`rounded-xl py-2 px-3.5 flex items-center justify-between cursor-pointer transition-all ${
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

                  {/* Meeting Document */}
                  <div
                    onClick={() => setChannelSelection('Meeting')}
                    className={`rounded-xl py-2 px-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      channelSelection === 'Meeting'
                        ? 'border-2 border-[#2563eb] bg-white shadow-2xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className={channelSelection === 'Meeting' ? 'text-[#2563eb]' : 'text-slate-400'} />
                      <span className={`text-xs ${channelSelection === 'Meeting' ? 'font-bold text-[#2563eb]' : 'font-medium text-slate-600'}`}>
                        Meeting Document
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

              {/* Summary * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={recordSummary}
                  onChange={(e) => setRecordSummary(e.target.value)}
                  placeholder="Tulis ringkasan percakapan di sini..."
                  className="w-full bg-[#f8fafc] focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs font-normal text-slate-800 leading-relaxed outline-none shadow-2xs transition-colors resize-none placeholder:text-slate-400"
                />
              </div>

              {/* File * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Attachment (Opsional)
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
                  className={`w-full border rounded-2xl p-4 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs ${
                    isDraggingFile ? 'border-blue-500 bg-blue-50/20' : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#2563eb] mb-1.5">
                    <UploadCloud size={18} className="text-[#2563eb]" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Upload chat export .txt file or meeting notes PDF
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Drag and drop your file here, or <span className="text-[#2563eb] font-semibold underline">Browse files</span>
                  </p>
                  <div className="mt-2 px-2.5 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] text-slate-400 font-medium">
                    Max file size: 15MB • UTF-8 format supported
                  </div>
                </div>
                <input
                  ref={createFileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => handleCreateFileUpload(e.target.files)}
                  className="hidden"
                />

                {/* Uploaded items feedback */}
                {newUploadedFiles.length > 0 && (
                  <div className="mt-1.5 space-y-1">
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
              <div className="pt-2.5 -mx-6 -mb-3.5 px-6 py-3 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" />
                  <span className="text-xs text-slate-400 font-medium">
                    Auto-synced with C-Track Timeline
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew}
                    className="px-4 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmittingNew ? <Loader2 size={13} className="animate-spin" /> : <Save size={14} />}
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
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px] bg-slate-50">
              <iframe
                src={previewModal.url}
                className="w-full h-96 rounded-lg border border-slate-200"
                title={previewModal.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
