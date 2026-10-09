'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, FileText, ChevronRight, ChevronDown, Eye, Plus, X, MapPin, 
  CheckCircle, AlertOctagon, Check, Send, AlertTriangle, 
  ShieldAlert, Clock, ArrowLeftRight, Download, Calendar,
  Lock, Shield, User, RefreshCw, Building2, Truck, Box, Tag, AlertCircle,
  ExternalLink, Image as ImageIcon, MessageCircle
} from 'lucide-react';
import { getFieldAgentTasks, submitNeedBackup } from '@/backend/record_conversation/worksheetService';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type TaskStatus = 'Assigned' | 'Unassigned' | 'In Progress' | 'Completed';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  author: string;
  status: 'completed' | 'current' | 'pending' | 'alert';
}

export interface FieldTaskItem {
  id: string;
  task_id_code?: string;
  job_number: string;
  customer_name: string;
  customer_code?: string;
  shipper?: string;
  consignee?: string;
  mawb?: string;
  hawb?: string;
  handover_datetime: string;
  handover_location: string;
  field_agent_name?: string;
  status: TaskStatus;
  has_issue: boolean;
  issue_type?: string;
  issue_category?: string;
  issue_note?: string;
  issue_photos?: string[];
  issue_files?: {
    name: string;
    size: string;
    type: string;
    badge: string;
    url: string;
  }[];
  issue_document_status?: string;
  variance_tolerance?: string;
  issue_reported_at?: string;
  photo_count: number;
  doc_count: number;
  result_photos?: string[];
  result_docs?: { name: string; size: string; url: string }[];
  gross_weight?: string;
  cargo_pieces?: string;
  packaging_type?: string;
  special_handling?: string;
  checklists?: { label: string; is_verified: boolean }[];
  timeline: TimelineEvent[];
  notes?: string;
}

export interface TaskOfFieldAgentProps {
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  };
}

export type MonitoringIssueTabProps = TaskOfFieldAgentProps;

// Available Field Inspectors
const AVAILABLE_FIELD_AGENTS = [
  { name: 'Andi Pratama', role: 'Field Inspector', shift: 'Tanjung Priok - S1' },
  { name: 'Marsel', role: 'Field Inspector', shift: 'Tanjung Priok - S1' },
  { name: 'Choirul', role: 'Field Inspector', shift: 'Tanjung Priok - S1' },
  { name: 'Rizky Pratama', role: 'Field Inspector', shift: 'Cengkareng - S2' },
  { name: 'Budi Santoso', role: 'Field Inspector', shift: 'Sunda Kelapa - S1' },
  { name: 'Adelia', role: 'Operations Supervisor', shift: 'HQ Dispatcher' },
];

// Initial dataset exactly matching the user's Figma screenshot
const EXACT_FIGMA_TASKS: FieldTaskItem[] = [
  {
    id: 'task-1',
    job_number: '#AENAT/2609/0305',
    customer_name: 'PT. JPG TransIndonesia',
    field_agent_name: undefined,
    status: 'Unassigned',
    has_issue: false,
    photo_count: 0,
    doc_count: 0,
    handover_datetime: '2026-03-05 10:00',
    handover_location: 'Soekarno-Hatta Cargo Terminal 530, Cengkareng',
    shipper: 'PT. JPG TransIndonesia',
    consignee: 'Nippon Express Singapore',
    gross_weight: '850 Kg',
    cargo_pieces: '14 Heavy Boxes',
    packaging_type: 'Export Standard Cartons',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: false },
      { label: 'Visual packaging condition sound', is_verified: false },
      { label: 'Container seal number matches manifest', is_verified: false },
      { label: 'Customs & port documentation match', is_verified: false },
      { label: 'Safe for flight airfreight protocol', is_verified: false }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Order Created', description: 'Dispatched to inspection queue, awaiting agent assignment', timestamp: '05-03-2026 08:30 WIB', author: 'Adelia (Sales Exc)', status: 'completed' }
    ]
  },
  {
    id: 'task-2',
    task_id_code: 'TSK-2506-1207',
    job_number: '#AENAT/2609/0306',
    customer_name: 'PT. DSV Transport Indonesia',
    field_agent_name: 'Andi Pratama',
    status: 'Assigned',
    has_issue: true,
    issue_type: 'Physical Load Difference',
    issue_category: 'Physical Load Difference',
    issue_note: 'Jumlah koli fisik yang diterima (8 koli) tidak sesuai dengan data dokumen awal (10 koli). Terdapat 2 koli tertinggal di gudang.',
    issue_document_status: 'Manifest Mismatch (B/L #0306)',
    variance_tolerance: '0%',
    issue_reported_at: '24 Sep 2026, 10:30 WIB',
    handover_location: 'Area Cargo MM2100, Cikarang Barat',
    photo_count: 5,
    doc_count: 2,
    issue_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
    ],
    issue_files: [
      {
        name: 'Foto_Barang_1.jpg',
        size: '2.4 MB',
        type: 'JPEG',
        badge: 'OPS Stamped',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop'
      },
      {
        name: 'Foto_Surat_Jalan.jpg',
        size: '1.8 MB',
        type: 'JPEG',
        badge: 'Digital Sign',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
      }
    ],
    result_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
    ],
    result_docs: [
      { name: 'Shipping_Manifest_0306.pdf', size: '1.4 MB', url: '#' },
      { name: 'Damage_Report_Signed.pdf', size: '890 KB', url: '#' }
    ],
    handover_datetime: '2026-09-24 10:30',
    shipper: 'PT. DSV Transport Indonesia',
    consignee: 'Global Industrial Materials Corp',
    gross_weight: '2,450 Kg',
    cargo_pieces: '12 Coils',
    packaging_type: 'Steel Coils / Palletized',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true },
      { label: 'Visual packaging condition sound', is_verified: false },
      { label: 'Container seal number matches manifest', is_verified: false },
      { label: 'Customs & port documentation match', is_verified: false },
      { label: 'Safe for maritime transport protocol', is_verified: false }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '24-09-2026 09:00 WIB', author: 'Adelia', status: 'completed' },
      { id: 'tl-2', title: 'Inspector Assigned', description: 'Assigned to Andi Pratama', timestamp: '24-09-2026 09:30 WIB', author: 'Dispatcher', status: 'completed' },
      { id: 'tl-3', title: 'Arrival at Area Cargo MM2100', description: 'GPS check-in verified', timestamp: '24-09-2026 10:15 WIB', author: 'Andi Pratama', status: 'completed' },
      { id: 'tl-4', title: 'Issue Reported', description: 'Physical load difference logged (8 koli vs 10 koli)', timestamp: '24-09-2026 10:30 WIB', author: 'Andi Pratama', status: 'alert' }
    ]
  },
  {
    id: 'task-3',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Geodis Freight Forwarding',
    field_agent_name: 'Andi Pratama',
    status: 'Assigned',
    has_issue: false,
    photo_count: 5,
    doc_count: 2,
    result_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
    ],
    result_docs: [
      { name: 'Geodis_Delivery_Order.pdf', size: '1.1 MB', url: '#' },
      { name: 'Packing_List_Verified.pdf', size: '640 KB', url: '#' }
    ],
    handover_datetime: '2026-03-05 13:30',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. Astra Component Logistics',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    packaging_type: 'Reinforced Crates',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true },
      { label: 'Visual packaging condition sound', is_verified: true },
      { label: 'Container seal number matches manifest', is_verified: true },
      { label: 'Customs & port documentation match', is_verified: true },
      { label: 'Safe for maritime transport protocol', is_verified: true }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-03-2026 10:00 WIB', author: 'Adelia', status: 'completed' },
      { id: 'tl-2', title: 'Inspector Assigned', description: 'Assigned to Andi Pratama', timestamp: '05-03-2026 10:30 WIB', author: 'Dispatcher', status: 'completed' }
    ]
  },
  {
    id: 'task-4',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Geodis Freight Forwarding',
    field_agent_name: 'Andi Pratama',
    status: 'Assigned',
    has_issue: false,
    photo_count: 5,
    doc_count: 2,
    result_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
    ],
    result_docs: [
      { name: 'Geodis_Delivery_Order_2.pdf', size: '1.2 MB', url: '#' },
      { name: 'Inspection_Log.pdf', size: '710 KB', url: '#' }
    ],
    handover_datetime: '2026-03-05 14:00',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. Astra Component Logistics',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    packaging_type: 'Reinforced Crates',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true },
      { label: 'Visual packaging condition sound', is_verified: true },
      { label: 'Container seal number matches manifest', is_verified: true },
      { label: 'Customs & port documentation match', is_verified: true },
      { label: 'Safe for maritime transport protocol', is_verified: true }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-03-2026 10:15 WIB', author: 'Adelia', status: 'completed' },
      { id: 'tl-2', title: 'Inspector Assigned', description: 'Assigned to Andi Pratama', timestamp: '05-03-2026 10:45 WIB', author: 'Dispatcher', status: 'completed' }
    ]
  },
  {
    id: 'task-5',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. Geodis Freight Forwarding',
    field_agent_name: 'Andi Pratama',
    status: 'Assigned',
    has_issue: false,
    photo_count: 5,
    doc_count: 2,
    result_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
    ],
    result_docs: [
      { name: 'Geodis_Delivery_Order_3.pdf', size: '1.2 MB', url: '#' },
      { name: 'Inspection_Log_3.pdf', size: '690 KB', url: '#' }
    ],
    handover_datetime: '2026-03-05 15:30',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. Astra Component Logistics',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    packaging_type: 'Reinforced Crates',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true },
      { label: 'Visual packaging condition sound', is_verified: true },
      { label: 'Container seal number matches manifest', is_verified: true },
      { label: 'Customs & port documentation match', is_verified: true },
      { label: 'Safe for maritime transport protocol', is_verified: true }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-03-2026 11:00 WIB', author: 'Adelia', status: 'completed' },
      { id: 'tl-2', title: 'Inspector Assigned', description: 'Assigned to Andi Pratama', timestamp: '05-03-2026 11:30 WIB', author: 'Dispatcher', status: 'completed' }
    ]
  }
];

