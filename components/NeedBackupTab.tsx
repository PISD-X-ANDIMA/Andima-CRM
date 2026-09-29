'use client';
import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

// ---- DUMMY DATA ----
interface EskalasiItem {
  id: number;
  date: string;
  job_number: string;
  reason: string;
  current_pic: string;
  escalation_decision: string;
  management_direction: string;
}

interface PengalihanItem {
  id: number;
  date: string;
  job_number: string;
  customer: string;
  from_pic: string;
  to_pic: string;
  reason: string;
  notes: string;
}

const DUMMY_ESKALASI: EskalasiItem[] = [
  {
    id: 1,
    date: '2026-09-20',
    job_number: 'JOB-2026-002',
    reason: 'Tugas belum selesai >1 bulan, dokumen pelabuhan tertunda.',
    current_pic: 'Budi Santoso',
    escalation_decision: 'Eskalasi ke Top Management untuk percepatan dokumen',
    management_direction: 'Assign tim khusus dokumen, deadline 2 minggu',
  },
];

const DUMMY_PENGALIHAN: PengalihanItem[] = [
  {
    id: 1,
    date: '2026-09-25',
    job_number: 'JOB-2026-003',
    customer: 'Nusantara – Shipper C',
    from_pic: 'Siti Rahmawati',
    to_pic: 'Dewi Lestari',
    reason: 'Cuti melahirkan',
    notes: 'Handover dokumen via email',
  },
];

// ---- ESKALASI MODAL ----
function EskalasiModal({ onClose, onSave }: { onClose: () => void; onSave: (item: EskalasiItem) => void }) {
  const [form, setForm] = useState({ date: '', job_number: '', reason: '', current_pic: '', escalation_decision: '', management_direction: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.job_number || !form.reason) return;
    onSave({ id: Date.now(), ...form });
    onClose();
  };

  const fields = [
    { label: 'Tanggal *', key: 'date', type: 'date', req: true, ph: '' },
    { label: 'Job Number *', key: 'job_number', type: 'text', req: true, ph: 'JOB-2026-XXX' },
    { label: 'Current PIC', key: 'current_pic', type: 'text', req: false, ph: 'Nama PIC saat ini' },
    { label: 'Escalation Decision', key: 'escalation_decision', type: 'text', req: false, ph: 'Keputusan eskalasi' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">+ Tambah Eskalasi</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tambah record eskalasi tugas yang belum selesai</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input type={f.type} required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason / Alasan Eskalasi *</label>
            <textarea required rows={3} placeholder="Jelaskan alasan eskalasi..." value={form.reason} onChange={e => set('reason', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Management Direction</label>
            <textarea rows={2} placeholder="Arahan dari manajemen..." value={form.management_direction} onChange={e => set('management_direction', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit as any} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Plus size={13} /> Simpan Eskalasi
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- PENGALIHAN MODAL ----
function PengalihanModal({ onClose, onSave }: { onClose: () => void; onSave: (item: PengalihanItem) => void }) {
  const [form, setForm] = useState({ date: '', job_number: '', customer: '', from_pic: '', to_pic: '', reason: '', notes: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.job_number) return;
    onSave({ id: Date.now(), ...form });
    onClose();
  };

  const fields = [
    { label: 'Tanggal *', key: 'date', type: 'date', req: true, ph: '' },
    { label: 'Job Number *', key: 'job_number', type: 'text', req: true, ph: 'JOB-2026-XXX' },
    { label: 'Customer', key: 'customer', type: 'text', req: false, ph: 'Nama customer – Shipper' },
    { label: 'From PIC', key: 'from_pic', type: 'text', req: false, ph: 'PIC asal' },
    { label: 'To PIC', key: 'to_pic', type: 'text', req: false, ph: 'PIC tujuan' },
    { label: 'Reason', key: 'reason', type: 'text', req: false, ph: 'Alasan pengalihan' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">+ Tambah Pengalihan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tambah record pengalihan penanggung jawab</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input type={f.type} required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes / Catatan</label>
            <textarea rows={3} placeholder="Catatan serah terima..." value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit as any} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Plus size={13} /> Simpan Pengalihan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- ESKALASI SUB-TAB ----
function EskalasiSubTab() {
  const [items, setItems] = useState<EskalasiItem[]>(DUMMY_ESKALASI);
  const [showModal, setShowModal] = useState(false);
  const handleDelete = (id: number) => setItems(p => p.filter(i => i.id !== id));

  return (
    <div>
      {showModal && <EskalasiModal onClose={() => setShowModal(false)} onSave={item => setItems(p => [item, ...p])} />}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus size={14} /> Tambah Eskalasi
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Eskalasi (Tugas &gt;1 Bulan Belum Selesai)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['DATE','JOB NUMBER','REASON','CURRENT PIC','ESCALATION DECISION','MANAGEMENT DIRECTION',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{item.job_number}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{item.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{item.current_pic}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{item.escalation_decision}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{item.management_direction}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada data eskalasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- PENGALIHAN SUB-TAB ----
function PengalihanSubTab() {
  const [items, setItems] = useState<PengalihanItem[]>(DUMMY_PENGALIHAN);
  const [showModal, setShowModal] = useState(false);
  const handleDelete = (id: number) => setItems(p => p.filter(i => i.id !== id));

  return (
    <div>
      {showModal && <PengalihanModal onClose={() => setShowModal(false)} onSave={item => setItems(p => [item, ...p])} />}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus size={14} /> Tambah Pengalihan
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pengalihan Penanggung Jawab</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['DATE','JOB NUMBER','CUSTOMER','FROM PIC','TO PIC','REASON','NOTES',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{item.job_number}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{item.customer}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{item.from_pic}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{item.to_pic}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{item.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{item.notes}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada data pengalihan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- MAIN COMPONENT ----
interface NeedBackupProps {
  initialSub?: 'eskalasi' | 'pengalihan';
  onSubChange?: (sub: 'eskalasi' | 'pengalihan') => void;
}

export default function NeedBackupTab({ initialSub = 'eskalasi', onSubChange }: NeedBackupProps) {
  const [activeSubTab, setActiveSubTab] = useState<'eskalasi' | 'pengalihan'>(initialSub);

  const handleSubChange = (sub: 'eskalasi' | 'pengalihan') => {
    setActiveSubTab(sub);
    onSubChange?.(sub);
  };

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">NEED BACKUP</h1>
        <p className="text-xs text-slate-500 mt-0.5">Eskalasi &amp; pengalihan penanggung jawab</p>
      </div>

      {/* SUB-TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => handleSubChange('eskalasi')}
          className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeSubTab === 'eskalasi'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Eskalasi
        </button>
        <button
          onClick={() => handleSubChange('pengalihan')}
          className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeSubTab === 'pengalihan'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Pengalihan Penanggung Jawab
        </button>
      </div>

      {activeSubTab === 'eskalasi' && <EskalasiSubTab />}
      {activeSubTab === 'pengalihan' && <PengalihanSubTab />}
    </div>
  );
}
