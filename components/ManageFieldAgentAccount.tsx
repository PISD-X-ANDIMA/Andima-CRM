'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Briefcase,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  Eye,
  Edit3,
  X,
  Phone,
  Mail,
  MapPin,
  Shield,
  UserCheck,
  UserX,
  Check,
} from 'lucide-react';

export interface FieldAgentAccount {
  id: string;
  name: string;
  employee_id: string;
  role: string;
  phone: string;
  email: string;
  area: string;
  status: 'Active' | 'On Duty' | 'Off Duty';
  active_tasks_count: number;
  completed_tasks_count: number;
  joined_date: string;
}

const INITIAL_ACCOUNTS: FieldAgentAccount[] = [
  {
    id: 'fa-001',
    name: 'Andima WebDev',
    employee_id: 'EMP-FA-001',
    role: 'Senior Field Inspector',
    phone: '0812-8899-0011',
    email: 'webdev@andima.co.id',
    area: 'Tanjung Priok Port',
    status: 'On Duty',
    active_tasks_count: 4,
    completed_tasks_count: 28,
    joined_date: '12-01-2025',
  },
  {
    id: 'fa-002',
    name: 'Andi Pratama',
    employee_id: 'EMP-FA-002',
    role: 'Field Inspector',
    phone: '0813-2233-4455',
    email: 'andi.pratama@andima.co.id',
    area: 'Tanjung Priok Port',
    status: 'On Duty',
    active_tasks_count: 2,
    completed_tasks_count: 19,
    joined_date: '03-03-2025',
  },
  {
    id: 'fa-003',
    name: 'Marsel',
    employee_id: 'EMP-FA-003',
    role: 'Field Inspector',
    phone: '0815-9988-7766',
    email: 'marsel@andima.co.id',
    area: 'Bandara Soekarno-Hatta',
    status: 'Active',
    active_tasks_count: 1,
    completed_tasks_count: 34,
    joined_date: '15-05-2024',
  },
  {
    id: 'fa-004',
    name: 'Choirul',
    employee_id: 'EMP-FA-004',
    role: 'Lead Field Inspector',
    phone: '0819-7766-5544',
    email: 'choirul@andima.co.id',
    area: 'Cikarang Dry Port',
    status: 'On Duty',
    active_tasks_count: 3,
    completed_tasks_count: 42,
    joined_date: '10-02-2024',
  },
  {
    id: 'fa-005',
    name: 'Rizky Pratama',
    employee_id: 'EMP-FA-005',
    role: 'Field Inspector',
    phone: '0817-4455-6677',
    email: 'rizky.pratama@andima.co.id',
    area: 'Depo Marunda',
    status: 'Off Duty',
    active_tasks_count: 0,
    completed_tasks_count: 15,
    joined_date: '01-08-2025',
  },
];

