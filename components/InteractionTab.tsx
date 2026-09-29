import React, { useState } from 'react';
import { 
  Building2, Calendar, AlertTriangle, ChevronDown, Plus, TrendingUp,
  MapPin, Camera, CheckSquare, Edit3, Image as Img, Map, X, UploadCloud,
  Video, MessageCircle, AlertCircle, Briefcase, Truck, Clock, Box, Image, 
  FileText, User, Check, Info, Download, CircleDot, Circle, Flag, Send
} from 'lucide-react';

const interactions = [
  { id: '1', name: 'PT DSV Transport Indonesia', acc: 'CUST-JKT-0941', src: 'Meeting', srcC: 'purple', date: '20 Sep 2026', ast: 'Yes', astC: 'red', prio: 'High' },
  { id: '2', name: 'PT Sinar Logistik', acc: 'CUST-SBY-0418', src: 'WhatsApp', srcC: 'emerald', date: '19 Sep 2026', ast: 'No', astC: 'slate', prio: '—' }
];

const worksheets = [
  { trx: 'TRX-0526-03382', job: '#AENAT/2605/2551', cust: 'PT DSV TRANSPORT INDONESIA', pic: 'Marsel', picRole: 'Field Inspector', init: 'M', st: 'Normal', stC: 'blue' },
  { trx: 'TRX-0526-03381', job: '#AENAT/2605/0393', cust: 'PT Sinar Logistik', pic: 'Khoirul', picRole: 'Field Inspector', init: 'K', st: 'Kendala Terdeteksi', stC: 'red' }
];

const Badge = ({ t, c, dot, icon: I }: any) => {
  if (t === '—') return <span className="text-slate-400 font-bold">{t}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${c}-50 text-${c}-700 border border-${c}-200`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-${c}-500`} />}
      {I && <I size={12} />}
      {t}
    </span>
  );
};

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

const GridItem = ({ label, value }: any) => (
  <div>
    <div className="text-xs font-semibold text-slate-400 mb-1">{label}</div>
    <div className="text-sm font-extrabold text-slate-900">{value}</div>
  </div>
);

