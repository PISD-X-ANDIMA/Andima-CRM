'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera, FileText, ChevronRight, ChevronDown, Eye, Plus, X, MapPin,
  CheckCircle, AlertOctagon, Check, Send, AlertTriangle, Search,
  ShieldAlert, Clock, ArrowLeftRight, Download, Calendar, Info,
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

export interface FieldAgentAccount {
  id: string;
  agent_id: string;
  name: string;
  email: string;
  field_area: string;
  status: 'Active' | 'Inactive';
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
  issue_status?: 'Issue' | 'Resolved' | 'None';
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
  { name: 'Maselinus', role: 'Field Inspector', shift: 'Tanjung Priok - S1' },
  { name: 'Eysa Franata', role: 'Field Inspector', shift: 'Bekasi - S1' },
  { name: 'Khoirul Anwar', role: 'Field Inspector', shift: 'Bekasi - S1' },
  { name: 'Budi Santoso', role: 'Field Inspector', shift: 'Sunda Kelapa - S1' },
  { name: 'Adelia', role: 'Operations Supervisor', shift: 'HQ Dispatcher' },
];

const DEFAULT_FIELD_AGENT_ACCOUNTS: FieldAgentAccount[] = [
  { id: 'agent-1', agent_id: '#AENAT/2609/0305', name: 'Maselinus', email: 'marsel@and.com', field_area: 'Bekasi', status: 'Active' },
  { id: 'agent-2', agent_id: '#AENAT/2609/0306', name: 'Eysa Franata', email: 'eysa@and.com', field_area: 'Bekasi', status: 'Active' },
  { id: 'agent-3', agent_id: '#AENAT/2609/0307', name: 'Maselinus', email: 'marsel@and.com', field_area: 'Bekasi', status: 'Inactive' },
  { id: 'agent-4', agent_id: '#AENAT/2609/0308', name: 'Khoirul Anwar', email: 'eysa@and.com', field_area: 'Bekasi', status: 'Active' },
  { id: 'agent-5', agent_id: '#AENAT/2609/0309', name: 'Khoirul Anwar', email: 'eysa@and.com', field_area: 'Bekasi', status: 'Inactive' },
  { id: 'agent-6', agent_id: '#AENAT/2609/0310', name: 'Andi Pratama', email: 'andi@and.com', field_area: 'Tanjung Priok', status: 'Active' },
  { id: 'agent-7', agent_id: '#AENAT/2609/0311', name: 'Budi Santoso', email: 'budi@and.com', field_area: 'Sunda Kelapa', status: 'Inactive' },
  { id: 'agent-8', agent_id: '#AENAT/2609/0312', name: 'Rizky Pratama', email: 'rizky@and.com', field_area: 'Cengkareng', status: 'Active' },
  { id: 'agent-9', agent_id: '#AENAT/2609/0313', name: 'Hendra Wijaya', email: 'hendra@and.com', field_area: 'Tanjung Priok', status: 'Active' },
  { id: 'agent-10', agent_id: '#AENAT/2609/0314', name: 'Suryadi', email: 'suryadi@and.com', field_area: 'Marunda', status: 'Inactive' },
  { id: 'agent-11', agent_id: '#AENAT/2609/0315', name: 'Agus Setiawan', email: 'agus@and.com', field_area: 'Cikarang Dry Port', status: 'Active' },
  { id: 'agent-12', agent_id: '#AENAT/2609/0316', name: 'Dedi Kurniawan', email: 'dedi@and.com', field_area: 'Bandara Soetta', status: 'Active' },
  { id: 'agent-13', agent_id: '#AENAT/2609/0317', name: 'Bambang Subianto', email: 'bambang@and.com', field_area: 'Tanjung Priok', status: 'Inactive' },
  { id: 'agent-14', agent_id: '#AENAT/2609/0318', name: 'Irwan Gunawan', email: 'irwan@and.com', field_area: 'MM2100 Cikarang', status: 'Active' },
  { id: 'agent-15', agent_id: '#AENAT/2609/0319', name: 'Rahmat Hidayat', email: 'rahmat@and.com', field_area: 'Karawang', status: 'Active' },
  { id: 'agent-16', agent_id: '#AENAT/2609/0320', name: 'Herman Hermansyah', email: 'herman@and.com', field_area: 'Tanjung Priok', status: 'Active' },
  { id: 'agent-17', agent_id: '#AENAT/2609/0321', name: 'Doni Prasetyo', email: 'doni@and.com', field_area: 'Bandara Halim', status: 'Inactive' },
  { id: 'agent-18', agent_id: '#AENAT/2609/0322', name: 'Farhan Ramadhan', email: 'farhan@and.com', field_area: 'Sunda Kelapa', status: 'Active' },
  { id: 'agent-19', agent_id: '#AENAT/2609/0323', name: 'Gilang Perkasa', email: 'gilang@and.com', field_area: 'Bekasi', status: 'Active' },
  { id: 'agent-20', agent_id: '#AENAT/2609/0324', name: 'Fajar Kurnia', email: 'fajar@and.com', field_area: 'Cengkareng', status: 'Inactive' },
  { id: 'agent-21', agent_id: '#AENAT/2609/0325', name: 'Yudi Firmansyah', email: 'yudi@and.com', field_area: 'Tanjung Priok', status: 'Active' },
  { id: 'agent-22', agent_id: '#AENAT/2609/0326', name: 'Wahyu Hidayat', email: 'wahyu@and.com', field_area: 'Marunda', status: 'Active' },
  { id: 'agent-23', agent_id: '#AENAT/2609/0327', name: 'Arif Rahman', email: 'arif@and.com', field_area: 'Cikarang Dry Port', status: 'Active' },
  { id: 'agent-24', agent_id: '#AENAT/2609/0328', name: 'Teguh Santoso', email: 'teguh@and.com', field_area: 'Bekasi', status: 'Inactive' }
];

