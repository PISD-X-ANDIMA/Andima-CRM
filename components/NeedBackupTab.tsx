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
} from 'lucide-react';
import { NeedBackupTicket, NeedBackupTicketLog } from '@/backend/record_conversation/types';
import {
  getNeedBackupTickets,
  updateNeedBackupStatus,
} from '@/backend/record_conversation/worksheetService';

// Default seed tickets matching user's Figma screenshot & modal mockup
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
    ticket_id: 'BCK-2026-001',
    job_number: '#AENAT/2609/0306',
    customer_name: 'PT. Sinar Baja Nusantara',
    category: 'Gross Weight',
    priority: 'High',
    date: '24-09-2026',
    time: '10:35 WIB',
    status: 'Inprogress',
    connected_job: 'DSVEXP/2605/2552',
    sla_description: 'SLA Tindakan Segera (< 30 Menit)',
    description: 'Jumlah koli fisik yang diterima di lokasi (8 koli) tidak sesuai dengan data dokumen awal (10 koli). Mohon koordinasi tim warehouse Cikarang untuk pengecekan 2 koli tertinggal.',
    requested_by: 'Adelia (Sales Executive)',
    created_at: '2026-09-24T10:35:00Z',
    logs: [
      {
        id: 'log-2-1',
        author: 'Budi (Ops Senior)',
        timestamp: '24-09-2026 10:45',
        message: 'Tim warehouse Cikarang sedang melakukan audit fisik 2 koli...',
        is_active: true,
      },
      {
        id: 'log-2-2',
        author: 'Adelia',
        timestamp: '24-09-2026 10:35',
        message: 'Tiket diajukan ke tim Operasional & Senior Manager.',
        is_active: false,
      },
    ],
  },
  {
    id: 'bck-seed-3',
    ticket_id: 'BCK-2026-001',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Multi Logistik Sentosa',
    category: 'Kerusakan barang',
    priority: 'Medium',
    date: '03-03-2026',
    time: '11:45 WIB',
    status: 'Inprogress',
    connected_job: 'DSVEXP/2605/2553',
    sla_description: 'SLA Respon < 4 Jam',
    description: 'Kemasan karton sobek di bagian sudut saat proses forklift bongkar muat. Memerlukan berita acara re-packing dan dokumentasi foto resmi.',
    requested_by: 'Adelia (Sales Executive)',
    created_at: '2026-03-03T11:45:00Z',
    logs: [
      {
        id: 'log-3-1',
        author: 'Budi Santoso (Field Lead)',
        timestamp: '03-03-2026 12:10',
        message: 'Sedang dilakukan pembuatan Berita Acara Kerusakan bersama petugas kargo.',
        is_active: true,
      },
      {
        id: 'log-3-2',
        author: 'Adelia',
        timestamp: '03-03-2026 11:45',
        message: 'Laporan kerusakan barang dibuat.',
        is_active: false,
      },
    ],
  },
  {
    id: 'bck-seed-4',
    ticket_id: 'BCK-2026-001',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Trans Sejahtera Abadi',
    category: 'Kendala Surat Jalan',
    priority: 'Low',
    date: '03-03-2026',
    time: '13:20 WIB',
    status: 'Resolved',
    connected_job: 'DSVEXP/2605/2554',
    sla_description: 'SLA Respon Standard 24 Jam',
    description: 'Stempel surat jalan belum terbaca jelas pada lembar copy penerima. Telah dikonfirmasi ulang via e-stempel resmi dan consignee menandatangani BA.',
    requested_by: 'Siti Rahmawati',
    created_at: '2026-03-03T13:20:00Z',
    logs: [
      {
        id: 'log-4-1',
        author: 'Siti Rahmawati',
        timestamp: '03-03-2026 14:00',
        message: 'Surat jalan selesai divalidasi dan stempel basah telah diverifikasi OK.',
        is_active: true,
      },
      {
        id: 'log-4-2',
        author: 'Siti Rahmawati',
        timestamp: '03-03-2026 13:20',
        message: 'Permohonan bantuan konfirmasi stempel dibuat.',
        is_active: false,
      },
    ],
  },
  {
    id: 'bck-seed-5',
    ticket_id: 'BCK-2026-001',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Global Kargo Mandiri',
    category: 'Selisih Koli',
    priority: 'Low',
    date: '03-03-2026',
    time: '14:10 WIB',
    status: 'Resolved',
    connected_job: 'DSVEXP/2605/2555',
    sla_description: 'SLA Respon Standard 24 Jam',
    description: 'Selisih koli terselesaikan setelah pengecekan fisik di gudang transit kargo internasional.',
    requested_by: 'Dewi Lestari',
    created_at: '2026-03-03T14:10:00Z',
    logs: [
      {
        id: 'log-5-1',
        author: 'Dewi Lestari',
        timestamp: '03-03-2026 15:30',
        message: 'Semua koli telah diverifikasi lengkap di transit bay.',
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
  const [selectedTicket, setSelectedTicket] = useState<NeedBackupTicket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Comment Form State in Detail Modal
  const [newComment, setNewComment] = useState('');

  // New Ticket Form State
  const [newJobNumber, setNewJobNumber] = useState('#AENAT/2609/0308');
  const [newCustomer, setNewCustomer] = useState('');
  const [newCategory, setNewCategory] = useState('Selisih Koli');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
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
        if (raw) localData = JSON.parse(raw);
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

  // Filtered tickets based on search
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(t =>
      t.job_number.toLowerCase().includes(q) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
      t.ticket_id.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  // Dynamic counts for top cards
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inprogressCount = tickets.filter(t => t.status === 'Inprogress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  // Handle status update
  const handleUpdateStatus = async (ticketId: string, newStatus: 'Open' | 'Inprogress' | 'Resolved') => {
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
    const descWords = newDescription.trim().split(/\s+/).filter(Boolean);
    if (descWords.length > 200) {
      alert(`Deskripsi kendala melebihi batas maksimum 200 kata (saat ini ${descWords.length} kata). Mohon persingkat.`);
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newTicket: NeedBackupTicket = {
      id: `bck-${Date.now()}`,
      ticket_id: 'BCK-2026-001',
      job_number: newJobNumber.startsWith('#') ? newJobNumber : `#${newJobNumber}`,
      customer_name: newCustomer || 'PT. Sinar Baja Nusantara',
      category: newCategory,
      priority: newPriority,
      date: dateStr,
      time: timeStr,
      status: 'Open',
      connected_job: 'DSVEXP/2605/2552',
      sla_description: newPriority === 'High' ? 'SLA Tindakan Segera (< 30 Menit)' : 'SLA Respon < 4 Jam',
      description: newDescription || 'Permohonan bantuan operasional dari agen lapangan.',
      requested_by: 'Adelia (Sales Executive)',
      created_at: now.toISOString(),
      logs: [
        {
          id: `log-${Date.now()}`,
          author: 'Adelia (Sales Executive)',
          timestamp: `${dateStr} ${timeStr}`,
          message: 'Tiket diajukan ke tim Operasional & Senior Manager.',
          is_active: true,
        },
      ],
    };

    persistTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    setNewDescription('');
    setNewCustomer('');
    showToast(`Tiket ${newTicket.job_number} berhasil dibuat!`);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Need Backup Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            Pantau dan kelola tiket eskalasi bantuan operasional untuk transaksi terkendala.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Buat Tiket Baru</span>
          </button>
          <button
            onClick={loadTickets}
            title="Refresh Data"
            className="p-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
        {/* Card 1: Total Tiket */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 tracking-tight block">
              Total Tiket
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {totalCount} Tiket
            </div>
            <div className="text-[11px] font-medium text-blue-600 mt-3 flex items-center gap-1">
              <span>→ Semua kanal aktif</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50/90 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
        </div>

        {/* Card 2: Menunggu Respons */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 tracking-tight block">
              Menunggu Respons
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {openCount} Tiket
            </div>
            <div className="text-[11px] font-medium text-amber-600 mt-3 flex items-center gap-1">
              <span>! Perlu eskalasi segera</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50/90 text-amber-500 flex items-center justify-center shrink-0">
            <Hourglass size={18} />
          </div>
        </div>

        {/* Card 3: Dalam Penanganan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 tracking-tight block">
              Dalam Penanganan
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {inprogressCount} Tiket
            </div>
            <div className="text-[11px] font-medium text-blue-600 mt-3 flex items-center gap-1">
              <RefreshCw size={11} className="inline mr-0.5" />
              <span>Tim lapangan bertugas</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50/90 text-blue-500 flex items-center justify-center shrink-0">
            <RefreshCw size={18} />
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 tracking-tight block">
              Selesai
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {resolvedCount} Tiket
            </div>
            <div className="text-[11px] font-medium text-emerald-600 mt-3 flex items-center gap-1">
              <span>✓ Solved &amp; Verifikasi OK</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50/90 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* SEARCH BAR (Full-width rounded input matching screenshot) */}
      <div className="mb-5">
        <div className="relative w-full bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] px-5 py-3.5 flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Customer/Job Number..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-300 font-normal outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f4f9] text-slate-800 text-sm font-bold border-b border-slate-100">
                <th className="py-4.5 px-6 text-left pl-8 w-[160px]">Tiket ID</th>
                <th className="py-4.5 px-6 text-left w-[240px]">Job Number</th>
                <th className="py-4.5 px-6 text-center w-[180px]">Kategori Kendala</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Prioritas</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Tanggal</th>
                <th className="py-4.5 px-6 text-center w-[140px]">Status</th>
                <th className="py-4.5 px-6 text-center w-[120px] pr-8">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length > 0 ? (
                filteredTickets.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Tiket ID */}
                    <td className="py-5 px-6 pl-8 align-middle">
                      <span className="font-bold text-slate-800 text-sm tracking-tight">
                        {item.ticket_id}
                      </span>
                    </td>

                    {/* Job Number */}
                    <td className="py-5 px-6 align-middle">
                      <div>
                        <div className="font-bold text-slate-800 text-sm tracking-tight">
                          {item.job_number}
                        </div>
                        {item.customer_name ? (
                          <div className="text-xs text-slate-400 mt-0.5 font-normal">
                            {item.customer_name}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Kategori Kendala */}
                    <td className="py-5 px-6 text-center align-middle">
                      <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-semibold bg-[#eef2ff] text-[#4f46e5]">
                        {item.category}
                      </span>
                    </td>

                    {/* Prioritas */}
                    <td className="py-5 px-6 text-center align-middle">
                      {item.priority === 'High' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                          High
                        </span>
                      )}
                      {item.priority === 'Medium' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          Medium
                        </span>
                      )}
                      {item.priority === 'Low' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                          Low
                        </span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="py-5 px-6 text-center align-middle">
                      <span className="text-sm font-semibold text-slate-700">
                        {item.date}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-5 px-6 text-center align-middle">
                      {item.status === 'Open' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          Open
                        </span>
                      )}
                      {item.status === 'Inprogress' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                          Inprogress
                        </span>
                      )}
                      {item.status === 'Resolved' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          <Check size={12} className="text-[#059669]" />
                          Resolved
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-5 px-6 text-center pr-8 align-middle">
                      <button
                        onClick={() => setSelectedTicket(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye size={12} className="text-slate-400 group-hover:text-blue-500" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada tiket yang sesuai dengan pencarian &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL (Matching User's Uploaded Screenshot Exactly) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Detail Tiket Need Backup
                </h2>
                <div className="text-xs font-medium font-mono text-slate-400 mt-0.5 tracking-wider">
                  {selectedTicket.ticket_id}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 sm:space-y-4.5">
              {/* TOP TWO CARDS (Status Tiket & Prioritas) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Status Tiket Card */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Status Tiket</span>
                    {selectedTicket.status === 'Open' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                        Active
                      </span>
                    )}
                    {selectedTicket.status === 'Inprogress' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                        Active
                      </span>
                    )}
                    {selectedTicket.status === 'Resolved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                        <Check size={11} className="text-[#059669]" />
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-2">
                    {selectedTicket.status === 'Open'
                      ? 'Open / Menunggu Respons'
                      : selectedTicket.status === 'Inprogress'
                      ? 'Inprogress / Dalam Penanganan'
                      : 'Resolved / Selesai'}
                  </div>
                </div>

                {/* Prioritas Card */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Prioritas</span>
                    {selectedTicket.priority === 'High' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        Urgent SLA
                      </span>
                    ) : selectedTicket.priority === 'Medium' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fef3c7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                        Normal SLA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        Low SLA
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-2">
                    {selectedTicket.priority === 'High'
                      ? 'High / Urgent'
                      : selectedTicket.priority === 'Medium'
                      ? 'Medium / Normal'
                      : 'Low / Standard'}
                  </div>
                </div>
              </div>

              {/* INFORMATION CARD */}
              <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/60 p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  INFORMATION
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {selectedTicket.customer_name || 'PT. Sinar Baja Nusantara'}
                  </h3>
                  <p className="text-xs font-bold text-[#2563eb] mt-0.5">
                    {selectedTicket.job_number}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/50 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pelapor:</span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {selectedTicket.requested_by || 'Adelia (Sales Executive)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tanggal &amp; Waktu:</span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {selectedTicket.date}, {selectedTicket.time || '10:35 WIB'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONNECTED JOB / KATEGORI */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  CONNECTED JOB / KATEGORI
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                    <Tag size={12} className="rotate-90 text-blue-500" />
                    <span>{selectedTicket.connected_job || 'DSVEXP/2605/2552'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                    <Tag size={12} className="rotate-90 text-amber-500" />
                    <span>{selectedTicket.category || 'Gross Weight'}</span>
                  </span>
                </div>
              </div>

              {/* DESKRIPSI KENDALA & BANTUAN */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  DESKRIPSI KENDALA &amp; BANTUAN
                </span>
                <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-3.5 text-xs font-normal text-slate-700 leading-relaxed">
                  {selectedTicket.description ||
                    'Jumlah koli fisik yang diterima di lokasi (8 koli) tidak sesuai dengan data dokumen awal (10 koli). Mohon koordinasi tim warehouse Cikarang untuk pengecekan 2 koli tertinggal.'}
                </div>
              </div>

              {/* RIWAYAT TINDAK LANJUT / AUDIT LOG */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    RIWAYAT TINDAK LANJUT / AUDIT LOG
                  </span>
                  <span className="bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {selectedTicket.logs?.length || 2} Log
                  </span>
                </div>

                <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedTicket.logs && selectedTicket.logs.length > 0 ? (
                    selectedTicket.logs.map((log, idx) => (
                      <div key={log.id || idx} className="relative">
                        {/* Timeline Dot */}
                        <span
                          className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                            log.is_active ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                        />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800">{log.author}</span>
                          <span className="text-[11px] text-slate-400">at {log.timestamp}</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal">
                          {log.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-blue-600" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800">Ditanggapi oleh Budi (Ops Senior)</span>
                          <span className="text-[11px] text-slate-400">at 24-09-2026 10:45</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal">
                          Tim warehouse Cikarang sedang melakukan audit fisik 2 koli...
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-slate-400" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-800">Diajukan oleh Adelia</span>
                          <span className="text-[11px] text-slate-400">at 24-09-2026 10:35</span>
                        </div>
                        <div className="mt-1 bg-[#f8fafc] border border-slate-200/70 rounded-xl p-2.5 text-xs text-slate-600 leading-normal">
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
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PenLine size={13} className="text-slate-600" />
                    <span>Tulis Tanggapan / Catatan Tambahan</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Markdown didukung</span>
                </div>

                <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs focus-within:border-blue-400 transition-colors">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Tulis tanggapan / catatan tambahan..."
                    className="w-full p-3 text-xs text-slate-700 outline-none resize-none placeholder:text-slate-400"
                  />
                  <div className="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                      <button
                        type="button"
                        className="hover:text-slate-600 transition-colors cursor-pointer"
                        title="Lampirkan Dokumen"
                      >
                        <Paperclip size={15} />
                      </button>
                      <button
                        type="button"
                        className="hover:text-slate-600 transition-colors cursor-pointer"
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

              {/* STATUS TRANSITION BUTTONS (Preserved Exactly As Requested: Open, Inprogress, Resolved) */}
              <div className="border-t border-slate-100 pt-3.5">
                <label className="text-[11px] font-bold text-slate-700 block mb-2">
                  Ubah Status Tiket:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Open')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedTicket.status === 'Open'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Open
                  </button>

                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Inprogress')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedTicket.status === 'Inprogress'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <RefreshCw size={12} className={selectedTicket.status === 'Inprogress' ? 'animate-spin' : ''} />
                    Inprogress
                  </button>

                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedTicket.status === 'Resolved'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Check size={14} />
                    Resolved
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Space */}
            <div className="p-2 bg-slate-50 border-t border-slate-100 shrink-0" />
          </div>
        </div>
      )}

      {/* CREATE NEW TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Buat Tiket Need Backup
                  </h2>
                  <p className="text-xs text-slate-400">
                    Eskalasikan kendala operasional lapangan baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Job Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobNumber}
                    onChange={e => setNewJobNumber(e.target.value)}
                    placeholder="#AENAT/2609/0308"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Customer / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={e => setNewCustomer(e.target.value)}
                    placeholder="PT. Sinar Baja Nusantara"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kategori Kendala *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Gross Weight">Gross Weight</option>
                    <option value="Selisih Koli">Selisih Koli</option>
                    <option value="Kerusakan barang">Kerusakan barang</option>
                    <option value="Kendala Surat Jalan">Kendala Surat Jalan</option>
                    <option value="Dokumen Tertahan">Dokumen Tertahan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Prioritas *
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="High">High / Urgent</option>
                    <option value="Medium">Medium / Normal</option>
                    <option value="Low">Low / Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Deskripsi Kendala &amp; Bantuan yang Dibutuhkan *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    newDescription.trim().split(/\s+/).filter(Boolean).length > 200
                      ? 'text-red-500 font-bold'
                      : 'text-slate-400'
                  }`}>
                    {newDescription.trim().split(/\s+/).filter(Boolean).length} / 200 kata
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Jelaskan kendala di lapangan dan bantuan yang dibutuhkan..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
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
