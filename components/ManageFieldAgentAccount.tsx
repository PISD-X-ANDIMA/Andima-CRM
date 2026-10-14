'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, ChevronDown, Plus, X, Check, AlertTriangle, CheckCircle, FileText, Pencil, Lock
} from 'lucide-react';

export interface FieldAgentAccount {
  id: string;
  agent_id: string;
  name: string;
  email: string;
  phone_number?: string;
  field_area: string;
  status: 'Active' | 'Inactive';
}

const DEFAULT_FIELD_AGENT_ACCOUNTS: FieldAgentAccount[] = [
  { id: 'agent-1', agent_id: 'AGNT-001', name: 'Maselinus', email: 'marsel@andima.co.id', phone_number: '+62 812-9876-5432', field_area: 'Bekasi Industrial Area', status: 'Active' },
  { id: 'agent-2', agent_id: 'AGNT-002', name: 'Eysa Franata', email: 'eysa@andima.co.id', phone_number: '+62 813-1122-3344', field_area: 'Bekasi Industrial Area', status: 'Active' },
  { id: 'agent-3', agent_id: 'AGNT-003', name: 'Maselinus', email: 'marsel2@andima.co.id', phone_number: '+62 812-9876-5433', field_area: 'Bekasi Industrial Area', status: 'Inactive' },
  { id: 'agent-4', agent_id: 'AGNT-004', name: 'Khoirul Anwar', email: 'khoirul@andima.co.id', phone_number: '+62 814-5566-7788', field_area: 'Bekasi Industrial Area', status: 'Active' },
  { id: 'agent-5', agent_id: 'AGNT-005', name: 'Khoirul Anwar', email: 'khoirul2@andima.co.id', phone_number: '+62 814-5566-7789', field_area: 'Bekasi Industrial Area', status: 'Inactive' },
  { id: 'agent-6', agent_id: 'AGNT-006', name: 'Andi Pratama', email: 'andi@andima.co.id', phone_number: '+62 815-9988-7766', field_area: 'Tanjung Priok Port', status: 'Active' },
  { id: 'agent-7', agent_id: 'AGNT-007', name: 'Budi Santoso', email: 'budi@andima.co.id', phone_number: '+62 816-4433-2211', field_area: 'Sunda Kelapa', status: 'Inactive' },
  { id: 'agent-8', agent_id: 'AGNT-008', name: 'Rizky Pratama', email: 'rizky@andima.co.id', phone_number: '+62 817-6677-8899', field_area: 'Marunda Cargo Hub', status: 'Active' },
  { id: 'agent-9', agent_id: 'AGNT-009', name: 'Hendra Wijaya', email: 'hendra@andima.co.id', phone_number: '+62 818-2233-4455', field_area: 'Tanjung Priok Port', status: 'Active' },
  { id: 'agent-10', agent_id: 'AGNT-010', name: 'Suryadi', email: 'suryadi@andima.co.id', phone_number: '+62 819-3344-5566', field_area: 'Marunda Cargo Hub', status: 'Inactive' },
  { id: 'agent-11', agent_id: 'AGNT-011', name: 'Agus Setiawan', email: 'agus@andima.co.id', phone_number: '+62 821-4455-6677', field_area: 'Cikarang Dry Port', status: 'Active' },
  { id: 'agent-12', agent_id: 'AGNT-012', name: 'Dedi Kurniawan', email: 'dedi@andima.co.id', phone_number: '+62 822-5566-7788', field_area: 'Bandara Soetta', status: 'Active' },
  { id: 'agent-13', agent_id: 'AGNT-013', name: 'Bambang Subianto', email: 'bambang@andima.co.id', phone_number: '+62 823-6677-8899', field_area: 'Tanjung Priok Port', status: 'Inactive' },
  { id: 'agent-14', agent_id: 'AGNT-014', name: 'Irwan Gunawan', email: 'irwan@andima.co.id', phone_number: '+62 824-7788-9900', field_area: 'MM2100 Cikarang', status: 'Active' },
  { id: 'agent-15', agent_id: 'AGNT-015', name: 'Rahmat Hidayat', email: 'rahmat@andima.co.id', phone_number: '+62 825-8899-0011', field_area: 'Karawang', status: 'Active' },
  { id: 'agent-16', agent_id: 'AGNT-016', name: 'Herman Hermansyah', email: 'herman@andima.co.id', phone_number: '+62 826-9900-1122', field_area: 'Tanjung Priok Port', status: 'Active' },
  { id: 'agent-17', agent_id: 'AGNT-017', name: 'Doni Prasetyo', email: 'doni@andima.co.id', phone_number: '+62 827-0011-2233', field_area: 'Bandara Halim', status: 'Inactive' },
  { id: 'agent-18', agent_id: 'AGNT-018', name: 'Farhan Ramadhan', email: 'farhan@andima.co.id', phone_number: '+62 828-1122-3344', field_area: 'Sunda Kelapa', status: 'Active' },
  { id: 'agent-19', agent_id: 'AGNT-019', name: 'Gilang Perkasa', email: 'gilang@andima.co.id', phone_number: '+62 829-2233-4455', field_area: 'Bekasi Industrial Area', status: 'Active' },
  { id: 'agent-20', agent_id: 'AGNT-020', name: 'Fajar Kurnia', email: 'fajar@andima.co.id', phone_number: '+62 830-3344-5566', field_area: 'Marunda Cargo Hub', status: 'Inactive' },
  { id: 'agent-21', agent_id: 'AGNT-021', name: 'Yudi Firmansyah', email: 'yudi@andima.co.id', phone_number: '+62 831-4455-6677', field_area: 'Tanjung Priok Port', status: 'Active' },
  { id: 'agent-22', agent_id: 'AGNT-022', name: 'Wahyu Hidayat', email: 'wahyu@andima.co.id', phone_number: '+62 832-5566-7788', field_area: 'Marunda Cargo Hub', status: 'Active' },
  { id: 'agent-23', agent_id: 'AGNT-023', name: 'Arif Rahman', email: 'arif@andima.co.id', phone_number: '+62 833-6677-8899', field_area: 'Cikarang Dry Port', status: 'Active' },
  { id: 'agent-24', agent_id: 'AGNT-024', name: 'Teguh Santoso', email: 'teguh@andima.co.id', phone_number: '+62 834-7788-9900', field_area: 'Bekasi Industrial Area', status: 'Inactive' }
];

