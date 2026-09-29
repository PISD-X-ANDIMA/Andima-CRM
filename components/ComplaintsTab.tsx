import React, { useState } from 'react';
import { Search, AlertTriangle, Clock, MessageCircle, FileText, ChevronRight, Timer, MapPin, X, Zap, Check, ExternalLink } from 'lucide-react';

const alerts = [
  {
    id: 'ESC-PRIOK-942', priority: 'HIGH PRIORITY', priorityC: 'red',
    date: '20 September 2026, 14:15 WIB',
    customer: 'PT DSV TRANSPORT INDONESIA', jobRef: '#AENAT/2605/2551', industry: 'Maritime & Industrial Freight',
    pic: 'Adelia', picInitial: 'A', picInitialC: 'blue', picRole: 'Sales Executive • Surabaya',
    source: 'WhatsApp Chat', sourceBadge: 'Direct Not Forward', sourceBadgeC: 'blue', sourceRef: 'Thread ID: #WA-8819',
    summary: '"Klien meminta konfirmasi penahanan kontainer di Gate 3 Priok sebelum jam 5 sore."',
    riskDetail: 'Risiko demurrage & potensi kargo terlepas ke vessel tanpa inspeksi tambahan jika tidak ditahan dalam 45 menit ke depan.',
    sla: 'Response Target: < 30 mins (Urgent SLA)', slaC: 'red', slaMins: '18 mins left (Target < 30 mnt)',
    action1: 'View Chat History', action2: 'Assist & Respond',
    chat: [
      { sender: 'Bpk. Hendra (Logistics Lead – PT Sinar Logistik)', msg: 'Mbak Adelia, tolong kontainer nomor TCLU-892102-1 di Gate 3 Priok di-hold dulu ya sampai jam 5 sore. Ada revisi dokumen kargo dari principal.', time: '14:02 WIB', type: 'in' },
      { sender: 'Adelia (Sales Executive)', msg: 'Baik Pak Hendra, kami segera koordinasikan dengan tim CS & petugas lapangan Priok sekarang juga. Mohon ditunggu ya Pak.', time: '14:05 WIB', type: 'out' },
      { sender: 'Bpk. Hendra (Logistics Lead)', msg: 'Tolong dipastikan ya mbak, jangan sampai masuk dermaga muat sebelum surat clearance kami kirim jam 16:30.', time: '14:08 WIB', type: 'in' },
    ],
    draft: 'Halo Adelia, tim CS telah menghubungi Didik (Officer Gate 3 Tanjung Priok). Kontainer TCLU-892102-1 telah ditahan di holding zone jalur 3A hingga 17:00 WIB sesuai instruksi Pak Hendra. Silakan beritahu klien bahwa hold status sudah aktif dan dokumen revisi ditunggu sebelum 16:30.',
    checks: ['Kirim notifikasi SMS/WA darurat ke PIC Lapangan Gate 3 (Didik - Priok)', 'Lampirkan instruksi penahanan kontainer ke Audit Log C-Track & Manifest Sistem'],
  },
  {
    id: 'ESC-JKT-1029', priority: 'AVERAGE', priorityC: 'orange',
    date: '19 September 2026, 11:30 WIB',
    customer: 'PT DSV Transport Indonesia', jobRef: 'CUST-JKT-0641', industry: 'Freight Forwarding',
    pic: 'Lidya', picInitial: 'L', picInitialC: 'emerald', picRole: 'Sales Team A • Jakarta',
    source: 'Meeting Minutes', sourceBadge: 'MoM Received', sourceBadgeC: 'emerald', sourceRef: 'Ref: Q3-Sync-DSV',
    summary: '"Permintaan revisi adendum kontrak weekly meeting kuartal depan."',
    riskDetail: 'Potensi miskomunikasi kontrak jika revisi adendum tidak dikonfirmasi sebelum akhir kuartal.',
    sla: 'Response Target: Standard within today (COB)', slaC: 'orange', slaMins: 'Standard COB',
    action1: 'View MoM Attachment', action2: 'Assist & Respond',
    chat: [
      { sender: 'Lidya (Sales Team A)', msg: 'Hi CS, ada permintaan dari DSV untuk revisi adendum kontrak di weekly meeting Q3.', time: '11:30 WIB', type: 'in' },
    ],
    draft: 'Halo Lidya, tim CS sudah menerima permintaan revisi adendum kontrak dari DSV. Akan kami proses dan konfirmasi sebelum COB hari ini.',
    checks: ['Koordinasikan dengan tim Legal untuk review adendum', 'Update status di sistem CRM'],
  },
];

