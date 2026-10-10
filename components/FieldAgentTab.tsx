'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Plus, X, Trash2, Loader2,
  Briefcase, Truck, Clock, Box, Camera, FileText, User,
  CheckSquare, Check, Info, Download, AlertTriangle, Image,
  MapPin, ShieldAlert
} from 'lucide-react';
import {
  fetchApiWorksheets,
  fetchApiWorksheetDetail,
  WorksheetItem,
} from '../backend/record_conversation';

// --- Shared Helpers ---

const colorMap: Record<string, string> = {
  red:   'bg-red-50 text-red-700 border-red-200',
  blue:  'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};
const dotColorMap: Record<string, string> = {
  red:  'bg-red-500',
  blue: 'bg-blue-500',
};

const Badge = ({ t, c, dot }: { t: string; c: string; dot?: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorMap[c] || colorMap.slate}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[c] || 'bg-slate-400'}`} />}
    {t}
  </span>
);

const SectionTitle = ({ icon: I, title, right }: any) => (
  <div className="flex justify-between items-center mb-3 mt-8 first:mt-0">
    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
      <I size={16} className="text-blue-600" /> {title}
    </div>
    {right && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{right}</div>}
  </div>
);

const BoxRow = ({ label, value, blue }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-semibold text-slate-400">{label}</span>
    <span className={`text-sm font-extrabold ${blue ? 'text-blue-600' : 'text-slate-900'}`}>{value}</span>
  </div>
);

const GridItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs font-semibold text-slate-400 mb-1">{label}</div>
    <div className="text-sm font-extrabold text-slate-900">{value}</div>
  </div>
);

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '20 Sep 2026, 10:30';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return dateStr; }
}

// --- Eskalasi Types & Data ---

interface EskalasiItem {
  id: number;
  date: string;
  job_number: string;
  reason: string;
  current_pic: string;
  escalation_decision: string;
  management_direction: string;
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

// --- Eskalasi Modal ---

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

// --- Eskalasi Sub-Tab ---

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
                <tr key={item.id} className="border-l-4 border-l-transparent hover:border-l-blue-600 hover:bg-blue-50/30 transition-all duration-150">
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

// --- Worksheet Panel (AGT Slide-over) ---

function WorksheetPanel({ worksheetId, onClose }: { worksheetId: number; onClose: () => void }) {
  const [data, setData] = useState<WorksheetItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchApiWorksheetDetail(worksheetId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [worksheetId]);

  const isIssue = data?.status_kendala === 'kendala_terdeteksi' || data?.has_issue;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="printable-modal-card bg-white h-full w-full max-w-[600px] flex flex-col animate-in slide-in-from-right shadow-2xl">
        <div className="printable-header bg-slate-900 text-white px-5 py-4 shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">
              C-TRACK FIELD APP <span className="w-1 h-1 rounded-full bg-slate-600" />
              {isIssue ? (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Kendala Terdeteksi
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Normal
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold">
              <X size={13} /> Close
            </button>
          </div>
          <h2 className="text-base font-extrabold mb-0.5">Field Agent Worksheet</h2>
          <div className="text-xs text-blue-400 font-bold">#{data?.job_no || '...'}</div>
        </div>

        <div className="printable-body flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <Loader2 size={24} className="animate-spin inline mr-2 text-blue-500" />
              <div>Memuat data detail worksheet...</div>
            </div>
          ) : data ? (
            <>
              <SectionTitle icon={Briefcase} title="JOB INFORMATION" right={`ID: #${data.job_no}`} />
              <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-4">
                <GridItem label="Job Number" value={`#${data.job_no}`} />
                <GridItem label="Transaction ID" value={data.transaction_no} />
                <GridItem label="Sales" value={data.sales_pic_name || 'Adelia'} />
                <GridItem label="Created By" value={data.field_agent_name || 'Marsel'} />
              </div>

              <SectionTitle icon={Truck} title="SHIPMENT INFORMATION" />
              <div className="border border-slate-200 rounded-lg p-3 space-y-0.5">
                <BoxRow label="Customer:" value={data.company_name || 'PT DSV Transport Indonesia'} />
                <BoxRow label="Shipper:" value={data.shipper || 'PT Example Shipper'} />
                <BoxRow label="Consignee:" value={data.consignee || 'PT Example Consignee'} />
                <BoxRow label="MAWB:" value={data.mawb || '123-45678901'} />
                <BoxRow label="HAWB:" value={data.hawb || 'HAWB-00123'} blue />
              </div>

              <SectionTitle icon={Clock} title="WAKTU SERAH TERIMA" />
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock size={13} className="text-blue-300" /> Handover Time:
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">{formatDateTime(data.handover_datetime)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MapPin size={13} className="text-red-300" /> Handover Location:
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">{data.handover_location || 'Gate 3 Priok'}</div>
                </div>
              </div>

              <SectionTitle icon={Box} title="DATA FISIK BARANG" />
              <div className="grid grid-cols-3 gap-2">
                {(data.physical_items && data.physical_items.length > 0
                  ? data.physical_items.map((pi: any) => ({ l: pi.item_label, v: `${pi.item_value} ${pi.item_unit || ''}`, c: 'slate' }))
                  : [{ l: 'JUMLAH COIL', v: '12', c: 'slate' }, { l: 'ACTUAL PIECES', v: '12 Pcs', c: 'slate' }, { l: 'GROSS WEIGHT', v: '2,450 Kg', c: 'blue' }]
                ).map(({ l, v, c }: any) => (
                  <div key={l} className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{l}</div>
                    <div className={`text-sm font-extrabold ${c === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{v}</div>
                  </div>
                ))}
              </div>

              <SectionTitle
                icon={Camera}
                title="FOTO BUKTI LAPANGAN"
                right={
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-emerald-200">
                    <Check size={11} /> {data.photos?.filter((p: any) => p.is_verified).length || 4}/{data.photos?.length || 4} Verified
                  </span>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {(data.photos && data.photos.length > 0
                  ? data.photos.map((p: any, i: number) => ({ l: p.photo_label, s: p.photo_status || 'OK', i }))
                  : [{ l: '1. Foto Keseluruhan', s: 'OK', i: 0 }, { l: '2. Marking / Label', s: 'Match', i: 1 }, { l: '3. Foto Seal', s: 'Intact', i: 2 }, { l: '4. Area Kerusakan', s: 'No damage', i: 3 }]
                ).map((p: any) => (
                  <div key={p.l} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                    <div className="h-20 flex flex-col items-center justify-center text-slate-300 gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-400"><Image size={15} /></div>
                      <div className="text-[9px] font-bold tracking-widest">DSC_041{p.i}.JPG</div>
                    </div>
                    <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-600">{p.l}</span>
                      <span className="text-[10px] font-extrabold text-emerald-600">{p.s}</span>
                    </div>
                  </div>
                ))}
              </div>

              <SectionTitle icon={FileText} title="DOKUMEN PENDUKUNG & NAMA PETUGAS" />
              <div className="space-y-2 mb-3">
                {(data.documents && data.documents.length > 0
                  ? data.documents.map((d: any) => ({ n: d.doc_name, s: `${d.doc_type} • ${d.file_size_kb ? d.file_size_kb + ' KB' : '1.2 MB'} • ${d.doc_description || 'Verified'}`, url: d.doc_url }))
                  : [{ n: 'Packing List.pdf', s: 'PDF - 1.4 MB - Verified', url: '#' }, { n: 'MSDS.pdf', s: 'PDF - 883 KB - Material Safety Sheet', url: '#' }]
                ).map((d: any) => (
                  <div key={d.n} className="border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{d.n}</div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{d.s}</div>
                      </div>
                    </div>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600"><Download size={15} /></a>
                  </div>
                ))}
              </div>
              <div className="border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 bg-slate-50">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENYERAH</div>
                  <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" /> {data.pihak_penyerah || 'Budi Santoso'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENERIMA</div>
                  <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <User size={12} className="text-blue-400" /> {data.pihak_penerima || data.field_agent_name || 'Marsel'}
                  </div>
                </div>
              </div>

              <SectionTitle icon={CheckSquare} title="CHECKLIST CENTANG & STATUS MASALAH" />
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-1">
                  {(data.checklists && data.checklists.length > 0
                    ? data.checklists.map((c: any) => c.check_label)
                    : ['Quantity & weight match', 'Visual condition good', 'Safe for flight', 'Document conformity', 'Airline standard conformity']
                  ).map((t: string) => (
                    <div key={t} className="flex justify-between items-center px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-600 flex items-center gap-2"><Check size={13} className="text-emerald-500" /> {t}</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    Dangerous Goods: <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">{data.is_dangerous_goods ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    Special Handling: <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1"><Info size={12} /> {data.special_handling || 'YES (Reefer)'}</span>
                  </div>
                </div>
              </div>

              <SectionTitle icon={Info} title="ISSUE" />
              {isIssue ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={13} /></div>
                  <div>
                    <div className="text-xs font-extrabold text-red-900 mb-0.5">Kendala Operasional Terdeteksi</div>
                    <div className="text-[11px] font-semibold text-red-700/90 leading-relaxed">
                      {data.issue_note || 'Peti kemas tertahan pemeriksaan verifikasi di Gerbang 3 Priok.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={13} /></div>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-900 mb-0.5">No operational issue detected.</div>
                    <div className="text-[11px] font-semibold text-emerald-700/80 leading-relaxed">Seluruh parameter kuantitas, segel, dan fisik kargo telah terverifikasi normal.</div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="printable-footer px-5 py-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
          <button className="w-1/3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors" onClick={onClose}>
            Close Panel
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Worksheets Sub-Tab ---

function WorksheetsSubTab() {
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsPage, setWsPage] = useState(1);
  const [wsTotal, setWsTotal] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(null);

  const PER_PAGE = 8;
  const wsTotalPages = Math.max(1, Math.ceil(wsTotal / PER_PAGE));

  useEffect(() => {
    setLoading(true);
    fetchApiWorksheets({ page: wsPage, limit: PER_PAGE })
      .then(res => { setWorksheets(res.data); setWsTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wsPage]);

  return (
    <div>
      {activeId && <WorksheetPanel worksheetId={activeId} onClose={() => setActiveId(null)} />}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="border-b border-slate-200">
              <tr>
                {['NOMOR TRANSAKSI', 'NOMOR PEKERJAAN', 'NAMA PELANGGAN', 'DIBUAT OLEH / PIC', 'STATUS KENDALA', 'AKSI'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'STATUS KENDALA' || h === 'AKSI' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                    <Loader2 size={16} className="animate-spin inline mr-2 text-blue-500" /> Memuat data tugas lapangan...
                  </td>
                </tr>
              ) : worksheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">Belum ada lembar kerja lapangan.</td>
                </tr>
              ) : (
                worksheets.map(r => {
                  const isIssue = r.status_kendala === 'kendala_terdeteksi' || r.has_issue;
                  return (
                    <tr key={r.worksheet_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.transaction_no}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600">#{r.job_no}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.company_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {r.field_agent_initials || 'M'}
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            {r.field_agent_name} <span className="text-slate-400 font-normal">({r.field_agent_role || 'Field Inspector'})</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge t={isIssue ? 'Kendala Terdeteksi' : 'Normal'} c={isIssue ? 'red' : 'blue'} dot />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setActiveId(r.worksheet_id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md transition-colors shadow-sm"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-xl">
          <div className="text-xs font-medium text-slate-500">
            Showing {wsTotal === 0 ? 0 : (wsPage - 1) * PER_PAGE + 1}-{Math.min(wsPage * PER_PAGE, wsTotal)} of <span className="font-bold text-slate-700">{wsTotal}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <button disabled={wsPage <= 1} onClick={() => setWsPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">
              <ChevronRight size={14} className="rotate-180 text-slate-600" />
            </button>
            {Array.from({ length: wsTotalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setWsPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${p === wsPage ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
            <button disabled={wsPage >= wsTotalPages} onClick={() => setWsPage(p => Math.min(wsTotalPages, p + 1))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed">
              <ChevronRight size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---

type SubTab = 'worksheets' | 'eskalasi';

interface FieldAgentTabProps {
  initialSub?: SubTab;
  onSubChange?: (sub: SubTab) => void;
}

export default function FieldAgentTab({ initialSub = 'worksheets', onSubChange }: FieldAgentTabProps) {
  const [active, setActive] = useState<SubTab>(initialSub);

  const handleChange = (sub: SubTab) => {
    setActive(sub);
    onSubChange?.(sub);
  };

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">FIELD AGENT</h1>
        <p className="text-xs text-slate-500 mt-0.5">Tasks & Worksheets · Eskalasi Tugas Lapangan</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: 'worksheets' as SubTab, label: 'Tasks & Worksheets' },
          { id: 'eskalasi' as SubTab, label: 'Eskalasi' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => handleChange(t.id)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
              active === t.id
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'worksheets' && <WorksheetsSubTab />}
      {active === 'eskalasi' && <EskalasiSubTab />}
    </div>
  );
}
