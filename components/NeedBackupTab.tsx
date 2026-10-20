'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Hourglass,
  RefreshCw,
  CheckCircle2,
  Eye,
  X,
  Check,
  Plus,
  Tag,
  Paperclip,
  AtSign,
  PenLine,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { NeedBackupTicket, NeedBackupTicketLog, NeedBackupStatus } from '@/backend/record_conversation/types';
import {
  getNeedBackupTickets,
  updateNeedBackupStatus,
} from '@/backend/record_conversation/worksheetService';

// The 6 requested statuses in exact user order:
// 1. Open
// 2. To do
// 3. Pending
// 4. In progres
// 5. In riview
// 6. Completed
export const STATUS_LIST: NeedBackupStatus[] = [
  'Open',
  'To do',
  'Pending',
  'In progres',
  'In riview',
  'Completed',
];

export function normalizeStatus(rawStatus?: string): NeedBackupStatus {
  if (!rawStatus) return 'Open';
  const s = rawStatus.trim().toLowerCase();
  if (s === 'to do' || s === 'todo') return 'To do';
  if (s === 'pending') return 'Pending';
  if (
    s === 'in progres' ||
    s === 'in progress' ||
    s === 'inprogress' ||
    s === 'progres' ||
    s === 'progress'
  )
    return 'In progres';
  if (
    s === 'in riview' ||
    s === 'in review' ||
    s === 'inriview' ||
    s === 'inreview' ||
    s === 'review' ||
    s === 'riview'
  )
    return 'In riview';
  if (
    s === 'completed' ||
    s === 'resolved' ||
    s === 'selesai' ||
    s === 'done' ||
    s === 'close' ||
    s === 'closed'
  )
    return 'Completed';
  return 'Open';
}

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    dotBg: string;
    icon: 'dot' | 'check' | 'clock' | 'eye' | 'todo';
    detailLabel: string;
    btnClass: string;
    btnActiveClass: string;
  }
> = {
  'Open': {
    label: 'Open',
    bg: 'bg-[#fffbeb]',
    text: 'text-[#d97706]',
    border: 'border-[#fde68a]',
    darkBg: 'dark:bg-amber-950/40',
    darkText: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-900/60',
    dotBg: 'bg-[#d97706]',
    icon: 'dot',
    detailLabel: 'Open / Menunggu Respons',
    btnClass: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-900/60 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-amber-500 text-white border-amber-600 shadow-sm',
  },
  'To do': {
    label: 'To do',
    bg: 'bg-[#f1f5f9]',
    text: 'text-[#475569]',
    border: 'border-[#cbd5e1]',
    darkBg: 'dark:bg-slate-800/60',
    darkText: 'dark:text-slate-300',
    darkBorder: 'dark:border-slate-700',
    dotBg: 'bg-[#64748b]',
    icon: 'todo',
    detailLabel: 'To do / Dalam Antrean',
    btnClass: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-slate-700 text-white border-slate-800 shadow-sm',
  },
  'Pending': {
    label: 'Pending',
    bg: 'bg-[#fff7ed]',
    text: 'text-[#ea580c]',
    border: 'border-[#fed7aa]',
    darkBg: 'dark:bg-orange-950/40',
    darkText: 'dark:text-orange-300',
    darkBorder: 'dark:border-orange-900/60',
    dotBg: 'bg-[#ea580c]',
    icon: 'clock',
    detailLabel: 'Pending / Menunggu Konfirmasi',
    btnClass: 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50 dark:bg-slate-800 dark:text-orange-300 dark:border-orange-900/60 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-orange-500 text-white border-orange-600 shadow-sm',
  },
  'In progres': {
    label: 'In progres',
    bg: 'bg-[#eff6ff]',
    text: 'text-[#2563eb]',
    border: 'border-[#bfdbfe]',
    darkBg: 'dark:bg-blue-950/40',
    darkText: 'dark:text-blue-300',
    darkBorder: 'dark:border-blue-900/60',
    dotBg: 'bg-[#2563eb]',
    icon: 'dot',
    detailLabel: 'In progres / Dalam Penanganan',
    btnClass: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-blue-600 text-white border-blue-700 shadow-sm',
  },
  'In riview': {
    label: 'In riview',
    bg: 'bg-[#faf5ff]',
    text: 'text-[#9333ea]',
    border: 'border-[#e9d5ff]',
    darkBg: 'dark:bg-purple-950/40',
    darkText: 'dark:text-purple-300',
    darkBorder: 'dark:border-purple-900/60',
    dotBg: 'bg-[#9333ea]',
    icon: 'eye',
    detailLabel: 'In riview / Dalam Peninjauan',
    btnClass: 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-900/60 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-purple-600 text-white border-purple-700 shadow-sm',
  },
  'Completed': {
    label: 'Completed',
    bg: 'bg-[#ecfdf5]',
    text: 'text-[#059669]',
    border: 'border-[#a7f3d0]',
    darkBg: 'dark:bg-emerald-950/40',
    darkText: 'dark:text-emerald-300',
    darkBorder: 'dark:border-emerald-900/60',
    dotBg: 'bg-[#059669]',
    icon: 'check',
    detailLabel: 'Completed / Selesai',
    btnClass: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-900/60 dark:hover:bg-slate-700',
    btnActiveClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
  },
};

