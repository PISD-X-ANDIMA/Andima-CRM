'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  Search,
  TrendingUp,
} from 'lucide-react';

export interface DashboardJobItem {
  id: string;
  conversation_id: string;
  job_number: string;
  customer: string;
  pic: string;
  route: string;
  channel?: 'Meeting' | 'WhatsApp' | 'Phone' | 'Email';
  date: string;
  status: 'Completed' | 'Has Issue';
}

export const DEFAULT_DASHBOARD_ITEMS: DashboardJobItem[] = [
  {
    id: '1',
    conversation_id: 'CONV-56750',
    job_number: '#AINAT01',
    customer: 'PT Indofood CBP',
    pic: 'PIC: Bu Wulan',
    route: 'Cengkareng — SOP',
    channel: 'Meeting',
    date: '03/03/2026',
    status: 'Completed',
  },
  {
    id: '2',
    conversation_id: 'CONV-56751',
    job_number: '#AINAT02',
    customer: 'PT Astra Otoparts',
    pic: 'PIC: Bu Wulan',
    route: 'Tg Perak — Tokyo',
    channel: 'Meeting',
    date: '03/03/2026',
    status: 'Completed',
  },
  {
    id: '3',
    conversation_id: 'CONV-56752',
    job_number: '#AINAT03',
    customer: 'PT Kalbe Farma',
    pic: 'PIC: Bu Wulan',
    route: 'Cengkareng — KL',
    channel: 'WhatsApp',
    date: '03/03/2026',
    status: 'Has Issue',
  },
  {
    id: '4',
    conversation_id: 'CONV-56753',
    job_number: '#AINAT04',
    customer: 'PT Samsung Electronics',
    pic: 'PIC: Bu Wulan',
    route: 'Tg Mas — Jakarta',
    channel: 'WhatsApp',
    date: '03/03/2026',
    status: 'Completed',
  },
  {
    id: '5',
    conversation_id: 'CONV-56754',
    job_number: '#AINAT05',
    customer: 'PT Bio Farma',
    pic: 'PIC: Bu Wulan',
    route: 'Cengkareng — MKS',
    channel: 'WhatsApp',
    date: '03/03/2026',
    status: 'Has Issue',
  },
];

interface FieldAgentDashboardProps {
  jobs?: any[];
  onOpenJob?: (job: any) => void;
  onShowTasks?: () => void;
}

