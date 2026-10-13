import React, { useState } from 'react';
import { Calendar, Search, Plus, Clock, MessageSquare, CheckCircle, AlertTriangle, ChevronRight, X, Download, MoreVertical, ChevronDown } from 'lucide-react';

const followUps = [
  { id: 'FLW-042', customerName: 'Sinar Logistik', customerId: 'CUST-JKT-0822', task: 'Confirm complaint resolution', dueDate: 'Today, 14:00 WIB', assignedTo: 'Khoirul Anwar', priority: 'High', status: 'On Progress', assignedInitials: 'KA' },
  { id: 'FLW-043', customerName: 'Nusantara Cargo', customerId: 'CUST-JKT-0941', task: 'Follow-up on quotation', dueDate: 'Tomorrow, 10:00 WIB', assignedTo: 'Marselinus', priority: 'Medium', status: 'Open', assignedInitials: 'M' },
  { id: 'FLW-044', customerName: 'Trisakti Abadi', customerId: 'CUST-SUB-0115', task: 'Request missing document', dueDate: '16 Sep 2026', assignedTo: 'Yemima Saragih', priority: 'Low', status: 'Open', assignedInitials: 'YS' },
  { id: 'FLW-045', customerName: 'Maju Bersama', customerId: 'CUST-MDN-0442', task: 'Schedule quarterly review', dueDate: '17 Sep 2026', assignedTo: 'Imanuella', priority: 'Medium', status: 'Open', assignedInitials: 'I' },
  { id: 'FLW-046', customerName: 'Karya Mandiri', customerId: 'CUST-BDG-0311', task: 'Confirm payment receipt', dueDate: '18 Sep 2026', assignedTo: 'Nathalie', priority: 'High', status: 'Open', assignedInitials: 'N' },
];

const Sel = ({ opts }: { opts: string[] }) => (
  <div className="relative">
    <select className="appearance-none bg-white border border-slate-200 py-2 pl-3 pr-8 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer min-w-[130px]">{opts.map(o => <option key={o}>{o}</option>)}</select>
    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const Th = ({ children, align = 'left', w = '' }: any) => (
  <th className={`py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-${align} ${w} border-b border-slate-200`}>{children}</th>
);

export default function FollowUpTab() {
  const [sel, setSel] = useState<string | null>(null);
  const data = followUps.find(f => f.id === sel);

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-5 gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 mb-0.5">Follow-up Tasks</h1>
          <p className="text-xs font-medium text-slate-500">Track actions that need to be completed</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"><Download size={14} /> Export</button>
          <button className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700"><Plus size={14} /> Add Task</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row mb-4 gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search tasks..." className="w-full border border-slate-200 py-2 pl-9 pr-3 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Sel opts={['Due Date: All', 'Today', 'Upcoming']} />
          <Sel opts={['Status: All', 'Open', 'Closed']} />
          <Sel opts={['Assignee: All', 'Unassigned']} />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white w-full overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-max">
            <thead className="bg-slate-50">
              <tr><Th>CUSTOMER & COMPANY</Th><Th>TASK DESCRIPTION</Th><Th>DEADLINE</Th><Th>ASSIGNED TO</Th><Th align="center">PRIORITY</Th><Th>STATUS</Th><Th align="center" w="w-16">ACTIONS</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followUps.map(i => (
                <tr key={i.id} onClick={() => setSel(sel === i.id ? null : i.id)} className={`cursor-pointer transition-colors ${sel === i.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <td className="py-3.5 px-4"><div className="text-sm font-bold text-slate-900">{i.customerName}</div><div className="text-[11px] text-blue-600 font-semibold mt-0.5">{i.customerId}</div></td>
                  <td className="py-3.5 px-4"><div className="text-xs font-semibold text-slate-700 max-w-xs truncate">{i.task}</div><div className="text-[11px] font-medium text-slate-400 mt-0.5">{i.id}</div></td>
                  <td className="py-3.5 px-4"><div className={`flex items-center gap-1.5 text-xs font-bold ${i.dueDate.includes('Today') ? 'text-red-600' : 'text-slate-600'}`}><Calendar size={13} /> {i.dueDate}</div></td>
                  <td className="py-3.5 px-4"><div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">{i.assignedInitials}</div><span className="text-xs font-semibold text-slate-700">{i.assignedTo}</span></div></td>
                  <td className="py-3.5 px-4 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${i.priority === 'High' ? 'text-red-700 bg-red-50 border-red-200' : i.priority === 'Medium' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>{i.priority}</span></td>
                  <td className="py-3.5 px-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${i.status === 'On Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${i.status === 'On Progress' ? 'bg-blue-500' : 'bg-orange-500'}`} />{i.status}</span></td>
                  <td className="py-3.5 px-4 text-center"><button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><MoreVertical size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="text-xs font-medium text-slate-500">Showing 1–5 of <span className="font-bold text-slate-700">5</span></div>
          <div className="flex gap-1.5">
            <button className="p-1.5 border border-slate-200 rounded-lg bg-white opacity-50"><ChevronRight size={14} className="rotate-180" /></button>
            <button className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</button>
            <button className="p-1.5 border border-slate-200 rounded-lg bg-white opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSel(null)} />
          <div className="fixed top-0 right-0 w-full max-w-sm bg-white h-full shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
            <div className="bg-slate-900 text-white px-5 py-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-sm font-bold flex gap-2 items-center"><CheckCircle size={16} className="text-emerald-400" /> Follow-up Task <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] tracking-wider">{data.id}</span></h2>
                <button onClick={() => setSel(null)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="text-xs text-slate-400 flex justify-between items-center">
                <span className="font-semibold text-slate-300">{data.customerName}</span>
                <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{data.status}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <div><div className="text-xs font-bold text-orange-800 mb-0.5">SLA Warning</div><div className="text-[11px] font-medium text-orange-700">Task due in 3 hours. <a href="#" className="underline font-bold">#AENAT/2609/0305</a></div></div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Terkait Interaksi</div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm"><MessageSquare size={16} className="text-slate-400" /></div>
                    <div><div className="text-xs font-bold text-slate-900">Delivery discussion</div><div className="text-[11px] font-medium text-slate-400 mt-0.5">14 Sep 2026</div></div>
                  </div>
                  <a href="#" className="text-indigo-600 text-[11px] font-bold hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg">Lihat Detail</a>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Target</h3>
                <div className="flex gap-3">
                  <div className="flex-1 border border-slate-200 p-4 rounded-xl bg-white shadow-sm"><div className="text-[10px] font-bold text-slate-400 mb-1">Tanggal</div><div className="text-sm font-extrabold text-slate-900">15 Sep 2026</div></div>
                  <div className="flex-1 border border-slate-200 p-4 rounded-xl bg-white shadow-sm"><div className="text-[10px] font-bold text-slate-400 mb-1">Waktu</div><div className="text-sm font-extrabold text-slate-900">14:00 WIB</div></div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Task Notes</h3>
                <textarea className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-700 min-h-[96px] outline-none focus:ring-1 focus:ring-blue-400 resize-none" defaultValue="Follow-up kesepakatan tarif pengiriman kontainer..." />
              </div>
            </div>
            <div className="border-t border-slate-200 p-4 flex gap-3 bg-white">
              <button className="border border-slate-200 px-5 py-2.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50">Save Draft</button>
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"><CheckCircle size={14} /> Mark as Closed</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