// Initial dataset exactly matching the user's Figma screenshot (Expanded to 24 database dummy records)
const EXACT_FIGMA_TASKS: FieldTaskItem[] = [
  {
    id: 'task-1',
    job_number: '#AENAT/2609/0305',
    customer_name: 'PT. JPG Trans Indonesia',
    field_agent_name: 'Maselinus',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '08/10/2026',
    handover_location: 'Soekarno-Hatta Cargo Terminal 530, Cengkareng',
    shipper: 'PT. JPG Trans Indonesia',
    consignee: 'Nippon Express Singapore',
    gross_weight: '850 Kg',
    cargo_pieces: '14 Heavy Boxes',
    packaging_type: 'Export Standard Cartons',
    notes: '',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true },
      { label: 'Visual packaging condition sound', is_verified: true },
      { label: 'Container seal number matches manifest', is_verified: true },
      { label: 'Customs & port documentation match', is_verified: true },
      { label: 'Safe for flight airfreight protocol', is_verified: true }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Order Created', description: 'Dispatched to inspection queue, awaiting agent assignment', timestamp: '08-10-2026 08:30 WIB', author: 'Adelia (Sales Exc)', status: 'completed' }
    ]
  },
  {
    id: 'task-2',
    task_id_code: 'TSK-2506-1207',
    job_number: '#AENAT/2609/0306',
    customer_name: 'PT. DSV Transport Indonesia',
    field_agent_name: 'Eysa Franata',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_type: 'Physical Load Difference',
    issue_category: 'Physical Load Difference',
    issue_note: 'Selisih 2 koli kargo saat serah terima di area cargo MM2100.',
    issue_document_status: 'Manifest Mismatch (B/L #0306)',
    variance_tolerance: '0%',
    issue_reported_at: '08 Oct 2026, 10:30 WIB',
    handover_location: 'Area Cargo MM2100, Cikarang Barat',
    photo_count: 4,
    doc_count: 2,
    notes: 'Hasil rapat internal: Kendala selisih koli telah akan dselesaikan secara langsung bersama Tim Supervisor Warehouse Cikarang. 2 koli tertinggal akan diangkut ke armada kedua.',
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
    handover_datetime: '08/10/2026',
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
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '08-10-2026 09:00 WIB', author: 'Adelia', status: 'completed' },
      { id: 'tl-2', title: 'Inspector Assigned', description: 'Assigned to Eysa Franata', timestamp: '08-10-2026 09:30 WIB', author: 'Dispatcher', status: 'completed' },
      { id: 'tl-3', title: 'Arrival at Area Cargo MM2100', description: 'GPS check-in verified', timestamp: '08-10-2026 10:15 WIB', author: 'Eysa Franata', status: 'completed' },
      { id: 'tl-4', title: 'Issue Reported', description: 'Physical load difference logged (8 koli vs 10 koli)', timestamp: '08-10-2026 10:30 WIB', author: 'Eysa Franata', status: 'alert' }
    ]
  },
  {
    id: 'task-3',
    job_number: '#AENAT/2609/0307',
    customer_name: 'PT. DSV Transport Indonesia',
    field_agent_name: 'Maselinus',
    status: 'Completed',
    has_issue: false,
    issue_status: 'None',
    photo_count: 4,
    doc_count: 3,
    notes: '',
    result_photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop'
    ],
    result_docs: [
      { name: 'DSV_Delivery_Order.pdf', size: '1.1 MB', url: '#' },
      { name: 'Packing_List_Verified.pdf', size: '640 KB', url: '#' }
    ],
    handover_datetime: '08/10/2026',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. DSV Transport Indonesia',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    packaging_type: 'Reinforced Crates',
    checklists: [
      { label: 'Quantity & Gross Weight verification', is_verified: true }
    ],
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '08-10-2026 10:00 WIB', author: 'Adelia', status: 'completed' }
    ]
  },
  {
    id: 'task-4',
    job_number: '#AENAT/2609/0308',
    customer_name: 'PT. DSV Transport Indonesia',
    field_agent_name: 'Khoirul Anwar',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 3,
    notes: '',
    handover_datetime: '08/10/2026',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. DSV Transport Indonesia',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '08-10-2026 10:15 WIB', author: 'Adelia', status: 'completed' }
    ]
  },
  {
    id: 'task-5',
    job_number: '#AENAT/2609/0309',
    customer_name: 'PT. DSV Transport Indonesia',
    field_agent_name: 'Khoirul Anwar',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    notes: '',
    handover_datetime: '08/10/2026',
    handover_location: 'Cikarang Dry Port Terminal 2, West Java',
    shipper: 'PT. DSV Transport Indonesia',
    consignee: 'Toyota Tsusho Asia',
    gross_weight: '3,200 Kg',
    cargo_pieces: '16 Reinforced Crates',
    timeline: [
      { id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '08-10-2026 11:00 WIB', author: 'Adelia', status: 'completed' }
    ]
  },
  {
    id: 'task-6',
    job_number: '#AENAT/2609/0310',
    customer_name: 'PT. Geodis Freight Forwarding',
    field_agent_name: 'Andi Pratama',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '09/10/2026',
    handover_location: 'Gate 3 Tanjung Priok Port, Jakarta',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '09-10-2026 09:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-7',
    job_number: '#AENAT/2609/0311',
    customer_name: 'PT. Kuehne Nagel Indonesia',
    field_agent_name: 'Budi Santoso',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_note: 'Segel kontainer tidak tertera jelas pada dokumen surat jalan.',
    photo_count: 6,
    doc_count: 1,
    handover_datetime: '09/10/2026',
    handover_location: 'Sunda Kelapa Pier 4, Jakarta',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '09-10-2026 10:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-8',
    job_number: '#AENAT/2609/0312',
    customer_name: 'PT. Nippon Express Indonesia',
    field_agent_name: 'Maselinus',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 4,
    handover_datetime: '09/10/2026',
    handover_location: 'Warehouse MM2100 Cikarang',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '09-10-2026 11:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-9',
    job_number: '#AENAT/2609/0313',
    customer_name: 'PT. Schenker Petrolog Utama',
    field_agent_name: 'Eysa Franata',
    status: 'Completed',
    has_issue: false,
    photo_count: 3,
    doc_count: 2,
    handover_datetime: '10/10/2026',
    handover_location: 'Cargo Terminal Soekarno-Hatta',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '10-10-2026 08:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-10',
    job_number: '#AENAT/2609/0314',
    customer_name: 'PT. DHL Global Forwarding',
    field_agent_name: 'Khoirul Anwar',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_note: 'Kemasan karton luar mengalami kelembapan berlebih.',
    photo_count: 4,
    doc_count: 3,
    handover_datetime: '10/10/2026',
    handover_location: 'Marunda Logistics Park',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '10-10-2026 09:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-11',
    job_number: '#AENAT/2609/0315',
    customer_name: 'PT. Yusen Logistics Indonesia',
    field_agent_name: 'Andi Pratama',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '10/10/2026',
    handover_location: 'Tanjung Priok Gate 2',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '10-10-2026 10:45 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-12',
    job_number: '#AENAT/2609/0316',
    customer_name: 'PT. Kintetsu World Express',
    field_agent_name: 'Budi Santoso',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 3,
    handover_datetime: '10/10/2026',
    handover_location: 'Cikarang Dry Port',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '10-10-2026 11:15 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-13',
    job_number: '#AENAT/2609/0317',
    customer_name: 'PT. Agility International',
    field_agent_name: 'Maselinus',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '07/10/2026',
    handover_location: 'Bandara Halim Cargo Area',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '07-10-2026 09:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-14',
    job_number: '#AENAT/2609/0318',
    customer_name: 'PT. Expeditors Indonesia',
    field_agent_name: 'Eysa Franata',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_note: 'BEDA timbangan gross weight sebesar 45 kg.',
    photo_count: 6,
    doc_count: 2,
    handover_datetime: '07/10/2026',
    handover_location: 'Warehouse Jababeka 2',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '07-10-2026 10:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-15',
    job_number: '#AENAT/2609/0319',
    customer_name: 'PT. CEVA Logistics Indonesia',
    field_agent_name: 'Khoirul Anwar',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 1,
    handover_datetime: '07/10/2026',
    handover_location: 'Tanjung Priok Pier 3',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '07-10-2026 11:45 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-16',
    job_number: '#AENAT/2609/0320',
    customer_name: 'PT. Bollore Logistics Indonesia',
    field_agent_name: 'Andi Pratama',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 3,
    handover_datetime: '06/10/2026',
    handover_location: 'Karawang International Port',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '06-10-2026 08:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-17',
    job_number: '#AENAT/2609/0321',
    customer_name: 'PT. Kerry Logistics Indonesia',
    field_agent_name: 'Budi Santoso',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '06/10/2026',
    handover_location: 'Sunda Kelapa Gate 1',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '06-10-2026 10:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-18',
    job_number: '#AENAT/2609/0322',
    customer_name: 'PT. Hellmann Worldwide Logistics',
    field_agent_name: 'Maselinus',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_note: 'Pallet kayu tidak memiliki stempel sertifikasi ISPM-15.',
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '06/10/2026',
    handover_location: 'Warehouse MM2100',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '06-10-2026 11:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-19',
    job_number: '#AENAT/2609/0323',
    customer_name: 'PT. Sinotrans Indonesia',
    field_agent_name: 'Eysa Franata',
    status: 'Completed',
    has_issue: false,
    photo_count: 3,
    doc_count: 2,
    handover_datetime: '05/10/2026',
    handover_location: 'Gate 3 Tanjung Priok',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-10-2026 09:00 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-20',
    job_number: '#AENAT/2609/0324',
    customer_name: 'PT. NIPPON CONVEYOR',
    field_agent_name: 'Khoirul Anwar',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 3,
    handover_datetime: '05/10/2026',
    handover_location: 'Soekarno Hatta Terminal 530',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-10-2026 10:15 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-21',
    job_number: '#AENAT/2609/0325',
    customer_name: 'PT. Toyota Tsusho Logistics',
    field_agent_name: 'Andi Pratama',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '05/10/2026',
    handover_location: 'Cikarang Dry Port Terminal 1',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '05-10-2026 11:45 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-22',
    job_number: '#AENAT/2609/0326',
    customer_name: 'PT. Mitsubishi Logistics',
    field_agent_name: 'Budi Santoso',
    status: 'Assigned',
    has_issue: true,
    issue_status: 'Issue',
    issue_note: 'Terdapat kerusakan minor pada sudut peti kemas.',
    photo_count: 4,
    doc_count: 1,
    handover_datetime: '04/10/2026',
    handover_location: 'Marunda Logistics Hub',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '04-10-2026 09:30 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-23',
    job_number: '#AENAT/2609/0327',
    customer_name: 'PT. Sumitomo Global Logistics',
    field_agent_name: 'Maselinus',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 2,
    handover_datetime: '04/10/2026',
    handover_location: 'Tanjung Priok Gate 1',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '04-10-2026 10:45 WIB', author: 'Adelia', status: 'completed' }]
  },
  {
    id: 'task-24',
    job_number: '#AENAT/2609/0328',
    customer_name: 'PT. Sankyu Indonesia International',
    field_agent_name: 'Eysa Franata',
    status: 'Completed',
    has_issue: false,
    photo_count: 4,
    doc_count: 3,
    handover_datetime: '04/10/2026',
    handover_location: 'Cikarang Dry Port Terminal 2',
    timeline: [{ id: 'tl-1', title: 'Job Created', description: 'Inspection scheduled', timestamp: '04-10-2026 11:30 WIB', author: 'Adelia', status: 'completed' }]
  }
];