export default function FieldAgentDashboard({
  jobs = [],
  onOpenJob,
  onShowTasks,
}: FieldAgentDashboardProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const displayItems = useMemo<DashboardJobItem[]>(() => {
    if (!jobs || jobs.length === 0) {
      return DEFAULT_DASHBOARD_ITEMS;
    }

    return jobs.map((j: any, idx: number) => {
      const fallback = DEFAULT_DASHBOARD_ITEMS[idx % DEFAULT_DASHBOARD_ITEMS.length];
      const convId = j.transaction_number?.startsWith('CONV-')
        ? j.transaction_number
        : `CONV-${56750 + idx}`;
      const jobNo = j.job_number?.startsWith('#')
        ? j.job_number
        : `#${j.job_number || 'AINAT0' + (idx + 1)}`;
      const customer = j.customer || fallback.customer;
      const pic = j.sales_executive ? `PIC: ${j.sales_executive}` : fallback.pic;
      const route = j.origin && j.destination
        ? `${j.origin} — ${j.destination}`
        : fallback.route;
      const isIssue = j.status === 'Has Issue' || Boolean(j.has_issue);
      const status: 'Completed' | 'Has Issue' = isIssue ? 'Has Issue' : 'Completed';
      const channel: 'Meeting' | 'WhatsApp' = idx < 2 ? 'Meeting' : 'WhatsApp';
      const date = j.date && j.date !== '-'
        ? (j.date.includes(',') ? j.date.split(',')[0].trim() : j.date)
        : '03/03/2026';

      return {
        id: j.id || String(idx + 1),
        conversation_id: convId,
        job_number: jobNo,
        customer,
        pic,
        route,
        channel,
        date,
        status,
      };
    });
  }, [jobs]);

  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = item.customer.toLowerCase().includes(q);
        const matchJobNo = item.job_number.toLowerCase().includes(q);
        const matchConv = item.conversation_id.toLowerCase().includes(q);
        const matchPic = item.pic.toLowerCase().includes(q);
        const matchRoute = item.route.toLowerCase().includes(q);
        if (!matchCustomer && !matchJobNo && !matchConv && !matchPic && !matchRoute) {
          return false;
        }
      }

      // 2. Period Filter
      return true;
    });
  }, [displayItems, searchQuery, periodFilter]);

  const totalTasks = displayItems.length;
  const completedCount = displayItems.filter((j) => j.status === 'Completed').length;
  const issueCount = displayItems.filter((j) => j.status === 'Has Issue').length;
  const completedPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 60;
  const issuePct = totalTasks > 0 ? Math.round((issueCount / totalTasks) * 100) : 40;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedJobs = filteredItems.slice(startIndex, startIndex + itemsPerPage);
  const showingRangeText = filteredItems.length > 0
    ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredItems.length)}`
    : '0';

  const handleOpenJobItem = (item: DashboardJobItem) => {
    if (onOpenJob) {
      const found = jobs.find((j: any) => j.id === item.id || j.job_number === item.job_number);
      if (found) {
        onOpenJob(found);
      } else {
        onOpenJob({
          id: item.id,
          job_number: item.job_number.replace(/^#/, ''),
          transaction_number: item.conversation_id,
          task_title: `Cargo Inspection - ${item.job_number}`,
          customer: item.customer,
          sales_executive: item.pic.replace(/^PIC:\s*/, ''),
          shipper: item.customer,
          consignee: 'PT Andima Transportindo',
          origin: item.route.split('—')[0]?.trim() || 'Cengkareng',
          destination: item.route.split('—')[1]?.trim() || 'SOP',
          location: item.route,
          status: item.status,
          has_issue: item.status === 'Has Issue',
          date: item.date,
          field_stage: item.status === 'Completed' ? 'Completed' : 'In Progress',
        });
      }
    } else {
      router.push(`/dashboard/field-agent?tab=tasks&search=${encodeURIComponent(item.job_number.replace(/^#/, ''))}`);
    }
  };

  const handleTasksClick = () => {
    if (onShowTasks) {
      onShowTasks();
    } else {
      router.push('/dashboard/field-agent?tab=tasks');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 pb-8">
      {/* Title Header */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Field Agent Dashboard
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Selamat datang di modul operasional lapangan. Kelola tugas worksheet, koordinasi rute logistik, dan laporan kunjungan Anda di sini.
        </p>
      </section>

      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Task Selesai */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Total Task Selesai
              </span>
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalTasks}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                tugas tercatat
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500">Worksheet Aktif</span>
            <button
              type="button"
              onClick={handleTasksClick}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Detail task</span>
              <span>&rarr;</span>
            </button>
          </div>
        </section>

        {/* Card 2: Completed (Tuntas) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Completed (Tuntas)
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check size={16} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {completedPct}% keberhasilan
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500">Kunjungan Tuntas</span>
            <button
              type="button"
              onClick={() => router.push('/dashboard/field-agent?tab=history')}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Lihat laporan</span>
              <span>&rarr;</span>
            </button>
          </div>
        </section>

        {/* Card 3: Has Issue (Perlu Tindak Lanjut) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Has Issue (Perlu Tindak Lanjut)
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-500 dark:text-rose-400">
                {issueCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {issuePct}% butuh eskalasi
              </span>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500">Perlu Tindak Lanjut</span>
            <button
              type="button"
              onClick={() => router.push('/dashboard/need-backup')}
              className="text-rose-500 dark:text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Eskalasi tim</span>
              <span>&rarr;</span>
            </button>
          </div>
        </section>
      </div>

      {/* 2. FILTER TOOLBAR (Without Input New Task Button) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Employee's Name or Job Number..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 shadow-2xs transition-colors"
          />
        </div>


        {/* Periods */}
        <div className="relative">
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl py-2 px-3.5 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <option value="All">All Periods</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 3. MAIN SECTION: PROPORSI STATUS PEKERJAAN & RECENT JOBS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6">
        {/* SISI KIRI (Col 4): PROPORSI STATUS PEKERJAAN */}
        <section className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-700 dark:border-slate-300" />
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Proporsi Status Pekerjaan
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ringkasan status tugas operasional
                </p>
              </div>

              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                2 Status Aktif
              </span>
            </div>

            {/* Donut Chart */}
            <div className="mt-6 flex flex-col items-center">
              <div
                className="relative grid h-[180px] w-[180px] shrink-0 place-items-center rounded-full shadow-2xs"
                style={{
                  background: `conic-gradient(#10b981 0% ${completedPct}%, #f43f5e ${completedPct}% 100%)`,
                }}
                aria-label="Grafik proporsi status task"
              >
                <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-white dark:bg-[#0f172a] text-center shadow-inner">
                  <div>
                    <b className="block text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {totalTasks}
                    </b>
                    <span className="mt-1 block text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                      TOTAL TASK
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges / Legend below chart */}
              <div className="mt-6 w-full grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#10b981] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">Completed</span>
                  </div>
                  <span className="font-bold text-[#10b981] text-[11px]">
                    {completedCount} ({completedPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#f43f5e] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">Has issue</span>
                  </div>
                  <span className="font-bold text-[#f43f5e] text-[11px]">
                    {issueCount} ({issuePct}%)
                  </span>
                </div>
              </div>

              {/* Progress: Tingkat Keberhasilan */}
              <div className="mt-5 w-full">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <TrendingUp size={13} className="text-slate-500" />
                    <span>Tingkat Keberhasilan</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {completedPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  <div className="bg-[#10b981] h-full transition-all duration-300" style={{ width: `${completedPct}%` }} />
                  <div className="bg-[#f43f5e] h-full transition-all duration-300" style={{ width: `${issuePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer of Left Card */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tuntas Normal: <strong className="font-bold text-slate-800 dark:text-slate-100">{completedCount}</strong>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Petugas: <strong className="font-bold text-slate-800 dark:text-slate-100">Budi P (Squad A3)</strong>
              </p>
            </div>
            <div className="text-right flex flex-col justify-between items-end">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Isu Logistik: <strong className="font-bold text-rose-500 dark:text-rose-400">{issueCount}</strong>
              </p>
              <button
                type="button"
                onClick={handleTasksClick}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Detail Rekap</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </section>

        {/* SISI KANAN (Col 8): RECENT JOBS TABLE */}
        <section className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-xs">
          <div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Recent Jobs (Tugas Terbaru)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tugas dialokasikan dari tim CRM • Klik salah satu baris tugas untuk melihat rincian aktivitas lapangan.
              </p>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-[#edf4fb] dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Conversation ID</th>
                    <th className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Job Number</th>
                    <th className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-200">Company / Customer</th>
                    <th className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Date</th>
                    <th className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-200 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Tidak ada tugas yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    pagedJobs.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-3.5 py-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {item.conversation_id}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenJobItem(item)}
                            className="cursor-pointer hover:underline text-left font-bold"
                          >
                            {item.job_number}
                          </button>
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{item.customer}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.pic} • {item.route}
                          </p>
                        </td>
                        <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {item.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50 px-2.5 py-0.5 text-[11px] font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50 px-2.5 py-0.5 text-[11px] font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>Has Issue</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination Footer */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Showing {showingRangeText} of {filteredItems.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-7 w-7 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