export default function ManageFieldAgentAccount() {
  const [accounts, setAccounts] = useState<FieldAgentAccount[]>(INITIAL_ACCOUNTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedAgent, setSelectedAgent] = useState<FieldAgentAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Agent Form state
  const [newName, setNewName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newRole, setNewRole] = useState('Field Inspector');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newArea, setNewArea] = useState('Tanjung Priok Port');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalCount = accounts.length;
  const activeCount = accounts.filter(a => a.status === 'Active' || a.status === 'On Duty').length;
  const onDutyCount = accounts.filter(a => a.status === 'On Duty').length;
  const offDutyCount = accounts.filter(a => a.status === 'Off Duty').length;

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchArea = areaFilter === 'All' || a.area === areaFilter;

      return matchSearch && matchStatus && matchArea;
    });
  }, [accounts, searchQuery, statusFilter, areaFilter]);

  // Handle Add Agent
  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      showToast('Nama dan nomor telepon wajib diisi.');
      return;
    }

    const created: FieldAgentAccount = {
      id: `fa-${Date.now()}`,
      name: newName.trim(),
      employee_id: newEmployeeId.trim() || `EMP-FA-00${accounts.length + 1}`,
      role: newRole,
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@andima.co.id`,
      area: newArea,
      status: 'Active',
      active_tasks_count: 0,
      completed_tasks_count: 0,
      joined_date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    };

    setAccounts([created, ...accounts]);
    setIsCreateModalOpen(false);
    setNewName('');
    setNewEmployeeId('');
    setNewPhone('');
    setNewEmail('');
    showToast(`Akun agen ${created.name} berhasil ditambahkan!`);
  };

  // Handle Status Toggle
  const handleToggleStatus = (id: string, newStatus: 'Active' | 'On Duty' | 'Off Duty') => {
    setAccounts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
    );
    if (selectedAgent && selectedAgent.id === id) {
      setSelectedAgent(prev => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`Status akun berhasil diubah menjadi "${newStatus}"!`);
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

      {/* TOP SECTION (SHRINK-0) */}
      <div className="shrink-0">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manage Field Agent Account
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal">
              Kelola data profil, status penugasan, dan akun operasional agen lapangan.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Akun Agen</span>
            </button>
            <button
              onClick={() => showToast('Data akun agen lapangan berhasil diperbarui!')}
              title="Refresh Data"
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-2.5">
          {/* Card 1: Total Agen */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Total Agen Lapangan
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {totalCount} Agen
              </div>
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <span>→ Semua agen terdaftar</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50/90 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>

          {/* Card 2: Agen Aktif */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Agen Aktif
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {activeCount} Agen
              </div>
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>✓ Siap bertugas</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50/90 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck size={16} />
            </div>
          </div>

          {/* Card 3: Sedang Bertugas */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Sedang Bertugas
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {onDutyCount} Agen
              </div>
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <Briefcase size={10} className="inline mr-0.5" />
                <span>Di pelabuhan / depo</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50/90 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
          </div>

          {/* Card 4: Off Duty */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-3 flex items-start justify-between dark:bg-[#0f172a] dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 tracking-tight block">
                Off Duty / Cuti
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {offDutyCount} Agen
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>• Istirahat / cuti</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px]">
            <div className="relative w-full bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] px-3.5 py-1.5 flex items-center dark:bg-slate-900 dark:border-slate-800">
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama agen, employee ID, wilayah..."
                className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500 font-normal outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 outline-none"
          >
            <option value="All">Semua Status</option>
            <option value="Active">Active</option>
            <option value="On Duty">On Duty</option>
            <option value="Off Duty">Off Duty</option>
          </select>

          {/* Area Filter Dropdown */}
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 outline-none"
          >
            <option value="All">Semua Wilayah</option>
            <option value="Tanjung Priok Port">Tanjung Priok Port</option>
            <option value="Bandara Soekarno-Hatta">Bandara Soekarno-Hatta</option>
            <option value="Cikarang Dry Port">Cikarang Dry Port</option>
            <option value="Depo Marunda">Depo Marunda</option>
          </select>
        </div>
      </div>

      {/* MAIN DATA TABLE (FLEX-1 MIN-H-0 SCROLLABLE) */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#0f172a] dark:border-slate-800 flex flex-col">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto relative">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead className="sticky top-0 z-10 bg-[#edf4fb] dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-2xs">
              <tr className="text-slate-800 text-xs font-bold dark:text-slate-200">
                <th className="py-3 px-5 text-left pl-6 w-[220px]">Agen Lapangan</th>
                <th className="py-3 px-4 text-left w-[130px]">Employee ID</th>
                <th className="py-3 px-4 text-left w-[180px]">Kontak &amp; Email</th>
                <th className="py-3 px-4 text-center w-[170px]">Wilayah Tugas</th>
                <th className="py-3 px-4 text-center w-[120px]">Status Akun</th>
                <th className="py-3 px-4 text-center w-[110px]">Tugas Aktif</th>
                <th className="py-3 px-4 text-center w-[110px] pr-6">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map(agent => (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Agen Lapangan Info */}
                    <td className="py-3.5 px-5 pl-6 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-xs tracking-tight">
                            {agent.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                            {agent.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3.5 px-4 align-middle">
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                        {agent.employee_id}
                      </span>
                    </td>

                    {/* Kontak & Email */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="text-xs">
                        <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                          <Phone size={11} className="text-slate-400 shrink-0" />
                          <span>{agent.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                          <Mail size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{agent.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Wilayah Tugas */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <MapPin size={10} className="text-blue-500 shrink-0" />
                        {agent.area}
                      </span>
                    </td>

                    {/* Status Akun */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      {agent.status === 'On Duty' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                          On Duty
                        </span>
                      )}
                      {agent.status === 'Active' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                          Active
                        </span>
                      )}
                      {agent.status === 'Off Duty' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Off Duty
                        </span>
                      )}
                    </td>

                    {/* Tugas Aktif */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {agent.active_tasks_count} Task
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center align-middle pr-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setIsDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye size={12} className="text-slate-400 group-hover:text-blue-500" />
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Tidak ada akun agen yang cocok dengan kriteria pencarian &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION (SHRINK-0) */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-xs text-slate-500 dark:text-slate-400">
          <span>Showing 1-{filteredAccounts.length} of {filteredAccounts.length} field agents</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              ‹
            </button>
            <button className="h-7 w-7 rounded-md bg-blue-600 text-white font-semibold flex items-center justify-center">
              1
            </button>
            <button
              disabled
              className="h-7 w-7 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: DETAIL & EDIT AGENT ACCOUNT */}
      {isDetailModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-[#0f172a] dark:border dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Detail Akun Field Agent
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedAgent.employee_id} • {selectedAgent.name}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedAgent.name}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    {selectedAgent.role}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Bergabung sejak {selectedAgent.joined_date}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Status Penugasan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Active', 'On Duty', 'Off Duty'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleStatus(selectedAgent.id, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedAgent.status === st
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Details */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Nomor Telepon / WhatsApp:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAgent.phone}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Email Resmi:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAgent.email}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Wilayah Utama:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAgent.area}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Tugas Aktif Lapangan:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedAgent.active_tasks_count} Jobs</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Tugas Selesai (Riwayat):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAgent.completed_tasks_count} Handover Selesai</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH AKUN FIELD AGENT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-[#0f172a] dark:border dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tambah Akun Field Agent Baru
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftarkan staf inspektur lapangan ke ekosistem CRM operasional.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateAgent} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap Agen *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={newEmployeeId}
                  onChange={e => setNewEmployeeId(e.target.value)}
                  placeholder="Misal: EMP-FA-006 (Opsional/Auto)"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jabatan / Role
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Field Inspector">Field Inspector</option>
                    <option value="Lead Field Inspector">Lead Field Inspector</option>
                    <option value="Senior Field Inspector">Senior Field Inspector</option>
                    <option value="Supervisor Lapangan">Supervisor Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Wilayah Penugasan
                  </label>
                  <select
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Tanjung Priok Port">Tanjung Priok Port</option>
                    <option value="Bandara Soekarno-Hatta">Bandara Soekarno-Hatta</option>
                    <option value="Cikarang Dry Port">Cikarang Dry Port</option>
                    <option value="Depo Marunda">Depo Marunda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Misal: 0812-3456-7890"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Misal: budi.santoso@andima.co.id"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Akun Agen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