export default function TaskOfFieldAgent({ currentUser }: TaskOfFieldAgentProps) {
  const [tasks, setTasks] = useState<FieldTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [issueFilter, setIssueFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');

  // Table 2 State: Manage Field Agent Accounts
  const [agentAccounts, setAgentAccounts] = useState<FieldAgentAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_field_agent_accounts');
        if (stored) {
          const parsed: FieldAgentAccount[] = JSON.parse(stored);
          if (parsed.length >= 24) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_FIELD_AGENT_ACCOUNTS;
  });

  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState('All');

  // Modals for Field Agent Account Management
  const [editingAgent, setEditingAgent] = useState<FieldAgentAccount | null>(null);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<FieldAgentAccount | null>(null);

  // Form states for Edit / Add Agent
  const [formAgentName, setFormAgentName] = useState('');
  const [formAgentEmail, setFormAgentEmail] = useState('');
  const [formAgentArea, setFormAgentArea] = useState('Bekasi');
  const [formAgentStatus, setFormAgentStatus] = useState<'Active' | 'Inactive'>('Active');
  const [agentFormError, setAgentFormError] = useState<string | null>(null);

  // Pagination states
  const [t1Page, setT1Page] = useState(1);
  const [t2Page, setT2Page] = useState(1);

  // Active User session & role
  const activeUserName = currentUser?.name || 'Adelia';
  const activeUserInitial = activeUserName.trim().charAt(0).toUpperCase() || 'A';

  const [activeUserRole, setActiveUserRole] = useState<string>(() => {
    if (currentUser?.role && currentUser.role.trim()) return currentUser.role.trim();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.role && parsed.role.trim()) return parsed.role.trim();
        }
      } catch {}
    }
    return 'Sales Executive';
  });

  const isManager = activeUserRole.toLowerCase().includes('manager') ||
                    activeUserRole.toLowerCase().includes('manajemen') ||
                    activeUserRole.toLowerCase().includes('director');

  const isFieldAgent = activeUserRole.toLowerCase().includes('field') ||
                       activeUserRole.toLowerCase().includes('inspector');

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
  const [notesModalTask, setNotesModalTask] = useState<FieldTaskItem | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const formatTaskDateDisplay = (dateStr?: string | null): string => {
    if (!dateStr || dateStr === 'MM/DD/YYYY') {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    const clean = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean.replace(/-/g, '/');
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('/');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch { }
    return clean.replace(/-/g, '/');
  };

  const countWords = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  const handleMax50WordsChange = (
    value: string,
    setter: (val: string) => void
  ) => {
    const words = value.trim() ? value.trim().split(/\s+/).filter(Boolean) : [];
    if (words.length > 50) {
      const truncated = value.split(/\s+/).slice(0, 50).join(' ');
      setter(truncated);
    } else {
      setter(value);
    }
  };

  const handleOpenNotesModal = (task: FieldTaskItem) => {
    setEditingNoteText(task.notes || '');
    setAssignedAgentName(task.field_agent_name || '');
    setNotesModalTask(task);
  };

  const handleSaveTaskNote = () => {
    if (!notesModalTask) return;
    const updatedNote = editingNoteText.trim();
    const updatedAgent = assignedAgentName.trim() || notesModalTask.field_agent_name;
    const updated = tasks.map(t => {
      if (t.id === notesModalTask.id) {
        return {
          ...t,
          notes: updatedNote,
          field_agent_name: updatedAgent,
          status: updatedAgent ? ('Assigned' as const) : t.status
        };
      }
      return t;
    });
    saveTasks(updated);
    setNotesModalTask(null);
    showToast(`Penugasan & catatan untuk ${notesModalTask.job_number} berhasil disimpan.`);
  };

  const [issueModalNoteText, setIssueModalNoteText] = useState('');

  const handleOpenIssueModal = (task: FieldTaskItem) => {
    setDispatcherDispositionNotes('');
    setIssueModalNoteText(task.notes || '');
    setIssueModalTask(task);
  };

  const handleSaveIssueModalNotes = () => {
    if (!issueModalTask) return;
    const updatedNote = issueModalNoteText.trim();
    const updated = tasks.map(t => t.id === issueModalTask.id ? { ...t, notes: updatedNote } : t);
    saveTasks(updated);
    setIssueModalTask(null);
    showToast(`Notes untuk ${issueModalTask.job_number} berhasil disimpan.`);
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

  const saveAgentAccounts = (accounts: FieldAgentAccount[]) => {
    setAgentAccounts(accounts);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('andima_field_agent_accounts', JSON.stringify(accounts));
      } catch {}
    }
  };

  const handleOpenEditAgent = (agent: FieldAgentAccount) => {
    setEditingAgent(agent);
    setFormAgentName(agent.name);
    setFormAgentEmail(agent.email);
    setFormAgentArea(agent.field_area);
    setFormAgentStatus(agent.status);
    setAgentFormError(null);
  };

  const handleSaveEditAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    if (!formAgentName.trim()) {
      setAgentFormError('Nama Field Agent wajib diisi.');
      return;
    }
    if (!formAgentEmail.trim() || !formAgentEmail.includes('@')) {
      setAgentFormError('Email valid wajib diisi.');
      return;
    }

    const updated = agentAccounts.map(a => {
      if (a.id === editingAgent.id) {
        return {
          ...a,
          name: formAgentName.trim(),
          email: formAgentEmail.trim(),
          field_area: formAgentArea.trim() || 'Bekasi',
          status: formAgentStatus
        };
      }
      return a;
    });

    saveAgentAccounts(updated);
    setEditingAgent(null);
    showToast(`Akun Field Agent "${formAgentName}" berhasil diperbarui.`);
  };

  const handleOpenAddAgent = () => {
    setFormAgentName('');
    setFormAgentEmail('');
    setFormAgentArea('Bekasi');
    setFormAgentStatus('Active');
    setAgentFormError(null);
    setIsAddAgentModalOpen(true);
  };

  const handleSaveAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAgentName.trim()) {
      setAgentFormError('Nama Field Agent wajib diisi.');
      return;
    }
    if (!formAgentEmail.trim() || !formAgentEmail.includes('@')) {
      setAgentFormError('Email valid wajib diisi.');
      return;
    }

    const nextIdNum = String(agentAccounts.length + 305).padStart(4, '0');
    const newAgent: FieldAgentAccount = {
      id: `agent-${Date.now()}`,
      agent_id: `#AENAT/2609/${nextIdNum}`,
      name: formAgentName.trim(),
      email: formAgentEmail.trim(),
      field_area: formAgentArea.trim() || 'Bekasi',
      status: formAgentStatus
    };

    const updated = [newAgent, ...agentAccounts];
    saveAgentAccounts(updated);
    setIsAddAgentModalOpen(false);
    showToast(`Akun Field Agent "${newAgent.name}" (${newAgent.agent_id}) berhasil ditambahkan.`);
  };

  const handleConfirmDeleteAgent = () => {
    if (!agentToDelete) return;
    const updated = agentAccounts.filter(a => a.id !== agentToDelete.id);
    saveAgentAccounts(updated);
    showToast(`Akun Field Agent "${agentToDelete.name}" (${agentToDelete.agent_id}) berhasil dihapus.`);
    setAgentToDelete(null);
  };

  useEffect(() => {
    let stored: FieldTaskItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('andima_field_agent_figma_tasks');
        if (raw) stored = JSON.parse(raw);
      } catch { }
    }
    if (stored.length === 0 || stored[0]?.handover_datetime !== '08/10/2026' || stored[0]?.customer_name !== 'PT. JPG Trans Indonesia' || stored.length < 24) {
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
        if (t.id === 'task-3' || (t.field_agent_name === 'Eysa Franata' && t.job_number === '#AENAT/2609/0307')) {
          hasChange = true;
          return {
            ...t,
            issue_status: 'Resolved',
            has_issue: false,
            issue_type: 'Physical Load Difference',
            issue_category: 'Physical Load Difference',
            issue_note: 'Kendala selisih koli telah diselesaikan secara langsung bersama Tim Supervisor Warehouse Cikarang. 2 koli tertinggal sudah berhasil diangkut ke armada kedua.'
          };
        }
        return t;
      });
      if (hasChange && typeof window !== 'undefined') {
        localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(stored));
      }
    }
    setTasks(stored);

    setLoading(true);
    // Attempt to hydrate from Supabase database if connected
    getFieldAgentTasks().then(dbTasks => {
      if (dbTasks && dbTasks.length > 0) {
        const allTasks = [...dbTasks, ...stored];
        const uniqueTasks: FieldTaskItem[] = [];
        const seenKeys = new Set<string>();
        for (const t of allTasks) {
          const key = t.id || t.job_number;
          if (key && !seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueTasks.push(t);
          }
        }
        setTasks(uniqueTasks);
        if (typeof window !== 'undefined') {
          localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(uniqueTasks));
        }
      }
    }).catch(() => { })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  const saveTasks = (newTasks: FieldTaskItem[]) => {
    setTasks(newTasks);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('andima_field_agent_figma_tasks', JSON.stringify(newTasks));
      } catch { }
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

  const parseTaskDate = (task: FieldTaskItem): Date | null => {
    const raw = task.handover_datetime || (task.timeline && task.timeline[0]?.timestamp) || task.issue_reported_at;
    if (!raw) return null;
    const clean = raw.trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(clean)) {
      const [d, m, y] = clean.slice(0, 10).split('/');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{2}-\d{2}-\d{4}/.test(clean)) {
      const [d, m, y] = clean.slice(0, 10).split('-');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const [y, m, d] = clean.slice(0, 10).split('-');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.job_number.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      (t.field_agent_name && t.field_agent_name.toLowerCase().includes(q));

    const matchesIssue = 
      issueFilter === 'All' ||
      (issueFilter === 'Issue' && (t.has_issue || t.issue_status === 'Issue')) ||
      (issueFilter === 'Completed' && (!t.has_issue || t.issue_status === 'Resolved' || t.status === 'Completed')) ||
      (issueFilter === 'Resolved' && (!t.has_issue || t.issue_status === 'Resolved' || t.status === 'Completed')) ||
      (issueFilter === 'No Issue' && !t.has_issue && t.issue_status !== 'Issue');

    const matchesPeriod = (() => {
      if (!periodFilter || periodFilter === 'All' || periodFilter === 'All Periods') return true;

      const taskDate = parseTaskDate(t);
      if (!taskDate) return false;

      const now = new Date();

      if (periodFilter === 'Today') {
        return (
          taskDate.getDate() === now.getDate() &&
          taskDate.getMonth() === now.getMonth() &&
          taskDate.getFullYear() === now.getFullYear()
        );
      }

      if (periodFilter === 'This Week') {
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      }

      if (periodFilter === 'This Month') {
        return (
          taskDate.getMonth() === now.getMonth() &&
          taskDate.getFullYear() === now.getFullYear()
        );
      }

      const formattedTaskDate = formatTaskDateDisplay(t.handover_datetime);
      if (periodFilter === formattedTaskDate) return true;

      return false;
    })();

    const matchesRoleAccess = (() => {
      if (isManager) return true; // Full Oversight Mode for Manager of Customer Success
      if (isFieldAgent) {
        return !t.field_agent_name || t.field_agent_name.toLowerCase().includes(activeUserName.toLowerCase());
      }
      // Sales Executive view: sees tasks under their sales responsibility / created by them / assigned to their field agents
      const isMine = t.customer_name?.toLowerCase().includes(activeUserName.toLowerCase()) ||
                     t.timeline?.some(ev => ev.author?.toLowerCase().includes(activeUserName.toLowerCase())) ||
                     t.notes?.toLowerCase().includes(activeUserName.toLowerCase()) ||
                     !t.field_agent_name ||
                     t.field_agent_name === activeUserName;
      return isMine;
    })();

    return matchesSearch && matchesIssue && matchesPeriod && matchesRoleAccess;
  });

  // Filter & Pagination logic for Table 2 (Field Agent Accounts)
  const filteredAgents = agentAccounts.filter(a => {
    const q = agentSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      a.agent_id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.field_area.toLowerCase().includes(q);

    const matchesStatus =
      agentStatusFilter === 'All' ||
      agentStatusFilter === 'Status' ||
      a.status.toLowerCase() === agentStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const t1PageSize = 5;
  const t1TotalPages = Math.min(5, Math.max(1, Math.ceil(filteredTasks.length / t1PageSize)));
  const t1ValidPage = Math.min(t1Page, t1TotalPages);
  const pagedTasks = filteredTasks.slice((t1ValidPage - 1) * t1PageSize, t1ValidPage * t1PageSize);

  const t2PageSize = 5;
  const t2TotalPages = Math.min(5, Math.max(1, Math.ceil(filteredAgents.length / t2PageSize)));
  const t2ValidPage = Math.min(t2Page, t2TotalPages);
  const pagedAgents = filteredAgents.slice((t2ValidPage - 1) * t2PageSize, t2ValidPage * t2PageSize);

  return (
    <div className="w-full pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-semibold mb-3">
        <span className="text-slate-900 font-extrabold tracking-wide text-xs">ANDIMA CRM</span>
        <span className="text-slate-400">CRM /</span>
        <span className="text-[#0d6efd] font-bold">Task Field</span>
      </div>

      {/* 2. TITLE & SUBTITLE */}
      <div className="mb-5">
        <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight leading-tight">
          Monitoring Task Field Agent
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-1">
          Monitor progres task dan tinjau hasil inspeksi yang dikirim dari A3.
        </p>
      </div>

      {/* 3. SEARCH & FILTER BAR (Exact Match to Screenshot) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 mb-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setT1Page(1);
              }}
              placeholder="Job Number, Company Name, dan Field Agent"
              className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Dropdown 1: Status */}
            <div className="relative min-w-[130px]">
              <select
                value={issueFilter}
                onChange={(e) => {
                  setIssueFilter(e.target.value);
                  setT1Page(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer appearance-none pr-8 shadow-2xs"
              >
                <option value="All">Status</option>
                <option value="Issue">● Issue</option>
                <option value="Completed">✓ Completed</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            {/* Dropdown 2: All Periods (Exact 3 period choices: Today, This Week, This Month) */}
            <div className="relative min-w-[140px]">
              <select
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setT1Page(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer appearance-none pr-8 shadow-2xs"
              >
                <option value="All">All Periods</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN DATA TABLE (Exact UI & Compact Proportions from Screenshot) */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full min-w-[800px] border-collapse">
          {/* Header: Soft pastel blue periwinkle background */}
          <thead className="bg-[#cad8eb] border-b border-slate-200/80">
            <tr>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[20%]">
                Job Number
              </th>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[25%]">
                Company Name
              </th>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[15%]">
                Date
              </th>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[13%]">
                Status
              </th>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[15%]">
                Field Agent
              </th>
              <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[12%]">
                Result
              </th>
            </tr>
          </thead>

          {/* Table Rows */}
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`task-skeleton-${idx}`} className="animate-pulse border-b border-slate-100">
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-28 mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-40 mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-20 mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-6 bg-slate-200/70 rounded-full w-24 mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-24 mx-auto" /></td>
                  <td className="py-4 px-4"><div className="h-7 bg-slate-200/70 rounded-xl w-24 mx-auto" /></td>
                </tr>
              ))
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Tidak Ada Task Field Agent
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {searchQuery.trim()
                        ? `Tidak ada task yang cocok dengan pencarian "${searchQuery}".`
                        : 'Belum ada data task Field Agent tersimpan.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedTasks.map((task) => (
                <tr key={task.id} className="border-l-4 border-l-transparent hover:border-l-blue-600 hover:bg-blue-50/30 transition-all duration-150">
                  {/* Column 1: Job Number */}
                  <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight">
                    {task.job_number}
                  </td>

                  {/* Column 2: Company Name */}
                  <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-semibold text-slate-800">
                    {task.customer_name}
                  </td>

                  {/* Column 3: Date */}
                  <td className="py-4 px-4 text-center text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {formatTaskDateDisplay(task.handover_datetime)}
                  </td>

                  {/* Column 4: Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {task.has_issue || task.issue_status === 'Issue' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenIssueModal(task)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-[#e11d48] bg-[#ffe4e6] border border-[#fecdd3] hover:bg-rose-200 transition-colors cursor-pointer"
                        title="Klik untuk melihat detail issue"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                        <span>Issue</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenIssueModal(task)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Klik untuk melihat Detail Status"
                      >
                        <Check size={11} className="text-emerald-600 stroke-[3]" />
                        <span>Completed</span>
                      </button>
                    )}
                  </td>

                  {/* Column 5: Field Agent */}
                  <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {task.field_agent_name || (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>

                  {/* Column 6: Result */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Camera size={11} className="text-slate-400" />
                        <span>{task.photo_count === 0 ? 0 : 4}</span>
                        <FileText size={11} className="text-slate-400 ml-1" />
                        <span>{task.doc_count || 2}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResultModalTask(task)}
                        className="text-xs font-semibold text-[#0d6efd] hover:underline cursor-pointer transition-colors mt-0.5"
                      >
                        See more...
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM PAGINATION FOR TABLE 1 (Exact screenshot layout) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Showing {filteredTasks.length > 0 ? (t1ValidPage - 1) * t1PageSize + 1 : 0}-
          {Math.min(t1ValidPage * t1PageSize, filteredTasks.length)} of {filteredTasks.length > 0 ? filteredTasks.length : 24} customers
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={t1ValidPage <= 1}
            onClick={() => setT1Page(prev => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          {Array.from({ length: t1TotalPages }).map((_, i) => (
            <button
              key={i + 1}
              type="button"
              onClick={() => setT1Page(i + 1)}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                t1ValidPage === i + 1
                  ? 'bg-[#2563eb] text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={t1ValidPage >= t1TotalPages}
            onClick={() => setT1Page(prev => Math.min(t1TotalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* MODAL: HANDLING NOTES & ISSUE HISTORY MODAL (Exact User Screenshot)        */}
      {/* ========================================================================= */}
      {notesModalTask && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setNotesModalTask(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[540px] overflow-hidden flex flex-col p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Handling Notes &amp; Issue History
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal flex items-center gap-1.5 flex-wrap">
                  <span>Job {notesModalTask.job_number}</span>
                  <span className="text-slate-400">•</span>
                  <span>{notesModalTask.customer_name || 'PT Geodis Freight Forwarding'}</span>
                </p>
              </div>
            </div>

            {/* Current Issue Status Banner */}
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#047857]">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>CURRENT ISSUE STATUS</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d1fae5] border border-[#a7f3d0] text-[#047857] text-xs font-bold">
                <Check size={12} className="text-[#047857] stroke-[3]" />
                <span>Resolved / Selesai</span>
              </span>
            </div>

            {/* Initial Issue Report Box */}
            <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  INITIAL ISSUE REPORT
                </span>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  Read-Only
                </span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed shadow-2xs">
                “{notesModalTask.issue_note || 'Selisih 2 koli kargo saat serah terima di area cargo MM2100.'}”
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Column 1: Job Number */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      JOB NUMBER
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1d4ed8] font-mono">
                      {notesModalTask.job_number}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-[10px] font-bold">
                    <Lock size={10} className="text-[#b45309]" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Column 2: Field Agent & Waktu */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      FIELD AGENT &amp; WAKTU
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                      {notesModalTask.field_agent_name || 'Khoirul Anwar'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                      {notesModalTask.handover_datetime || '08/10/2026, 10:15 WIB'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-[10px] font-bold shrink-0 ml-1">
                    <Lock size={10} className="text-[#b45309]" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Escalation History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wider">
                  <Clock size={14} className="text-slate-500" />
                  <span>NOTES &amp; ESCALATION HISTORY</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">1 entry on file</span>
              </div>

              {/* History list */}
              <div className="pl-3 border-l-2 border-blue-500 space-y-2 relative ml-1">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-bold text-slate-900">Adelia</span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Sales Executive
                  </span>
                  <span className="text-slate-400">• 08/10/2026, 14:00 WIB</span>
                </div>
                <div className="p-3.5 bg-[#f8fafd] border border-[#e2eaf5] rounded-xl text-xs text-slate-700 leading-relaxed shadow-2xs">
                  “Hasil rapat internal: Kendala selisih koli telah diselesaikan secara langsung bersama Tim Supervisor Warehouse Cikarang. 2 koli tertinggal sudah berhasil diangkut ke armada kedua.”
                </div>
              </div>
            </div>

            {/* Add Follow-Up Notes (opsional) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 tracking-wider">
                  + ADD FOLLOW-UP NOTES <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${countWords(editingNoteText) >= 50 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {countWords(editingNoteText)}/50 kata
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#059669]">
                    <CheckCircle size={14} className="text-[#059669]" />
                    <span>Encrypted Record</span>
                  </div>
                </div>
              </div>

              <textarea
                rows={3}
                value={editingNoteText}
                onChange={(e) => handleMax50WordsChange(e.target.value, setEditingNoteText)}
                placeholder="Ketik catatan tambahan di sini jika ada update baru..."
                className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[90px] resize-none shadow-2xs leading-relaxed"
              />
              <p className="text-xs text-slate-400 font-normal">
                Catatan ini akan langsung terbit pada modul job list mobile A3 Field Agent &amp; tersimpan dalam audit trail.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setNotesModalTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveTaskNote}
                className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW TRANSACTION MODAL (Matching User Screenshot Exactly)         */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[530px] overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                New Transaction
              </h3>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveTransaction} className="p-6 overflow-y-auto space-y-4.5 text-xs flex-1">
              {/* Error Alert Banner (UC-CRM-A2-004 E-1 & E-2) */}
              {transactionFormError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
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
                  <label className="text-xs font-bold text-slate-800">
                    Job Number (Auto-Generated)
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <User size={11} className="text-slate-400" />
                    <span>System Identifier</span>
                  </span>
                </div>
                <div className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Lock size={13} className="text-slate-400 shrink-0" />
                  <span>{autoJobNumber}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatic system sequence number for operational agent assignment
                </p>
              </div>

              {/* Field 2: Transaction Number * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Informasi Transaksi / Transaction Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRX-88291-JKT"
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs transition-colors"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter the operational transaction identification number from the CRM/ERP system
                </p>
              </div>

              {/* Field 3: Customer / Company * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Customer / Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 shadow-2xs transition-colors cursor-pointer"
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
                  <label className="text-xs font-bold text-slate-800">
                    Sales Executive (PIC)
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Shield size={11} className="text-slate-400" />
                    <span>Active Session</span>
                  </span>
                </div>
                <div className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#c7d2fe] text-[#3730a3] flex items-center justify-center font-bold text-[10px]">
                      {activeUserInitial}
                    </div>
                    <span>{activeUserName} (Sales Executive)</span>
                  </div>
                  <Lock size={13} className="text-slate-400 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Your account is automatically recorded as the person in charge of this job
                </p>
              </div>

              {/* Field 5: Data Shipment (MAWB / HAWB) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Data Shipment (MAWB / HAWB) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Shipment identifier
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: 126-9021-4412 atau SHP-001"
                  value={mawbHawb}
                  onChange={(e) => setMawbHawb(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-2xs transition-colors"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Air Waybill / House Air Waybill number related to the shipment of goods
                </p>
              </div>

              {/* Sync Notification Banner */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900 shadow-2xs">
                <RefreshCw size={14} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-snug font-medium">
                  This data will be automatically synced with the C-Track timeline and WhatsApp Field Agent notifications.
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 leading-snug">Field Agent Assignment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a field inspector from HRMS records for this job.</p>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Error Alert Banner (UC-CRM-A2-005 E-1 through E-5) */}
              {assignError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Proses Assignment Gagal</strong>
                    <span>{assignError}</span>
                  </div>
                </div>
              )}

              {/* Box Read-Only: CURRENT TASK INFORMATION (READ-ONLY) */}
              <div className="bg-[#f5f8fc] border border-[#e2eaf5] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold tracking-wider">
                    <FileText size={12} className="text-slate-400" />
                    <span>CURRENT TASK INFORMATION (READ-ONLY)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">System Verified</span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JOB NUMBER</span>
                    <span className="text-[13px] font-bold text-[#1d4ed8] mt-0.5 block font-mono">{assignModalTask.job_number}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c]" />
                    <span>Locked</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CUSTOMER / COMPANY</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{assignModalTask.customer_name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c]" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>

              {/* Field: SELECT FIELD AGENT (HRMS) * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 tracking-wider">
                    SELECT FIELD AGENT (HRMS) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">HRMS Database Connected</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer pr-10"
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
                <label className="text-[11px] font-bold text-slate-700 tracking-wider block mb-1.5">
                  FORM TEMPLATE <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('Standard Inspection Form')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-[#f0f6ff] text-[#1d4ed8] text-xs font-semibold hover:bg-blue-100/70 transition-colors cursor-pointer"
                  >
                    <FileText size={13} className="text-[#2563eb]" />
                    <span>Standard Inspection Form</span>
                  </button>
                </div>
              </div>

              {/* Field: INSTRUCTION NOTES FOR AGENT (OPTIONAL) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 tracking-wider block mb-1.5">
                  INSTRUCTION NOTES FOR AGENT (OPTIONAL)
                </label>
                <textarea
                  value={instructionNote}
                  onChange={(e) => setInstructionNote(e.target.value)}
                  rows={3}
                  placeholder="Please verify cargo packaging condition before loading..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  These notes will immediately appear in the A3 Field Agent mobile job list.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelAssign}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowLeftRight size={14} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 leading-snug">
                    Reassign Field Agent
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transfer assignment from previous agent to a new agent.
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="px-6 pb-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Box Read-Only: CURRENT TASK INFORMATION (READ-ONLY) */}
              <div className="bg-[#f5f8fc] border border-[#e2eaf5] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold tracking-wider">
                    <FileText size={12} className="text-slate-400" />
                    <span>CURRENT TASK INFORMATION (READ-ONLY)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">System Verified</span>
                </div>

                {/* Job Number */}
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JOB NUMBER</span>
                    <span className="text-[13px] font-bold text-[#1d4ed8] mt-0.5 block font-mono">
                      {reassignModalTask.job_number}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c]" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Customer / Company */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CUSTOMER / COMPANY</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                      {reassignModalTask.customer_name}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c]" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Current Field Agent */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT FIELD AGENT</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] text-[10px] font-bold inline-flex items-center justify-center">
                        {reassignModalTask.field_agent_name
                          ? reassignModalTask.field_agent_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : 'AP'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {reassignModalTask.field_agent_name || 'Andi Pratama'}
                      </span>
                      <span className="text-slate-400 text-[11px] font-normal">
                        (FA-1092)
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                    <Lock size={10} className="text-[#ea580c]" />
                    <span>Locked</span>
                  </span>
                </div>
              </div>

              {/* Field: SELECT NEW FIELD AGENT (HRMS) * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 tracking-wider">
                    SELECT NEW FIELD AGENT (HRMS) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>HRMS Sync Active</span>
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={reassignAgent}
                    onChange={(e) => setReassignAgent(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer pr-10"
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
                <p className="text-[10px] text-slate-400 mt-1">
                  List automatically filters standby/available inspectors in the target area.
                </p>
              </div>

              {/* Field: REASSIGNMENT REASON * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 tracking-wider">
                    REASSIGNMENT REASON <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Required</span>
                </div>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={2}
                  placeholder="Previous agent is unavailable / on leave at Cikarang site..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              {/* Field: ADDITIONAL INSTRUCTION NOTES (OPTIONAL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 tracking-wider">
                    ADDITIONAL INSTRUCTION NOTES (OPTIONAL)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                </div>
                <textarea
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  rows={2}
                  placeholder="Please continue cargo inspection from the previous agent..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
                />
              </div>

              {/* Footer Button: Save Reassignment */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignModalTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
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
      {/* MODAL 4: DETAIL STATUS MODAL (Exact User Screenshots Image 1 & Image 2)    */}
      {/* ========================================================================= */}
      {issueModalTask && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIssueModalTask(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[540px] overflow-hidden flex flex-col p-6 sm:p-7 space-y-5 max-h-[94vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Detail Status
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                  Job <span className="font-semibold text-slate-700">{issueModalTask.job_number}</span> • <span className="font-semibold text-slate-700">{issueModalTask.customer_name}</span>
                </p>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto space-y-5 pr-1 text-xs flex-1">
              {/* 1. CURRENT ISSUE STATUS Banner */}
              {issueModalTask.has_issue || issueModalTask.issue_status === 'Issue' ? (
                <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 text-[#e11d48] font-bold text-xs tracking-wider uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] inline-block" />
                    <span>CURRENT ISSUE STATUS</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs tracking-wider uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    <span>CURRENT ISSUE STATUS</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#dcfce7] border border-[#86efac] text-emerald-800 text-xs font-bold shadow-2xs">
                    <Check size={12} className="text-emerald-700 stroke-[3]" />
                    <span>Completed</span>
                  </span>
                </div>
              )}

              {/* 2. INITIAL ISSUE REPORT Card */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 sm:p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    INITIAL ISSUE REPORT
                  </span>
                  {!issueModalTask.has_issue && issueModalTask.issue_status !== 'Issue' && (
                    <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded">
                      Read-Only
                    </span>
                  )}
                </div>

                {/* Report Text Quote Box */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 italic leading-relaxed shadow-2xs">
                  {issueModalTask.has_issue || issueModalTask.issue_status === 'Issue'
                    ? `“${issueModalTask.issue_note || 'Selisih 2 koli kargo saat serah terima di area cargo MM2100.'}”`
                    : `“Semua berjalan lancar di lapangan”`}
                </div>

                {/* Bottom 2 Grid Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Job Number */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">JOB NUMBER</span>
                      <span className="text-xs font-bold text-[#0d6efd] font-mono block mt-0.5">
                        {issueModalTask.job_number}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium">
                      <Lock size={10} className="text-[#ea580c]" />
                      <span>Locked</span>
                    </span>
                  </div>

                  {/* Field Agent & Waktu */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">FIELD AGENT &amp; WAKTU</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {issueModalTask.field_agent_name || 'Maselinus'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        08/10/2026, 10:15 WIB
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] text-[10px] font-medium self-start">
                      <Lock size={10} className="text-[#ea580c]" />
                      <span>Locked</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. NOTES & ESCALATION HISTORY Section */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <Clock size={14} className="text-slate-500" />
                  <span>NOTES &amp; ESCALATION HISTORY</span>
                </div>

                {/* Timeline History Item (Shown when task has notes) */}
                {issueModalTask.notes && (
                  <div className="relative pl-4 border-l-2 border-blue-500 space-y-1.5 py-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{activeUserName || 'Adelia'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold">
                        Sales Executive
                      </span>
                      <span className="text-slate-400 text-[11px]">• 08/10/2026, 14:00 WIB</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed shadow-2xs">
                      “{issueModalTask.notes}”
                    </div>
                  </div>
                )}

                {/* Add More Notes Box */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 tracking-wider">
                      + ADD MORE NOTES <span className="text-slate-400 font-normal">(max 50 words)</span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                      <Shield size={13} className="text-[#059669]" />
                      <span>Encrypted Record</span>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={issueModalNoteText}
                    onChange={(e) => handleMax50WordsChange(e.target.value, setIssueModalNoteText)}
                    placeholder="Ketik catatan tambahan di sini jika ada update baru..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed shadow-2xs"
                  />

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                    <span>Catatan ini akan langsung terbit pada modul job list mobile A3 Field Agent &amp; tersimpan dalam audit trail.</span>
                    <span className={countWords(issueModalNoteText) >= 50 ? 'text-red-500 font-bold shrink-0 ml-2' : 'text-slate-400 shrink-0 ml-2'}>
                      {countWords(issueModalNoteText)}/50 kata
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Button: Save Notes */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIssueModalTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveIssueModalNotes}
                className="px-6 py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RESULT MODAL - Field Agent Worksheet (Exact Figma Screenshot)     */}
      {/* ========================================================================= */}
      {resultModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="printable-modal-card bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[520px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Dark Navy Header */}
            <div className="printable-header bg-[#0b1329] px-5 sm:px-6 py-4 text-white shrink-0">
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
              </div>
              <div className="mt-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Field Agent Worksheet</h2>
                <p className="text-xs text-blue-400 font-mono font-medium mt-0.5">
                  {resultModalTask.job_number || '#DSVEXP/2605/2551'}
                </p>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="printable-body p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-white">
              {/* E-3: Data Hasil Pemeriksaan Tidak Ditemukan (UC-CRM-A2-001 TC-004) */}
              {(resultModalTask.job_number.includes('999') || resultModalTask.job_number.toLowerCase().includes('notfound')) && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Data Hasil Pemeriksaan Tidak Ditemukan</strong>
                    <span>Data hasil pemeriksaan tidak ditemukan berdasarkan Job Number yang dipilih.</span>
                  </div>
                </div>
              )}

              {/* E-2: Hasil Pemeriksaan Belum Tersedia (UC-CRM-A2-001 TC-003) */}
              {resultModalTask.status === 'Completed' && resultModalTask.photo_count === 0 && resultModalTask.doc_count === 0 && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 animate-in fade-in">
                  <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="block font-bold">Hasil Pemeriksaan Belum Tersedia</strong>
                    <span>Hasil pemeriksaan belum tersedia. Dokumen dan foto inspeksi belum diunggah oleh Field Agent.</span>
                  </div>
                </div>
              )}

              {/* 1. JOB INFORMATION */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <Building2 size={13} className="text-[#2563eb]" />
                    <span>JOB INFORMATION</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID : {resultModalTask.job_number.replace(/^#/, '') || 'DSVEXP/2605/2551'}
                  </span>
                </div>
                <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Job Number</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
                        {resultModalTask.job_number || '#DSVEXP/2605/2551'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-2">Sales</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        Adelia
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Transaction ID</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
                        TRX-0526-03382
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-2">Created By</span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {resultModalTask.field_agent_name || 'Marsel'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SHIPMENT INFORMATION */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Truck size={13} className="text-[#2563eb]" />
                  <span>SHIPMENT INFORMATION</span>
                </div>
                <div className="bg-[#f8fafd] border border-[#e2e8f0] rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold text-slate-900 text-right">{resultModalTask.customer_name || 'PT DSV Transport Indonesia'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Shipper:</span>
                    <span className="font-bold text-slate-900 text-right">{resultModalTask.shipper || 'PT Example Shipper'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Consignee:</span>
                    <span className="font-bold text-slate-900 text-right">{resultModalTask.consignee || 'PT Example Consignee'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">MAWB:</span>
                    <span className="font-bold text-slate-900 font-mono text-right">{resultModalTask.mawb || '123-45678901'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">HAWB:</span>
                    <span className="font-bold text-[#2563eb] font-mono text-right">{resultModalTask.hawb || 'HAWB-00123'}</span>
                  </div>
                </div>
              </div>

              {/* 3. WAKTU SERAH TERIMA */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Clock size={13} className="text-[#2563eb]" />
                  <span>WAKTU SERAH TERIMA</span>
                </div>
                <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Handover Time:</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      20 Sep 2026, 10:30
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={13} className="text-rose-500" />
                      <span>Handover Location:</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {resultModalTask.handover_location || 'Gate 3 Priok'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. DATA FISIK BARANG */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Box size={13} className="text-[#2563eb]" />
                  <span>DATA FISIK BARANG</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">JUMLAH COIL</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">12</span>
                  </div>
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ACTUAL PIECES</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {resultModalTask.cargo_pieces || '12 Pcs'}
                    </span>
                  </div>
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">GROSS WEIGHT</span>
                    <span className="text-sm font-extrabold text-[#2563eb] mt-0.5 block">
                      {resultModalTask.gross_weight || '2,450 Kg'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. FOTO BUKTI LAPANGAN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <Camera size={13} className="text-[#2563eb]" />
                    <span>FOTO BUKTI LAPANGAN</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    <Check size={11} className="text-emerald-600" />
                    <span>4/4 Verified</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Card 1: 1. Foto Keseluruhan */}
                  <div className="border border-[#e2eaf5] rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="printable-photo-box bg-[#edf2f9] h-16 flex flex-col items-center justify-center p-1.5 relative group cursor-pointer hover:bg-[#e4ecf7] transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800')}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center shadow-xs">
                        <Camera size={12} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">IMG_8411.JPG • 10:12</span>
                    </div>
                    <div className="px-2 py-1 bg-white flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-800">1. Foto Keseluruhan</span>
                      <span className="text-[10px] font-bold text-emerald-600">OK</span>
                    </div>
                  </div>

                  {/* Card 2: 2. Marking / Label */}
                  <div className="border border-[#e2eaf5] rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="printable-photo-box bg-[#edf2f9] h-16 flex flex-col items-center justify-center p-1.5 relative group cursor-pointer hover:bg-[#e4ecf7] transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[1] || 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800')}
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                        <Tag size={12} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">IMG_8412.JPG • 10:14</span>
                    </div>
                    <div className="px-2 py-1 bg-white flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-800">2. Marking / Label</span>
                      <span className="text-[10px] font-bold text-emerald-600">Match</span>
                    </div>
                  </div>

                  {/* Card 3: 3. Foto Seal */}
                  <div className="border border-[#e2eaf5] rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="printable-photo-box bg-[#edf2f9] h-16 flex flex-col items-center justify-center p-1.5 relative group cursor-pointer hover:bg-[#e4ecf7] transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[2] || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800')}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                        <Lock size={12} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">IMG_8413.JPG • 10:15</span>
                    </div>
                    <div className="px-2 py-1 bg-white flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-800">3. Foto Seal</span>
                      <span className="text-[10px] font-bold text-emerald-600">Intact</span>
                    </div>
                  </div>

                  {/* Card 4: 4. Area Kerusakan */}
                  <div className="border border-[#e2eaf5] rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="printable-photo-box bg-[#edf2f9] h-16 flex flex-col items-center justify-center p-1.5 relative group cursor-pointer hover:bg-[#e4ecf7] transition-colors"
                      onClick={() => setPreviewPhotoUrl(resultModalTask.result_photos?.[3] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800')}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                        <Shield size={12} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">Inspected • 10:20</span>
                    </div>
                    <div className="px-2 py-1 bg-white flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-800">4. Area Kerusakan</span>
                      <span className="text-[9px] font-bold text-emerald-600">No damage reported</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. DOKUMEN PENDUKUNG & NAMA PETUGAS */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <FileText size={13} className="text-[#2563eb]" />
                  <span>DOKUMEN PENDUKUNG &amp; NAMA PETUGAS</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 bg-white border border-[#e2eaf5] rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Packing List.pdf</span>
                        <span className="text-[10px] text-slate-400">PDF • 1.4 MB • Verified</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Downloading Packing List.pdf...')}
                      className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white border border-[#e2eaf5] rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">MSDS.pdf</span>
                        <span className="text-[10px] text-slate-400">PDF • 860 KB • Material Safety Sheet</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('Downloading MSDS.pdf...')}
                      className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>

                  {/* Pihak Penyerah & Pihak Penerima Box */}
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PIHAK PENYERAH</span>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-slate-500" />
                        <span>Budi Santoso</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PIHAK PENERIMA</span>
                      <span className="text-xs font-bold text-[#2563eb] flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-[#2563eb]" />
                        <span>{resultModalTask.field_agent_name || 'Marsel'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. CHECKLIST CENTANG & STATUS MASALAH */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <CheckCircle size={13} className="text-[#2563eb]" />
                  <span>CHECKLIST CENTANG &amp; STATUS MASALAH</span>
                </div>
                <div className="bg-white border border-[#e2eaf5] rounded-xl p-3 space-y-2">
                  <div className="space-y-1.5">
                    {[
                      'Quantity & weight match',
                      'Visual condition good',
                      'Safe for flight',
                      'Document conformity',
                      'Airline standard conformity'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-700">
                          <Check size={13} className="text-emerald-500 stroke-[2.5]" />
                          <span>{item}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Dangerous Goods:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        NO
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Special Handling:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fffbeb] border border-[#fef3c7] text-[#b45309] text-[10px] font-bold">
                        <RefreshCw size={10} className="text-[#b45309]" />
                        <span>YES (Kooler / Priority Cargo)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. ISSUE */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <AlertCircle size={13} className="text-[#2563eb]" />
                  <span>ISSUE</span>
                </div>
                {resultModalTask.has_issue ? (
                  <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-900">{resultModalTask.issue_type || 'Cargo Damage'} Detected</h4>
                      <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                        {resultModalTask.issue_note || 'Physical damage detected during on-site inspection.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">No operational issue detected.</h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        Seluruh parameter kuantitas, segel, dan fisik kargo telah terverifikasi normal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="printable-footer px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setResultModalTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[490px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 leading-tight">Job / Transaction Detail Summary</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{detailModalTask.job_number || '#AENAT/2609/0307'}</p>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-white">
              {/* 1. JOB NUMBER & STATUS */}
              <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JOB NUMBER &amp; STATUS</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span>Assigned / In Progress</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {detailModalTask.customer_name || 'PT Schneider Electric Indonesia'}
                  </h4>
                  <span className="text-xs font-bold text-[#2563eb] font-mono block mt-0.5">
                    {detailModalTask.job_number || '#AENAT/2609/0307'}
                  </span>
                </div>
                <div className="border-t border-slate-200/70 pt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Created At:</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">06 Oct 2026, 14:30 WIB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Sales Executive:</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {activeUserName || 'Adelia'} <span className="text-slate-400 font-normal text-[11px]">(Logged-In User)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. CONNECTED TRANSACTION & HAWB */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  CONNECTED TRANSACTION &amp; HAWB
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#1d4ed8] text-xs font-semibold">
                    <Tag size={12} className="text-[#2563eb]" />
                    <span>#TRX-0526-03689</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f6ff] border border-blue-200 text-[#1d4ed8] text-xs font-semibold">
                    <Tag size={12} className="text-[#2563eb]" />
                    <span>MAWB: 123-99887766 (Air Cargo)</span>
                  </span>
                </div>
              </div>

              {/* 3. FIELD AGENT ASSIGNMENT (FR-A2-004) */}
              <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    FIELD AGENT ASSIGNMENT (FR-A2-004)
                  </span>
                  {detailModalTask.status === 'Assigned' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                      Belum Ditugaskan
                    </span>
                  )}
                </div>

                {detailModalTask.status === 'Assigned' && detailModalTask.field_agent_name ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Field Agent Name</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{detailModalTask.field_agent_name}</span>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          [ID: FA-1092 - HRMS]
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Assigned At</span>
                      <span className="font-bold text-slate-900">06 Oct 2026, 09:00 WIB</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Task Area / Location</span>
                      <span className="font-bold text-slate-900">{detailModalTask.handover_location || 'Kawasan Industri Jababeka, Cikarang'}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2.5 text-center space-y-2 bg-white/70 rounded-lg border border-dashed border-slate-200">
                    <p className="text-xs text-slate-600 font-medium">
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
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      Ubah Informasi Job/Transaksi (A-4)
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Diizinkan</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Handover Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Handover Datetime</label>
                    <input
                      type="text"
                      value={editDatetime}
                      onChange={(e) => setEditDatetime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Operational Notes</label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Tambahkan catatan revisi transaksi..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-end pt-1">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  DATA RELATIONSHIPS &amp; CONNECTIVITY (FR-A2-010)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <MessageCircle size={11} className="text-[#2563eb]" />
                      <span>Conversation</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">CONV-250624-018</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <FileText size={11} className="text-[#2563eb]" />
                      <span>Field Task</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-1 block">TSK-2508-1208</span>
                  </div>
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <CheckCircle size={11} className="text-emerald-600" />
                      <span>Issue Status</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-900 mt-1 block">Normal / Resolved</span>
                  </div>
                </div>
              </div>

              {/* 5. FIELD INSPECTION RESULT PREVIEW (A3) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    FIELD INSPECTION RESULT PREVIEW (A3)
                  </span>
                  <ChevronRight size={13} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Actual Pieces:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{detailModalTask.cargo_pieces || '12 / 12 Koli'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold">
                        Matched
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Gross Weight:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{detailModalTask.gross_weight || '8,450 kg'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold">
                        Matched
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-[#e2eaf5] rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
                        <ImageIcon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Foto_Segel.jpg</span>
                        <span className="text-[10px] text-slate-400">2.4 MB • JPG Image</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => showToast('Downloading Foto_Segel.jpg...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(detailModalTask.result_photos?.[0] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#e2eaf5] rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Surat_Jalan.pdf</span>
                        <span className="text-[10px] text-slate-400">1.2 MB • PDF Document</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => showToast('Downloading Surat_Jalan.pdf...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Opening Surat_Jalan.pdf preview...')}
                        className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-lg transition-colors cursor-pointer"
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
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDetailModalTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              {!isEditingTransaction ? (
                <button
                  type="button"
                  onClick={() => handleOpenEditTransaction(detailModalTask)}
                  className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-xs font-bold text-[#0d6efd] cursor-pointer transition-colors shadow-2xs"
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
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                Handling Timeline &amp; Audit Log
              </h3>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-white">
              {/* INFORMATION Box */}
              <div className="bg-[#f8fafd] border border-[#e2eaf5] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INFORMATION</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span>Assigned / In Progress</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {timelineModalTask.customer_name || 'PT JPG Trans Indonesia'}
                  </h4>
                  <span className="text-xs font-bold text-[#2563eb] font-mono block mt-0.5">
                    {timelineModalTask.job_number || '#AENAT/2609/0307'}
                  </span>
                </div>
                <div className="border-t border-slate-200/70 pt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Reporter:</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {activeUserName || 'Adelia'} <span className="text-slate-500 font-normal text-[11px]">(Sales Executive)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Date &amp; Time:</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">06-10-2026, 14:35 WIB</span>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL ACTIVITY HISTORY Header */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    CHRONOLOGICAL ACTIVITY HISTORY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] text-[10px] font-bold">
                    4 Logs
                  </span>
                </div>

                {/* Timeline vertical chain */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[7px] top-2 bottom-3 w-[2px] bg-slate-200" />

                  {/* Log 1: Reassign Field Agent */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Reassign Field Agent</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 14:35 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By: <strong className="text-slate-700 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 mt-1.5 leading-relaxed">
                        <p>
                          <span className="font-semibold text-slate-800">Notes:</span> Transferred from Andi Pratama to Marsel Xavier due to previous agent being unavailable at Cikarang site.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Log 2: Field Inspection Result Updated (A3) */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Field Inspection Result Updated (A3)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 10:15 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By: <strong className="text-slate-700 font-semibold">{timelineModalTask.field_agent_name || 'Marsel Xavier'}</strong> (Field Agent)
                      </p>
                      <div className="p-2.5 bg-[#f8fafd] border border-[#e2eaf5] rounded-xl text-xs mt-1.5 space-y-2">
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>Physical inspection: 10 cargo pieces verified matching client technical specs.</span>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <FileText size={13} className="text-[#2563eb]" />
                            <span className="text-slate-700 font-medium">Uploaded 2 Cargo Evidence Photos &amp; 1 Signed Delivery Order</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const t = timelineModalTask;
                              setTimelineModalTask(null);
                              setResultModalTask(t);
                            }}
                            className="text-[#2563eb] hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            VIEW
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Log 3: Field Agent Assignment */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Field Agent Assignment</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 09:00 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By: <strong className="text-slate-700 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 mt-1.5">
                        Assigned to: <strong className="text-slate-900">{timelineModalTask.field_agent_name || 'Andi Pratama'}</strong> <span className="text-slate-500 font-mono text-[11px]">(FA-1092 — HRMS)</span>
                      </div>
                    </div>
                  </div>

                  {/* Log 4: Job Order Created */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Job Order Created</h4>
                        <span className="text-[10px] text-slate-400 font-mono">06 Oct 2026 • 08:30 WIB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By: <strong className="text-slate-700 font-semibold">{activeUserName || 'Adelia'}</strong> (Sales Executive)
                      </p>
                      <div className="p-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 mt-1.5 flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-400" />
                        <span>Connected to Transaction ID: <strong className="font-mono text-slate-900">TRX-0526-03689</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer Space */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setTimelineModalTask(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
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
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Top Header */}
              <div className="px-6 pt-5 pb-3.5 border-b border-slate-100 flex items-start justify-between shrink-0 bg-white">
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
                    Pengajuan Need Backup
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Buat tiket bantuan penanganan masalah untuk tim support/operations.
                  </p>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs flex-1 bg-white">
                {/* 1. Job Number / Customer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Job Number / Customer
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e2e8f0]/80 text-slate-600 text-[10px] font-medium">
                      <Lock size={10} className="text-slate-500" />
                      <span>Locked</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] border border-slate-200/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs">
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
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Kategori Kendala <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={backupCategory}
                      onChange={(e) => setBackupCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer pr-10 shadow-2xs transition-colors"
                    >
                      <option value="Selisih Koli / Gross Weight">Selisih Koli / Gross Weight</option>
                      <option value="Kerusakan Kemasan Fisik Kargo">Kerusakan Kemasan Fisik Kargo</option>
                      <option value="Segel Kontainer Rusak / Tidak Sesuai">Segel Kontainer Rusak / Tidak Sesuai</option>
                      <option value="Kendala Dokumen Bea Cukai / Pelabuhan">Kendala Dokumen Bea Cukai / Pelabuhan</option>
                      <option value="Armada Rusak / Butuh Armada Pengganti">Armada Rusak / Butuh Armada Pengganti</option>
                      <option value="Lainnya / Force Majeure">Lainnya / Force Majeure</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                {/* 3. Tingkat Prioritas * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-2 block">
                    Tingkat Prioritas <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Normal */}
                    <div
                      onClick={() => setBackupPriority('normal')}
                      className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all ${backupPriority === 'normal'
                          ? 'border-2 border-[#0d6efd] bg-[#f0f6ff]/40 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${backupPriority === 'normal'
                          ? 'border-2 border-[#0d6efd]'
                          : 'border border-slate-300'
                        }`}>
                        {backupPriority === 'normal' && (
                          <span className="w-2 h-2 rounded-full bg-[#0d6efd]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-bold block ${backupPriority === 'normal' ? 'text-[#0d6efd]' : 'text-slate-800'}`}>
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
                      className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all ${backupPriority === 'urgent'
                          ? 'border-2 border-[#0d6efd] bg-[#f0f6ff]/40 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${backupPriority === 'urgent'
                          ? 'border-2 border-[#0d6efd]'
                          : 'border border-slate-300'
                        }`}>
                        {backupPriority === 'urgent' && (
                          <span className="w-2 h-2 rounded-full bg-[#0d6efd]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#0d6efd] flex items-center gap-1.5">
                          <span>High / Urgent</span>
                          <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          SLA Tindakan Segera (&lt; 30 Menit)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Deskripsi Bantuan yang Dibutuhkan * */}
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Deskripsi Bantuan yang Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={500}
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    placeholder="Jelaskan kebutuhan bantuan operasional, armada, atau perbaikan dokumen..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none transition-colors leading-relaxed shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Sertakan PIC atau nomor kontak darurat bila relevan.</span>
                    <span className="font-mono">{backupDescription.length} / 500 Karakter</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-4 bg-[#f8fafc] border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setBackupModalTask(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
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
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-black flex flex-col">
            <img src={previewPhotoUrl} alt="Preview" className="w-full h-auto object-contain" />
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