/**
 * Validasi alamat email sesuai standar Field Agent Account:
 * Email Valid:
 *  - nama@gmail.com
 *  - nama@yahoo.com
 *  - nama@outlook.com
 *  - nama@company.co.id
 *  - nama@company.id
 *  - nama@company.org
 *  - nama@company.ac.id
 *
 * Email Tidak Valid:
 *  - nama@gmail -> tidak ada akhiran domain
 *  - nama@gmail.co -> domain gmail.co tidak valid (typo untuk gmail.com)
 *  - nama@company -> tidak ada akhiran domain
 *  - @gmail.com -> tidak ada nama pengguna
 *  - nama.gmail.com -> tidak ada simbol @
 *  - nama@@gmail.com -> simbol @ ganda
 *  - nama@.com -> nama domain tidak lengkap (diawali titik)
 *  - nama@gmail..com -> terdapat titik ganda pada domain
 *  - nama@gmail.com. -> ada titik berlebih di akhir
 *  - kolom email kosong -> email tidak diisi (tidak bisa create account)
 */
/**
 * Ekstensi domain resmi yang diizinkan dalam sistem (Whitelist).
 * Menolak domain asal-asalan seperti .sd, .co, .xx, dll.
 */
export const ALLOWED_DOMAIN_EXTENSIONS = [
  'com',
  'co.id',
  'id',
  'org',
  'ac.id',
  'net',
  'edu',
  'gov',
  'go.id',
  'sch.id',
  'biz.id',
  'web.id',
  'my.id',
  'org.id',
  'io',
];

