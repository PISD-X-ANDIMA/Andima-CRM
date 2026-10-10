'use client';

import React, { useState } from 'react';
import {
  Search, ChevronDown, Plus, X, Check, AlertTriangle, CheckCircle, FileText, Pencil, Trash2, Lock
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

export default function ManageFieldAgentAccount() {
  const [agentAccounts, setAgentAccounts] = useState<FieldAgentAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('andima_field_agent_accounts');
        if (stored) {
          const parsed: FieldAgentAccount[] = JSON.parse(stored);
          if (parsed.length >= 24 && parsed[0]?.agent_id?.startsWith('AGNT-')) return parsed;
        }
      } catch {}
    }
    return DEFAULT_FIELD_AGENT_ACCOUNTS;
  });

  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  // Modals
  const [editingAgent, setEditingAgent] = useState<FieldAgentAccount | null>(null);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<FieldAgentAccount | null>(null);

  // Form states
  const [formAgentName, setFormAgentName] = useState('');
  const [formAgentEmail, setFormAgentEmail] = useState('');
  const [formAgentPhone, setFormAgentPhone] = useState('');
  const [formAgentArea, setFormAgentArea] = useState('Bekasi Industrial Area');
  const [formAgentStatus, setFormAgentStatus] = useState<'Active' | 'Inactive'>('Active');
  const [agentFormError, setAgentFormError] = useState<string | null>(null);

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
    setFormAgentPhone(agent.phone_number || '');
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
    setFormAgentPhone(''); // Empty, do not prefill
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
    if (!formAgentEmail.trim() || !formAgentEmail.includes('@')) {
      setAgentFormError('Email valid wajib diisi.');
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

  const handleConfirmDeleteAgent = () => {
    if (!agentToDelete) return;
    const updated = agentAccounts.filter(a => a.id !== agentToDelete.id);
    saveAgentAccounts(updated);
    showToast(`Akun Field Agent "${agentToDelete.name}" (${agentToDelete.agent_id}) berhasil dihapus.`);
    setAgentToDelete(null);
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

      {/* TOP BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-semibold mb-3">
        <span className="text-slate-900 font-extrabold tracking-wide text-xs">ANDIMA CRM</span>
        <span className="text-slate-400">CRM /</span>
        <span className="text-[#0d6efd] font-bold">Manage Field Agent Account</span>
      </div>

      {/* TITLE & SUBTITLE */}
      <div className="mb-5">
        <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight leading-tight">
          Manage Field Agent Account
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-1">
          Manage and organize field worker account credentials for the A3 application.
        </p>
      </div>

      {/* MAIN FRAME CONTAINER FOR TABLE & CONTROLS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm mb-8">
        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={agentSearchQuery}
              onChange={(e) => {
                setAgentSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Agent ID, Email, dan Field Agent"
              className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Dropdown: Status */}
            <div className="relative min-w-[120px]">
              <select
                value={agentStatusFilter}
                onChange={(e) => {
                  setAgentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer appearance-none pr-8 shadow-2xs"
              >
                <option value="All">Status</option>
                <option value="Active">✓ Active</option>
                <option value="Inactive">● Inactive</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            {/* Create Agent Button */}
            <button
              type="button"
              onClick={handleOpenAddAgent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Create Agent</span>
            </button>
          </div>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-[#cad8eb] border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[20%]">
                  Agent ID
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[20%]">
                  Field Agent
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[25%]">
                  Email
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[15%]">
                  Field Area
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[10%]">
                  Status
                </th>
                <th className="py-3.5 px-4 text-xs sm:text-sm font-bold text-[#1e293b] text-center w-[10%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {pagedAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada akun Field Agent yang ditemukan.
                  </td>
                </tr>
              ) : (
                pagedAgents.map((agent) => (
                  <tr key={agent.id} className="border-l-4 border-l-transparent hover:border-l-blue-600 hover:bg-blue-50/30 transition-all duration-150">
                    <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight">
                      {agent.agent_id}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-semibold text-slate-800">
                      {agent.name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-normal text-slate-700 font-mono">
                      {agent.email}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs sm:text-sm font-semibold text-slate-800">
                      {agent.field_area}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        agent.status === 'Active'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}>
                        <Check size={11} className={agent.status === 'Active' ? 'text-emerald-600 stroke-[3]' : 'hidden'} />
                        <span>{agent.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAgent(agent)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgentToDelete(agent)}
                          title="Hapus"
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {filteredAgents.length > 0 ? (validPage - 1) * pageSize + 1 : 0}-
            {Math.min(validPage * pageSize, filteredAgents.length)} of {filteredAgents.length} customers
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setPage(Math.max(1, validPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
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
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {agentFormError}
              </div>
            )}

            <form onSubmit={handleSaveEditAgent} className="space-y-4">
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
                  onChange={(e) => setFormAgentName(e.target.value)}
                  placeholder="Enter field agent full name..."
                  className="w-full bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Fields 3 & 4: EMAIL ADDRESS * & PHONE NUMBER * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL ADDRESS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formAgentEmail}
                    onChange={(e) => setFormAgentEmail(e.target.value)}
                    placeholder="agent@andima.co.id"
                    className="w-full bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PHONE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAgentPhone}
                    onChange={(e) => setFormAgentPhone(e.target.value)}
                    placeholder="+62 812-9876-5432"
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
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {agentFormError}
              </div>
            )}

            <form onSubmit={handleSaveAddAgent} className="space-y-4">
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
                  onChange={(e) => setFormAgentName(e.target.value)}
                  placeholder="Enter field agent full name..."
                  className="w-full bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Fields 3 & 4: EMAIL ADDRESS * & PHONE NUMBER * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    EMAIL ADDRESS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formAgentEmail}
                    onChange={(e) => setFormAgentEmail(e.target.value)}
                    placeholder="agent@andima.co.id"
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
                    onChange={(e) => setFormAgentPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
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

      {/* MODAL: DELETE FIELD AGENT CONFIRMATION */}
      {agentToDelete && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setAgentToDelete(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[420px] p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfirmasi Hapus Akun
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Apakah Anda yakin ingin menghapus akun Field Agent <strong className="text-slate-800">{agentToDelete.name}</strong> ({agentToDelete.agent_id})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAgentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAgent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