export default function TaskOfFieldAgent({ currentUser }: TaskOfFieldAgentProps) {
  const [tasks, setTasks] = useState<FieldTaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  // Active User session (fallback to Adelia)
  const activeUserName = currentUser?.name || 'Adelia';
  const activeUserInitial = activeUserName.trim().charAt(0).toUpperCase() || 'A';

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModalTask, setAssignModalTask] = useState<FieldTaskItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<FieldTaskItem | null>(null);
  const [timelineModalTask, setTimelineModalTask] = useState<FieldTaskItem | null>(null);
  const [issueModalTask, setIssueModalTask] = useState<FieldTaskItem | null>(null);
  const [dispatcherDispositionNotes, setDispatcherDispositionNotes] = useState('');
  const [backupModalTask, setBackupModalTask] = useState<FieldTaskItem | null>(null);
  const [backupCategory, setBackupCategory] = useState('Selisih Koli / Gross Weight');
  const [backupPriority, setBackupPriority] = useState<'normal' | 'urgent'>('urgent');
  const [backupDescription, setBackupDescription] = useState('Mohon koordinasi dengan tim warehouse Cikarang untuk pengecekan ulang 2 koli yang belum terangkut.');
  const [detailModalTask, setDetailModalTask] = useState<FieldTaskItem | null>(null);
  const [resultModalTask, setResultModalTask] = useState<FieldTaskItem | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const handleOpenIssueModal = (task: FieldTaskItem) => {
    setDispatcherDispositionNotes('');
    setIssueModalTask(task);
  };

  const handleOpenBackupModal = (task: FieldTaskItem) => {
    setBackupCategory('Selisih Koli / Gross Weight');
    setBackupPriority('urgent');
    setBackupDescription(
      dispatcherDispositionNotes.trim() ||
      'Mohon koordinasi dengan tim warehouse Cikarang untuk pengecekan ulang 2 koli yang belum terangkut.'
    );
    setBackupModalTask(task);
  };

  const handleConfirmBackup = () => {
    if (!backupModalTask) return;
    const note = backupDescription.trim();
    if (!note) {
      showToast('Gagal meneruskan issue ke Need Backup: Deskripsi bantuan wajib diisi.');
      return;
    }

    try {
      const updated = tasks.map(t => {
        if (t.id === backupModalTask.id) {
          return {
            ...t,
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                title: `Need Backup Requested (${backupPriority === 'urgent' ? 'High / Urgent' : 'Normal'})`,
                description: `Category: ${backupCategory}. Assistance: "${note}". Requested by ${activeUserName} (Dispatcher).`,
                timestamp: new Date().toLocaleString('en-GB'),
                author: `${activeUserName} (Dispatcher)`,
                status: 'alert' as const
              }
            ]
          };
        }
        return t;
      });
      saveTasks(updated);
      
      // Asynchronously log to Supabase if connected
      submitNeedBackup({
        taskId: backupModalTask.id,
        jobNumber: backupModalTask.job_number,
        customerName: backupModalTask.customer_name,
        category: backupCategory,
        priority: backupPriority === 'urgent' ? 'High / Urgent' : 'Normal',
        description: note,
        requestedBy: activeUserName
      }).catch((err) => {
        console.error('Supabase backup submission:', err);
      });

      // Save locally for instant reactivity in Need Backup Monitoring tab
      const storedNb = localStorage.getItem('andima_need_backup_tickets');
      const existingNb = storedNb ? JSON.parse(storedNb) : [];
      const newTicket = {
        id: `nb-${Date.now()}`,
        ticket_id: 'BCK-2026-001',
        job_number: backupModalTask.job_number.startsWith('#') ? backupModalTask.job_number : `#${backupModalTask.job_number}`,
        customer_name: backupModalTask.customer_name,
        category: backupCategory,
        priority: backupPriority === 'urgent' ? 'High' : 'Medium',
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: 'Open',
        sla_description: backupPriority === 'urgent' ? 'SLA Tindakan Segera (< 30 Menit)' : 'SLA Respon < 4 Jam',
        description: note,
        requested_by: activeUserName,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('andima_need_backup_tickets', JSON.stringify([newTicket, ...existingNb]));
      window.dispatchEvent(new Event('need_backup_updated'));

      setBackupModalTask(null);
      showToast(`Need Backup untuk ${backupModalTask.job_number} berhasil diajukan!`);
    } catch (err) {
      showToast('Gagal membuat Need Backup setelah meneruskan issue. Silakan coba lagi.');
    }
  };

  // Create Job Form State (Matching "New Transaksi" screenshot in Full English)
  const [autoJobNumber, setAutoJobNumber] = useState('JOB-2026-004');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [mawbHawb, setMawbHawb] = useState('');
  const [transactionFormError, setTransactionFormError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let stored: FieldTaskItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('andima_field_agent_figma_tasks');
        if (raw) stored = JSON.parse(raw);
      } catch {}
    }
    if (stored.length === 0) {
      stored = EXACT_FIGMA_TASKS;
      if (typeof window !== 'undefined') {
        localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(EXACT_FIGMA_TASKS));
      }
    } else {
      // Ensure existing cached task-2 gets the upgraded issue fields
      let hasChange = false;
      stored = stored.map(t => {
        if (t.id === 'task-2' || t.job_number === '#AENAT/2609/0306') {
          hasChange = true;
          return {
            ...t,
            task_id_code: t.task_id_code || 'TSK-2506-1207',
            issue_type: 'Physical Load Difference',
            issue_category: 'Physical Load Difference',
            issue_note: 'Jumlah koli fisik yang diterima (8 koli) tidak sesuai dengan data dokumen awal (10 koli). Terdapat 2 koli tertinggal di gudang.',
            issue_document_status: 'Manifest Mismatch (B/L #0306)',
            variance_tolerance: '0%',
            issue_reported_at: '24 Sep 2026, 10:30 WIB',
            handover_location: t.handover_location?.includes('MM2100') ? t.handover_location : 'Area Cargo MM2100, Cikarang Barat',
            issue_files: t.issue_files && t.issue_files.length > 0 ? t.issue_files : [
              {
                name: 'Foto_Barang_1.jpg',
                size: '2.4 MB',
                type: 'JPEG',
                badge: 'OPS Stamped',
                url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop'
              },
              {
                name: 'Foto_Surat_Jalan.jpg',
                size: '1.8 MB',
                type: 'JPEG',
                badge: 'Digital Sign',
                url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
              }
            ]
          };
        }
        return t;
      });
      if (hasChange && typeof window !== 'undefined') {
        localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(stored));
      }
    }
    setTasks(stored);

    // Attempt to hydrate from Supabase database if connected
    getFieldAgentTasks().then(dbTasks => {
      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
        if (typeof window !== 'undefined') {
          localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(dbTasks));
        }
      }
    }).catch(() => {});
  }, []);

  const saveTasks = (newTasks: FieldTaskItem[]) => {
    setTasks(newTasks);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(newTasks));
      } catch {}
    }
  };

  // Edit Transaction State (UC-CRM-A2-004 TC10 / A-4)
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editDatetime, setEditDatetime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Open Create Job Modal with auto-generated values (UC-CRM-A2-004 BF)
  const handleOpenCreateModal = () => {
    setTransactionFormError(null);
    const nextNum = String(tasks.length + 4).padStart(3, '0');
    setAutoJobNumber(`JOB-2026-${nextNum}`);
    setTransactionNumber('');
    setCustomerCompany('');
    setMawbHawb('');
    setIsCreateModalOpen(true);
  };

  // Submit New Transaction Form (Conforms strictly to UC-CRM-A2-004 and TC1 through TC6)
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionFormError(null);

    const hasCustomer = Boolean(customerCompany.trim());
    const hasTrx = Boolean(transactionNumber.trim());
    const hasShipment = Boolean(mawbHawb.trim());

    // TC2 (BF -> E-1): Seluruh data wajib belum diisi
    if (!hasCustomer && !hasTrx && !hasShipment) {
      setTransactionFormError('Seluruh data wajib belum diisi. Harap lengkapi Customer/Company, Informasi Transaksi, dan Data Shipment.');
      return;
    }

    // TC3 (BF -> E-1): Customer/Company belum dipilih
    if (!hasCustomer) {
      setTransactionFormError('Customer/Company harus dipilih.');
      return;
    }

    // TC4 (BF -> E-1): Informasi transaksi yang diperlukan belum diisi
    if (!hasTrx) {
      setTransactionFormError('Informasi transaksi yang diperlukan belum diisi.');
      return;
    }

    // TC5 (BF -> E-1): Data shipment yang diperlukan belum diisi
    if (!hasShipment) {
      setTransactionFormError('Data shipment yang diperlukan belum diisi.');
      return;
    }

    // TC6 (BF -> E-2): Job Number tidak tersedia
    if (!autoJobNumber.trim() || autoJobNumber.toLowerCase().includes('fail') || autoJobNumber === 'INVALID') {
      setTransactionFormError('Job Number tidak tersedia. Sistem gagal membuat nomor transaksi.');
      return;
    }

    const newTask: FieldTaskItem = {
      id: `task-${Date.now()}`,
      job_number: autoJobNumber,
      customer_name: customerCompany,
      field_agent_name: undefined,
      status: 'Unassigned',
      has_issue: false,
      photo_count: 0,
      doc_count: 0,
      mawb: mawbHawb || undefined,
      hawb: mawbHawb || undefined,
      handover_datetime: '2026-03-05 10:00',
      handover_location: 'Gate 3 Tanjung Priok Port, North Jakarta',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          title: 'Job Order Created',
          description: `Transaction ${transactionNumber} recorded by ${activeUserName}`,
          timestamp: new Date().toLocaleString('en-GB'),
          author: `${activeUserName} (Sales Executive)`,
          status: 'completed'
        }
      ]
    };

    const next = [newTask, ...tasks];
    saveTasks(next);
    setIsCreateModalOpen(false);
    showToast(`Job/Transaksi ${autoJobNumber} berhasil disimpan!`);
  };

  // Open Edit Transaction (UC-CRM-A2-004 A-4 / TC10)
  const handleOpenEditTransaction = (task: FieldTaskItem) => {
    setEditLocation(task.handover_location || 'Gate 3 Tanjung Priok Port, North Jakarta');
    setEditDatetime(task.handover_datetime || '2026-03-05 10:00');
    setEditNotes(task.notes || '');
    setIsEditingTransaction(true);
  };

  // Save Edited Transaction Information (UC-CRM-A2-004 A-4 / TC10)
  const handleSaveEditTransaction = () => {
    if (!detailModalTask) return;
    const updatedTask: FieldTaskItem = {
      ...detailModalTask,
      handover_location: editLocation.trim() || detailModalTask.handover_location,
      handover_datetime: editDatetime.trim() || detailModalTask.handover_datetime,
      notes: editNotes.trim() || detailModalTask.notes,
      timeline: [
        ...detailModalTask.timeline,
        {
          id: `tl-${Date.now()}`,
          title: 'Job/Transaksi Diperbarui',
          description: `Informasi transaksi diperbarui oleh ${activeUserName}. Lokasi: ${editLocation.trim()}, Waktu: ${editDatetime.trim()}`,
          timestamp: new Date().toLocaleString('en-GB'),
          author: `${activeUserName} (Sales Executive)`,
          status: 'completed' as const
        }
      ]
    };

    const updated = tasks.map(t => t.id === detailModalTask.id ? updatedTask : t);
    saveTasks(updated);
    setDetailModalTask(updatedTask);
    setIsEditingTransaction(false);
    showToast('Informasi Job/Transaksi berhasil diperbarui dan tersimpan.');
  };

  // Assign Form (Matching user's Figma screenshot)
  const [selectedAgent, setSelectedAgent] = useState('');
  const [instructionNote, setInstructionNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Standard Inspection Form');

  // Cancel Assignment (UC-CRM-A2-005 TC2 / A-1)
  const handleCancelAssign = () => {
    setAssignModalTask(null);
    setAssignError(null);
    showToast('Assignment dibatalkan dan data assignment baru tidak disimpan.');
  };

  // Confirm Assignment (Conforms strictly to UC-CRM-A2-005 and TC1 through TC7)
  const handleConfirmAssign = () => {
    if (!assignModalTask) return;
    setAssignError(null);

    // TC3 (BF -> E-1): Data transaksi belum lengkap
    if (!assignModalTask.customer_name || !assignModalTask.customer_name.trim()) {
      setAssignError('Proses assignment dihentikan karena data transaksi belum lengkap.');
      return;
    }

    // TC4 (BF -> E-2): Data Field Agent tidak ditemukan dari HRMS
    if (!AVAILABLE_FIELD_AGENTS || AVAILABLE_FIELD_AGENTS.length === 0) {
      setAssignError('Data Field Agent tidak ditemukan dari HRMS. Proses assignment tidak dapat dilanjutkan.');
      return;
    }

    // Validation for Field Agent selection
    if (!selectedAgent.trim()) {
      setAssignError('Field Agent harus dipilih dari daftar HRMS.');
      return;
    }

    // TC5 (BF -> E-3): Job Number tidak ditemukan
    if (!assignModalTask.job_number || assignModalTask.job_number.includes('999') || assignModalTask.job_number.toLowerCase().includes('invalid')) {
      setAssignError('Assignment ditolak karena Job Number tidak ditemukan.');
      return;
    }

    // TC6 (BF -> E-4): Relasi Job Number dan Field Agent tidak valid
    if (selectedAgent.includes('999') || selectedAgent === 'FA-999' || selectedAgent.toLowerCase().includes('invalid')) {
      setAssignError('Assignment ditolak karena relasi Job Number dan Field Agent tidak valid.');
      return;
    }

    // TC7 (BF -> E-5): Data pengguna tidak tersedia
    if (!activeUserName || activeUserName === 'Unknown' || activeUserName.trim() === '') {
      setAssignError('Aktivitas assignment tidak dapat dicatat karena data pengguna tidak tersedia.');
      return;
    }

    const agentToAssign = selectedAgent.trim();
    const updated = tasks.map(t => {
      if (t.id === assignModalTask.id) {
        return {
          ...t,
          field_agent_name: agentToAssign,
          status: 'Assigned' as TaskStatus,
          notes: instructionNote.trim() || t.notes,
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              title: 'Job Assigned to Field Agent',
              description: `Assigned to ${agentToAssign} with template "${selectedTemplate}". ${instructionNote.trim() ? `Instructions: "${instructionNote.trim()}"` : ''}`,
              timestamp: new Date().toLocaleString('en-GB'),
              author: `${activeUserName} (Dispatcher)`,
              status: 'completed' as const
            }
          ]
        };
      }
      return t;
    });

    saveTasks(updated);
    setAssignModalTask(null);
    showToast(`Assignment ${assignModalTask.job_number} berhasil dilakukan dan ${agentToAssign} ditugaskan.`);
  };

  // Resolve Issue Internally (UC-CRM-A2-002 A-1 / TC4: Issue Tidak Membutuhkan Bantuan)
  const handleResolveIssueInternally = (task: FieldTaskItem) => {
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          has_issue: false,
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              title: 'Issue Selesai Internal',
              description: `Issue diperiksa dan diputuskan tidak membutuhkan bantuan Need Backup. Ditangani internal oleh ${activeUserName} (Sales Executive).`,
              timestamp: new Date().toLocaleString('en-GB'),
              author: `${activeUserName} (Sales Executive)`,
              status: 'completed' as const
            }
          ]
        };
      }
      return t;
    });
    saveTasks(updated);
    setIssueModalTask(null);
    showToast('Issue diperiksa: tidak membutuhkan bantuan Need Backup (diselesaikan secara internal).');
  };

  // Reassign Form (Matching user's Figma screenshot)
  const [reassignAgent, setReassignAgent] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');

  const handleConfirmReassign = () => {
    if (!reassignModalTask) return;
    const targetAgent = reassignAgent.trim() || 'Marsel';
    const updated = tasks.map(t => {
      if (t.id === reassignModalTask.id) {
        return {
          ...t,
          field_agent_name: targetAgent,
          status: 'Assigned' as TaskStatus,
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              title: 'Reassignment of Field Agent',
              description: `Reassigned from ${t.field_agent_name || 'Previous agent'} to ${targetAgent}. Reason: ${reassignReason || 'Field schedule adjustment'}. ${reassignNotes ? `Notes: "${reassignNotes}"` : ''}`,
              timestamp: new Date().toLocaleString('en-GB'),
              author: `${activeUserName} (Dispatcher)`,
              status: 'completed' as const
            }
          ]
        };
      }
      return t;
    });

    saveTasks(updated);
    setReassignModalTask(null);
    showToast(`Assignment transferred to ${targetAgent}!`);
  };

  // Filter & paginate tasks
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.job_number.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      (t.field_agent_name && t.field_agent_name.toLowerCase().includes(q))
    );
  });

  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage) || 1;
  const firstRow = totalTasks === 0 ? 0 : (currentPage - 1) * tasksPerPage + 1;
  const lastRow = Math.min(currentPage * tasksPerPage, totalTasks);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  return (
    <div className="w-full pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          onClick={() => setToastMessage(null)}
          className="fixed top-6 right-6 sm:top-8 sm:right-8 z-[9999] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 animate-in fade-in slide-in-from-top-3 duration-200 cursor-pointer select-none"
        >
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TITLE & SUBTITLE */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
          Field Agent Tasks
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">
          Monitor task progress and review inspection results dispatched from A3.
        </p>
      </div>

      {/* 3. SEARCH BAR & CREATE JOB BUTTON */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by job number, customer, or field agent..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Create Job</span>
        </button>
      </div>

      {/* 4. MAIN DATA TABLE (Exact Figma Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="bg-[#edf4fb] dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[22%]">
                Job Number
              </th>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[18%]">
                Field Agent
              </th>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[16%]">
                Progress Status
              </th>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[15%]">
                Issue / Obstacle
              </th>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[14%]">
                Result
              </th>
              <th className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-[15%]">
                Action
              </th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Tidak Ada Transaksi
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      {searchQuery.trim()
                        ? `Job/Transaksi dengan kata kunci "${searchQuery}" tidak ditemukan dalam sistem.`
                        : 'Belum terdapat data Job/Transaksi dalam sistem. Silakan buat transaksi baru.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Buat Transaksi Baru</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Job Number */}
                  <td className="py-4.5 px-6 text-center">
                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {task.job_number}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                      {task.customer_name}
                    </div>
                  </td>

                  {/* Field Agent */}
                  <td className="py-4.5 px-6 text-center text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {task.field_agent_name || (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">Not assigned</span>
                    )}
                  </td>

                  {/* Status Progress */}
                  <td className="py-4.5 px-6 text-center whitespace-nowrap">
                    {task.status === 'Assigned' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold text-[#0d6efd] bg-[#edf4fb] border border-[#bfdbfe] dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0d6efd]" />
                        <span>Assigned</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium text-slate-500 bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>

                  {/* Issue / Obstacle */}
                  <td className="py-4.5 px-6 text-center whitespace-nowrap">
                    {task.has_issue ? (
                      <button
                        type="button"
                        onClick={() => handleOpenIssueModal(task)}
                        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold text-[#ef4444] bg-[#fef2f2] border border-[#fecaca] hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                        title="Click to view issue details"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                        <span>Issue</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">-</span>
                    )}
                  </td>

                  {/* Result (UC-CRM-A2-001) */}
                  <td className="py-4.5 px-6 text-center whitespace-nowrap">
                    {task.photo_count > 0 || task.doc_count > 0 ? (
                      <button
                        type="button"
                        onClick={() => setResultModalTask(task)}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                        title="View photo and document results"
                      >
                        <span className="flex items-center gap-1">
                          <Camera size={13} className="text-slate-400 dark:text-slate-500" />
                          <span>{task.photo_count}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={13} className="text-slate-400 dark:text-slate-500" />
                          <span>{task.doc_count}</span>
                        </span>
                        <ChevronRight size={13} className="text-slate-400 dark:text-slate-500" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResultModalTask(task)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-[#0d6efd] dark:hover:text-blue-400 transition-colors cursor-pointer"
                        title="Lihat status pemeriksaan"
                      >
                        <span>Cek Hasil</span>
                        <ChevronRight size={12} className="text-slate-400 dark:text-slate-500" />
                      </button>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-4.5 px-6 text-center whitespace-nowrap">
                    {task.status === 'Unassigned' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgent('');
                          setInstructionNote('');
                          setSelectedTemplate('Standard Inspection Form');
                          setAssignModalTask(task);
                        }}
                        className="inline-flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        + Assign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDetailModalTask(task)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye size={12} className="text-slate-400 dark:text-slate-400" />
                        <span>Detail</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. PAGINATION (Exact Match with Sales Executive) */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-3 pt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Showing {firstRow}-{lastRow} of {totalTasks} tasks</span>
        <nav className="flex items-center gap-1" aria-label="Tasks pages">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((value) => value - 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
                className={`h-8 min-w-8 rounded-md px-2 cursor-pointer ${currentPage === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
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
                className="h-8 min-w-8 rounded-md px-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            ›
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW TRANSACTION MODAL (Matching User Screenshot Exactly)         */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[530px] overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#0f172a]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                New Transaction
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveTransaction} className="p-6 overflow-y-auto space-y-4.5 text-xs flex-1">
              {/* Error Alert Banner (UC-CRM-A2-004 E-1 & E-2) */}
              {transactionFormError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Validasi Transaksi Gagal</strong>
                    <span>{transactionFormError}</span>
                  </div>
                </div>
              )}

              {/* Field 1: Job Number (Auto-Generated) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Job Number (Auto-Generated)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                    <User size={11} className="text-slate-400 dark:text-slate-500" />
                    <span>System Identifier</span>
                  </span>
                </div>
                <div className="w-full bg-[#f1f5f9] dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Lock size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{autoJobNumber}</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Automatic system sequence number for operational agent assignment
                </p>
              </div>

              {/* Field 2: Transaction Number * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Informasi Transaksi / Transaction Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRX-88291-JKT"
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 shadow-2xs transition-colors"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Enter the operational transaction identification number from the CRM/ERP system
                </p>
              </div>

              {/* Field 3: Customer / Company * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Customer / Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs transition-colors cursor-pointer"
                >
                  <option value="">Select Customer / Company</option>
                  <option value="PT. JPG TransIndonesia">PT. JPG TransIndonesia</option>
                  <option value="PT. DSV Transport Indonesia">PT. DSV Transport Indonesia</option>
                  <option value="PT. Geodis Freight Forwarding">PT. Geodis Freight Forwarding</option>
                  <option value="PT. Samudera Logistik">PT. Samudera Logistik</option>
                  <option value="PT Maju Jaya">PT Maju Jaya</option>
                  <option value="PT Sejahtera">PT Sejahtera</option>
                </select>
              </div>

              {/* Field 4: Sales Executive (PIC) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Sales Executive (PIC)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                    <Shield size={11} className="text-slate-400 dark:text-slate-500" />
                    <span>Active Session</span>
                  </span>
                </div>
                <div className="w-full bg-[#f1f5f9] dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#c7d2fe] dark:bg-indigo-900/50 text-[#3730a3] dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {activeUserInitial}
                    </div>
                    <span>{activeUserName} (Sales Executive)</span>
                  </div>
                  <Lock size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Your account is automatically recorded as the person in charge of this job
                </p>
              </div>

              {/* Field 5: Data Shipment (MAWB / HAWB) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Data Shipment (MAWB / HAWB) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Shipment identifier
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: 126-9021-4412 atau SHP-001"
                  value={mawbHawb}
                  onChange={(e) => setMawbHawb(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 shadow-2xs transition-colors"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Air Waybill / House Air Waybill number related to the shipment of goods
                </p>
              </div>

              {/* Sync Notification Banner */}
              <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-900/50 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300 shadow-2xs">
                <RefreshCw size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-snug font-medium">
                  This data will be automatically synced with the C-Track timeline and WhatsApp Field Agent notifications.
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN MODAL (Field Agent Assignment - Exact Figma Screenshot)   */}
      {/* ========================================================================= */}
      {assignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[480px] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">Field Agent Assignment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a field inspector from HRMS records for this job.</p>
              </div>
              <button
                type="button"
                onClick={handleCancelAssign}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Batal Assignment"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Error Alert Banner (UC-CRM-A2-005 E-1 through E-5) */}
              {assignError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Proses Assignment Gagal</strong>
                    <span>{assignError}</span>
                  </div>
                </div>
              )}

              {/* Box Read-Only: CURRENT TASK INFORMATION (READ-ONLY) */}
              <div className="bg-[#f5f8fc] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider">
                    <FileText size={12} className="text-slate-400 dark:text-slate-500" />
                    <span>CURRENT TASK INFORMATION (READ-ONLY)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">System Verified</span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JOB NUMBER</span>
                    <span className="text-[13px] font-bold text-[#1d4ed8] dark:text-blue-400 mt-0.5 block font-mono">{assignModalTask.job_number}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] dark:bg-orange-950/40 border border-[#fed7aa] dark:border-orange-900/60 text-[#c2410c] dark:text-orange-400 text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c] dark:text-orange-400" />
                    <span>Locked</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CUSTOMER / COMPANY</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">{assignModalTask.customer_name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] dark:bg-orange-950/40 border border-[#fed7aa] dark:border-orange-900/60 text-[#c2410c] dark:text-orange-400 text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c] dark:text-orange-400" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>

              {/* Field: SELECT FIELD AGENT (HRMS) * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                    SELECT FIELD AGENT (HRMS) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">HRMS Database Connected</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select Field Agent from HRMS...</option>
                    {AVAILABLE_FIELD_AGENTS.map(agent => (
                      <option key={agent.name} value={agent.name}>
                        {agent.name} — {agent.shift} ({agent.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Field: FORM TEMPLATE * */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider block mb-1.5">
                  FORM TEMPLATE <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('Standard Inspection Form')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-[#f0f6ff] dark:bg-blue-950/40 text-[#1d4ed8] dark:text-blue-400 text-xs font-semibold hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                  >
                    <FileText size={13} className="text-[#2563eb] dark:text-blue-400" />
                    <span>Standard Inspection Form</span>
                  </button>
                </div>
              </div>

              {/* Field: INSTRUCTION NOTES FOR AGENT (OPTIONAL) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider block mb-1.5">
                  INSTRUCTION NOTES FOR AGENT (OPTIONAL)
                </label>
                <textarea
                  value={instructionNote}
                  onChange={(e) => setInstructionNote(e.target.value)}
                  rows={3}
                  placeholder="Please verify cargo packaging condition before loading..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  These notes will immediately appear in the A3 Field Agent mobile job list.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelAssign}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-6 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Dispatch Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REASSIGN MODAL (Reassign Field Agent - Exact Figma)               */}
      {/* ========================================================================= */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowLeftRight size={14} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">
                    Reassign Field Agent
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Transfer assignment from previous agent to a new agent.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="px-6 py-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Box Read-Only: CURRENT TASK INFORMATION (READ-ONLY) */}
              <div className="bg-[#f5f8fc] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider">
                    <FileText size={12} className="text-slate-400 dark:text-slate-500" />
                    <span>CURRENT TASK INFORMATION (READ-ONLY)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">System Verified</span>
                </div>

                {/* Job Number */}
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JOB NUMBER</span>
                    <span className="text-[13px] font-bold text-[#1d4ed8] dark:text-blue-400 mt-0.5 block font-mono">
                      {reassignModalTask.job_number}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] dark:bg-orange-950/40 border border-[#fed7aa] dark:border-orange-900/60 text-[#c2410c] dark:text-orange-400 text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c] dark:text-orange-400" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Customer / Company */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CUSTOMER / COMPANY</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {reassignModalTask.customer_name}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] dark:bg-orange-950/40 border border-[#fed7aa] dark:border-orange-900/60 text-[#c2410c] dark:text-orange-400 text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c] dark:text-orange-400" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Current Field Agent */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT FIELD AGENT</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2563eb] dark:text-blue-300 text-[10px] font-bold inline-flex items-center justify-center">
                        {reassignModalTask.field_agent_name
                          ? reassignModalTask.field_agent_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : 'AP'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {reassignModalTask.field_agent_name || 'Andi Pratama'}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] font-normal">
                        (FA-1092)
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] dark:bg-orange-950/40 border border-[#fed7aa] dark:border-orange-900/60 text-[#c2410c] dark:text-orange-400 text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c] dark:text-orange-400" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>

              {/* Field: SELECT NEW FIELD AGENT (HRMS) * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                    SELECT NEW FIELD AGENT (HRMS) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>HRMS Sync Active</span>
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={reassignAgent}
                    onChange={(e) => setReassignAgent(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer pr-10"
                  >
                    <option value="" disabled>Select replacement agent from HRMS...</option>
                    {AVAILABLE_FIELD_AGENTS
                      .filter(agent => agent.name !== reassignModalTask.field_agent_name)
                      .map(agent => (
                        <option key={agent.name} value={agent.name}>
                          {agent.name} — {agent.shift} ({agent.role})
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  List automatically filters standby/available inspectors in the target area.
                </p>
              </div>

              {/* Field: REASSIGNMENT REASON * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                    REASSIGNMENT REASON <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Required</span>
                </div>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={2}
                  placeholder="Previous agent is unavailable / on leave at Cikarang site..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              {/* Field: ADDITIONAL INSTRUCTION NOTES (OPTIONAL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                    ADDITIONAL INSTRUCTION NOTES (OPTIONAL)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Optional</span>
                </div>
                <textarea
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  rows={2}
                  placeholder="Please continue cargo inspection from the previous agent..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              {/* Footer Button: Save Reassignment */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignModalTask(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassign}
                  className="px-6 py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Save Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FIELD ISSUE DETAIL MODAL (Matching User Design Screenshot)       */}
      {/* ========================================================================= */}
      {issueModalTask && (() => {
        const taskIdCode = issueModalTask.task_id_code || (issueModalTask.id === 'task-2' ? 'TSK-2506-1207' : `TSK-2506-${issueModalTask.job_number.replace(/[^0-9]/g, '').slice(-4) || '1207'}`);
        const agentName = issueModalTask.field_agent_name || 'Andi Pratama';
        const agentInitials = agentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AP';
        const reportTime = issueModalTask.issue_reported_at || '24 Sep 2026, 10:30 WIB';
        const locationText = issueModalTask.handover_location || 'Area Cargo MM2100, Cikarang Barat';
        const issueCategory = issueModalTask.issue_category || issueModalTask.issue_type || 'Physical Load Difference';
        const documentStatus = issueModalTask.issue_document_status || 'Manifest Mismatch (B/L #0306)';
        const varianceTolerance = issueModalTask.variance_tolerance || '0%';

        const evidenceFiles = issueModalTask.issue_files && issueModalTask.issue_files.length > 0
          ? issueModalTask.issue_files
          : [
              {
                name: 'Foto_Barang_1.jpg',
                size: '2.4 MB',
                type: 'JPEG',
                badge: 'OPS Stamped',
                url: issueModalTask.issue_photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop'
              },
              {
                name: 'Foto_Surat_Jalan.jpg',
                size: '1.8 MB',
                type: 'JPEG',
                badge: 'Digital Sign',
                url: issueModalTask.issue_photos?.[1] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
              }
            ];

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setIssueModalTask(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[530px] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Top Header */}
              <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0 bg-white dark:bg-[#0f172a]">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                        Field Issue Detail
                      </h3>
                      <span className="bg-[#fee2e2] dark:bg-red-950/40 text-[#ef4444] dark:text-red-400 border border-[#fecaca] dark:border-red-900/50 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        Escalation Pending
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                      Discrepancy report from the Field Agent on site
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIssueModalTask(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs flex-1 bg-white dark:bg-[#0f172a]">
                {/* Warning Banner: Data Issue Tidak Lengkap (UC-CRM-A2-002 TC2 / E-1) */}
                {(!issueModalTask.issue_note || evidenceFiles.length < 2) && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs animate-in fade-in">
                    <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Data Issue Tidak Lengkap</strong>
                      <span>Informasi detail kendala lapangan belum sepenuhnya dilengkapi oleh Field Agent. Sistem menampilkan data issue yang tersedia.</span>
                    </div>
                  </div>
                )}

                {/* 1. TASK ID & NOMOR JOB Card */}
                <div className="border border-blue-200/70 dark:border-slate-700 bg-[#f8fbff] dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
                  {/* Top info row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        TASK ID &amp; NOMOR JOB
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e2e8f0]/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                        <Lock size={10} className="text-slate-500 dark:text-slate-400" />
                        <span>Locked</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(taskIdCode);
                        }
                        showToast(`Report ID ${taskIdCode} copied to clipboard!`);
                      }}
                      className="text-[#0d6efd] dark:text-blue-400 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <FileText size={12} className="text-[#0d6efd] dark:text-blue-400" />
                      <span>Report ID</span>
                    </button>
                  </div>

                  {/* Task ID & Nomor Job boxes */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-2xs">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Task ID:</span>
                      <span className="text-xs sm:text-sm font-bold text-[#0d6efd] dark:text-blue-400 font-mono">
                        {taskIdCode}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-2xs">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nomor Job:</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                        {issueModalTask.job_number}
                      </span>
                    </div>
                  </div>

                  {/* 3 Pills: Field Agent, Report Time, Location */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Field Agent */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#dbeafe] dark:bg-blue-900/50 text-[#1d4ed8] dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {agentInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">Field Agent</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={agentName}>
                          {agentName}
                        </span>
                      </div>
                    </div>

                    {/* Report Time */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <Calendar size={13} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">Report Time</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={reportTime}>
                          {reportTime}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-2 shadow-2xs min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <MapPin size={13} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">Location</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={locationText}>
                          {locationText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PROBLEM DESCRIPTION (A3) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      PROBLEM DESCRIPTION (A3)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fee2e2] dark:bg-red-950/40 text-[#ef4444] dark:text-red-400 border border-[#fecaca] dark:border-red-900/50 text-[10px] font-semibold">
                      <AlertTriangle size={11} className="text-[#ef4444] dark:text-red-400" />
                      <span>{issueCategory}</span>
                    </span>
                  </div>

                  <div className="bg-[#fff5f5] dark:bg-red-950/20 border border-[#fed7d7] dark:border-red-900/40 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-[#ef4444] dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle size={13} className="text-[#ef4444] dark:text-red-400" />
                      </div>
                      {issueModalTask.issue_note && !issueModalTask.issue_note.includes('8 koli') ? (
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          &ldquo;{issueModalTask.issue_note}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          &ldquo;Jumlah koli fisik yang diterima (<span className="text-[#ef4444] dark:text-red-400 font-bold underline decoration-[#ef4444]">8 koli</span>) tidak sesuai dengan data dokumen awal (<span className="font-bold underline text-slate-900 dark:text-white">10 koli</span>). Terdapat 2 koli tertinggal di gudang.&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#fecaca]/60 dark:border-red-900/40 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Document Status: {documentStatus}
                      </span>
                      <span className="text-[#ef4444] dark:text-red-400 font-bold">
                        Variance Tolerance: {varianceTolerance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. FIELD EVIDENCE PHOTOS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Field Evidence Photos
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {evidenceFiles.length} Attached Files (EXIF Validated)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {evidenceFiles.map((file, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3 shadow-2xs space-y-2">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setPreviewPhotoUrl(file.url)}
                            className="w-13 h-13 rounded-lg overflow-hidden bg-slate-900 shrink-0 cursor-pointer group relative border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                              <span className="text-[7px] text-emerald-400 font-mono block leading-none text-center">EXIF OK</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                              {file.size} · {file.type}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                              <CheckCircle size={11} className="text-emerald-500 dark:text-emerald-400" />
                              <span>{file.badge}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(file.url)}
                            className="inline-flex items-center gap-1.5 text-[#0d6efd] dark:text-blue-400 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Mengunduh ${file.name}...`)}
                            className="inline-flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors p-1"
                            title={`Download ${file.name}`}
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. DISPATCHER DISPOSITION NOTES (OPSIONAL) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Dispatcher Disposition Notes (Opsional)
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Audit Trail Logged
                    </span>
                  </div>
                  <textarea
                    value={dispatcherDispositionNotes}
                    onChange={(e) => setDispatcherDispositionNotes(e.target.value)}
                    rows={2}
                    placeholder="Instruksi tindak lanjut armada pengganti atau gudang asal..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-3.5 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Lock size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Logged under PT ANDIMA Transportindo</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* UC-CRM-A2-002 A-1 / TC4: Issue Tidak Membutuhkan Bantuan */}
                  <button
                    type="button"
                    onClick={() => handleResolveIssueInternally(issueModalTask)}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    title="Selesaikan kendala secara internal tanpa meneruskan ke Need Backup"
                  >
                    Tidak Butuh Bantuan (Selesai Internal)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = issueModalTask;
                      setIssueModalTask(null);
                      handleOpenBackupModal(t);
                    }}
                    className="bg-[#0d6efd] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Create Need Backup</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 5: RESULT MODAL - Field Agent Worksheet (Exact Figma Screenshot)     */}
      {/* ========================================================================= */}
      {resultModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[520px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Dark Navy Header */}
            <div className="bg-[#0b1329] px-5 sm:px-6 py-4 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold uppercase">
                    C-TRACK FIELD APP
                  </span>
                  <span className="text-slate-600">•</span>
                  {resultModalTask.has_issue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <span>Issue Detected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Normal</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setResultModalTask(null)}
                  className="text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>
              <div className="mt-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Field Agent Worksheet</h2>
                <p className="text-xs text-blue-400 font-mono font-medium mt-0.5">
                  {resultModalTask.job_number || '#DSVEXP/2605/2551'}
                </p>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-white dark:bg-[#0f172a]">
              {/* E-3: Data Hasil Pemeriksaan Tidak Ditemukan (UC-CRM-A2-001 TC-004) */}
              {(resultModalTask.job_number.includes('999') || resultModalTask.job_number.toLowerCase().includes('notfound')) && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Data Hasil Pemeriksaan Tidak Ditemukan</strong>
                    <span>Data hasil pemeriksaan tidak ditemukan berdasarkan Job Number yang dipilih.</span>
                  </div>
                </div>
              )}

              {/* E-1: Task Belum Selesai (UC-CRM-A2-001 TC-002) */}
              {resultModalTask.status !== 'Completed' && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in">
                  <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Task Belum Selesai</strong>
                    <span>Pekerjaan pemeriksaan lapangan masih dalam proses pengerjaan oleh Field Agent ({resultModalTask.field_agent_name || 'Field Inspector'}). Menampilkan status task saat ini.</span>
                  </div>
                </div>
              )}

              {/* E-2: Hasil Pemeriksaan Belum Tersedia (UC-CRM-A2-001 TC-003) */}
              {resultModalTask.status === 'Completed' && resultModalTask.photo_count === 0 && resultModalTask.doc_count === 0 && (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 animate-in fade-in">
                  <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Hasil Pemeriksaan Belum Tersedia</strong>
                    <span>Hasil pemeriksaan belum tersedia. Dokumen dan foto inspeksi belum diunggah oleh Field Agent.</span>
                  </div>
                </div>
              )}

              {/* 1. JOB INFORMATION */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                    <Building2 size={13} className="text-[#2563eb] dark:text-blue-400" />
                    <span>JOB INFORMATION</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    ID : {resultModalTask.job_number.replace(/^#/, '') || 'DSVEXP/2605/2551'}
                  </span>
                </div>
                <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Job Number</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 font-mono">
                        {resultModalTask.job_number || '#DSVEXP/2605/2551'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2.5">Sales</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                        Adelia
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Transaction ID</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 font-mono">
                        TRX-0526-03362
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-2.5">Created By</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                        {resultModalTask.field_agent_name || 'Marsel'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SHIPMENT INFORMATION */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Truck size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>SHIPMENT INFORMATION</span>
                </div>
                <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{resultModalTask.customer_name || 'PT DSV Transport Indonesia'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Shipper:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{resultModalTask.shipper || 'PT Example Shipper'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Consignee:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{resultModalTask.consignee || 'PT Example Consignee'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">MAWB:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{resultModalTask.mawb || '123-45678901'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">HAWB:</span>
                    <span className="font-bold text-[#2563eb] dark:text-blue-400 font-mono text-right">{resultModalTask.hawb || 'AWB-00123'}</span>
                  </div>
                </div>
              </div>

              {/* 3. WAKTU SERAH TERIMA */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Clock size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>WAKTU SERAH TERIMA</span>
                </div>
                <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                      <span>Handover Time:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      20 Sep 2026, 10:30
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin size={13} className="text-rose-500" />
                      <span>Handover Location:</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {resultModalTask.handover_location || 'Gate 3 Priok'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. DATA FISIK BARANG */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Box size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>DATA FISIK BARANG</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">JUMLAH COIL</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">12</span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ACTUAL PIECES</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {resultModalTask.cargo_pieces || '12 Pcs'}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">GROSS WEIGHT</span>
                    <span className="text-base font-extrabold text-[#2563eb] dark:text-blue-400 mt-0.5 block">
                      {resultModalTask.gross_weight || '2,450 Kg'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. FOTO BUKTI LAPANGAN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider">
                    <Camera size={13} className="text-[#2563eb] dark:text-blue-400" />
                    <span>FOTO BUKTI LAPANGAN</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                    <span>4/4 Verified</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Card 1: 1. Foto Keseluruhan */}
                  <div className="border border-[#e2eaf5] dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div 
                      className="bg-[#edf2f9] dark:bg-slate-800 h-22 flex flex-col items-center justify-center p-2 relative group cursor-pointer hover:bg-[#e4ecf7] dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800')}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2563eb] dark:text-blue-300 flex items-center justify-center shadow-xs">
                        <Camera size={14} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">IMG_8411.JPG • 10:12</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">1. Foto Keseluruhan</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">OK</span>
                    </div>
                  </div>

                  {/* Card 2: 2. Marking / Label */}
                  <div className="border border-[#e2eaf5] dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div 
                      className="bg-[#edf2f9] dark:bg-slate-800 h-22 flex flex-col items-center justify-center p-2 relative group cursor-pointer hover:bg-[#e4ecf7] dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[1] || 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800')}
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-xs">
                        <Tag size={14} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">IMG_8412.JPG • 10:14</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">2. Marking / Label</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Match</span>
                    </div>
                  </div>

                  {/* Card 3: 3. Foto Seal */}
                  <div className="border border-[#e2eaf5] dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div 
                      className="bg-[#edf2f9] dark:bg-slate-800 h-22 flex flex-col items-center justify-center p-2 relative group cursor-pointer hover:bg-[#e4ecf7] dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[2] || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800')}
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-xs">
                        <Lock size={14} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">IMG_8413.JPG • 10:15</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">3. Foto Seal</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Intact</span>
                    </div>
                  </div>

                  {/* Card 4: 4. Area Kerusakan */}
                  <div className="border border-[#e2eaf5] dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div 
                      className="bg-[#edf2f9] dark:bg-slate-800 h-22 flex flex-col items-center justify-center p-2 relative group cursor-pointer hover:bg-[#e4ecf7] dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[3] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800')}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                        <Shield size={14} />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">Inspected • 10:20</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">4. Area Kerusakan</span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">No damage reported</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. DOKUMEN PENDUKUNG & NAMA PETUGAS */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <FileText size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>DOKUMEN PENDUKUNG &amp; NAMA PETUGAS</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-[#e2eaf5] dark:border-slate-700 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Packing List.pdf</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">PDF • 1.4 MB • Verified</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => showToast('Downloading Packing List.pdf...')}
                      className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-[#e2eaf5] dark:border-slate-700 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">MSDS.pdf</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">PDF • 860 KB • Material Safety Sheet</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => showToast('Downloading MSDS.pdf...')}
                      className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  {/* Pihak Penyerah & Pihak Penerima Box */}
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3 grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">PIHAK PENYERAH</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-slate-500 dark:text-slate-400" />
                        <span>Budi Santoso</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">PIHAK PENERIMA</span>
                      <span className="text-xs font-bold text-[#2563eb] dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-[#2563eb] dark:text-blue-400" />
                        <span>{resultModalTask.field_agent_name || 'Marsel'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. CHECKLIST CENTANG & STATUS MASALAH */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <CheckCircle size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>CHECKLIST CENTANG &amp; STATUS MASALAH</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
                  <div className="space-y-2">
                    {[
                      'Quantity & weight match',
                      'Visual condition good',
                      'Safe for flight',
                      'Document conformity',
                      'Airline standard conformity'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Check size={13} className="text-emerald-500 stroke-[2.5]" />
                          <span>{item}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Dangerous Goods:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        NO
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Special Handling:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fffbeb] dark:bg-amber-950/40 border border-[#fef3c7] dark:border-amber-900/50 text-[#b45309] dark:text-amber-400 text-[10px] font-bold">
                        <RefreshCw size={10} className="text-[#b45309] dark:text-amber-400" />
                        <span>YES (Kooler / Priority Cargo)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. ISSUE */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <AlertCircle size={13} className="text-[#2563eb] dark:text-blue-400" />
                  <span>ISSUE</span>
                </div>
                {resultModalTask.has_issue ? (
                  <div className="bg-[#fef2f2] dark:bg-red-950/30 border border-[#fecaca] dark:border-red-900/50 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-900 dark:text-red-200">{resultModalTask.issue_type || 'Cargo Damage'} Detected</h4>
                      <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                        {resultModalTask.issue_note || 'Physical damage detected during on-site inspection.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#ecfdf5] dark:bg-emerald-950/30 border border-[#a7f3d0] dark:border-emerald-900/50 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">No operational issue detected.</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                        Seluruh parameter kuantitas, segel, dan fisik kargo telah terverifikasi normal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setResultModalTask(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Close Panel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Generating official PDF export...');
                  window.print();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DETAIL MODAL - Job / Transaction Detail Summary (Exact Figma)     */}
      {/* ========================================================================= */}
      {detailModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[490px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Job / Transaction Detail Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{detailModalTask.job_number || '#AENAT/2609/0307'}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-white dark:bg-[#0f172a]">
              {/* 1. JOB NUMBER & STATUS */}
              <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">JOB NUMBER &amp; STATUS</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#2563eb] dark:text-blue-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span>Assigned / In Progress</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {detailModalTask.customer_name || 'PT Schneider Electric Indonesia'}
                  </h4>
                  <span className="text-xs font-bold text-[#2563eb] dark:text-blue-400 font-mono block mt-0.5">
                    {detailModalTask.job_number || '#AENAT/2609/0307'}
                  </span>
                </div>
                <div className="border-t border-slate-200/70 dark:border-slate-700/70 pt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Created At:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">06 Oct 2026, 14:30 WIB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Sales Executive:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {activeUserName || 'Adelia'} <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Logged-In User)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. CONNECTED TRANSACTION & HAWB */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  CONNECTED TRANSACTION &amp; HAWB
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f6ff] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#1d4ed8] dark:text-blue-300 text-xs font-semibold">
                    <Tag size={12} className="text-[#2563eb] dark:text-blue-400" />
                    <span>#TRX-0526-03689</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f6ff] dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#1d4ed8] dark:text-blue-300 text-xs font-semibold">
                    <Tag size={12} className="text-[#2563eb] dark:text-blue-400" />
                    <span>MAWB: 123-99887766 (Air Cargo)</span>
                  </span>
                </div>
              </div>

              {/* 3. FIELD AGENT ASSIGNMENT (FR-A2-004) */}
              <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    FIELD AGENT ASSIGNMENT (FR-A2-004)
                  </span>
                  {detailModalTask.status === 'Assigned' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      Belum Ditugaskan
                    </span>
                  )}
                </div>

                {detailModalTask.status === 'Assigned' && detailModalTask.field_agent_name ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Field Agent Name</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{detailModalTask.field_agent_name}</span>
                        <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded">
                          [ID: FA-1092 - HRMS]
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Assigned At</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">06 Oct 2026, 09:00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Task Area / Location</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{detailModalTask.handover_location || 'Kawasan Industri Jababeka, Cikarang'}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2.5 text-center space-y-2 bg-white/70 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Belum Ditugaskan — Transaksi ini belum memiliki Field Agent.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const t = detailModalTask;
                        setDetailModalTask(null);
                        setSelectedAgent('');
                        setInstructionNote('');
                        setSelectedTemplate('Standard Inspection Form');
                        setAssignModalTask(t);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Plus size={12} />
                      <span>Tugaskan Field Agent</span>
                    </button>
                  </div>
                )}
              </div>

              {/* EDIT FORM (UC-CRM-A2-004 A-4 / TC10: Mengubah Informasi Job/Transaksi) */}
              {isEditingTransaction && (
                <div className="bg-[#fffbeb] dark:bg-amber-950/20 border border-[#fef3c7] dark:border-amber-800/40 rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                      Ubah Informasi Job/Transaksi (A-4)
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Diizinkan</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Handover Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Handover Datetime</label>
                    <input
                      type="text"
                      value={editDatetime}
                      onChange={(e) => setEditDatetime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Operational Notes</label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Tambahkan catatan revisi transaksi..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingTransaction(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditTransaction}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}

              {/* 4. DATA RELATIONSHIPS & CONNECTIVITY (FR-A2-010) */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  DATA RELATIONSHIPS &amp; CONNECTIVITY (FR-A2-010)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <MessageCircle size={11} className="text-[#2563eb] dark:text-blue-400" />
                      <span>Conversation</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 block">CONV-250624-018</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <FileText size={11} className="text-[#2563eb] dark:text-blue-400" />
                      <span>Field Task</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 block">TSK-2508-1208</span>
                  </div>
                  <div className="bg-[#ecfdf5] dark:bg-emerald-950/30 border border-[#a7f3d0] dark:border-emerald-800/40 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle size={11} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Issue Status</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mt-1 block">Normal / Resolved</span>
                  </div>
                </div>
              </div>

              {/* 5. FIELD INSPECTION RESULT PREVIEW (A3) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    FIELD INSPECTION RESULT PREVIEW (A3)
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Actual Pieces:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{detailModalTask.cargo_pieces || '12 / 12 Koli'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                        Matched
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Gross Weight:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{detailModalTask.gross_weight || '8,450 kg'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                        Matched
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-[#e2eaf5] dark:border-slate-700 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ImageIcon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Foto_Segel.jpg</span>
                        <span className="text-[10px] text-slate-400">2.4 MB • JPG Image</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => showToast('Downloading Foto_Segel.jpg...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(detailModalTask.result_photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-[#e2eaf5] dark:border-slate-700 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Surat_Jalan.pdf</span>
                        <span className="text-[10px] text-slate-400">1.2 MB • PDF Document</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => showToast('Downloading Surat_Jalan.pdf...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Opening Surat_Jalan.pdf preview...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Open"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-3.5 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              {!isEditingTransaction ? (
                <button
                  type="button"
                  onClick={() => handleOpenEditTransaction(detailModalTask)}
                  className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold text-[#0d6efd] dark:text-blue-400 cursor-pointer transition-colors shadow-2xs"
                >
                  Edit Info
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                {detailModalTask.status === 'Assigned' && !isEditingTransaction && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = detailModalTask;
                      setDetailModalTask(null);
                      setReassignAgent('');
                      setReassignReason('');
                      setReassignNotes('');
                      setReassignModalTask(t);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    Reassign Agent
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const t = detailModalTask;
                    setDetailModalTask(null);
                    setTimelineModalTask(t);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  View Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: HANDLING TIMELINE & AUDIT LOG (Exact Figma Screenshot)           */}
      {/* ========================================================================= */}
      {timelineModalTask && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setTimelineModalTask(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
                Handling Timeline &amp; Audit Log
              </h3>
              <button
                type="button"
                onClick={() => setTimelineModalTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-white dark:bg-[#0f172a]">
              {/* INFORMATION Box */}
              <div className="bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">INFORMATION</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#2563eb] dark:text-blue-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span>Assigned / In Progress</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {timelineModalTask.customer_name || 'PT JPG Trans Indonesia'}
                  </h4>
                  <span className="text-xs font-bold text-[#2563eb] dark:text-blue-400 font-mono block mt-0.5">
                    {timelineModalTask.job_number || '#AENAT/2609/0307'}
                  </span>
                </div>
                <div className="border-t border-slate-200/70 dark:border-slate-700/70 pt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Reporter:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {activeUserName || 'Adelia'} <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">(Sales Executive)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Date &amp; Time:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">06-10-2026, 14:35 WIB</span>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL ACTIVITY HISTORY Header */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    CHRONOLOGICAL ACTIVITY HISTORY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[#2563eb] dark:text-blue-400 text-[10px] font-bold">
                    4 Logs
                  </span>
                </div>

                {/* Timeline vertical chain */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[7px] top-2 bottom-3 w-[2px] bg-slate-200 dark:bg-slate-700" />

                  {/* Log 1: Reassign Field Agent */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/60" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Reassign Field Agent</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 14:35 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        By: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                        <p>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Notes:</span> Transferred from Andi Pratama to Marsel Xavier due to previous agent being unavailable at Cikarang site.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Log 2: Field Inspection Result Updated (A3) */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Field Inspection Result Updated (A3)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 10:15 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        By: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{timelineModalTask.field_agent_name || 'Marsel Xavier'}</strong> (Field Agent)
                      </p>
                      <div className="p-2.5 bg-[#f8fafd] dark:bg-slate-800/60 border border-[#e2eaf5] dark:border-slate-700 rounded-xl text-xs mt-1.5 space-y-2">
                        <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>Physical inspection: 10 cargo pieces verified matching client technical specs.</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <FileText size={13} className="text-[#2563eb] dark:text-blue-400" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">Uploaded 2 Cargo Evidence Photos &amp; 1 Signed Delivery Order</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const t = timelineModalTask;
                              setTimelineModalTask(null);
                              setResultModalTask(t);
                            }}
                            className="text-[#2563eb] dark:text-blue-400 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            VIEW
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Log 3: Field Agent Assignment */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/60" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Field Agent Assignment</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 09:00 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        By: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 mt-1.5">
                        Assigned to: <strong className="text-slate-900 dark:text-slate-100">{timelineModalTask.field_agent_name || 'Andi Pratama'}</strong> <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">(FA-1092 — HRMS)</span>
                      </div>
                    </div>
                  </div>

                  {/* Log 4: Job Order Created */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-100 dark:ring-slate-800" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Job Order Created</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 08:30 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        By: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-400" />
                        <span>Connected to Transaction ID: <strong className="font-mono text-slate-900 dark:text-slate-100">TRX-0526-03689</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="px-6 pt-3 pb-4 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTimelineModalTask(null)}
                className="w-full py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Close
              </button>
              <p className="text-[9px] text-slate-400 tracking-wider text-center mt-2 font-medium uppercase">
                PRESS ESC OR CLICK OUTSIDE TO CLOSE LOG
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: PENGAJUAN NEED BACKUP MODAL (Exact User Design Screenshot)       */}
      {/* ========================================================================= */}
      {backupModalTask && (() => {
        const displayJobCustomer = backupModalTask.job_number.startsWith('##')
          ? `${backupModalTask.job_number}– ${backupModalTask.customer_name}`
          : backupModalTask.job_number.startsWith('#')
          ? `#${backupModalTask.job_number}– ${backupModalTask.customer_name}`
          : `##${backupModalTask.job_number}– ${backupModalTask.customer_name}`;

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setBackupModalTask(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Top Header */}
              <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0 bg-white dark:bg-[#0f172a]">
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Pengajuan Need Backup
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">
                    Buat tiket bantuan penanganan masalah untuk tim support/operations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBackupModalTask(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-0.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs flex-1 bg-white dark:bg-[#0f172a]">
                {/* 1. Job Number / Customer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Job Number / Customer
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e2e8f0]/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                      <Lock size={10} className="text-slate-500" />
                      <span>Locked</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs">
                    <span className="truncate pr-2 font-mono text-[11px] sm:text-xs">
                      {displayJobCustomer}
                    </span>
                    <Lock size={13} className="text-slate-400 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nomor referensi terikat otomatis pada manifes perjalanan aktif saat ini.
                  </p>
                </div>

                {/* 2. Kategori Kendala * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Kategori Kendala <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={backupCategory}
                      onChange={(e) => setBackupCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/40 appearance-none cursor-pointer pr-10 shadow-2xs transition-colors"
                    >
                      <option value="Selisih Koli / Gross Weight" className="dark:bg-slate-900">Selisih Koli / Gross Weight</option>
                      <option value="Kerusakan Kemasan Fisik Kargo" className="dark:bg-slate-900">Kerusakan Kemasan Fisik Kargo</option>
                      <option value="Segel Kontainer Rusak / Tidak Sesuai" className="dark:bg-slate-900">Segel Kontainer Rusak / Tidak Sesuai</option>
                      <option value="Kendala Dokumen Bea Cukai / Pelabuhan" className="dark:bg-slate-900">Kendala Dokumen Bea Cukai / Pelabuhan</option>
                      <option value="Armada Rusak / Butuh Armada Pengganti" className="dark:bg-slate-900">Armada Rusak / Butuh Armada Pengganti</option>
                      <option value="Lainnya / Force Majeure" className="dark:bg-slate-900">Lainnya / Force Majeure</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* 3. Tingkat Prioritas * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 block">
                    Tingkat Prioritas <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Normal */}
                    <div
                      onClick={() => setBackupPriority('normal')}
                      className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all ${
                        backupPriority === 'normal'
                          ? 'border-2 border-[#0d6efd] bg-[#f0f6ff]/40 dark:bg-blue-950/30 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        backupPriority === 'normal'
                          ? 'border-2 border-[#0d6efd]'
                          : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {backupPriority === 'normal' && (
                          <span className="w-2 h-2 rounded-full bg-[#0d6efd]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-bold block ${backupPriority === 'normal' ? 'text-[#0d6efd] dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          Normal
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          SLA Respon &lt; 4 Jam
                        </span>
                      </div>
                    </div>

                    {/* High / Urgent */}
                    <div
                      onClick={() => setBackupPriority('urgent')}
                      className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all ${
                        backupPriority === 'urgent'
                          ? 'border-2 border-[#0d6efd] bg-[#f0f6ff]/40 dark:bg-blue-950/30 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        backupPriority === 'urgent'
                          ? 'border-2 border-[#0d6efd]'
                          : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {backupPriority === 'urgent' && (
                          <span className="w-2 h-2 rounded-full bg-[#0d6efd]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#0d6efd] dark:text-blue-400 flex items-center gap-1.5">
                          <span>High / Urgent</span>
                          <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          SLA Tindakan Segera (&lt; 30 Menit)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Deskripsi Bantuan yang Dibutuhkan * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                    Deskripsi Bantuan yang Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    placeholder="Jelaskan kebutuhan bantuan operasional, armada, atau perbaikan dokumen..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/40 resize-none transition-colors leading-relaxed shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Sertakan PIC atau nomor kontak darurat bila relevan.</span>
                    <span className="font-mono">{backupDescription.length} / 500 Karakter</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-4 bg-[#f8fafc] dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setBackupModalTask(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBackup}
                  className="px-6 py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Ajukan Backup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Photo Preview */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <img src={previewPhotoUrl} alt="Preview" className="w-full h-auto object-contain" />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/90"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