export function validateEmail(email: string): { isValid: boolean; error: string | null } {
  const trimmed = (email || '').trim();

  // 1. Cek kosong
  if (!trimmed) {
    return { isValid: false, error: 'Kolom email kosong. Email wajib diisi.' };
  }

  // 2. Cek spasi
  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Email tidak boleh mengandung spasi.' };
  }

  // 3. Cek simbol @
  const atMatches = trimmed.match(/@/g);
  if (!atMatches) {
    return { isValid: false, error: "Email tidak valid: tidak ada simbol '@'." };
  }
  if (atMatches.length > 1) {
    return { isValid: false, error: "Email tidak valid: simbol '@' ganda." };
  }

  const [username, domain] = trimmed.split('@');

  // 4. Cek username (sebelum @)
  if (!username) {
    return { isValid: false, error: "Email tidak valid: tidak ada nama pengguna sebelum '@'." };
  }
  if (username.startsWith('.') || username.endsWith('.')) {
    return { isValid: false, error: 'Nama pengguna tidak boleh diawali atau diakhiri titik.' };
  }
  if (username.includes('..')) {
    return { isValid: false, error: 'Nama pengguna tidak boleh mengandung titik ganda (..).' };
  }
  const usernameRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Karakter pada nama pengguna email tidak valid.' };
  }

  // 5. Cek domain (setelah @)
  if (!domain) {
    return { isValid: false, error: 'Nama domain tidak lengkap.' };
  }
  if (domain.startsWith('.')) {
    return { isValid: false, error: 'Nama domain tidak lengkap (diawali titik).' };
  }
  if (domain.endsWith('.')) {
    return { isValid: false, error: 'Ada titik berlebih di akhir domain.' };
  }
  if (domain.includes('..')) {
    return { isValid: false, error: 'Terdapat titik ganda pada domain.' };
  }
  if (!domain.includes('.')) {
    return { isValid: false, error: 'Tidak ada akhiran domain (contoh: .com, .co.id, .id).' };
  }

  const domainParts = domain.split('.');

  // Cek format setiap bagian domain (label)
  const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  for (const part of domainParts) {
    if (!part || !labelRegex.test(part)) {
      return { isValid: false, error: `Bagian domain '${part}' tidak valid.` };
    }
  }

  // 6. Validasi ekstensi domain resmi (Whitelist)
  const lastTwo = domainParts.length >= 2 ? domainParts.slice(-2).join('.').toLowerCase() : '';
  const lastOne = domainParts[domainParts.length - 1].toLowerCase();

  if (lastTwo && ALLOWED_DOMAIN_EXTENSIONS.includes(lastTwo)) {
    if (domainParts.length < 3) {
      return { isValid: false, error: `Nama domain tidak lengkap sebelum '.${lastTwo}' (contoh: company.${lastTwo}).` };
    }
    return { isValid: true, error: null };
  }

  if (ALLOWED_DOMAIN_EXTENSIONS.includes(lastOne)) {
    if (domainParts.length < 2) {
      return { isValid: false, error: 'Nama domain tidak lengkap.' };
    }
    return { isValid: true, error: null };
  }

  return {
    isValid: false,
    error: `Ekstensi domain '.${lastOne}' tidak valid. Gunakan ekstensi resmi (contoh: .com, .co.id, .id, .org, .ac.id).`
  };
}