export default function InteractionTab() {
  const [panel, setPanel] = useState<any>(null);

  return (
    <div className="max-w-[1200px] mx-auto w-full pb-20">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { t: 'Total Pelanggan yang Dikelola', v: '24 Akun', i: Building2, d: '+3', d_txt: 'kerja aktif bulan ini', d_i: TrendingUp, c: 'blue' },
          { t: 'Rapat Mendatang', v: '3 Jadwal', i: Calendar, d: 'Hari ini 14:00 WIB', d_txt: 'dengan DSV Transport', d_i: Calendar, c: 'slate' },
          { t: 'Kendala Lapangan Aktif', v: '1 Kendala', i: AlertTriangle, d: 'Memerlukan verifikasi', d_txt: 'di Gerbang 3 Priok', d_i: MapPin, c: 'red', badge: 'Kritis' }
        ].map(s => (
          <div key={s.t} className="bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-semibold text-slate-500 leading-snug max-w-[72%]">{s.t}</span>
              <div className={`w-6 h-6 rounded-md bg-${s.c}-50 text-${s.c}-600 flex items-center justify-center shrink-0`}><s.i size={13} /></div>
            </div>
            <div className="flex items-end gap-2 mb-1.5">
              <div className="text-xl font-extrabold text-slate-900 leading-none">{s.v}</div>
              {s.badge && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold mb-0.5">{s.badge}</span>}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <span className={`flex items-center gap-0.5 font-bold ${s.c === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
                {s.c !== 'slate' && <s.d_i size={11} />} {s.d}
              </span>
              {s.d_txt}
            </div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { l: 'Channel Type:', v: 'All Channels' },
            { l: '', v: 'Today (14 Sep 2026)', i: Calendar },
            { l: 'Status:', v: 'All Statuses' }
          ].map((f, i) => (
            <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              {f.i && <f.i size={12} className="text-slate-500" />}
              {f.l && <span className="text-slate-400">{f.l}</span>}
              <span className="font-bold text-slate-700">{f.v}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
          ))}
        </div>
        <button onClick={() => setPanel('REC')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5">
          <Plus size={14} /> Record Conversation
        </button>
      </div>

      {/* CONVERSATION TABLE */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Conversation</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="border-b border-slate-200">
              <tr>
                {['PELANGGAN', 'SUMBER', 'TANGGAL', 'BUTUH ASISTEN', 'PRIORITAS', 'AKSI'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h !== 'PELANGGAN' && 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interactions.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-xs text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">Acc: {r.acc}</div>
                  </td>
                  <td className="px-4 py-3 text-center"><Badge t={r.src} c={r.srcC} icon={r.src === 'Meeting' ? Video : MessageCircle} /></td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600">{r.date}</td>
                  <td className="px-4 py-3 text-center"><Badge t={r.ast} c={r.astC} dot /></td>
                  <td className="px-4 py-3 text-center"><Badge t={r.prio} c={r.prio === 'High' ? 'red' : 'slate'} icon={r.prio === 'High' ? AlertCircle : null} /></td>
                  <td className="px-4 py-3 text-center"><button onClick={() => setPanel('VIEW')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORKSHEETS TABLE */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Field Agent Tasks & Worksheets <span className="font-normal text-slate-400">(Job Reference Tracing)</span></h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="border-b border-slate-200">
              <tr>
                {['NOMOR TRANSAKSI', 'NOMOR PEKERJAAN', 'NAMA PELANGGAN', 'DIBUAT OLEH / PIC', 'STATUS KENDALA', 'AKSI'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${h === 'STATUS KENDALA' || h === 'AKSI' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {worksheets.map(r => (
                <tr key={r.trx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.trx}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{r.job}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">{r.cust}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">{r.init}</div>
                      <div className="text-xs font-semibold text-slate-700">{r.pic} <span className="text-slate-400 font-normal">({r.picRole})</span></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><Badge t={r.st} c={r.stC} dot /></td>
                  <td className="px-4 py-3 text-center"><button onClick={() => setPanel('AGT')} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md transition-colors shadow-sm">Lihat Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANELS */}
      {panel && <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 ${panel === 'REC' ? 'flex items-center justify-center p-4' : 'flex justify-end'}`}>
        <div className={`bg-white shadow-2xl flex flex-col ${panel === 'REC' ? 'w-full max-w-2xl max-h-[90vh] rounded-2xl' : 'h-full w-full max-w-[600px] animate-in slide-in-from-right'}`}>
          
          {panel === 'REC' ? (
            <>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><MessageCircle size={18}/></div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Rekaman Komunikasi Pelanggan</h2>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">Log WhatsApp threads or meeting documents and declare assistance requirement.</div>
                  </div>
                </div>
                <button onClick={() => setPanel(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0"><X size={18}/></button>
              </div>

              {/* Modal Body — 2 columns */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  {/* Left col */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5"><label className="text-xs font-bold text-slate-700">Select Customer Account <span className="text-red-500">*</span></label><a href="#" className="text-[11px] font-bold text-blue-600 hover:underline">View Account Details</a></div>
                      <div className="relative"><select className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-semibold outline-none appearance-none"><option>PT DSV Transport Indonesia (CUST-JKT-0941)</option></select><ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/></div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Jenis Channel <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border border-blue-500 bg-blue-50/40 text-blue-600 rounded-lg px-3 py-2.5 flex justify-between items-center cursor-pointer"><div className="flex items-center gap-1.5 text-xs font-bold"><MessageCircle size={13}/> WhatsApp (.txt)</div><CircleDot size={13}/></div>
                        <div className="border border-slate-200 text-slate-500 rounded-lg px-3 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50"><div className="flex items-center gap-1.5 text-xs font-bold"><FileText size={13} className="text-slate-400"/> Meeting Document</div><Circle size={13} className="text-slate-300"/></div>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl px-4 py-5 flex flex-col items-center text-center">
                      <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2.5"><UploadCloud size={18}/></div>
                      <div className="text-xs font-extrabold text-slate-700 mb-1">Upload chat export .txt or meeting notes PDF</div>
                      <div className="text-[11px] font-medium text-slate-400 mb-2">Drag & drop here, or <span className="text-slate-600 underline cursor-pointer">Browse files</span></div>
                      <div className="border border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-semibold px-2.5 py-0.5 rounded">Max 15MB • UTF-8 format</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Kesimpulan <span className="text-red-500">*</span></label>
                      <textarea className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 leading-relaxed outline-none focus:border-blue-400 min-h-[80px] resize-none" defaultValue="Diskusi bersama Pak Hendra (DSV) mengenai kepastian jadwal kontainer di Gate 3 Priok. Membutuhkan verifikasi fisik cepat dan pendampingan customs clearance untuk mencegah denda demurrage." />
                    </div>
                  </div>
                  {/* Right col */}
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-1.5">Apakah percakapan ini membutuhkan bantuan (Need Assistance)?</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border border-slate-200 text-slate-500 rounded-lg px-3 py-2.5 flex gap-2 items-center cursor-pointer hover:bg-slate-50"><Circle size={14} className="text-slate-300 shrink-0"/><span className="text-xs font-bold">No (Standard Log)</span></div>
                        <div className="border border-blue-500 bg-blue-50 text-blue-700 rounded-lg px-3 py-2.5 flex gap-2 items-center cursor-pointer"><CircleDot size={14} className="shrink-0"/><span className="text-xs font-bold">Yes (Send Alert)</span></div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block mb-2">Pilih Level Urgensi (Urgency Level)</label>
                      <div className="space-y-2">
                        <div className="border border-red-200 bg-red-50/40 px-3 py-3 rounded-xl flex items-center justify-between cursor-pointer">
                          <div className="flex gap-2.5"><CircleDot size={15} className="text-red-500 shrink-0 mt-0.5"/>
                            <div><div className="flex items-center gap-1.5 mb-0.5"><span className="text-xs font-extrabold text-slate-900">Tingkat Kritis</span><span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">High Priority</span></div><div className="text-[11px] font-medium text-slate-400">For urgent customer escalations or operational blocks</div></div>
                          </div>
                          <span className="text-red-500 font-extrabold text-base ml-2">!</span>
                        </div>
                        <div className="border border-slate-200 px-3 py-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50">
                          <div className="flex gap-2.5"><Circle size={15} className="text-slate-300 shrink-0 mt-0.5"/>
                            <div><div className="flex items-center gap-1.5 mb-0.5"><span className="text-xs font-extrabold text-slate-800">Tingkat Standar</span><span className="text-[10px] font-bold text-orange-600 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded-full">Average</span></div><div className="text-[11px] font-medium text-slate-400">For standard assistance and follow-up support</div></div>
                          </div>
                          <Flag size={14} className="text-orange-400 ml-2"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-2xl">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Auto-synced with C-Track Timeline</div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 rounded-lg text-xs font-bold transition-colors" onClick={() => setPanel(null)}>Batal</button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" onClick={() => setPanel(null)}><Send size={13}/> Simpan</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-900 text-white px-5 py-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">C-TRACK FIELD APP <span className="w-1 h-1 rounded-full bg-slate-600"/> <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Normal</span></div>
                  <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold"><X size={13} /> Close</button>
                </div>
                <h2 className="text-base font-extrabold mb-0.5">Field Agent Worksheet</h2>
                <div className="text-xs text-blue-400 font-bold">#DSVEXP/2605/2551</div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
                <SectionTitle icon={Briefcase} title="JOB INFORMATION" right="ID: #DSVEXP/2605/2551" />
                <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-4">
                  <GridItem label="Job Number" value="#DSVEXP/2605/2551" />
                  <GridItem label="Transaction ID" value="TRX-0526-03382" />
                  <GridItem label="Sales" value="Adelia" />
                  <GridItem label="Created By" value="Marsel" />
                </div>

                <SectionTitle icon={Truck} title="SHIPMENT INFORMATION" />
                <div className="border border-slate-200 rounded-lg p-3 space-y-0.5">
                  <BoxRow label="Customer:" value="PT DSV Transport Indonesia" />
                  <BoxRow label="Shipper:" value="PT Example Shipper" />
                  <BoxRow label="Consignee:" value="PT Example Consignee" />
                  <BoxRow label="MAWB:" value="123-45678901" />
                  <BoxRow label="HAWB:" value="HAWB-00123" blue />
                </div>

                <SectionTitle icon={Clock} title="WAKTU SERAH TERIMA" />
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Calendar size={13} className="text-blue-300" /> Handover Time:</div><div className="text-xs font-extrabold text-slate-900">20 Sep 2026, 10:30</div></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><MapPin size={13} className="text-red-300" /> Handover Location:</div><div className="text-xs font-extrabold text-slate-900">Gate 3 Priok</div></div>
                </div>

                <SectionTitle icon={Box} title="DATA FISIK BARANG" />
                <div className="grid grid-cols-3 gap-2">
                  {[['JUMLAH COIL','12','slate'],['ACTUAL PIECES','12 Pcs','slate'],['GROSS WEIGHT','2,450 Kg','blue']].map(([l,v,c]) => (
                    <div key={l} className="border border-slate-200 bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{l}</div>
                      <div className={`text-sm font-extrabold ${c === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{v}</div>
                    </div>
                  ))}
                </div>

                <SectionTitle icon={Camera} title="FOTO BUKTI LAPANGAN" right={<span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-emerald-200"><Check size={11}/> 4/4 Verified</span>} />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: '1. Foto Keseluruhan', s: 'OK', c: 'emerald' },
                    { l: '2. Marking / Label', s: 'Match', c: 'emerald' },
                    { l: '3. Foto Seal', s: 'Intact', c: 'emerald' },
                    { l: '4. Area Kerusakan', s: 'No damage', c: 'emerald' }
                  ].map((p, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col">
                      <div className="h-20 flex flex-col items-center justify-center text-slate-300 gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-400"><Image size={15} /></div>
                        <div className="text-[9px] font-bold tracking-widest">DSC_041{i}.JPG • 10:32</div>
                      </div>
                      <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-600">{p.l}</span>
                        <span className={`text-[10px] font-extrabold text-${p.c}-600`}>{p.s}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionTitle icon={FileText} title="DOKUMEN PENDUKUNG & NAMA PETUGAS" />
                <div className="space-y-2 mb-3">
                  {[
                    { n: 'Packing List.pdf', s: 'PDF • 1.4 MB • Verified' },
                    { n: 'MSDS.pdf', s: 'PDF • 883 KB • Material Safety Sheet' }
                  ].map(d => (
                    <div key={d.n} className="border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                        <div><div className="text-xs font-extrabold text-slate-900">{d.n}</div><div className="text-[11px] font-semibold text-slate-400 mt-0.5">{d.s}</div></div>
                      </div>
                      <Download size={15} className="text-slate-300" />
                    </div>
                  ))}
                </div>
                <div className="border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 bg-slate-50">
                  <div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENYERAH</div><div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5"><User size={12} className="text-slate-400"/> Budi Santoso</div></div>
                  <div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIHAK PENERIMA</div><div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5"><User size={12} className="text-blue-400"/> Marsel</div></div>
                </div>

                <SectionTitle icon={CheckSquare} title="CHECKLIST CENTANG & STATUS MASALAH" />
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-1">
                    {['Quantity & weight match', 'Visual condition good', 'Safe for flight', 'Document conformity', 'Airline standard conformity'].map(t => (
                      <div key={t} className="flex justify-between items-center px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-600 flex items-center gap-2"><Check size={13} className="text-emerald-500" /> {t}</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Dangerous Goods: <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">NO</span></div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">Special Handling: <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1"><Info size={12} /> YES (Reefer)</span></div>
                  </div>
                </div>

                <SectionTitle icon={Info} title="ISSUE" />
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><Check size={13} /></div>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-900 mb-0.5">No operational issue detected.</div>
                    <div className="text-[11px] font-semibold text-emerald-700/80 leading-relaxed">Seluruh parameter kuantitas, segel, dan fisik kargo telah terverifikasi normal.</div>
                  </div>
                </div>

              </div>

              <div className="px-5 py-4 bg-white border-t border-slate-200 flex gap-3">
                <button className="w-1/3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition-colors" onClick={() => setPanel(null)}>Close Panel</button>
                <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"><Download size={13} /> Export PDF</button>
              </div>
            </>
          )}
        </div>
      </div>}
    </div>
  );
}