// Default seed tickets showcasing all 6 statuses in order
const SEED_TICKETS: NeedBackupTicket[] = [
  {
    id: 'bck-seed-1',
    ticket_id: 'BCK-2026-001',
    job_number: '#AENAT/2609/0305',
    customer_name: 'PT. JPG TransIndonesia',
    category: 'Selisih Koli',
    priority: 'Medium',
    date: '03-03-2026',
    time: '09:15 WIB',
    status: 'Open',
    connected_job: 'DSVEXP/2605/2550',
    sla_description: 'SLA Respon < 4 Jam',
    description: 'Terdapat selisih 2 koli saat serah terima di dermaga 3. Butuh koordinasi segera dengan pihak shipper & supervisi dokumen.',
    requested_by: 'Adelia (Sales Executive)',
    created_at: '2026-03-03T09:15:00Z',
    logs: [
      {
        id: 'log-1-1',
        author: 'Adelia (Sales Executive)',
        timestamp: '03-03-2026 09:15',
        message: 'Tiket diajukan ke tim Operasional & Senior Manager.',
        is_active: true,
      },
    ],
  },
  {
    id: 'bck-seed-2',
    ticket_id: 'BCK-2026-002',
    job_number: '#AENAT/2609/0306',
    customer_name: 'PT. Sinar Baja Nusantara',
    category: 'Gross Weight',
    priority: 'Normal',
    date: '03-03-2026',
    time: '10:00 WIB',
    status: 'To do',
    connected_job: 'DSVEXP/2605/2551',
    sla_description: 'SLA Respon < 4 Jam',
    description: 'Menunggu penugasan personil lapangan untuk verifikasi timbangan ulang kargo sebelum stuffing kontainer.',
    requested_by: 'Adelia (Sales Executive)',
    created_at: '2026-03-03T10:00:00Z',
    logs: [
      {
        id: 'log-2-1',
        author: 'Dispatcher Ops',
        timestamp: '03-03-2026 10:05',
        message: 'Tiket masuk antrean To do jadwal inspeksi shift siang.',
        is_active: true,
      },
    ],
  },
  {
    id: 'bck-seed-3',
    ticket_id: 'BCK-2026-003',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Bahtera Nusa Logistik',
    category: 'Kendala Surat Jalan',
    priority: 'High',
    date: '03-03-2026',
    time: '10:35 WIB',
    status: 'Pending',
    connected_job: 'DSVEXP/2605/2552',
    sla_description: 'SLA Tindakan Segera (< 30 Menit)',
    description: 'Pending konfirmasi stempel bea cukai dari consignee. Menunggu upload berkas legalisir resmi.',
    requested_by: 'Budi (Ops Senior)',
    created_at: '2026-03-03T10:35:00Z',
    logs: [
      {
        id: 'log-3-1',
        author: 'Budi (Ops Senior)',
        timestamp: '03-03-2026 10:45',
        message: 'Status dipending sementara menunggu dokumen revisi shipper.',
        is_active: true,
      },
    ],
  },
  {
    id: 'bck-seed-4',
    ticket_id: 'BCK-2026-004',
    job_number: '#AENAT/2609/0308',
    customer_name: 'PT. Multi Logistik Sentosa',
    category: 'Kerusakan barang',
    priority: 'Medium',
    date: '03-03-2026',
    time: '11:45 WIB',
    status: 'In progres',
    connected_job: 'DSVEXP/2605/2553',
    sla_description: 'SLA Respon < 4 Jam',
    description: 'Kemasan karton sobek di bagian sudut saat forklift bongkar muat. Sedang dilakukan pembuatan Berita Acara Kerusakan bersama tim gudang.',
    requested_by: 'Adelia (Sales Executive)',
    created_at: '2026-03-03T11:45:00Z',
    logs: [
      {
        id: 'log-4-1',
        author: 'Budi Santoso (Field Lead)',
        timestamp: '03-03-2026 12:10',
        message: 'Sedang dilakukan pembuatan Berita Acara Kerusakan bersama petugas kargo.',
        is_active: true,
      },
    ],
  },
  {
    id: 'bck-seed-5',
    ticket_id: 'BCK-2026-005',
    job_number: '#AENAT/2609/0309',
    customer_name: 'PT. Trans Sejahtera Abadi',
    category: 'Dokumen Tertahan',
    priority: 'High',
    date: '03-03-2026',
    time: '13:20 WIB',
    status: 'In riview',
    connected_job: 'DSVEXP/2605/2554',
    sla_description: 'SLA Respon < 4 Jam',
    description: 'Dokumen revisi koli dan manifest baru telah diunggah. Menunggu approval review dari Operation Lead.',
    requested_by: 'Siti Rahmawati',
    created_at: '2026-03-03T13:20:00Z',
    logs: [
      {
        id: 'log-5-1',
        author: 'Siti Rahmawati',
        timestamp: '03-03-2026 13:50',
        message: 'Dokumen lengkap telah diserahkan untuk proses in riview supervisi.',
        is_active: true,
      },
    ],
  },
  {
    id: 'bck-seed-6',
    ticket_id: 'BCK-2026-006',
    job_number: '#AENAT/2609/0310',
    customer_name: 'PT. Global Kargo Mandiri',
    category: 'Selisih Koli',
    priority: 'Low',
    date: '03-03-2026',
    time: '14:10 WIB',
    status: 'Completed',
    connected_job: 'DSVEXP/2605/2555',
    sla_description: 'SLA Respon Standard 24 Jam',
    description: 'Selisih koli terselesaikan setelah pengecekan fisik di gudang transit kargo internasional. Serah terima tuntas.',
    requested_by: 'Dewi Lestari',
    created_at: '2026-03-03T14:10:00Z',
    logs: [
      {
        id: 'log-6-1',
        author: 'Dewi Lestari',
        timestamp: '03-03-2026 15:30',
        message: 'Semua koli telah diverifikasi lengkap di transit bay. Tiket ditutup (Completed).',
        is_active: true,
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'andima_need_backup_tickets';

interface NeedBackupProps {
  initialSub?: string;
  onSubChange?: (sub: any) => void;
}

export default function NeedBackupTab({}: NeedBackupProps = {}) {
  const [tickets, setTickets] = useState<NeedBackupTicket[]>(SEED_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NeedBackupStatus>('all');
  const [statusDropdownOpenId, setStatusDropdownOpenId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 6;
  const [selectedTicket, setSelectedTicket] = useState<NeedBackupTicket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setStatusDropdownOpenId(null);
    };
    if (statusDropdownOpenId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [statusDropdownOpenId]);

  // Helper to count words for 200-word limit
  const countWords = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  };

  // Helper to clean and format job number without duplicate #
  const cleanJobNumber = (raw: string): string => {
    const stripped = (raw || '').replace(/#+/g, '').trim();
    return stripped ? `#${stripped}` : '#AENAT/2609/0308';
  };

  // New Comment Form State in Detail Modal
  const [newComment, setNewComment] = useState('');

  // New Ticket Form State
  const [newJobNumber, setNewJobNumber] = useState('#AENAT/2609/0308');
  const [newCustomer, setNewCustomer] = useState('');
  const [newCategory, setNewCategory] = useState('Selisih Koli');
  const [newPriority, setNewPriority] = useState<string>('Normal');
  const [newStatus, setNewStatus] = useState<NeedBackupStatus>('Open');
  const [newDescription, setNewDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load tickets from Supabase or localStorage
  const loadTickets = async () => {
    let localData: NeedBackupTicket[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if older version data needs migration to the 6 statuses
            const hasNewStatuses = parsed.some(
              (t: any) =>
                t.status === 'To do' ||
                t.status === 'In riview' ||
                t.status === 'Pending' ||
                t.status === 'In progres' ||
                t.status === 'Completed'
            );
            if (!hasNewStatuses && parsed.length <= 5) {
              localData = SEED_TICKETS;
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TICKETS));
            } else {
              localData = parsed.map((t: any) => ({
                ...t,
                status: normalizeStatus(t.status),
              }));
            }
          }
        }
      } catch {}
    }

    // Try fetching from Supabase
    try {
      const dbTickets = await getNeedBackupTickets();
      if (dbTickets && dbTickets.length > 0) {
        const combined = [...dbTickets];
        SEED_TICKETS.forEach(seed => {
          if (!combined.some(c => c.job_number === seed.job_number && c.category === seed.category)) {
            combined.push(seed);
          }
        });
        setTickets(combined);
        return;
      }
    } catch {}

    // Fallback: localStorage or default SEED
    if (localData && localData.length > 0) {
      setTickets(localData);
    } else {
      setTickets(SEED_TICKETS);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_TICKETS));
      }
    }
  };

  useEffect(() => {
    loadTickets();

    const handleUpdateEvent = () => {
      loadTickets();
    };

    window.addEventListener('need_backup_updated', handleUpdateEvent);
    return () => {
      window.removeEventListener('need_backup_updated', handleUpdateEvent);
    };
  }, []);

  // Save tickets to local state & localStorage
  const persistTickets = (updated: NeedBackupTicket[]) => {
    setTickets(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  // Dynamic counts for each status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Open': 0,
      'To do': 0,
      'Pending': 0,
      'In progres': 0,
      'In riview': 0,
      'Completed': 0,
    };
    tickets.forEach(t => {
      const norm = normalizeStatus(t.status);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  // Filtered tickets based on search and status filter
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const norm = normalizeStatus(t.status);
      if (statusFilter !== 'all' && norm !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.job_number.toLowerCase().includes(q) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        t.ticket_id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        norm.toLowerCase().includes(q) ||
        (t.status && t.status.toLowerCase().includes(q))
      );
    });
  }, [tickets, statusFilter, searchQuery]);

  // Pagination calculations (Exact Match with Sales Executive)
  const totalTickets = filteredTickets.length;
  const totalPages = Math.ceil(totalTickets / ticketsPerPage) || 1;
  const firstRow = totalTickets === 0 ? 0 : (currentPage - 1) * ticketsPerPage + 1;
  const lastRow = Math.min(currentPage * ticketsPerPage, totalTickets);
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      (currentPage - 1) * ticketsPerPage,
      currentPage * ticketsPerPage
    );
  }, [filteredTickets, currentPage, ticketsPerPage]);

  // Dynamic counts for top cards
  const totalCount = tickets.length;
  const openCount = statusCounts['Open'] || 0;
  const todoCount = statusCounts['To do'] || 0;
  const pendingCount = statusCounts['Pending'] || 0;
  const inprogressCount = statusCounts['In progres'] || 0;
  const inreviewCount = statusCounts['In riview'] || 0;
  const resolvedCount = statusCounts['Completed'] || 0;

  // Handle status update
  const handleUpdateStatus = async (ticketId: string, newStatus: NeedBackupStatus) => {
    setIsUpdating(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newLogItem: NeedBackupTicketLog = {
      id: `log-${Date.now()}`,
      author: 'Adelia (Dispatcher)',
      timestamp: `${dateStr} ${timeStr}`,
      message: `Status tiket diubah menjadi "${newStatus}".`,
      is_active: true,
    };

    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const existingLogs = t.logs ? t.logs.map(l => ({ ...l, is_active: false })) : [];
        return {
          ...t,
          status: newStatus,
          logs: [newLogItem, ...existingLogs],
        };
      }
      return t;
    });

    persistTickets(updated);

    if (selectedTicket && selectedTicket.id === ticketId) {
      const existingLogs = selectedTicket.logs ? selectedTicket.logs.map(l => ({ ...l, is_active: false })) : [];
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
        logs: [newLogItem, ...existingLogs],
      });
    }

    // Attempt Supabase update
    try {
      await updateNeedBackupStatus(ticketId, newStatus);
    } catch {}

    setIsUpdating(false);
    showToast(`Status tiket berhasil diubah menjadi "${newStatus}"!`);
  };

  // Add Comment / Response to Audit Log
  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newLogItem: NeedBackupTicketLog = {
      id: `log-${Date.now()}`,
      author: 'Adelia (Dispatcher)',
      timestamp: `${dateStr} ${timeStr}`,
      message: newComment.trim(),
      is_active: true,
    };

    const existingLogs = selectedTicket.logs ? selectedTicket.logs.map(l => ({ ...l, is_active: false })) : [];
    const updatedTicket: NeedBackupTicket = {
      ...selectedTicket,
      logs: [newLogItem, ...existingLogs],
    };

    setSelectedTicket(updatedTicket);
    const updatedTickets = tickets.map(t => (t.id === selectedTicket.id ? updatedTicket : t));
    persistTickets(updatedTickets);
    setNewComment('');
    showToast('Tanggapan berhasil ditambahkan ke riwayat audit log!');
  };

  // Handle create new ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (countWords(newDescription) > 200) {
      showToast('Deskripsi kendala melebihi batas maksimal 200 kata.');
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newTicket: NeedBackupTicket = {
      id: `bck-${Date.now()}`,
      ticket_id: `BCK-2026-${String(tickets.length + 1).padStart(3, '0')}`,
      job_number: cleanJobNumber(newJobNumber),
      customer_name: newCustomer || 'PT. Sinar Baja Nusantara',
      category: newCategory,
      priority: newPriority,
      date: dateStr,
      time: timeStr,
      status: newStatus || 'Open',
      connected_job: 'DSVEXP/2605/2552',
      sla_description: newPriority === 'Urgent' || newPriority === 'High' ? 'SLA Tindakan Segera (< 30 Menit)' : 'SLA Respon < 4 Jam',
      description: newDescription || 'Permohonan bantuan operasional dari agen lapangan.',
      requested_by: 'Adelia (Sales Executive)',
      created_at: now.toISOString(),
      logs: [
        {
          id: `log-${Date.now()}`,
          author: 'Adelia (Sales Executive)',
          timestamp: `${dateStr} ${timeStr}`,
          message: `Tiket dibuat dengan status "${newStatus || 'Open'}".`,
          is_active: true,
        },
      ],
    };

    persistTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    setNewDescription('');
    setNewCustomer('');
    setNewStatus('Open');
    showToast(`Tiket ${newTicket.job_number} berhasil dibuat!`);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          onClick={() => setToastMessage(null)}
          className="fixed top-6 right-6 sm:top-8 sm:right-8 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700/80 animate-in fade-in slide-in-from-top-3 duration-200 cursor-pointer select-none"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP SECTION: HEADER, METRIC CARDS, SEARCH BAR (SHRINK-0) */}
      <div className="shrink-0">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Need Backup Monitoring
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal">
              Pantau dan kelola tiket eskalasi bantuan operasional untuk transaksi terkendala.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Buat Tiket Baru</span>
            </button>
            <button
              onClick={loadTickets}
              title="Refresh Data"
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-2.5">
          {/* Card 1: Total Tiket */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Total Tiket
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {totalCount} Tiket
              </div>
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <span>→ Semua status aktif</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50/90 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
          </div>

          {/* Card 2: Menunggu Respons & To do */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Open &amp; To do
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {openCount + todoCount} Tiket
              </div>
              <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <span>! {openCount} Open, {todoCount} To do</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50/90 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Hourglass size={16} />
            </div>
          </div>

          {/* Card 3: Dalam Penanganan (In progres & Pending) */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                In progres &amp; Pending
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {inprogressCount + pendingCount} Tiket
              </div>
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <RefreshCw size={10} className="inline mr-0.5" />
                <span>{inprogressCount} Aktif, {pendingCount} Pending</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50/90 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
              <RefreshCw size={16} />
            </div>
          </div>

          {/* Card 4: Selesai & Review */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Completed &amp; Review
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {resolvedCount + inreviewCount} Tiket
              </div>
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>✓ {resolvedCount} Selesai, {inreviewCount} Riview</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50/90 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        {/* QUICK STATUS FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({totalCount})
          </button>
          {STATUS_LIST.map(st => {
            const cfg = STATUS_CONFIG[st];
            const count = statusCounts[st] || 0;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-current/30 shadow-xs`
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotBg}`} />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH BAR */}
        <div className="mb-2.5">
          <div className="relative w-full bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] px-4 py-2 flex items-center dark:bg-slate-900 dark:border-slate-800">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Customer/Job Number..."
              className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 font-normal outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE (FLEX-1 MIN-H-0 SCROLLABLE) */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#0f172a] dark:border-slate-800 flex flex-col">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="sticky top-0 z-10 bg-[#f0f4f9] dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-2xs">
              <tr className="text-slate-800 text-xs font-bold dark:text-slate-200">
                <th className="py-3 px-5 text-left pl-6 w-[150px]">Tiket ID</th>
                <th className="py-3 px-5 text-left w-[220px]">Job Number</th>
                <th className="py-4.5 px-6 text-center w-[180px]">Kategori Kendala</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Prioritas</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Tanggal</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Status</th>
                <th className="py-4.5 px-6 text-center w-[120px] pr-8">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTickets.length > 0 ? (
                paginatedTickets.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Tiket ID */}
                    <td className="py-5 px-6 pl-8 align-middle">
                      <span className="font-bold text-slate-800 dark:text-slate-300 text-sm tracking-tight">
                        {item.ticket_id}
                      </span>
                    </td>

                    {/* Job Number */}
                    <td className="py-5 px-6 align-middle">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">
                          {cleanJobNumber(item.job_number)}
                        </div>
                        {item.customer_name ? (
                          <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-normal">
                            {item.customer_name}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Kategori Kendala */}
                    <td className="py-5 px-6 text-center align-middle">
                      <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold bg-[#eef2ff] text-[#4f46e5] dark:bg-indigo-950/40 dark:text-indigo-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Prioritas */}
                    <td className="py-5 px-6 text-center align-middle">
                      {(item.priority === 'Urgent' || item.priority === 'Origin') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
                          Urgent
                        </span>
                      )}
                      {item.priority === 'High' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fff1f2] text-[#e11d48] border border-[#ffe4e6] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                          High
                        </span>
                      )}
                      {(item.priority === 'Normal' || item.priority === 'Medium' || item.priority === 'Standard') && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          Normal
                        </span>
                      )}
                      {item.priority === 'Low' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                          Low
                        </span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="py-5 px-6 text-center align-middle">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {item.date}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-5 px-6 text-center align-middle">
                      {(() => {
                        const norm = normalizeStatus(item.status);
                        const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG['Open'];
                        const isOpen = statusDropdownOpenId === item.id;
                        return (
                          <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setStatusDropdownOpenId(isOpen ? null : item.id)}
                              className={`group inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:brightness-95 active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`}
                              title="Klik untuk ubah status"
                            >
                              {cfg.icon === 'check' ? (
                                <Check size={12} className={cfg.text} />
                              ) : cfg.icon === 'clock' ? (
                                <Clock size={11} className={cfg.text} />
                              ) : cfg.icon === 'eye' ? (
                                <Eye size={11} className={cfg.text} />
                              ) : cfg.icon === 'todo' ? (
                                <span className="w-1.5 h-1.5 rounded-xs bg-current" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotBg}`} />
                              )}
                              <span>{cfg.label}</span>
                              <ChevronDown size={11} className="opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                            </button>

                            {/* Status Quick Select Dropdown */}
                            {isOpen && (
                              <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                                  Ubah Status
                                </div>
                                {STATUS_LIST.map(st => {
                                  const itemCfg = STATUS_CONFIG[st];
                                  const isSelected = norm === st;
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => {
                                        setStatusDropdownOpenId(null);
                                        handleUpdateStatus(item.id, st);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                                          : 'text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${itemCfg.dotBg}`} />
                                        <span>{itemCfg.label}</span>
                                      </div>
                                      {isSelected && <Check size={12} className="text-blue-600 dark:text-blue-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Action */}
                    <td className="py-5 px-6 text-center pr-8 align-middle">
                      <button
                        onClick={() => setSelectedTicket(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye size={12} className="text-slate-400 group-hover:text-blue-500" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Tidak ada tiket yang sesuai dengan pencarian &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION (SHRINK-0) */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Showing {firstRow}-{lastRow} of {totalTickets} tickets</span>
        <nav className="flex items-center gap-1" aria-label="Tickets pages">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((value) => value - 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
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
                className={`h-8 min-w-8 rounded-md px-2 cursor-pointer transition-colors ${currentPage === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
              >
                {pageNumber}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-1 text-slate-400 dark:text-slate-500">...</span>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="h-8 min-w-8 rounded-md px-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((value) => value + 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            ›
          </button>
        </nav>
      </div>

      {/* DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-[#0f172a] dark:border dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Detail Tiket Need Backup
                </h2>
                <div className="text-xs font-medium font-mono text-slate-400 dark:text-slate-400 mt-0.5 tracking-wider">
                  {selectedTicket.ticket_id}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 sm:space-y-4.5">
              {/* TOP TWO CARDS (Status Tiket & Prioritas) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Status Tiket Card */}
                {(() => {
                  const norm = normalizeStatus(selectedTicket.status);
                  const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG['Open'];
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 shadow-2xs dark:bg-slate-900/90 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-400">Status Tiket</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`}>
                          {cfg.icon === 'check' ? (
                            <Check size={11} className={cfg.text} />
                          ) : cfg.icon === 'clock' ? (
                            <Clock size={11} className={cfg.text} />
                          ) : cfg.icon === 'eye' ? (
                            <Eye size={11} className={cfg.text} />
                          ) : cfg.icon === 'todo' ? (
                            <span className="w-1.5 h-1.5 rounded-xs bg-current" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotBg}`} />
                          )}
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {cfg.detailLabel}
                      </div>
                    </div>
                  );
                })()}

                {/* Prioritas Card */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 shadow-2xs dark:bg-slate-900/90 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-400">Prioritas</span>
                    {selectedTicket.priority === 'High' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2] dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        Urgent SLA
                      </span>
                    ) : selectedTicket.priority === 'Medium' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                        Normal SLA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        Low SLA
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {selectedTicket.priority === 'High'
                      ? 'High / Urgent'
                      : selectedTicket.priority === 'Medium'
                      ? 'Medium / Normal'
                      : 'Low / Standard'}
                  </div>
                </div>
              </div>

              {/* INFORMATION CARD */}
              <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/60 p-4 space-y-3 dark:bg-slate-900/60 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  INFORMATION
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedTicket.customer_name || 'PT. Sinar Baja Nusantara'}
                  </h3>
                  <p className="text-xs font-bold text-[#2563eb] dark:text-blue-400 mt-0.5">
                    {cleanJobNumber(selectedTicket.job_number)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Pelapor:</span>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedTicket.requested_by || 'Adelia (Sales Executive)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Tanggal &amp; Waktu:</span>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedTicket.date}, {selectedTicket.time || '10:35 WIB'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONNECTED JOB / KATEGORI */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  CONNECTED JOB / KATEGORI
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60">
                    <Tag size={12} className="rotate-90 text-blue-500 dark:text-blue-400" />
                    <span>{selectedTicket.connected_job || 'DSVEXP/2605/2552'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
                    <Tag size={12} className="rotate-90 text-amber-500 dark:text-amber-400" />
                    <span>{selectedTicket.category || 'Gross Weight'}</span>
                  </span>
                </div>
              </div>

              {/* DESKRIPSI KENDALA & BANTUAN */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  DESKRIPSI KENDALA &amp; BANTUAN
                </span>
                <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-3.5 text-xs font-normal text-slate-700 leading-relaxed dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
                  {selectedTicket.description ||
                    'Jumlah koli fisik yang diterima di lokasi (8 koli) tidak sesuai dengan data dokumen awal (10 koli). Mohon koordinasi tim warehouse Cikarang untuk pengecekan 2 koli tertinggal.'}
                </div>
              </div>

              {/* RIWAYAT TINDAK LANJUT / AUDIT LOG */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    RIWAYAT TINDAK LANJUT / AUDIT LOG
                  </span>
                  <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {selectedTicket.logs?.length || 2} Log
                  </span>
                </div>

                <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {selectedTicket.logs && selectedTicket.logs.length > 0 ? (
                    selectedTicket.logs.map((log, idx) => (
                      <div key={log.id || idx} className="relative">
                        {/* Timeline Dot */}
                        <span
                          className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                            log.is_active ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                        />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.author}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">at {log.timestamp}</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
                          {log.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 bg-blue-600" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ditanggapi oleh Budi (Ops Senior)</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">at 24-09-2026 10:45</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
                          Tim warehouse Cikarang sedang melakukan audit fisik 2 koli...
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 bg-slate-400" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Diajukan oleh Adelia</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">at 24-09-2026 10:35</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
                          Tiket diajukan ke tim Operasional &amp; Senior Manager.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* TULIS TANGGAPAN / CATATAN TAMBAHAN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PenLine size={13} className="text-slate-600 dark:text-slate-400" />
                    <span>Tulis Tanggapan / Catatan Tambahan</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Markdown didukung</span>
                </div>

                {normalizeStatus(selectedTicket.status) === 'Completed' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Status: Completed (Terselesaikan)</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Dapat diaktifkan kembali kapan saja
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs focus-within:border-blue-400 dark:border-slate-700 dark:bg-slate-900 transition-colors">
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Tulis catatan tindak lanjut tambahan..."
                        className="w-full p-3 text-xs text-slate-700 outline-none resize-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 bg-transparent"
                      />
                      <div className="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between dark:bg-slate-900/90 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                          <button
                            type="button"
                            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="Lampirkan Dokumen"
                          >
                            <Paperclip size={15} />
                          </button>
                          <button
                            type="button"
                            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="Mention Rekan Kerja"
                          >
                            <AtSign size={15} />
                          </button>
                        </div>
                        {newComment.trim() && (
                          <button
                            type="button"
                            onClick={() => handleAddComment()}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            Kirim Tanggapan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs focus-within:border-blue-400 dark:border-slate-700 dark:bg-slate-900 transition-colors">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Tulis tanggapan / catatan tambahan..."
                      className="w-full p-3 text-xs text-slate-700 outline-none resize-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 bg-transparent"
                    />
                    <div className="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between dark:bg-slate-900/90 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                        <button
                          type="button"
                          className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          title="Lampirkan Dokumen"
                        >
                          <Paperclip size={15} />
                        </button>
                        <button
                          type="button"
                          className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          title="Mention Rekan Kerja"
                        >
                          <AtSign size={15} />
                        </button>
                      </div>
                      {newComment.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAddComment()}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Kirim Tanggapan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STATUS TRANSITION BUTTONS */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Ubah Status Tiket:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_LIST.map(st => {
                    const cfg = STATUS_CONFIG[st];
                    const isCurrent = normalizeStatus(selectedTicket.status) === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isCurrent ? cfg.btnActiveClass : cfg.btnClass
                        }`}
                      >
                        {cfg.icon === 'check' ? (
                          <Check size={13} className={isCurrent ? 'text-white' : cfg.text} />
                        ) : cfg.icon === 'clock' ? (
                          <Clock size={12} className={isCurrent ? 'text-white' : cfg.text} />
                        ) : cfg.icon === 'eye' ? (
                          <Eye size={12} className={isCurrent ? 'text-white' : cfg.text} />
                        ) : cfg.icon === 'todo' ? (
                          <span className={`w-1.5 h-1.5 rounded-xs ${isCurrent ? 'bg-white' : 'bg-current'}`} />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : cfg.dotBg}`} />
                        )}
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end dark:bg-slate-900/80 dark:border-slate-800">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-[#0f172a] dark:border dark:border-slate-800">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Buat Tiket Need Backup
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Eskalasikan kendala operasional lapangan baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Job Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobNumber}
                    onChange={e => setNewJobNumber(e.target.value)}
                    placeholder="#AENAT/2609/0308"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Customer / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={e => setNewCustomer(e.target.value)}
                    placeholder="PT. Sinar Baja Nusantara"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Kategori Kendala *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Gross Weight" className="dark:bg-slate-900 dark:text-white">Gross Weight</option>
                    <option value="Selisih Koli" className="dark:bg-slate-900 dark:text-white">Selisih Koli</option>
                    <option value="Kerusakan barang" className="dark:bg-slate-900 dark:text-white">Kerusakan barang</option>
                    <option value="Kendala Surat Jalan" className="dark:bg-slate-900 dark:text-white">Kendala Surat Jalan</option>
                    <option value="Dokumen Tertahan" className="dark:bg-slate-900 dark:text-white">Dokumen Tertahan</option>
                    <option value="Others/Lainnya" className="dark:bg-slate-900 dark:text-white">Others/Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Prioritas *
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Urgent" className="dark:bg-slate-900 dark:text-white">Urgent</option>
                    <option value="High" className="dark:bg-slate-900 dark:text-white">High</option>
                    <option value="Normal" className="dark:bg-slate-900 dark:text-white">Normal</option>
                    <option value="Low" className="dark:bg-slate-900 dark:text-white">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Status Awal *
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as NeedBackupStatus)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none focus:border-blue-500 bg-white"
                  >
                    {STATUS_LIST.map(st => (
                      <option key={st} value={st} className="dark:bg-slate-900 dark:text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Deskripsi Kendala &amp; Bantuan yang Dibutuhkan *
                  </label>
                  <span className={`text-[10px] font-bold ${countWords(newDescription) > 200 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {countWords(newDescription)} / 200 kata
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Jelaskan kendala di lapangan dan bantuan yang dibutuhkan (maksimal 200 kata)..."
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-900 outline-none resize-none transition-colors ${
                    countWords(newDescription) > 200
                      ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                  }`}
                />
                {countWords(newDescription) > 200 && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    Deskripsi melebihi batas maksimal 200 kata. Harap ringkas deskripsi kendala Anda.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  Simpan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
