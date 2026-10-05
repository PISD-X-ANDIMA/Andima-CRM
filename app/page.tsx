"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Box, Camera, CheckCircle2, FileText, LayoutDashboard, 
  MapPin, PackageCheck, Search, Users, ArrowLeft, 
  CheckCircle, ChevronUp, ChevronRight, Monitor, Settings, PhoneCall,
  ImagePlus, Plus, X, ClipboardList, Clock3, CircleAlert, CircleCheckBig
} from "lucide-react";

type Status = "Draft" | "In Progress" | "Completed" | "Has Issue";
type View = "dashboard" | "list" | "detail" | "history";

type Job = {
  id: string;
  job_number?: string;
  customer: string;
  mawb: string;
  location: string;
  date: string;
  status: Status;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // State untuk Navigasi Halaman Utama & Detail
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // State untuk Tab di dalam halaman Job Detail
  const [activeDetailTab, setActiveDetailTab] = useState<string>("Overview");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [issueSaved, setIssueSaved] = useState<boolean>(false);
  const [isSavingIssue, setIsSavingIssue] = useState<boolean>(false);
  const [issueError, setIssueError] = useState<string>("");
  const [issueCategory, setIssueCategory] = useState<string>("Damaged Package");
  const [issueDescription, setIssueDescription] = useState<string>("The package is damaged on the left side.");

  // State untuk toggle Sidebar Menu
  const [isCrmOpen, setIsCrmOpen] = useState<boolean>(true);
  const [isFieldAgentOpen, setIsFieldAgentOpen] = useState<boolean>(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/feature/jobs");
        const data = await res.json();
        if (Array.isArray(data)) {
          setJobs(data);
        }
      } catch (err) {
        console.error("Gagal memuat data jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job: any) => {
    const matchesTab = activeTab === "All" || job.status === activeTab;
    const matchesSearch = 
      job.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.mawb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleJobAction = (job: Job) => {
    setSelectedJob(job);
    setCurrentView("detail");
    setActiveDetailTab("Overview");
    setIsIssueModalOpen(false);
  };

  const openJobHistory = () => {
    setSelectedJob(null);
    setCurrentView("history");
    setIsIssueModalOpen(false);
  };

  const selectDetailTab = (tab: string) => {
    setActiveDetailTab(tab);
    setIsIssueModalOpen(tab === "Issue");
    if (tab === "Issue") { setIssueSaved(false); setIssueError(""); }
  };

  const handleSaveIssue = async () => {
    setIsSavingIssue(true);
    setIssueError("");
    try {
      const response = await fetch("/api/feature/A3-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobNumber: selectedJob?.job_number || selectedJob?.id || "JOB-JKT-2401", category: issueCategory, description: issueDescription }),
      });
      if (!response.ok) throw new Error("Gagal menyimpan issue.");
      setIssueSaved(true);
      setIsIssueModalOpen(false);
    } catch (error) {
      setIssueError(error instanceof Error ? error.message : "Gagal menyimpan issue.");
    } finally {
      setIsSavingIssue(false);
    }
  };

  // ==========================================
  // RENDER: JOB LIST 
  // ==========================================
  const renderJobList = () => (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Jobs</h1>
          <p className="text-sm text-gray-500">View and manage your assigned jobs.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search job number, customer, or MAWB/HAWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["All", "Draft", "In Progress", "Completed", "Has Issue"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveTab(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
              activeTab === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {status} {status === "All" ? `(${jobs.length})` : `(${jobs.filter(j => j.status === status).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">No.</th>
                <th className="p-4">Job Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">MAWB / HAWB</th>
                <th className="p-4">Pick Up / Delivery</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-gray-500">Memuat data...</td></tr>
              ) : filteredJobs.length === 0 ? (
                <tr><td colSpan={8} className="p-16 text-center text-gray-500">Tidak ada job ditemukan.</td></tr>
              ) : (
                filteredJobs.map((job: any, index: number) => (
                  <tr key={job.id || index} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4 text-gray-500">{index + 1}</td>
                    <td className="p-4 font-semibold text-blue-600">{job.job_number || job.id}</td>
                    <td className="p-4 text-gray-800 font-medium">{job.customer || "-"}</td>
                    <td className="p-4 text-gray-600">{job.mawb || job.mawb_hawb || "-"}</td>
                    <td className="p-4 text-gray-600">{job.location || job.pickup_delivery || "-"}</td>
                    <td className="p-4 text-gray-600">{job.date || (job.created_at ? job.created_at.slice(0, 10) : "-")}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        job.status === 'Has Issue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        type="button"
                        onClick={() => handleJobAction(job)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                      >
                        {job.status === 'Draft' ? 'Continue' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDER: JOB DETAIL CONTAINER & TABS 
  // ==========================================
  const renderJobDetail = () => {
    const tabs = ['Overview', 'Hand Over', 'Dokumentasi', 'Dokumen', 'Verifikasi', 'Issue', 'History'];

    return (
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
        <button 
          type="button"
          onClick={() => setCurrentView("list")} 
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job List
        </button>

        {/* Header Job Detail */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{selectedJob?.job_number || selectedJob?.id || 'JOB-JKT-2403'}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedJob?.status === 'Completed' ? 'bg-green-100 text-green-700' :
                selectedJob?.status === 'In Progress' ? 'bg-gray-200 text-gray-700' :
                selectedJob?.status === 'Has Issue' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}>
                {selectedJob?.status || 'In Progress'}
              </span>
              <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100">High Priority</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => selectDetailTab("Hand Over")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            Mulai Proses Handover
          </button>
        </div>

        {/* Navigation Tabs Interaktif */}
        <div className="flex border-b border-gray-200 mb-6 gap-6 relative z-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectDetailTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer outline-none select-none ${
                activeDetailTab === tab 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Konten Dinamis Berdasarkan Tab Terpilih */}
        <div className="mt-6 relative z-0">
          {activeDetailTab === 'Overview' && renderOverviewTab()}
          {activeDetailTab === 'Hand Over' && renderHandoverTab()}
          {activeDetailTab === 'Dokumentasi' && renderDokumentasiTab()}
          {activeDetailTab === 'Verifikasi' && renderVerifikasiTab()}
          {activeDetailTab === 'Issue' && renderIssueTab()}
          {activeDetailTab === 'History' && renderHistoryTab()}
          {activeDetailTab === 'Dokumen' && (
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
              <PackageCheck className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p>Halaman <span className="font-semibold text-gray-700">Dokumen</span> sedang dalam tahap pengembangan.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // KONTEN TAB
  // ==========================================
  const renderIssueTab = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Issue Report</h2>
          <p className="mt-1 text-sm text-gray-500">Laporkan kendala yang ditemukan selama proses verifikasi.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsIssueModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Report Issue
        </button>
      </div>

      {issueSaved && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Issue berhasil disimpan dan akan tercatat pada Job History.
        </div>
      )}

      {isIssueModalOpen && (
        <div className="absolute inset-0 z-30 flex min-h-[460px] items-start justify-center bg-slate-900/45 px-4 pt-8 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="issue-modal-title"
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="issue-modal-title" className="text-base font-bold text-slate-800">Report Issue</h2>
              <button
                type="button"
                aria-label="Close report issue"
                onClick={() => setIsIssueModalOpen(false)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); handleSaveIssue(); }} className="space-y-4 px-6 py-5">
              {issueError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{issueError}</p>}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Issue Category <span className="text-red-500">*</span></span>
                <select
                  required
                  value={issueCategory}
                  onChange={(event) => setIssueCategory(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Damaged Package</option>
                  <option>Missing Package</option>
                  <option>Document Discrepancy</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Description <span className="text-red-500">*</span></span>
                <textarea
                  required
                  maxLength={500}
                  value={issueDescription}
                  onChange={(event) => setIssueDescription(event.target.value)}
                  className="min-h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-right text-[10px] text-slate-400">{issueDescription.length}/500</span>
              </label>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">Evidence Photo <span className="font-normal text-slate-400">(Max. 2 MB/file)</span></p>
                <div className="flex gap-3">
                  <div className="flex h-20 w-24 items-end rounded-md border border-slate-200 bg-gradient-to-br from-amber-100 via-stone-200 to-stone-400 p-2 shadow-inner">
                    <span className="rounded bg-slate-800/65 px-1.5 py-0.5 text-[9px] font-medium text-white">Cargo photo</span>
                  </div>
                  <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                    <ImagePlus className="mb-1 h-5 w-5" />
                    <span className="text-xs">Add Photo</span>
                    <input type="file" accept="image/*" className="sr-only" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsIssueModalOpen(false)} className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSavingIssue} className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSavingIssue ? "Saving..." : "Save Issue"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => {
    const history = [
      ["1", "28 Sep 2026, 10:30", "Handover Completed", "Rizky Pratama", "-"],
      ["2", "28 Sep 2026, 10:45", "Document Uploaded", "Rizky Pratama", "4 photos, 3 documents"],
      ["3", "28 Sep 2026, 11:10", "Verification Completed", "Rizky Pratama", "All checklist valid"],
      ["4", "28 Sep 2026, 11:15", "Job Completed", "Rizky Pratama", "-"],
    ];

    return (
      <div className="animate-in fade-in duration-300">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Job History — {selectedJob?.job_number || selectedJob?.id || "JOB-JKT-2401"}</h2>
          <p className="mt-1 text-sm text-slate-500">Riwayat pengerjaan job.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">No.</th><th className="px-5 py-3">Date &amp; Time</th><th className="px-5 py-3">Activity</th><th className="px-5 py-3">Performed By</th><th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {history.map(([number, date, activity, performer, notes]) => (
                  <tr key={number} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">{number}</td><td className="px-5 py-3.5">{date}</td><td className="px-5 py-3.5 font-medium text-slate-700">{activity}</td><td className="px-5 py-3.5">{performer}</td><td className="px-5 py-3.5">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const recentJobs = [
      ["JOB-JKT-2401", "PT DSV Transport", "28 Sep 2026", "In Progress"],
      ["JOB-JKT-2403", "PT Andalan Logistik", "26 Sep 2026", "Completed"],
      ["JOB-JKT-2410", "PT Nusantara Cargo", "25 Sep 2026", "Has Issue"],
    ];
    const summaries = [
      ["Total Jobs", "12", ClipboardList, "text-blue-600", "bg-blue-50"],
      ["In Progress", "4", Clock3, "text-blue-600", "bg-blue-50"],
      ["Completed", "6", CircleCheckBig, "text-emerald-600", "bg-emerald-50"],
      ["Has Issue", "1", CircleAlert, "text-red-600", "bg-red-50"],
    ] as const;

    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Field Agent Dashboard</h1><p className="mt-1 text-sm text-slate-500">Ringkasan pekerjaan untuk Field Agent.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map(([label, value, Icon, color, background]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`rounded-lg p-2.5 ${background} ${color}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-800">{value}</p></div></div>)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-800">Recent Jobs</h2><button type="button" onClick={() => setCurrentView("list")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-[11px] text-slate-500"><tr><th className="px-5 py-3">Job Number</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{recentJobs.map(([number, customer, date, status]) => <tr key={number}><td className="px-5 py-3 font-semibold text-blue-600">{number}</td><td className="px-5 py-3">{customer}</td><td className="px-5 py-3">{date}</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${status === "Completed" ? "bg-green-100 text-green-700" : status === "Has Issue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{status}</span></td><td className="px-5 py-3"><button type="button" onClick={() => handleJobAction({ id: number, job_number: number, customer, mawb: "618-9921", location: "Delivery", date, status: status as Status })} className="rounded border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">View</button></td></tr>)}</tbody></table></div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Job Status Overview</h2><div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#2f80ed_0_33%,#22c55e_33%_83%,#ef4444_83%_92%,#dbe4ef_92%_100%)]"><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"><b className="text-2xl text-slate-800">12</b><span className="text-xs text-slate-500">Total Jobs</span></div></div><div className="mt-5 grid grid-cols-2 gap-y-3 text-xs text-slate-600"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-300" />Draft <b className="float-right">3</b></span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />In Progress <b className="float-right">4</b></span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />Completed <b className="float-right">6</b></span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />Has Issue <b className="float-right">1</b></span></div></div>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-3 gap-6 animate-in fade-in duration-300">
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="font-bold text-gray-800 mb-6">Cargo Information</h3>
        <div className="grid grid-cols-2 gap-y-5 text-sm">
          <div className="text-gray-500">Job Number</div><div className="font-medium text-gray-900">{selectedJob?.job_number || 'JOB-JKT-2403'}</div>
          <div className="text-gray-500">Customer</div><div className="font-medium text-gray-900">{selectedJob?.customer || '-'}</div>
          <div className="text-gray-500">MAWB</div><div className="font-medium text-gray-900">{selectedJob?.mawb || '-'}</div>
          <div className="text-gray-500">Shipper</div><div className="font-medium text-gray-900">PT ABC Co., Ltd.</div>
          <div className="text-gray-500">Consignee</div><div className="font-medium text-gray-900">PT XYZ Indonesia</div>
          <div className="text-gray-500">Cargo Description</div><div className="font-medium text-gray-900">General Cargo</div>
          <div className="text-gray-500">Planned Pieces</div><div className="font-medium text-gray-900">10 Koli</div>
          <div className="text-gray-500">Planned Gross Weight</div><div className="font-medium text-gray-900">2,000 kg</div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Progress</h3>
          <div className="flex items-start justify-between text-center text-[10px] text-gray-500"><div><span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">1</span>Hand Over</div><div className="mt-3 h-px flex-1 bg-gray-200" /><div><span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white">2</span>Dokumentasi</div><div className="mt-3 h-px flex-1 bg-gray-200" /><div><span className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white">3</span>Verifikasi</div></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="font-bold text-gray-800 mb-6">Delivery Information</h3>
          <div className="flex items-start gap-3 mb-6">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Delivery Location</p>
              <p className="text-xs text-gray-500 mt-1">{selectedJob?.location || 'Gate 3, Terminal 2, Soekarno-Hatta'}</p>
            </div>
          </div>
          <div className="w-full h-36 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-400 font-medium text-sm">
            <MapPin className="mr-2 h-5 w-5" /> Gate 3, Terminal 2
          </div>
          <p className="mt-3 text-xs text-gray-500">Planned Date &amp; Time<br /><span className="font-medium text-gray-700">28 Sep 2026, 10:30 WIB</span></p>
        </div>
      </div>
    </div>
  );

  const renderHandoverTab = () => (
    <div className="flex justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center mb-10 text-sm">
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1">1</div><span className="text-blue-600 font-medium">Hand Over</span></div>
          <div className="w-16 h-0.5 bg-gray-200 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex justify-center items-center font-bold mb-1">2</div><span className="text-gray-400">Dokumentasi</span></div>
          <div className="w-16 h-0.5 bg-gray-200 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex justify-center items-center font-bold mb-1">3</div><span className="text-gray-400">Verifikasi</span></div>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name of Delivering Party *</label>
              <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500" defaultValue="Budi Santoso" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name of Receiving Party *</label>
              <input type="text" className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-500" defaultValue="Andi Wijaya" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Actual Pieces (Koli) *</label>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <input type="number" className="w-full p-2.5 text-sm focus:outline-none" defaultValue="12" />
                <span className="bg-gray-50 px-4 text-sm text-gray-500 border-l border-gray-300 h-full py-2.5">Koli</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Actual Gross Weight *</label>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <input type="number" className="w-full p-2.5 text-sm focus:outline-none" defaultValue="2450" />
                <span className="bg-gray-50 px-4 text-sm text-gray-500 border-l border-gray-300 h-full py-2.5">kg</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <label className="block text-xs font-medium text-gray-700 mb-2">Location & Time (Automatic) <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 ml-2">Location Detected</span></label>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><MapPin className="h-6 w-6"/></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Gate 3, Terminal 2</p>
                <p className="text-xs text-gray-500">Soekarno-Hatta International Airport</p>
                <p className="mt-1 text-xs font-medium text-gray-700">28 Sep 2026, 10:30 WIB</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea placeholder="Enter notes (optional)..." className="min-h-20 w-full resize-none rounded-md border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end mt-8 pt-4 border-t">
            <button type="button" onClick={() => selectDetailTab("Dokumentasi")} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm flex items-center transition cursor-pointer">
              Next ➔
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDokumentasiTab = () => (
    <div className="flex justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center mb-10 text-sm">
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1"><CheckCircle2 className="h-5 w-5"/></div><span className="text-blue-600 font-medium">Hand Over</span></div>
          <div className="w-16 h-0.5 bg-blue-600 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1">2</div><span className="text-blue-600 font-medium">Dokumentasi</span></div>
          <div className="w-16 h-0.5 bg-gray-200 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex justify-center items-center font-bold mb-1">3</div><span className="text-gray-400">Verifikasi</span></div>
        </div>
        <h3 className="font-semibold text-gray-800 mb-1 text-sm">Foto Kargo <span className="text-red-500 font-normal text-xs">(Required 4 Photos)</span></h3>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {['1. Kesesuaian Cargo', '2. Marking & Label', '3. Seal / Segel', '4. Area Kerusakan (Optional)'].map((label, index) => (
            <label key={label} className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-2 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <span className="mb-2 block text-[10px] font-medium text-gray-600">{label}</span>
              {index < 3 ? <div className="relative h-14 rounded bg-gradient-to-br from-amber-100 via-stone-300 to-stone-500"><Camera className="absolute right-1 top-1 h-3 w-3 text-white" /><CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 p-0.5 text-white" /></div> : <div className="flex h-14 flex-col items-center justify-center rounded border border-dashed border-gray-300 text-gray-400"><ImagePlus className="h-4 w-4" /><span className="text-[10px]">Add Photo</span></div>}
              <span className="mt-1 block text-[10px] font-medium text-blue-600">{index < 3 ? 'Change Photo' : 'Add Photo'}</span><input type="file" accept="image/*" className="sr-only" />
            </label>
          ))}
        </div>
        <h3 className="font-semibold text-gray-800 mb-1 text-sm">Dokumen Pendukung</h3><p className="mb-3 text-[10px] text-gray-400">Format: PDF, JPG, PNG (Max. 10 MB/file)</p>
        <div className="space-y-3 mb-8">
          {['Packing List', 'Commercial Invoice', 'MSDS (Jika barang kimia/DG)'].map((doc, index) => (
            <div key={doc} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">{doc} <span className="text-red-500">*</span></span>
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-xs text-gray-500"><span>{index === 0 ? 'packing_list.pdf' : index === 1 ? 'invoice.pdf' : 'msds.pdf'}</span><CheckCircle className="h-4 w-4 text-green-500" /><input type="file" accept=".pdf,image/*" className="sr-only" /></label>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-8 pt-4 border-t">
          <button type="button" onClick={() => setActiveDetailTab("Hand Over")} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-md transition cursor-pointer">Back</button>
          <button type="button" onClick={() => setActiveDetailTab("Verifikasi")} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm flex items-center transition cursor-pointer">
            Next ➔
          </button>
        </div>
      </div>
    </div>
  );

  const renderVerifikasiTab = () => (
    <div className="flex justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center mb-10 text-sm">
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1"><CheckCircle2 className="h-5 w-5"/></div><span className="text-blue-600 font-medium">Hand Over</span></div>
          <div className="w-16 h-0.5 bg-blue-600 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1"><CheckCircle2 className="h-5 w-5"/></div><span className="text-blue-600 font-medium">Dokumentasi</span></div>
          <div className="w-16 h-0.5 bg-blue-600 mx-2 -mt-5"></div>
          <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex justify-center items-center font-bold mb-1">3</div><span className="text-blue-600 font-medium">Verifikasi</span></div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">1. Kesesuaian Dokumen</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="dokumen" defaultChecked className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Sesuai</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="dokumen" className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Tidak Sesuai</label>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">2. Kondisi Kemasan</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="kemasan" defaultChecked className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Baik</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="kemasan" className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Rusak / Basah</label>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">3. Standar Maskapai</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="standar" defaultChecked className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Sesuai</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="standar" className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Perlu Repacking</label>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">4. Dangerous Goods (DG)</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="dg" className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Ya</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="dg" defaultChecked className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /> Tidak</label>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">5. Special Handling</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['Cold Chain', 'Fragile', 'Live Animals', 'Perishable'].map((item, index) => <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs ${index === 1 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}><input type="checkbox" defaultChecked={index === 1} className="text-blue-600 focus:ring-blue-500" /> {item}</label>)}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-10 pt-4 border-t">
          <button type="button" onClick={() => setActiveDetailTab("Dokumentasi")} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-md transition cursor-pointer">Back</button>
          <button type="button" onClick={() => selectDetailTab("Issue")} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-2 transition cursor-pointer">
            Next →
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDER UTAMA KESELURUHAN HALAMAN
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#09162a] text-gray-400 flex flex-col justify-between border-r border-gray-800 select-none overflow-y-auto">
        <div>
          {/* Logo & Header */}
          <div className="p-6 flex items-center gap-4 border-b border-gray-800/60 pb-8">
            <div className="bg-blue-500 p-2.5 rounded-xl text-white shadow-lg">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-[15px] tracking-wide leading-tight">ANDIMA</h2>
              <h2 className="text-white font-bold text-[15px] tracking-wide leading-tight">TRANSPORTINDO</h2>
              <p className="text-[8px] text-gray-500 tracking-widest mt-1">ENTERPRISE DIGITAL ECOSYSTEM</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            
            {/* MAIN */}
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Main</div>
              <button type="button" onClick={() => setCurrentView("dashboard")} className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:text-white transition cursor-pointer">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">General Dashboard</span>
              </button>
            </div>

            {/* BUSINESS MODUL */}
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Business Modul</div>
              
              <button type="button" className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:text-white transition cursor-pointer">
                <Box className="h-4 w-4" />
                <span className="text-sm font-medium">POS</span>
              </button>
              
              {/* CRM MENU DROPDOWN */}
              <div className="mt-1">
                <button 
                  type="button" 
                  onClick={() => setIsCrmOpen(!isCrmOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition cursor-pointer ${isCrmOpen ? 'text-white' : 'hover:text-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-bold">CRM</span>
                  </div>
                  {isCrmOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                
                {/* Isi Dropdown CRM */}
                {isCrmOpen && (
                  <div className="pl-11 pr-2 py-2 space-y-3">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-2 mb-2">Sales Executive</div>
                    
                    <button type="button" className="w-full text-left px-4 py-1.5 text-sm text-gray-400 hover:text-white transition cursor-pointer">Company List</button>
                    <button type="button" className="w-full text-left px-4 py-1.5 text-sm text-gray-400 hover:text-white transition cursor-pointer">Meeting Schedule</button>
                    <button type="button" className="w-full text-left px-4 py-1.5 text-sm text-gray-400 hover:text-white transition cursor-pointer">Record Conversation</button>
                    <button type="button" className="w-full text-left px-4 py-1.5 text-sm text-gray-400 hover:text-white transition cursor-pointer">Task of Field Agent</button>
                    <button type="button" className="w-full text-left px-4 py-1.5 text-sm text-gray-400 hover:text-white transition cursor-pointer">Need Backup</button>
                    
                    {/* FIELD AGENT DROPDOWN */}
                    <button 
                      type="button" 
                      onClick={() => setIsFieldAgentOpen(!isFieldAgentOpen)}
                      className={`w-full flex items-center justify-between px-4 pt-3 pb-1 text-sm transition cursor-pointer ${isFieldAgentOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <span className="font-medium">Field Agent</span>
                      {isFieldAgentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    
                    {/* ANAK MENU FIELD AGENT */}
                    {isFieldAgentOpen && (
                      <div className="pl-4 pr-2 space-y-1">
                        <button 
                          type="button" 
                          onClick={() => setCurrentView("list")}
                          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition cursor-pointer ${
                            currentView === 'list' || currentView === 'detail' 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <span className="text-sm font-medium">Job List</span>
                          {(currentView === 'list' || currentView === 'detail') && (
                            <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                          )}
                        </button>
                        <button 
                          type="button" 
                          onClick={openJobHistory}
                          aria-current={currentView === "history" ? "page" : undefined}
                          className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition cursor-pointer ${currentView === "history" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                        >
                          History
                        </button>
                      </div>
                    )}
                    
                    <button type="button" className="w-full text-left px-4 pt-2 text-sm text-gray-400 hover:text-white transition cursor-pointer">HRMS</button>
                  </div>
                )}
              </div>

              <button type="button" className="w-full flex items-center gap-4 px-3 py-2.5 mt-1 rounded-lg hover:text-white transition cursor-pointer">
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">MID</span>
              </button>
            </div>

            {/* SYSTEM */}
            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">System</div>
              <button type="button" className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg hover:text-white transition cursor-pointer">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Support Footer */}
        <div className="p-6 mb-2">
          <div className="bg-[#12233f] rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-[#1a3055] transition shadow-md border border-gray-700/50">
            <div className="bg-blue-600/20 p-2.5 rounded-full text-blue-400">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">Customer Support</p>
              <p className="text-[10px] text-gray-400 mt-0.5">24/7 Operations Line</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-20 shadow-sm relative">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
            <span className="text-gray-800 font-bold">Field Agent</span><span>→</span>
            <span className="text-blue-600 capitalize">
              {currentView === 'list' ? 'Job List' : currentView === 'detail' ? 'Job Detail' : currentView === 'history' ? 'History' : 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="p-2 text-gray-400 hover:text-gray-600 relative cursor-pointer"><Bell className="h-5 w-5" /></button>
            <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">RP</div>
              <div className="text-left"><p className="text-xs font-bold text-gray-800">Rizky Pratama</p><p className="text-[10px] text-gray-500">Field Agent</p></div>
            </div>
          </div>
        </header>

        {currentView === "dashboard" && renderDashboard()}
        {currentView === "list" && renderJobList()}
        {currentView === "detail" && renderJobDetail()}
        {currentView === "history" && <div className="flex-1 overflow-y-auto p-8">{renderHistoryTab()}</div>}
      </div>
    </div>
  );
}