const PriorityBadge = ({ p, c }: any) => (
  <span className={`flex items-center gap-1 text-[10px] font-extrabold tracking-wider ${c === 'red' ? 'text-red-600' : 'text-orange-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${c === 'red' ? 'bg-red-500' : 'bg-orange-400'}`} />
    {p}
  </span>
);

const WorkspaceModal = ({ a, onClose }: any) => {
  const [mode, setMode] = useState(0);
  const modes = [
    { label: 'Catatan Internal', sub: `Ke Sales ${a.pic}`, icon: FileText },
    { label: 'Balas Klien', sub: `Via WhatsApp ${a.sourceRef.split(': ')[1] || 'WA'}`, icon: MessageCircle },
    { label: 'Tim Lapangan', sub: 'Gate 3 Didik Priok', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><Zap size={18} /></div>
            <div>
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900">Workspace Eskalasi & Respon Cepat</h2>
                <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Ticket #{a.id}
                </span>
              </div>
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Progress by CS Budi
              </span>
              <div className="text-[11px] font-medium text-slate-500">Intervensi Bantuan Khusus Customer Success untuk Permintaan Mendesak</div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="border border-red-200 bg-red-50 rounded-xl px-3 py-2 text-center">
              <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-0.5">SLA TARGET</div>
              <div className="flex items-center gap-1 text-xs font-extrabold text-red-700"><Timer size={12} /> {a.slaMins}</div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
          </div>
        </div>

        {/* INFO BAR */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs flex-wrap">
          <span className="text-slate-500">Customer:</span>
          <span className="font-extrabold text-slate-900">{a.customer}</span>
          <span className="font-bold text-blue-600">{a.jobRef}</span>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold text-[10px]">{a.industry}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Sales PIC:</span>
          <span className="font-bold text-slate-800">{a.pic}</span>
          <span className="text-slate-400">({a.picRole})</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* THREAT ANALYSIS */}
          <div className="mx-5 mt-4 mb-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="p-4">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-orange-600 uppercase tracking-wider mb-3">
                  <AlertTriangle size={12} /> Ringkasan Isu / Threat Analysis:
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pesan Utama / Callout Quote:</div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 leading-relaxed italic">{a.summary}</div>
              </div>
              <div className="p-4">
                <button className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline mb-3">
                  <FileText size={12} /> Lihat Worksheet / Job Ref {a.jobRef}(Gate 3 Priok) <ExternalLink size={10} />
                </button>
                <div className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider mb-1.5">Detail Risiko Lapangan:</div>
                <div className="text-xs font-medium text-slate-700 leading-relaxed">{a.riskDetail}</div>
              </div>
            </div>
          </div>

          {/* MAIN 2-COL */}
          <div className="grid grid-cols-2 gap-4 px-5 pb-5">
            {/* LEFT: Chat */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-emerald-700 text-white px-4 py-3">
                <div className="flex items-center gap-2 mb-0.5"><MessageCircle size={14} /><span className="text-sm font-bold">WhatsApp Business Escalation</span></div>
                <div className="text-[10px] text-emerald-200 font-medium">{a.sourceRef} • Direct Forwarding to Desk</div>
              </div>
              <div className="flex-1 p-4 space-y-3 bg-[#f0f2f5] min-h-[220px]">
                <div className="text-center text-[10px] font-bold text-slate-400 mb-2">Hari ini, 20 September 2026</div>
                {a.chat.map((m: any, i: number) => (
                  <div key={i} className={`flex flex-col ${m.type === 'out' ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] font-bold text-slate-500 mb-1">{m.sender}</div>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs font-medium leading-relaxed shadow-sm ${m.type === 'out' ? 'bg-emerald-100 text-emerald-900 rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm'}`}>
                      {m.msg}
                      <div className={`text-[9px] mt-1 ${m.type === 'out' ? 'text-emerald-600 text-right' : 'text-slate-400'}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-200 bg-white flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">Enkripsi end-to-end terhubung ke C-Track Bridge</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 3 Pesan Disinkronkan</span>
              </div>
            </div>

            {/* RIGHT: Response Form */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText size={14} className="text-blue-500" /><span className="text-sm font-bold text-slate-800">Form Aksi Respon & Intervensi CS</span></div>
                <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100">Opsi: Beri Catatan Internal ke Sales</button>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">Pilih Mode Intervensi CS <span className="text-red-500">*</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {modes.map((m, i) => (
                      <button key={i} onClick={() => setMode(i)} className={`border rounded-xl p-2.5 flex flex-col items-center gap-1 text-center transition-colors ${mode === i ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <m.icon size={16} className={mode === i ? 'text-blue-600' : 'text-slate-400'} />
                        <div className={`text-[10px] font-bold leading-tight ${mode === i ? 'text-blue-700' : 'text-slate-700'}`}>{m.label}</div>
                        <div className="text-[9px] text-slate-400 font-medium leading-tight">{m.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Draft Pesan Balasan / Catatan Instruksi CS <span className="text-red-500">*</span></div>
                    <button className="text-[9px] font-bold text-blue-500 hover:underline">Template Intervensi CS Aktif</button>
                  </div>
                  <textarea className="w-full border border-slate-200 rounded-lg p-3 text-[11px] font-medium text-slate-700 leading-relaxed outline-none focus:ring-1 focus:ring-blue-400 resize-none min-h-[100px]" defaultValue={a.draft} />
                </div>
                <div className="space-y-2">
                  {a.checks.map((c: string, i: number) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={10} className="text-white" /></div>
                      <span className="text-[11px] font-medium text-slate-700 leading-snug">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50">Tutup Workstation</button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
            Update & Transfer Back to Sales <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ComplaintsTab() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [workspace, setWorkspace] = useState<any>(null);

  const filters = [
    { id: 'all', label: 'All Alerts (2)' },
    { id: 'high', label: 'High Priority (1)' },
    { id: 'avg', label: 'Average (1)' },
  ];

  const filtered = alerts.filter(a =>
    activeFilter === 'all' ? true :
    activeFilter === 'high' ? a.priorityC === 'red' : a.priorityC === 'orange'
  );

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20">
      {workspace && <WorkspaceModal a={workspace} onClose={() => setWorkspace(null)} />}

      {/* HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-extrabold text-slate-900">Assistance Alert Feed</h1>
            <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 2 Active Alerts
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">Conversation dari Sales yang membutuhkan bantuan Customer Success.</p>
        </div>
        <div className="flex gap-3">
          <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 bg-white shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Timer size={14} /></div>
            <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG. RESOLUTION</div><div className="text-sm font-extrabold text-slate-900">16.4 mins</div></div>
          </div>
          <div className="border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 bg-white shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><MapPin size={14} /></div>
            <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DUTY SHIFT</div><div className="text-sm font-extrabold text-slate-900">Tanjung Priok - S1</div></div>
          </div>
        </div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
          {filters.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${activeFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search alert by Customer, Sales PIC, or keywords..."
            className="w-full border border-slate-200 py-2 pl-8 pr-3 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
        </div>
      </div>

      {/* ALERT CARDS */}
      <div className="space-y-4">
        {filtered.map(a => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-4">
                <PriorityBadge p={a.priority} c={a.priorityC} />
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400"><Clock size={12} /> {a.date}</div>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Ticket #{a.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100 px-5 py-4">
              <div className="pr-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Account</div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500"><FileText size={14} /></div>
                  <div><div className="text-sm font-extrabold text-slate-900 leading-tight">{a.customer}</div><div className="text-[11px] font-semibold text-blue-600 mt-0.5">{a.jobRef}</div></div>
                </div>
              </div>
              <div className="px-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sales Executive PIC</div>
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${a.picInitialC === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>{a.picInitial}</div>
                  <div><div className="text-sm font-extrabold text-slate-900 leading-tight">{a.pic}</div><div className="text-[11px] font-medium text-slate-400 mt-0.5">{a.picRole}</div></div>
                </div>
              </div>
              <div className="pl-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Escalation Source</div>
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${a.sourceBadgeC === 'blue' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center shrink-0`}>
                    {a.sourceBadgeC === 'blue' ? <MessageCircle size={14} /> : <FileText size={14} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900 leading-tight">{a.source}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.sourceBadgeC === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{a.sourceBadge}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">{a.sourceRef}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Executive Summary / Alert Note:</div>
              <div className="text-xs font-semibold text-slate-700 leading-relaxed italic">{a.summary}</div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
              <span className={`flex items-center gap-1.5 text-[11px] font-bold ${a.slaC === 'red' ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200'} border px-3 py-1 rounded-lg`}>
                <AlertTriangle size={11} /> {a.sla}
              </span>
              <div className="flex items-center gap-3">
                <button className="text-xs font-bold text-slate-500 hover:text-slate-700 underline underline-offset-2">{a.action1}</button>
                <button onClick={() => setWorkspace(a)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
                  {a.action2} <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
