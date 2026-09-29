'use client';
import React, { useState } from 'react';
import { Plus, X, MapPin, Package, FileCheck, AlertTriangle, CheckCircle } from 'lucide-react';

const DUMMY_REPORTS = [
  {
    id: 1,
    datetime: '9/28/2026, 8:00:00 AM',
    job_number: 'JOB-2026-001',
    customer: 'Samudra',
    shipper: 'Shipper A',
    gps_lat: -6.1077,
    gps_lng: 106.8810,
    qty: 12,
    doc_conformity: 'Conform',
    packaging: 'Good',
    status: 'NORMAL',
    notes: 'Semua dokumen lengkap. Pengiriman berjalan sesuai jadwal. Kondisi kargo baik.',
    field_agent: 'Rizky Pratama',
    location: 'Tanjung Priok, Jakarta Utara',
  },
  {
    id: 2,
    datetime: '9/27/2026, 1:30:00 PM',
    job_number: 'JOB-2026-004',
    customer: 'Transindo',
    shipper: 'Shipper D',
    gps_lat: -6.1500,
    gps_lng: 106.8900,
    qty: 5,
    doc_conformity: 'Not Conform',
    packaging: 'Damaged',
    status: 'ISSUE',
    notes: 'Dokumen Bill of Lading tidak sesuai. Kemasan rusak pada 2 dari 5 item. Perlu verifikasi ulang dari shipper.',
    field_agent: 'Budi Santoso',
    location: 'Pelabuhan Sunda Kelapa, Jakarta',
  },
];

interface Report {
  id: number;
  datetime: string;
  job_number: string;
  customer: string;
  shipper: string;
  gps_lat: number;
  gps_lng: number;
  qty: number;
  doc_conformity: string;
  packaging: string;
  status: string;
  notes: string;
  field_agent: string;
  location: string;
}

const statusStyle = (s: string) =>
  s === 'NORMAL'
    ? 'border border-slate-300 text-slate-600 bg-white text-[11px] font-bold px-2 py-0.5 rounded'
    : 'border border-slate-800 text-slate-900 bg-white text-[11px] font-bold px-2 py-0.5 rounded';

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
    <div className="text-sm font-semibold text-slate-800">{value}</div>
  </div>
);

function AssignModal({ onClose, onSave }: { onClose: () => void; onSave: (r: Report) => void }) {
  const [form, setForm] = useState({
    datetime: '', job_number: '', customer: '', shipper: '',
    gps_lat: '', gps_lng: '', qty: '', doc_conformity: 'Conform',
    packaging: 'Good', status: 'NORMAL', notes: '', field_agent: '', location: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_number || !form.customer || !form.datetime) return;
    onSave({
      id: Date.now(), datetime: form.datetime, job_number: form.job_number,
      customer: form.customer, shipper: form.shipper,
      gps_lat: parseFloat(form.gps_lat) || 0, gps_lng: parseFloat(form.gps_lng) || 0,
      qty: parseInt(form.qty) || 0, doc_conformity: form.doc_conformity,
      packaging: form.packaging, status: form.status, notes: form.notes,
      field_agent: form.field_agent, location: form.location,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Assign Monitoring Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tambah laporan monitoring lapangan baru</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Date/Time *', key: 'datetime', type: 'datetime-local', req: true },
              { label: 'Job Number *', key: 'job_number', type: 'text', req: true, ph: 'JOB-2026-XXX' },
              { label: 'Customer *', key: 'customer', type: 'text', req: true, ph: 'Nama customer' },
              { label: 'Shipper', key: 'shipper', type: 'text', req: false, ph: 'Nama shipper' },
              { label: 'GPS Latitude', key: 'gps_lat', type: 'number', req: false, ph: '-6.1077' },
              { label: 'GPS Longitude', key: 'gps_lng', type: 'number', req: false, ph: '106.8810' },
              { label: 'Qty', key: 'qty', type: 'number', req: false, ph: '0' },
              { label: 'Field Agent', key: 'field_agent', type: 'text', req: false, ph: 'Nama petugas' },
              { label: 'Lokasi', key: 'location', type: 'text', req: false, ph: 'Nama lokasi' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                <input type={f.type} required={f.req} placeholder={(f as any).ph || ''} value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)} step={f.type === 'number' ? 'any' : undefined}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Doc Conformity</label>
              <select value={form.doc_conformity} onChange={e => set('doc_conformity', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                <option>Conform</option><option>Not Conform</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Packaging</label>
              <select value={form.packaging} onChange={e => set('packaging', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                <option>Good</option><option>Damaged</option><option>Fair</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                <option>NORMAL</option><option>ISSUE</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes / Catatan Lapangan</label>
            <textarea rows={3} placeholder="Catatan situasi lapangan..." value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit as any} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
            <Plus size={13} /> Simpan Laporan
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Detail Monitoring Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">{report.job_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Date/Time" value={report.datetime} />
            <InfoRow label="Job Number" value={report.job_number} />
            <InfoRow label="Customer" value={report.customer} />
            <InfoRow label="Shipper" value={report.shipper || '-'} />
            <InfoRow label="GPS" value={`${report.gps_lat?.toFixed(4)}, ${report.gps_lng?.toFixed(5)}`} />
            <InfoRow label="Qty" value={String(report.qty)} />
            <InfoRow label="Doc Conformity" value={report.doc_conformity} />
            <InfoRow label="Packaging" value={report.packaging} />
            <InfoRow label="Status" value={report.status} />
            <InfoRow label="Field Agent" value={report.field_agent || '-'} />
            <InfoRow label="Lokasi" value={report.location || '-'} />
          </div>
          {report.notes && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Catatan</div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">{report.notes}</div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function MonitoringIssueTab() {
  const [reports, setReports] = useState<Report[]>(DUMMY_REPORTS);
  const [showAssign, setShowAssign] = useState(false);
  const [detail, setDetail] = useState<Report | null>(null);

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20">
      {showAssign && <AssignModal onClose={() => setShowAssign(false)} onSave={r => setReports(p => [r, ...p])} />}
      {detail && <DetailModal report={detail} onClose={() => setDetail(null)} />}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">MONITORING ISSUE</h1>
          <p className="text-xs text-slate-500 mt-0.5">Laporan monitoring lapangan per Job Number</p>
        </div>
        <button onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus size={14} /> Assign Monitoring Report
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Monitoring Reports</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['DATE/TIME','JOB NUMBER','CUSTOMER/SHIPPER','GPS','QTY','DOC CONFORMITY','PACKAGING','STATUS',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{r.datetime}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{r.job_number}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{r.customer} – {r.shipper}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{r.gps_lat?.toFixed(4)}, {r.gps_lng?.toFixed(5)}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 text-center">{r.qty}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {r.doc_conformity === 'Conform' ? <CheckCircle size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-red-500" />}
                      {r.doc_conformity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {r.packaging === 'Good' ? <Package size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-orange-500" />}
                      {r.packaging}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={statusStyle(r.status)}>{r.status}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => setDetail(r)} className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-md transition-colors">Detail</button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-xs text-slate-400">Belum ada laporan monitoring.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-[10px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5"><MapPin size={11} /> GPS direkam otomatis dari perangkat field agent</span>
        <span className="flex items-center gap-1.5"><FileCheck size={11} /> Doc Conformity merujuk kesesuaian dokumen pengiriman</span>
      </div>
    </div>
  );
}