/**
 * Format nomor telepon Indonesia otomatis dengan prefix +62 dan strip:
 * Contoh: +62 812-3456-9023
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '+62 ';

  // Ekstrak hanya digit angka
  let digits = value.replace(/\D/g, '');

  // Hilangkan kode negara 62 jika ada di awal
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  }

  // Hilangkan angka 0 di awal jika user paste 08...
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Batasi maksimal 12 digit setelah +62
  digits = digits.slice(0, 12);

  if (digits.length === 0) {
    return '+62 ';
  }
  if (digits.length <= 3) {
    return `+62 ${digits}`;
  }
  if (digits.length <= 7) {
    return `+62 ${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `+62 ${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ManageFieldAgentAccount() {
  const [agentAccounts, setAgentAccounts] = useState<FieldAgentAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_field_agent_accounts');
        if (stored) {
          const parsed: FieldAgentAccount[] = JSON.parse(stored);
          const cleaned = parsed.filter(a => !a.name.includes('121212121') && !/\d/.test(a.name));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('andima_field_agent_accounts', JSON.stringify(cleaned));
          }
          if (cleaned.length >= 24 && cleaned[0]?.agent_id?.startsWith('AGNT-')) return cleaned;
        }
      } catch {}
    }
    return DEFAULT_FIELD_AGENT_ACCOUNTS;
  });

  // Auto-clean test accounts like "121212121" or names containing numbers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_field_agent_accounts');
        if (stored) {
          const parsed: FieldAgentAccount[] = JSON.parse(stored);
          const cleaned = parsed.filter(a => !a.name.includes('121212121') && !/\d/.test(a.name));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('andima_field_agent_accounts', JSON.stringify(cleaned));
            setAgentAccounts(cleaned);
          }
        }
      } catch {}
    }
  }, []);

  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);

  // Close dropdown on outside click
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // Modals
  const [editingAgent, setEditingAgent] = useState<FieldAgentAccount | null>(null);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);

  // Form states
  const [formAgentName, setFormAgentName] = useState('');
  const [formAgentEmail, setFormAgentEmail] = useState('');
  const [formAgentPhone, setFormAgentPhone] = useState('+62 ');
  const [formAgentArea, setFormAgentArea] = useState('Bekasi Industrial Area');
  const [formAgentStatus, setFormAgentStatus] = useState<'Active' | 'Inactive'>('Active');
  const [agentFormError, setAgentFormError] = useState<string | null>(null);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Cegah pengetikan karakter angka 0-9 langsung dari keyboard
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setAgentFormError('Full name tidak boleh mengandung angka.');
    }
  };

  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (/[0-9]/.test(pasteData)) {
      e.preventDefault();
      const filtered = pasteData.replace(/[^a-zA-Z\s]/g, '');
      setFormAgentName(prev => (prev + filtered).replace(/[^a-zA-Z\s]/g, ''));
      setAgentFormError('Full name tidak boleh mengandung angka.');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/[0-9]/.test(raw)) {
      setAgentFormError('Full name tidak boleh mengandung angka.');
    } else if (agentFormError === 'Full name tidak boleh mengandung angka.') {
      setAgentFormError(null);
    }
    // Hanya menerima alfabet (A-Z, a-z) dan spasi, tidak menerima angka atau simbol
    const filtered = raw.replace(/[^a-zA-Z\s]/g, '');
    setFormAgentName(filtered);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val || val.length < 4 || val === '+62' || val === '+62 ') {
      setFormAgentPhone('+62 ');
      if (agentFormError) setAgentFormError(null);
      return;
    }
    const formatted = formatPhoneNumber(val);
    setFormAgentPhone(formatted);
    if (agentFormError) setAgentFormError(null);
  };

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
    setFormAgentEmail(agent.email.includes('@') ? agent.email : `${agent.name.toLowerCase().replace(/\s+/g, '')}@andima.co.id`);
    setFormAgentPhone(formatPhoneNumber(agent.phone_number || '+62 '));
    setFormAgentArea(agent.field_area || 'Bekasi Industrial Area');
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
    if (/[0-9]/.test(formAgentName)) {
      setAgentFormError('Full name tidak boleh mengandung angka.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(formAgentName.trim())) {
      setAgentFormError('Full name hanya boleh berisi huruf alfabet (A-Z) dan spasi.');
      return;
    }
    if (!formAgentEmail.trim()) {
      setAgentFormError('Kolom email kosong. Email wajib diisi.');
      return;
    }
    const emailCheck = validateEmail(formAgentEmail);
    if (!emailCheck.isValid) {
      setAgentFormError(emailCheck.error || 'Format email tidak valid.');
      return;
    }
    const phoneDigits = formAgentPhone.replace(/\D/g, '').replace(/^62/, '');
    if (!phoneDigits) {
      setAgentFormError('Nomor telepon wajib diisi.');
      return;
    }
    if (phoneDigits.length < 9) {
      setAgentFormError('Nomor telepon tidak lengkap (minimal 9 digit setelah +62).');
      return;
    }

    const updated = agentAccounts.map(a => {
      if (a.id === editingAgent.id) {
        return {
          ...a,
          name: formAgentName.trim(),
          email: formAgentEmail.trim(),
          phone_number: formAgentPhone.trim(),
          field_area: formAgentArea.trim() || 'Bekasi Industrial Area',
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
    setFormAgentEmail(''); // Empty, do not prefill
    setFormAgentPhone('+62 '); // Prefill with +62 
    setFormAgentArea('Bekasi Industrial Area');
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
    if (/[0-9]/.test(formAgentName)) {
      setAgentFormError('Full name tidak boleh mengandung angka.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(formAgentName.trim())) {
      setAgentFormError('Full name hanya boleh berisi huruf alfabet (A-Z) dan spasi.');
      return;
    }
    if (!formAgentEmail.trim()) {
      setAgentFormError('Kolom email kosong. Email wajib diisi untuk membuat akun.');
      return;
    }
    const emailCheck = validateEmail(formAgentEmail);
    if (!emailCheck.isValid) {
      setAgentFormError(emailCheck.error || 'Format email tidak valid.');
      return;
    }
    const phoneDigits = formAgentPhone.replace(/\D/g, '').replace(/^62/, '');
    if (!phoneDigits) {
      setAgentFormError('Nomor telepon wajib diisi.');
      return;
    }
    if (phoneDigits.length < 9) {
      setAgentFormError('Nomor telepon tidak lengkap (minimal 9 digit setelah +62).');
      return;
    }

    const nextIdNum = String(agentAccounts.length + 1).padStart(3, '0');
    const newAgent: FieldAgentAccount = {
      id: `agent-${Date.now()}`,
      agent_id: `AGNT-${nextIdNum}`,
      name: formAgentName.trim(),
      email: formAgentEmail.trim(),
      phone_number: formAgentPhone.trim(),
      field_area: formAgentArea.trim() || 'Bekasi Industrial Area',
      status: formAgentStatus
    };

    const updated = [newAgent, ...agentAccounts];
    saveAgentAccounts(updated);
    setIsAddAgentModalOpen(false);
    showToast(`Akun Field Agent "${newAgent.name}" (${newAgent.agent_id}) berhasil ditambahkan.`);
  };


  // Filtered Agents
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

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));
  const validPage = Math.min(page, totalPages);
  const pagedAgents = filteredAgents.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="w-full pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TITLE & SUBTITLE */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight leading-tight">
          Manage Field Agent Accounts
        </h1>
        <p className="text-xs text-slate-400 font-normal mt-1">
          Manage and organize field worker account credentials for the A3 application.
        </p>
      </div>

      {/* TOP CONTROLS AND ACTION BAR CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Left: Search input & Status dropdown */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={agentSearchQuery}
              onChange={(e) => {
                setAgentSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Agent ID, Email, dan Field Agent"
              className="w-full bg-[#f4f6fa] border border-slate-200/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Status Dropdown - Matching Record Conversation */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>{agentStatusFilter === 'All' ? 'Status' : agentStatusFilter}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 animate-in fade-in slide-in-from-top-1">
                {[
                  { label: 'Status (All)', value: 'All' },
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setAgentStatusFilter(opt.value);
                      setPage(1);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      agentStatusFilter === opt.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {agentStatusFilter === opt.value && <Check size={13} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Create Field Agent Accounts Button */}
        <button
          type="button"
          onClick={handleOpenAddAgent}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Create Field Agent Accounts</span>
        </button>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="bg-[#F5F7FF] rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-center">
            <thead className="bg-[#F5F7FF] border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[20%] first:rounded-tl-2xl">
                  Agent ID
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[20%]">
                  Field Agent
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[25%]">
                  Email
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[15%]">
                  Field Area
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[10%]">
                  Status
                </th>
                <th className="py-4 px-6 text-sm font-bold text-slate-800 text-center tracking-normal w-[10%] last:rounded-tr-2xl">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada akun Field Agent yang ditemukan.
                  </td>
                </tr>
              ) : (
                pagedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-4 px-6 text-center text-sm font-bold text-slate-900 tracking-tight">
                      {agent.agent_id}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-slate-800">
                      {agent.name}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-normal text-slate-700">
                      {agent.email}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-slate-800">
                      {agent.field_area}
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        agent.status === 'Active'
                          ? 'text-[#16a34a] bg-[#eaf8ef] border border-[#bbf7d0]'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}>
                        <Check size={12} className={agent.status === 'Active' ? 'text-[#16a34a] stroke-[2.5]' : 'hidden'} />
                        <span>{agent.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAgent(agent)}
                          title="Edit"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* DYNAMIC PAGINATION FOOTER */}
        <div className="py-4 px-6 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredAgents.length > 0 ? (validPage - 1) * pageSize + 1 : 0}-{Math.min(validPage * pageSize, filteredAgents.length)}</strong> of <strong className="text-slate-800">{filteredAgents.length}</strong> agents
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setPage(Math.max(1, validPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const pageNumber = totalPages <= 5
                ? index + 1
                : Math.max(1, Math.min(validPage - 2, totalPages - 4)) + index;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    validPage === pageNumber
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
              disabled={validPage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, validPage + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT FIELD AGENT ACCOUNT (Exact Match to Image 2 - No X Button) */}
      {editingAgent && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setEditingAgent(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[520px] p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header with Title & Subtitle - NO X BUTTON */}
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Edit Field Agent Account
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Update profile, operational area, or access status for this agent.
              </p>
            </div>

            {agentFormError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                <span>{agentFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditAgent} noValidate className="space-y-4">
              {/* Field 1: AGENT ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    AGENT ID
                  </label>
                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    <Lock size={10} /> Locked
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={editingAgent.agent_id}
                    disabled
                    className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none pr-10 cursor-not-allowed font-mono"
                  />
                  <Lock size={14} className="absolute right-3.5 text-slate-400" />
                </div>
              </div>

              {/* Field 2: FULL NAME * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  FULL NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAgentName}
                  onChange={handleNameChange}
                  onKeyDown={handleNameKeyDown}
                  onPaste={handleNamePaste}
                  pattern="[a-zA-Z\s]*"
                  inputMode="text"
                  placeholder="Enter field agent full name..."
                  className={`w-full bg-white border rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors ${
                    agentFormError && agentFormError.toLowerCase().includes('name')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200/90 focus:border-blue-500'
                  }`}
                />
                {agentFormError && agentFormError.toLowerCase().includes('name') && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {agentFormError}
                  </p>
                )}
              </div>

              {/* Fields 3 & 4: EMAIL ADDRESS * & PHONE NUMBER * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL ADDRESS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgentEmail}
                    onChange={(e) => {
                      setFormAgentEmail(e.target.value);
                      if (agentFormError) setAgentFormError(null);
                    }}
                    placeholder="nama@company.com"
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PHONE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgentPhone}
                    onChange={handlePhoneChange}
                    placeholder="+62 812-3456-9023"
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 5: FIELD AREA / LOCATION * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  FIELD AREA / LOCATION <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formAgentArea}
                    onChange={(e) => setFormAgentArea(e.target.value)}
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none cursor-pointer appearance-none pr-9 focus:border-blue-500 transition-colors"
                  >
                    <option value="Bekasi Industrial Area">Bekasi Industrial Area</option>
                    <option value="Bekasi">Bekasi</option>
                    <option value="Tanjung Priok Port">Tanjung Priok Port</option>
                    <option value="Tanjung Priok">Tanjung Priok</option>
                    <option value="Cikarang Dry Port">Cikarang Dry Port</option>
                    <option value="MM2100 Cikarang">MM2100 Cikarang</option>
                    <option value="Marunda Cargo Hub">Marunda Cargo Hub</option>
                    <option value="Bandara Soetta">Bandara Soetta</option>
                    <option value="Bandara Halim">Bandara Halim</option>
                    <option value="Karawang">Karawang</option>
                    <option value="Sunda Kelapa">Sunda Kelapa</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Field 6: ACCOUNT STATUS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ACCOUNT STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormAgentStatus('Active')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      formAgentStatus === 'Active'
                        ? 'border-[#2563eb] bg-white shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formAgentStatus === 'Active' ? 'border-[#2563eb] bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formAgentStatus === 'Active' && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">Active</span>
                    </div>
                    <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                      READY
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAgentStatus('Inactive')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      formAgentStatus === 'Inactive'
                        ? 'border-[#2563eb] bg-white shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formAgentStatus === 'Inactive' ? 'border-[#2563eb] bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formAgentStatus === 'Inactive' && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Inactive</span>
                    </div>
                    <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                      STANDBY
                    </span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Auto-synced with HRMS &amp; A3 Field Mobile</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Update Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FIELD AGENT ACCOUNT (Exact Match to Image 1 - No X Button) */}
      {isAddAgentModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddAgentModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[520px] p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header with Title & Subtitle - NO X BUTTON */}
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Create Field Agent Account
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Add a new field worker credential for the A3 mobile application.
              </p>
            </div>

            {agentFormError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                <span>{agentFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddAgent} noValidate className="space-y-4">
              {/* Field 1: AGENT ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    AGENT ID
                  </label>
                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    <Lock size={10} /> Auto-Gen
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={`AGNT-${String(agentAccounts.length + 1).padStart(3, '0')}`}
                    disabled
                    className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none pr-10 cursor-not-allowed font-mono"
                  />
                  <Lock size={14} className="absolute right-3.5 text-slate-400" />
                </div>
              </div>

              {/* Field 2: FULL NAME * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  FULL NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAgentName}
                  onChange={handleNameChange}
                  onKeyDown={handleNameKeyDown}
                  onPaste={handleNamePaste}
                  pattern="[a-zA-Z\s]*"
                  inputMode="text"
                  placeholder="Enter field agent full name..."
                  className={`w-full bg-white border rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-colors ${
                    agentFormError && agentFormError.toLowerCase().includes('name')
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200/90 focus:border-blue-500'
                  }`}
                />
                {agentFormError && agentFormError.toLowerCase().includes('name') && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {agentFormError}
                  </p>
                )}
              </div>

              {/* Fields 3 & 4: EMAIL ADDRESS * & PHONE NUMBER * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL ADDRESS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgentEmail}
                    onChange={(e) => {
                      setFormAgentEmail(e.target.value);
                      if (agentFormError) setAgentFormError(null);
                    }}
                    placeholder="nama@company.com"
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PHONE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgentPhone}
                    onChange={handlePhoneChange}
                    placeholder="+62 812-3456-9023"
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 5: FIELD AREA / LOCATION * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  FIELD AREA / LOCATION <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formAgentArea}
                    onChange={(e) => setFormAgentArea(e.target.value)}
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none cursor-pointer appearance-none pr-9 focus:border-blue-500 transition-colors"
                  >
                    <option value="" disabled>Select operational area (e.g. Bekasi, Cikarang, Priok)...</option>
                    <option value="Bekasi Industrial Area">Bekasi Industrial Area</option>
                    <option value="Bekasi">Bekasi</option>
                    <option value="Tanjung Priok Port">Tanjung Priok Port</option>
                    <option value="Tanjung Priok">Tanjung Priok</option>
                    <option value="Cikarang Dry Port">Cikarang Dry Port</option>
                    <option value="MM2100 Cikarang">MM2100 Cikarang</option>
                    <option value="Marunda Cargo Hub">Marunda Cargo Hub</option>
                    <option value="Bandara Soetta">Bandara Soetta</option>
                    <option value="Bandara Halim">Bandara Halim</option>
                    <option value="Karawang">Karawang</option>
                    <option value="Sunda Kelapa">Sunda Kelapa</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Field 6: ACCOUNT STATUS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ACCOUNT STATUS
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormAgentStatus('Active')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      formAgentStatus === 'Active'
                        ? 'border-[#2563eb] bg-white shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formAgentStatus === 'Active' ? 'border-[#2563eb] bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formAgentStatus === 'Active' && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">Active</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAgentStatus('Inactive')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      formAgentStatus === 'Inactive'
                        ? 'border-[#2563eb] bg-white shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formAgentStatus === 'Inactive' ? 'border-[#2563eb] bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {formAgentStatus === 'Inactive' && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Inactive</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Auto-synced with HRMS &amp; A3 Field Mobile</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddAgentModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Save Agent
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
