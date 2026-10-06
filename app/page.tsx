"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Check, ChevronDown, ChevronRight, ClipboardCheck, FileText, Info, LayoutDashboard, MapPin, RefreshCw, Search, Send, Upload, Users, X, AlertTriangle, Camera, Trash2 } from "lucide-react";

type Status = "Assigned" | "In Progress" | "Completed" | "Has Issue" | "Draft";
type Screen = "dashboard" | "tasks" | "detail" | "handover" | "documentation" | "verification" | "history";
type Job = { id: string; job_number?: string; customer?: string; mawb?: string; mawb_hawb?: string; location?: string; date?: string; status?: Status; created_at?: string };

const sampleJobs: Job[] = [
  { id: "DSVEXP/2605/2551", job_number: "DSVEXP/2605/2551", customer: "PT DSV Transport Indonesia", mawb: "123-45678901", location: "Kantor PT DSV, Jakarta", date: "7 Oct 2026 09:00", status: "Assigned" },
  { id: "GEOSEAXP/2605/2551", job_number: "GEOSEAXP/2605/2551", customer: "PT Geodis Freight Forwarding", mawb: "DSV-2506-001", location: "Kantor Geodis, Jakarta", date: "7 Oct 2026 08:30", status: "In Progress" },
  { id: "MBL/2605/1042", job_number: "MBL/2605/1042", customer: "PT Maju Bersama Logistics", mawb: "789-456321", location: "Jakarta", date: "6 Oct 2026 10:00", status: "Assigned" },
  { id: "NUSCARGO/2605/1188", job_number: "NUSCARGO/2605/1188", customer: "PT Nusantara Cargo", mawb: "001-23456789", location: "Jakarta", date: "5 Oct 2026 14:20", status: "Completed" },
  { id: "GEXP/2605/3301", job_number: "GEXP/2605/3301", customer: "PT Global Express", mawb: "777-88990011", location: "Jakarta", date: "5 Oct 2026 09:10", status: "Has Issue" },
];
const statusClass: Record<string, string> = { Assigned: "bg-amber-50 text-amber-700 border-amber-200", "In Progress": "bg-blue-50 text-blue-700 border-blue-200", Completed: "bg-emerald-50 text-emerald-700 border-emerald-200", "Has Issue": "bg-red-50 text-red-700 border-red-200", Draft: "bg-slate-100 text-slate-600 border-slate-200" };
const no = (job: Job | null) => job?.job_number || job?.id || "DSVEXP/2605/2551";
const mawb = (job: Job) => job.mawb || job.mawb_hawb || "-";
function StatusBadge({ status, onClick }: { status?: Status; onClick?: () => void }) { const className = `inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold ${statusClass[status || "Assigned"]}`; return onClick ? <button type="button" onClick={onClick} title="Buka detail job" className={`${className} cursor-pointer transition hover:brightness-95 hover:ring-2 hover:ring-blue-100`}>{status || "Assigned"}</button> : <span className={className}>{status || "Assigned"}</span>; }

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(sampleJobs), [screen, setScreen] = useState<Screen>("dashboard"), [selected, setSelected] = useState<Job | null>(sampleJobs[1]);
  const [filter, setFilter] = useState("All"), [query, setQuery] = useState(""), [issueOpen, setIssueOpen] = useState(false), [confirmReportOpen, setConfirmReportOpen] = useState(false), [processingOpen, setProcessingOpen] = useState(false), [completionOpen, setCompletionOpen] = useState(false), [reportIssueCount, setReportIssueCount] = useState(0), [category, setCategory] = useState("Damaged Package"), [description, setDescription] = useState(""), [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  useEffect(() => { fetch("/api/feature/jobs").then(r => r.ok ? r.json() : []).then(data => { if (Array.isArray(data) && data.length) setJobs(data); }).catch(() => undefined); }, []);
  useEffect(() => { const previous: Partial<Record<Screen, Screen>> = { tasks: "dashboard", detail: "tasks", handover: "detail", documentation: "handover", verification: "documentation", history: "tasks" }; const goBack = () => { const destination = previous[screen]; if (destination) setScreen(destination); }; window.addEventListener("field-agent:back", goBack); return () => window.removeEventListener("field-agent:back", goBack); }, [screen]);
  const counts = useMemo(() => ({ All: jobs.length, Assigned: jobs.filter(j => j.status === "Assigned" || j.status === "Draft").length, "In Progress": jobs.filter(j => j.status === "In Progress").length, Completed: jobs.filter(j => j.status === "Completed").length, "Has Issue": jobs.filter(j => j.status === "Has Issue").length }), [jobs]);
  const shown = useMemo(() => jobs.filter(j => (filter === "All" || (filter === "Assigned" ? j.status === "Assigned" || j.status === "Draft" : j.status === filter)) && `${no(j)} ${j.customer || ""} ${mawb(j)}`.toLowerCase().includes(query.toLowerCase())), [jobs, filter, query]);
  const openJob = (job: Job) => { setSelected(job); setScreen("detail"); setNotice(""); };
  const saveIssue = async () => { setSaving(true); try { const r = await fetch("/api/feature/A3-issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobNumber: no(selected), category, description: description || "Issue reported by field agent" }) }); if (!r.ok) throw new Error(); setIssueOpen(false); setNotice("Issue berhasil disimpan dan tercatat pada Job History."); } catch { setNotice("Issue belum dapat disimpan. Silakan coba lagi."); } finally { setSaving(false); } };
  const saveWorkflow = async (endpoint: string, payload: Record<string, unknown>, next: Screen) => { setScreen(next); setSaving(true); try { const r = await fetch(`/api/feature/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobNumber: no(selected), ...payload }) }); if (!r.ok) throw new Error(); setNotice("Data berhasil disimpan."); } catch { setNotice("Halaman berikutnya tetap dibuka; data belum dapat disimpan. Periksa koneksi lalu coba lagi."); } finally { setSaving(false); } };
  const openReportConfirm = (issueCount: number) => { setReportIssueCount(issueCount); setConfirmReportOpen(true); setNotice(""); };
  const completeTask = async () => {
    setConfirmReportOpen(false);
    setProcessingOpen(true);
    setSaving(true);
    const hasIssue = reportIssueCount > 0;
    try {
      const request = hasIssue
        ? fetch("/api/feature/A3-issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobNumber: no(selected), category: "Final Verification Finding", classification: "Urgent", description: `${reportIssueCount} checklist item bertanda issue pada verifikasi akhir.` }) })
        : fetch("/api/feature/A3-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobNumber: no(selected), documentVerification: "Sesuai", packageCondition: "Baik", airlineStandard: "Sesuai", dangerousGoods: false, specialHandling: [] }) });
      const [r] = await Promise.all([request, new Promise(resolve => setTimeout(resolve, 900))]);
      if (!r.ok) throw new Error();
      setJobs(current => current.map(job => no(job) === no(selected) ? { ...job, status: hasIssue ? "Has Issue" : "Completed" } : job));
      setSelected(current => current ? { ...current, status: hasIssue ? "Has Issue" : "Completed" } : current);
      setNotice("");
    } catch { setNotice("Laporan tersimpan lokal; koneksi database belum tersedia."); }
    finally { setSaving(false); setProcessingOpen(false); setCompletionOpen(true); }
  };
  return <div className="min-h-screen bg-white text-[#15213a]"><Sidebar screen={screen} navigate={setScreen} /><main className="ml-[224px] min-h-screen bg-white"><Topbar screen={screen} /><div className="mx-auto max-w-[1280px] px-5 pb-10 pt-5 md:px-9">
    {screen === "dashboard" && <Dashboard jobs={jobs} openJob={openJob} showTasks={() => setScreen("tasks")} />}
    {screen === "tasks" && <TaskList jobs={shown} filter={filter} counts={counts} query={query} setFilter={setFilter} setQuery={setQuery} openJob={openJob} />}
    {screen === "detail" && <JobDetail job={selected} onHandover={() => setScreen("handover")} />}
    {screen === "handover" && <Handover job={selected} back={() => setScreen("detail")} next={() => saveWorkflow("A3-handover", { deliveringParty: "Budi Santoso", receivingParty: "Andi Pratama", actualPieces: 10, actualGrossWeight: 250, location: selected?.location || "Kantor PT DSV, Jakarta" }, "documentation")} />}
    {screen === "documentation" && <Documentation back={() => setScreen("handover")} next={() => saveWorkflow("A3-documentation", { photos: ["Box 1", "Pallet Side", "Loading Area", "Seal & Wrap"], documents: ["PackingList_DSV.pdf", "Invoice_DSV.pdf"] }, "verification")} />}
    {screen === "verification" && <Verification back={() => setScreen("documentation")} next={openReportConfirm} onIssue={() => setIssueOpen(true)} />}
    {screen === "history" && <HistoryList jobs={shown} filter={filter} query={query} setFilter={setFilter} setQuery={setQuery} openJob={openJob} />}
  </div></main>{issueOpen && <IssueModal category={category} description={description} setCategory={setCategory} setDescription={setDescription} close={() => setIssueOpen(false)} save={saveIssue} saving={saving} />}{confirmReportOpen && <ReportConfirmModal job={selected} issueCount={reportIssueCount} close={() => setConfirmReportOpen(false)} confirm={completeTask} saving={saving} />}{processingOpen && <ReportProcessingModal issueCount={reportIssueCount} />}{completionOpen && <CompleteTaskModal job={selected} issueCount={reportIssueCount} openHistory={() => { setCompletionOpen(false); setScreen("history"); }} />}{notice && <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">{notice}</div>}</div>;
}

function Sidebar({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  const active = screen === "dashboard" ? "dashboard" : screen === "history" ? "history" : "tasks";
  const linkClass = (isActive = false) => `side-link ${isActive ? "bg-[#2d6df6] text-white shadow-[0_10px_22px_rgb(37_99_235_/_0.24)]" : "text-white/78 hover:bg-white/10 hover:text-white"}`;
  const subLinkClass = (isActive: boolean) => `block w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition ${isActive ? "bg-white text-[#173057] shadow-sm" : "text-white/62 hover:bg-white/10 hover:text-white"}`;

  return <aside className="fixed inset-y-0 left-0 z-30 flex w-[224px] flex-col border-r border-[#173a68] bg-[#0d2d55] text-white shadow-[8px_0_24px_rgb(15_23_42_/_0.08)]">
    <div className="px-5 pb-5 pt-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4">
        <div className="text-[16px] font-extrabold leading-[15px] tracking-tight">ANDIMA<br />TRANSPORTINDO</div>
        <div className="mt-3 border-t border-white/10 pt-3 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/45">Enterprise Digital Ecosystem</div>
      </div>
    </div>
    <nav className="flex-1 space-y-2 px-4 text-[12px]">
      <button onClick={() => navigate("dashboard")} className={linkClass(active === "dashboard")}><LayoutDashboard />Dashboard</button>
      <button className={linkClass()}><Users />CCR</button>
      <div className="rounded-xl bg-[#2166ef] p-1 shadow-[0_12px_26px_rgb(33_102_239_/_0.22)]">
        <button className="side-link text-white"><ClipboardCheck />CRM<ChevronDown className="ml-auto" /></button>
      </div>
      <div className="ml-4 space-y-1 border-l border-white/15 py-2 pl-4">
        <p className="px-3 py-1 text-[11px] font-semibold text-white/45">Sales Executive</p>
        <p className="px-3 py-1 text-[12px] font-extrabold text-white">Field Agent</p>
        <button onClick={() => navigate("tasks")} className={subLinkClass(active === "tasks")}>My Task</button>
        <button onClick={() => navigate("history")} className={subLinkClass(active === "history")}>Job History</button>
      </div>
      <button className={linkClass()}><Users />HRMS</button>
    </nav>
    <div className="px-4 pb-5">
      <button className="w-full rounded-xl border border-rose-400/45 bg-rose-500/10 px-4 py-3 text-left text-[12px] font-extrabold text-rose-100 transition hover:bg-rose-500/18">Logout</button>
    </div>
  </aside>;
}
function Topbar({ screen }: { screen: Screen }) { const labels: Record<Screen, string[]> = { dashboard: ["CRM", "SALES EXECUTIVE", "TASK FIELD AGENT"], tasks: ["CRM", "Field Agent", "My Task"], detail: ["CRM", "Field Agent", "My Task", "Detail Job"], handover: ["CRM", "Field Agent", "My Task", "Detail Job", "Handover"], documentation: ["CRM", "Field Agent", "My Task", "Detail Job", "Dokumentasi"], verification: ["CRM", "Field Agent", "My Task", "Detail Job", "Verifikasi"], history: ["CRM", "Field Agent", "Job History"] }; return <header className="flex h-[67px] items-center justify-between border-b border-slate-100 px-9"><div className="flex items-center gap-3">{screen !== "dashboard" && <button type="button" aria-label="Kembali ke halaman sebelumnya" title="Kembali" onClick={() => window.dispatchEvent(new Event("field-agent:back"))} className="grid h-9 w-9 place-items-center rounded-md text-[#173057] transition hover:bg-slate-100"><ArrowLeft size={28} strokeWidth={2.5} /></button>}<div className="flex gap-2 text-[10px] font-medium text-slate-500">{labels[screen].map((label, i) => <span key={label} className={i === labels[screen].length - 1 ? "text-[#2764e8]" : ""}>{i > 0 && <span className="mr-2 text-slate-400">/</span>}{label}</span>)}</div></div><div className="flex items-center gap-4"><div className="relative rounded-full bg-slate-100 p-2.5"><Bell size={19} className="text-slate-500" /><i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /></div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">R</span><div className="text-[10px]"><b className="block">Rian</b><span className="text-slate-400">Field Agent</span></div><ChevronDown size={15} className="text-slate-400" /></div></div></header>; }

function Dashboard({ jobs, openJob, showTasks }: { jobs: Job[]; openJob: (j: Job) => void; showTasks: () => void }) { const inProgress = jobs.filter(j => j.status === "In Progress").length || 4, complete = jobs.filter(j => j.status === "Completed").length || 3, issues = jobs.filter(j => j.status === "Has Issue").length || 2, assigned = Math.max(1, jobs.length - inProgress - complete - issues); const cards = [["Total Task", jobs.length || 12, "↑ +2 dari minggu lalu", "text-emerald-600"], ["In Progress", inProgress, "2 sedang dikerjakan", "text-blue-600"], ["Completed", complete, "↑ +3 dari minggu lalu", "text-emerald-600"], ["Has Issue", issues, "↑ +1 dari minggu lalu", "text-red-500"]]; return <><section className="mb-4"><h1 className="text-[21px] font-extrabold">Dashboard Field Agent</h1><p className="text-[12px] text-slate-500">Ringkasan pekerjaan dan status Anda hari ini.</p></section><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([title, value, sub, color]) => <button onClick={showTasks} key={String(title)} className="h-[155px] rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow"><p className="pt-2 text-[13px] font-bold text-slate-600">{title}</p><b className="mt-5 block text-[23px]">{value}</b><p className={`mt-2 text-[10px] font-bold ${color}`}>{sub}</p></button>)}</div><div className="mt-7 grid gap-4 lg:grid-cols-[320px_1fr]"><section className="rounded-xl border border-slate-100 p-5 shadow-sm"><h2 className="text-[13px] font-extrabold">Status Task</h2><div className="mx-auto mt-6 grid h-48 w-48 place-items-center rounded-full" style={{ background: "conic-gradient(#3d7cf0 0 25%,#0785c3 25% 58%,#12b981 58% 83%,#f34545 83% 100%)" }}><div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center"><b className="text-xl">{jobs.length || 12}</b><span className="-mt-8 text-[10px] text-slate-500">Total Task</span></div></div><div className="mt-6 space-y-4 text-[11px]">{[["bg-blue-500", "Assigned", assigned, "25%"], ["bg-sky-600", "In Progress", inProgress, "33%"], ["bg-emerald-500", "Completed", complete, "25%"], ["bg-red-500", "Has Issue", issues, "17%"]].map(([color, label, value, percent]) => <div className="flex items-center gap-2" key={String(label)}><i className={`h-3 w-3 rounded-full ${color}`} /><span className="w-20">{label}</span><b>{value}</b><span className="text-slate-400">({percent})</span></div>)}</div></section><section className="self-start rounded-xl border border-slate-100 p-5 shadow-sm"><div className="mb-4 flex justify-between"><h2 className="text-[13px] font-extrabold">Recent Jobs</h2><button onClick={showTasks} className="text-[10px] font-bold text-blue-600">Lihat Semua</button></div><table className="w-full text-left text-[11px]"><thead className="border-b border-slate-100 text-[10px] text-slate-500"><tr><th className="pb-3">Job Number</th><th>Customer</th><th>MAWB/HAWB</th><th>Status</th></tr></thead><tbody>{jobs.slice(0,4).map(j => <tr key={j.id} className="border-b border-slate-50 last:border-0"><td className="py-4 font-bold"><button onClick={() => openJob(j)}>{no(j)}</button></td><td>{j.customer}</td><td className="text-slate-500">{mawb(j)}</td><td><StatusBadge status={j.status} onClick={() => openJob(j)} /></td></tr>)}</tbody></table></section></div><AgentOpsLayer jobs={jobs} showTasks={showTasks} /></>; }

function AgentOpsLayer({ jobs, showTasks }: { jobs: Job[]; showTasks: () => void }) {
  const liveJobs = jobs.filter(job => job.status === "Assigned" || job.status === "In Progress" || job.status === "Has Issue").length || 7;
  const capabilities = [
    ["Quote & Rate", "Tarif lane, kapasitas carrier, dan margin rule disiapkan sebelum field action."],
    ["Booking & Handover", "Instruksi pickup, PIC, lokasi, dan timestamp tetap masuk ke alur handover lama."],
    ["Tracking & Exception", "Issue lapangan diarahkan ke approval Sales Executive dengan bukti foto."],
    ["Invoice Readiness", "Packing list, invoice, dan verifikasi akhir jadi dasar billing yang auditable."],
  ];
  const pipeline = [
    ["Intake", "Email / task SE", "done"],
    ["Policy", "SLA + margin", "done"],
    ["Field", `${liveJobs} job aktif`, "live"],
    ["Approval", "2 butuh review", "review"],
    ["Audit", "History tersimpan", "done"],
  ];

  return <section className="mt-7 rounded-2xl border border-slate-100 bg-[#f8fbff] p-5 shadow-sm">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">AI Cargo Operations Layer</p>
        <h2 className="mt-1 text-[20px] font-extrabold">Agent control panel untuk quote, booking, tracking, exception, dan invoice</h2>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">Tambahan ini mengikuti fungsi yang sudah ada: semua tindakan lapangan tetap lewat My Task, Handover, Dokumentasi, Verifikasi, dan Job History.</p>
      </div>
      <button onClick={showTasks} className="primary">Buka Task Aktif <ChevronRight size={14}/></button>
    </div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-blue-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><b className="text-[15px]">Quote Agent Preview</b><p className="mt-1 text-[12px] text-slate-500">Lane CGK -&gt; SIN, 375 kg, next flight, approval required.</p></div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700">18s ETA</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[["Carrier Capacity", "Garuda Cargo OK", "text-emerald-600"], ["Margin Rule", "Min 12% applied", "text-blue-600"], ["Proposed Quote", "IDR 18.600.000", "text-slate-900"]].map(([label, value, color]) => <div key={label} className="rounded-xl border border-slate-100 bg-[#fbfdff] p-4">
            <p className="text-[11px] font-semibold text-slate-500">{label}</p>
            <b className={`mt-2 block text-[15px] ${color}`}>{value}</b>
          </div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-[12px] font-extrabold text-emerald-700"><Check size={16} className="mr-2 inline" />Approve Quote</button>
          <button className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-[12px] font-extrabold text-blue-700"><RefreshCw size={16} className="mr-2 inline" />Request Changes</button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <b className="text-[15px]">Agent Execution Pipeline</b>
        <div className="mt-4 space-y-3">
          {pipeline.map(([title, sub, state], index) => <div key={title} className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-extrabold ${state === "done" ? "bg-emerald-100 text-emerald-700" : state === "live" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{index + 1}</span>
            <span className="min-w-0 flex-1"><b className="block text-[12px]">{title}</b><small className="text-[11px] text-slate-500">{sub}</small></span>
            <ChevronRight size={15} className="text-slate-300" />
          </div>)}
        </div>
      </div>
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-4">
      {capabilities.map(([title, body]) => <div key={title} className="rounded-xl border border-slate-100 bg-white p-4">
        <b className="text-[13px]">{title}</b>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">{body}</p>
      </div>)}
    </div>
  </section>;
}
function Tabs({ filter, counts, setFilter }: { filter: string; counts: Record<string, number>; setFilter: (v: string) => void }) { return <div className="mb-5 flex flex-wrap gap-2">{["All", "Assigned", "In Progress", "Completed", "Has Issue"].map(tab => <button key={tab} onClick={() => setFilter(tab)} className={`rounded-md border px-3 py-2 text-[11px] font-bold ${filter === tab ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 bg-white text-slate-600"}`}>{tab} <span className={`ml-1 rounded px-1.5 py-0.5 ${filter === tab ? "bg-blue-800/40" : tab === "Has Issue" ? "bg-red-100 text-red-600" : "bg-slate-100"}`}>{counts[tab]}</span></button>)}</div>; }
function Searchbar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) { return <div className="mb-5 flex rounded-lg border border-slate-100 bg-white p-2"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Job Number, Customer, or MAWB/HAWB" className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-2 text-[11px] outline-none" /></label><button className="ml-4 rounded-md border border-slate-200 bg-slate-50 px-4 text-[11px] font-bold">⚙ Filter ▼</button></div>; }
function TaskList({ jobs, filter, counts, query, setFilter, setQuery, openJob }: { jobs: Job[]; filter: string; counts: Record<string, number>; query: string; setFilter: (v: string) => void; setQuery: (v: string) => void; openJob: (j: Job) => void }) { return <><section className="mb-6"><h1 className="text-[20px] font-extrabold">My Task</h1><p className="text-[12px] text-slate-500">Daftar task yang ditugaskan kepada Anda.</p></section><Tabs filter={filter} counts={counts} setFilter={setFilter} /><Searchbar query={query} setQuery={setQuery} /><JobsTable jobs={jobs} action={openJob} history={false} /></>; }
function JobsTable({ jobs, action, history }: { jobs: Job[]; action?: (j: Job) => void; history: boolean }) { return <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"><table className="w-full table-fixed text-left text-[12px]"><thead className="bg-[#eff5fa] text-slate-600"><tr><th className="w-[22%] px-4 py-4">Job Number</th><th className="w-[24%] px-4 py-4">Customer</th><th className="w-[20%] px-4 py-4">MAWB/HAWB</th><th className="w-[20%] px-4 py-4">{history ? "Tanggal" : <>Tanggal<br />Penugasan</>}</th><th className="w-[14%] px-4 py-4">Status</th></tr></thead><tbody>{jobs.slice(0,5).map(j => <tr key={j.id} className="border-t border-slate-100"><td className="px-4 py-5 font-bold text-blue-600">{action ? <button onClick={() => action(j)}>{no(j)}</button> : no(j)}</td><td className="px-4 py-5 font-medium">{j.customer}</td><td className="px-4 py-5 text-slate-500">{mawb(j)}</td><td className="px-4 py-5 text-slate-600">{j.date || "7 Oct 2026"}</td><td className="px-4 py-5"><StatusBadge status={j.status} onClick={action ? () => action(j) : undefined} /></td></tr>)}</tbody></table><div className="flex items-center justify-between bg-[#f7fafc] px-4 py-4 text-[11px] text-slate-500"><span>Showing 1-{Math.min(5,jobs.length)} of {history ? 20 : countsText(jobs)} tasks</span><span className="flex gap-1"><button className="pager">‹</button><button className="pager active">1</button><button className="pager">2</button><button className="pager">3</button><button className="pager">›</button></span></div></div>; }
const countsText = (jobs: Job[]) => Math.max(jobs.length, 12);

function JobDetail({ job, onHandover }: { job: Job | null; onHandover: () => void }) {
  const info = [["Job Number", no(job)], ["Tanggal Penugasan", "7 Oct 2026, 09:00"], ["Customer", job?.customer || "PT DSV Transport Indonesia"], ["Estimasi Serah Terima", "7 Oct 2026, 14:00"], ["MAWB Number", mawb(job || sampleJobs[0])], ["Lokasi", job?.location || "Kantor PT DSV, Jakarta"], ["HAWB Number", "DSV-2506-001"], ["PIC Customer", "Aida (081231903090)"], ["Jenis Kargo", "Electronics"], ["Sales Executive", "Yuliana"]];
  const steps = [
    ["1", "Detail Job", "Selesai", "border-emerald-400 bg-emerald-50 text-emerald-700"],
    ["2", "Handover", "Sedang dikerjakan", "border-blue-500 bg-blue-50 text-blue-700"],
    ["3", "Dokumentasi", "Belum dikerjakan", "border-slate-200 bg-white text-slate-500"],
    ["4", "Verifikasi", "Belum dikerjakan", "border-slate-200 bg-white text-slate-500"],
    ["5", "Complete", "Belum dikerjakan", "border-slate-200 bg-white text-slate-500"],
  ];

  return <div className="w-full rounded-2xl bg-[#f6f9fc] p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Detail Job</h1>
        <p className="text-[14px] text-slate-500">Informasi lengkap pekerjaan dan progress pengerjaan.</p>
      </div>
      <StatusBadge status={job?.status || "Assigned"} />
    </div>
    <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <h2 className="mb-6 text-[20px] font-extrabold">Informasi Job</h2>
      <div className="grid gap-x-10 gap-y-1 text-[14px] lg:grid-cols-2">
        {info.map(([label, value]) => <div className="grid grid-cols-[170px_1fr] items-start border-b border-slate-100 py-4" key={label}>
          <span className="text-slate-500">{label}</span>
          <b className={`text-right leading-6 ${label === "Jenis Kargo" ? "justify-self-end rounded-md bg-blue-50 px-2 py-0.5 text-blue-600" : ""}`}>{value}</b>
        </div>)}
      </div>
    </section>
    <JobAgentAssist job={job} />
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold">Progress Tracker</h2>
        <span className="text-[13px] font-semibold text-slate-500">Tahap 2 dari 5</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        {steps.map(([number, title, caption, classes], i) => <button key={title} onClick={i === 1 ? onHandover : undefined} className={`flex min-h-[92px] items-center gap-4 rounded-xl border p-4 text-left transition hover:shadow-sm ${classes}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[17px] font-extrabold ${i === 0 ? "bg-emerald-500 text-white" : i === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>{i === 0 ? <Check size={22} /> : number}</span>
          <span className="min-w-0 flex-1">
            <b className="block text-[15px]">{title}</b>
            <small className="mt-1 block text-[12px]">{caption}</small>
          </span>
          <ChevronRight size={17} />
        </button>)}
      </div>
      <div className="mt-7 flex justify-end">
        <button onClick={onHandover} className="primary">Lanjutkan ke Handover <ChevronRight size={14}/></button>
      </div>
    </section>
  </div>;
}

function JobAgentAssist({ job }: { job: Job | null }) {
  const checks = [
    ["Lane History", "CGK domestic handover normal, no late pattern"],
    ["Carrier Capacity", "Space confirmed, SLA next-flight available"],
    ["Approval", job?.status === "Has Issue" ? "Sales Executive review required" : "Within field-agent policy"],
  ];

  return <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">AI Assist</p>
        <h2 className="mt-1 text-[18px] font-extrabold">Operational intelligence untuk {no(job)}</h2>
        <p className="mt-1 text-[12px] text-slate-500">Membantu field agent melihat konteks quote, kapasitas, dan approval tanpa mengubah tahap kerja lama.</p>
      </div>
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">Policy-aware</span>
    </div>
    <div className="grid gap-3 lg:grid-cols-3">
      {checks.map(([title, value]) => <div key={title} className="rounded-xl border border-slate-100 bg-[#fbfdff] p-4">
        <p className="text-[11px] font-semibold text-slate-500">{title}</p>
        <b className="mt-2 block text-[13px] leading-5">{value}</b>
      </div>)}
    </div>
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-[12px] leading-5 text-amber-800">
      Quote estimate: <b>IDR 18.600.000 all-in</b>. Human approval tetap diperlukan sebelum perubahan tarif atau eskalasi exception disimpan.
    </div>
  </section>;
}
function Handover({ job, back, next }: { job: Job | null; back: () => void; next: () => void }) {
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracy: number; recordedAt: Date } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [recording, setRecording] = useState(true);
  const recordGps = () => {
    setRecording(true); setGpsError("");
    if (!navigator.geolocation) { setGpsError("GPS tidak tersedia pada perangkat ini."); setRecording(false); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { const coordinates = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`; if (job) job.location = coordinates; setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, recordedAt: new Date() }); setRecording(false); },
      (error) => { const message = error.code === error.PERMISSION_DENIED ? "Izin lokasi ditolak. Aktifkan izin lokasi lalu klik Refresh GPS." : error.code === error.TIMEOUT ? "Pengambilan lokasi melebihi 10 detik. Klik Refresh GPS untuk mencoba lagi." : "GPS gagal direkam. Pastikan layanan lokasi aktif lalu klik Refresh GPS."; setGpsError(message); setRecording(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };
  // GPS hanya direkam saat form Handover pertama kali dibuka.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(recordGps, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    const handoverInput = document.querySelectorAll<HTMLInputElement>("input")[5];
    const handoverMapButton = document.querySelector<HTMLButtonElement>("button.ml-2.rounded.border.border-slate-200.bg-blue-50");
    handoverInput?.removeAttribute("readonly");
    const syncLocation = () => {
      const value = handoverInput?.value.trim() || "";
      if (job) job.location = value;
    };
    const openTypedLocation = () => {
      syncLocation();
      const query = handoverInput?.value.trim();
      if (query) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    };
    const onLocationKeyDown = (event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); openTypedLocation(); } };
    handoverInput?.addEventListener("input", syncLocation);
    handoverInput?.addEventListener("keydown", onLocationKeyDown);
    handoverMapButton?.addEventListener("click", openTypedLocation);
    return () => { handoverInput?.removeEventListener("input", syncLocation); handoverInput?.removeEventListener("keydown", onLocationKeyDown); handoverMapButton?.removeEventListener("click", openTypedLocation); };
    const initialLocation = job?.location || "Kantor PT DSV, Jakarta";
    const locationInput = document.querySelectorAll<HTMLInputElement>("input")[5];
    const mapButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("🗺"));
    locationInput?.removeAttribute("readonly");
    if (locationInput?.value === initialLocation) locationInput.value = "";
    const openMap = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationInput?.value || initialLocation)}`, "_blank", "noopener,noreferrer");
    const handleLocationKey = (event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); openMap(); } };
    const mapsButton = mapButton ?? document.querySelector<HTMLButtonElement>("button.ml-2.rounded.border.border-slate-200.bg-blue-50");
    mapsButton?.addEventListener("click", openMap);
    locationInput?.addEventListener("keydown", handleLocationKey);
    return () => { mapsButton?.removeEventListener("click", openMap); locationInput?.removeEventListener("keydown", handleLocationKey); };
  }, [gps, job]);
  const timestamp = gps?.recordedAt.toLocaleString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\//g, "-").replace(",", "") + " WIB";
  return <div className="max-w-[1050px] bg-[#f7fafc] px-5 pb-6"><h1 className="pt-4 text-[18px] font-extrabold">Handover</h1><p className="mb-4 text-[11px] text-slate-500">Isi data penyerah dan penerima serta data aktual kargo.</p><div className="grid grid-cols-2 gap-4"><PersonCard title="Data Penyerah" dot="bg-blue-600" name="Budi Santoso" /><PersonCard title="Data Penerima" dot="bg-emerald-500" name="Andi Pratama" /></div><section className="form-card mt-5"><h2>Detail Handover</h2><div className="grid grid-cols-2 gap-4"><Field label="Waktu Serah Terima *" value="7 Oct 2026, 10:30" /><div><label>Lokasi Serah Terima *</label><button onClick={recordGps} className="float-right text-[10px] font-bold text-blue-600"><MapPin size={11} className="inline text-red-500"/> Gunakan Lokasi Saat Ini</button><div className="flex"><input value={job?.location || "Kantor PT DSV, Jakarta"} readOnly/><button className="ml-2 rounded border border-slate-200 bg-blue-50 px-3">🗺️</button></div></div></div></section><section className="form-card mt-5"><h2>Data Kargo Aktual</h2><div className="grid grid-cols-2 gap-4"><Field label="Jumlah Koli (Pieces) *" value="10" /><Field label="Berat Aktual (kg) *" value="250" /></div></section><section className="mt-5 rounded-[18px] border border-[#e4eaf2] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3"><span className="grid h-[43px] w-[43px] place-items-center rounded-xl bg-[#eef7ff] text-blue-600"><MapPin size={24}/></span><div className="flex-1"><h2 className="text-[16px] font-extrabold">Perekaman Otomatis Lokasi GPS &amp; Timestamp Handover</h2><p className="text-[11px] text-slate-500">Terekam otomatis saat Handover dibuka untuk keabsahan berita acara (US-A3-013)</p></div><button onClick={recordGps} disabled={recording} className="rounded-xl border border-blue-100 bg-[#f4faff] px-4 py-2 text-[11px] font-bold text-blue-600 disabled:opacity-60">⟳ {recording ? "Merekam GPS..." : "Refresh GPS"}</button><button onClick={() => { setGps(null); setGpsError("Simulasi GPS gagal. Klik Refresh GPS untuk merekam ulang."); }} className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-[11px] font-bold text-red-500">Simulasi GPS Gagal</button></div><div className="mt-5 grid grid-cols-3 gap-3">{[["Koordinat Satelit:", gps ? `${gps.latitude.toFixed(5)},  ${gps.longitude.toFixed(5)}` : recording ? "Merekam lokasi..." : "GPS belum tersedia", gps ? `Akurasi: ±${gps.accuracy.toFixed(1)} meter` : gpsError || "Menunggu izin lokasi"],["Waktu Aktual Handover:", gps ? timestamp : "—", gps ? "◉ Timestamp Tersertifikasi" : "Menunggu rekaman GPS"],["Fasilitas / Terminal:", "Terminal Kargo Domestik Lini 1 Bandara Soekarno-Hatta (CGK)", ""]].map(([label, value, sub]) => <div key={label} className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-4"><p className="text-[11px] font-medium text-slate-500">{label}</p><b className="mt-2 block text-[14px] leading-6">{value}</b><small className={label.startsWith("Waktu") && gps ? "mt-1 block text-[11px] font-bold text-emerald-500" : "mt-1 block text-[11px] text-slate-500"}>{sub}</small></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><p className={`text-[11px] font-bold ${gps ? "text-emerald-600" : "text-red-500"}`}><AlertTriangle className="mr-2 inline" size={17}/>{gps ? "GPS berhasil direkam. Anda dapat melanjutkan ke dokumentasi." : "Tombol lanjut terkunci: Lengkapi seluruh nama pihak, koli, berat, dan pastikan GPS berhasil direkam."}</p><button onClick={next} disabled={!gps} className="primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">Simpan &amp; Lanjut ke Dokumentasi <ChevronRight size={17}/></button></div></section><div className="mt-5 flex justify-end"><button onClick={back} className="secondary">Kembali</button></div></div>;
}
function PersonCard({ title, dot, name }: { title: string; dot: string; name: string }) { return <section className="form-card !p-4"><h2><i className={`mr-1 inline-block h-2 w-2 rounded-full ${dot}`} />{title}</h2><Field label="Nama Penyerah *" value={name} /><Field label="Perusahaan *" value="PT DSV Transport Indonesia" /></section>; }
function Field({ label, value }: { label: string; value: string }) { const isAutomaticTime = label.startsWith("Waktu Serah Terima"); const [selectedAt] = useState(() => new Date()); const [date, setDate] = useState(() => selectedAt.toISOString().slice(0, 10)); const [time, setTime] = useState(() => selectedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })); if (isAutomaticTime) return <div className="mb-3"><label>{label}</label><div className="grid grid-cols-2 gap-2"><input aria-label="Tanggal handover" type="date" value={date} onChange={event => setDate(event.target.value)} className="h-10 !rounded-[11px] !border-slate-200 !px-3 !text-[15px] font-semibold focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-100" /><input aria-label="Jam handover" type="time" value={time} onChange={event => setTime(event.target.value)} className="h-10 !rounded-[11px] !border-blue-500 !px-3 !text-[15px] font-semibold focus:!ring-2 focus:!ring-blue-100" /></div></div>; return <div className="mb-3"><label>{label}</label><input defaultValue={value} /></div>; }

function Documentation({ back, next }: { back: () => void; next: () => void }) {
  const photoLabels = ["Keseluruhan Barang (Overall)", "Marking & Shipping Label", "Seal / Segel Pengaman", "Area Kerusakan / Kondisi Fisik"];
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [docs, setDocs] = useState<Record<string, string | null>>({ packing: null, invoice: null });
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<{ title: string; name: string } | null>(null);
  const filledPhotos = photos.filter(Boolean).length;
  const ready = filledPhotos === 4 && Boolean(docs.packing) && Boolean(docs.invoice);
  const setPhoto = (index: number, file?: File) => {
    if (file && file.size > 2 * 1024 * 1024) { setUploadError("Ukuran foto maksimal 2 MB per slot."); return; }
    setUploadError("");
    setPhotos(current => current.map((item, i) => i === index ? file?.name || `Foto inspeksi ${index + 1}.jpg` : item));
  };
  const clearPhoto = (index: number) => setPhotos(current => current.map((item, i) => i === index ? null : item));
  const setDoc = (key: "packing" | "invoice", file?: File) => {
    if (file && file.size > 10 * 1024 * 1024) { setUploadError("Ukuran dokumen maksimal 10 MB per berkas."); return; }
    setUploadError("");
    setDocs(current => ({ ...current, [key]: file?.name || (key === "packing" ? "PackingList_DSV.pdf" : "Invoice_DSV.pdf") }));
  };
  const clearDoc = (key: "packing" | "invoice") => setDocs(current => ({ ...current, [key]: null }));

  return <div className="w-full bg-[#f7fbff] pb-7">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[24px] font-extrabold tracking-tight">JOB-2026-10-8824</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">Normal</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">In Progress</span>
        </div>
        <p className="mt-2 text-[12px] text-slate-600">Customer: PT Nusantara Global Logistik <span className="mx-2 text-slate-300">|</span> Penugasan: 2026-10-07 08:30 WIB</p>
      </div>
    </div>

    <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between text-[12px] font-extrabold">
        <span className="flex items-center gap-2"><Info size={18} className="text-sky-500" /> INFORMASI TASK KARGO (READ-ONLY DARI SALES EXECUTIVE)</span>
        <span className="font-semibold text-slate-500">US-A3-0095 &amp; US-A3-0103</span>
      </div>
      <div className="grid gap-4 text-[12px] lg:grid-cols-5">
        {[["Sales Executive (SE)", "Kavin Sanjaya (SE-23)"], ["Project / Department", "PT Indoluxor CDE - Sukses Makmur"], ["Customer / Penerima", "PT Sumber Alfaria Trijaya Subs..."], ["BE / PO / INV #", "12B-0051-0346"], ["Rencana Tgl. Tiba", "12 Oktober 2026"]].map(([label, value]) => <div className="border-r border-blue-100 last:border-0" key={label}><p className="text-slate-500">{label}</p><b className="mt-1 block leading-5">{value}</b></div>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-blue-300 bg-blue-50/40 p-4">
          <div className="mb-3 flex items-center justify-between"><b className="text-[13px] text-blue-700">RENCANA SALES EXECUTIVE (PICK-ALERT)</b><button className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">Lihat Detail</button></div>
          <p className="text-[12px] text-slate-600">Rencana Lokasi: <b className="text-slate-900">Gudang Cengkareng, Jl. Mutiara Soedarmo No.12</b></p>
          <p className="mt-2 text-[12px] text-slate-600">Rencana Waktu: <b className="text-slate-900">2026-10-08 08:30 WIB</b></p>
          <p className="mt-2 text-[12px] text-slate-600">Durasi Pick/Drop: <b className="text-slate-900">2,5 PKG</b> <span className="mx-2">|</span> <b className="text-slate-900">375 Kg</b></p>
        </div>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-4">
          <div className="mb-3 flex items-center justify-between"><b className="text-[13px] text-emerald-700">REALISASI LAPANGAN (AKTUAL HANDOVER)</b><span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">Terealisasi</span></div>
          <p className="text-[12px] text-slate-600">Lokasi: <b className="text-slate-900">Jl. Raya Daan Mogot, Kec. Cengkareng, Jakarta Barat 11730 (CGK)</b></p>
          <p className="mt-2 text-[12px] text-slate-600">Tgl. Handover: <b className="text-slate-900">08-10-2026 10:15 WIB</b></p>
          <p className="mt-2 text-[12px] text-slate-600">Berat Aktual: <b className="text-slate-900">2,5 PKG</b> <span className="mx-2">|</span> <b className="text-slate-900">375 Kg</b></p>
        </div>
      </div>
    </section>

    <section className="mt-5 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex justify-between"><h2 className="text-[15px] font-extrabold">Progress Tracker Alur Kerja (US-A3-0101)</h2><span className="text-[13px] text-slate-500">Tahap 2 dari 3</span></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[["1", "Handover", "Selesai (5/5) eksekusi", "emerald"], ["2", "Dokumentasi", `Terisi wajib (${filledPhotos}/4) foto`, "blue"], ["3", "Verifikasi", "3 eksekusi menunggu", "slate"]].map(([num, title, sub, tone]) => <div key={title} className={`flex items-center gap-4 rounded-xl border p-4 ${tone === "emerald" ? "border-emerald-400 bg-emerald-50" : tone === "blue" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}>
          <span className={`grid h-11 w-11 place-items-center rounded-full font-extrabold text-white ${tone === "emerald" ? "bg-emerald-500" : tone === "blue" ? "bg-blue-600" : "bg-slate-200 text-slate-500"}`}>{tone === "emerald" ? <Check size={21} /> : num}</span>
          <span className="flex-1"><b className="block">{title}</b><small className={tone === "emerald" ? "text-emerald-600" : tone === "blue" ? "text-blue-600" : "text-slate-500"}>{sub}</small></span>
          <ChevronRight size={17} className="text-slate-400" />
        </div>)}
      </div>
    </section>

    <section className="mt-5 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[13px] font-extrabold uppercase text-blue-700">Tahap 2 dari 3: Dokumentasi Visual &amp; Dokumen</p><h2 className="mt-1 text-[22px] font-extrabold">4 Slot Foto Wajib &amp; Berkas Mustan</h2><p className="mt-1 text-[13px] text-slate-600">Upload 4 foto wajib dan dokumen pengajuan hasil, serta sebelum verifikasi (5/5 slot, 1,5-4,0 MB).</p></div>
          <span className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] font-extrabold text-amber-700"><Camera size={16} className="mr-2 inline" />Foto Wajib, {filledPhotos}/4 Terisi</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[14px] font-extrabold">4 Slot Foto Wajib Inspeksi Lapangan (Maks. 2 MB/Foto)</h3>
        <p className="mt-1 text-[12px] text-slate-500">Format JPG, PNG / Maks. 2 MB per foto, pastikan gambar jelas, tidak blur, dan sesuai sudut yang diminta.</p>
        {uploadError && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600"><AlertTriangle size={14} className="mr-2 inline" />{uploadError}</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {photoLabels.map((label, i) => <div key={label} className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2"><b className="text-[12px]">{i + 1}. {label}</b><button type="button" onClick={() => clearPhoto(i)} className="grid h-7 w-7 place-items-center rounded-md text-red-500 hover:bg-red-50" title="Hapus foto"><Trash2 size={14}/></button></div>
            <div className={`grid h-[132px] place-items-center rounded-lg border text-center ${photos[i] ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="px-4">
                <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${photos[i] ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{photos[i] ? <Check size={22}/> : <Camera size={22}/>}</span>
                <p className="mt-3 line-clamp-2 text-[11px] text-slate-500">{photos[i] || ["Tampak posisi keseluruhan barang, jelas dan termasuk area.", "Nomor AWB, label, dan marking terpampang dengan jelas.", "Nomor segel, kondisi segel, dan keasliannya terlihat jelas.", "Tampak kondisi fisik barang seperti goresan, penyok, atau kerusakan lain."][i]}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_68px] gap-2">
              <label className="grid h-9 cursor-pointer place-items-center rounded-lg bg-[#061833] text-[12px] font-extrabold text-white"><span><Upload size={14} className="mr-2 inline" />Pilih Foto</span><input type="file" accept="image/*" className="sr-only" onChange={event => setPhoto(i, event.target.files?.[0])} /></label>
              <button type="button" onClick={() => setPhoto(i)} className="grid h-9 place-items-center rounded-lg bg-blue-50 text-[12px] font-extrabold text-blue-600 transition hover:bg-blue-100"><span><RefreshCw size={14} className="mr-1 inline" />Swap</span></button>
            </div>
          </div>)}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 p-4">
        <h3 className="text-[15px] font-extrabold">Dokumen Mustan Wajib (Packing List &amp; Commercial Invoice)</h3>
        <p className="mt-1 text-[12px] text-slate-500">Format PDF/JPG/PNG/PDF, maks. 10 MB per berkas.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[["packing", "Packing List (PL)", "Upload Packing List"], ["invoice", "Commercial Invoice", "Upload Invoice"]].map(([key, title, upload]) => <div key={key} className="rounded-xl border border-blue-100 bg-[#fbfdff] p-4">
            <div className="mb-3 flex items-center justify-between"><b className="text-[13px]"><FileText size={15} className="mr-2 inline text-blue-600" />{title} <span className="text-red-500">*</span></b>{docs[key] && <span className="flex items-center gap-2"><button onClick={() => setPreview({ title, name: docs[key] || "" })} className="text-[11px] font-bold text-blue-600">Preview</button><button onClick={() => clearDoc(key as "packing" | "invoice")} className="text-red-500" title="Hapus dokumen"><Trash2 size={14}/></button></span>}</div>
            <div className="grid grid-cols-[1fr_112px] gap-3">
              <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-blue-200 bg-white text-[12px] font-semibold text-slate-600"><Upload size={14} className="mr-2" />{docs[key] || upload}<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={event => setDoc(key as "packing" | "invoice", event.target.files?.[0])}/></label>
              <button type="button" onClick={() => setDoc(key as "packing" | "invoice")} className="rounded-lg bg-slate-100 text-[12px] font-bold text-slate-700 hover:bg-slate-200">Simulasi PDF</button>
            </div>
          </div>)}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-[13px] font-extrabold"><span className="rounded bg-amber-200 px-2 py-1 text-amber-800">DATA DANGEROUS GOODS (DG)</span> <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-blue-600">US-A3-0097</span></p>
        <p className="mt-3 text-[13px] font-bold">MSDS (Material Safety Data Sheet) &amp; Shipper&apos;s DG Declaration</p>
        <p className="mt-1 text-[12px] text-slate-500">Karena run DG, tidak memerlukan sertifikat keselamatan lain kecuali bila haul membawa chemical atau baterai khusus.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <button onClick={back} className="secondary"><ArrowLeft size={16}/>Kembali ke Handover</button>
        {!ready && <p className="text-[12px] font-bold text-red-500"><AlertTriangle size={15} className="mr-2 inline" />Lengkapi 4 foto wajib dan dokumen pengajuan untuk membuka tahap Verifikasi.</p>}
        <button onClick={next} disabled={!ready} className="primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none">Simpan &amp; Lanjut ke Verifikasi <ChevronRight size={14}/></button>
      </div>
    </section>
    {preview && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-5">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><b className="block">{preview.title}</b><span className="text-[12px] text-slate-500">{preview.name}</span></div>
          <button onClick={() => setPreview(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="grid min-h-[260px] place-items-center bg-slate-50 p-6 text-center">
          <div><FileText className="mx-auto text-blue-600" size={44}/><p className="mt-3 text-sm font-bold text-slate-700">Preview berkas tersedia</p><p className="mt-1 text-xs text-slate-500">Nama file dan status upload sudah tercatat untuk validasi tahap berikutnya.</p></div>
        </div>
      </div>
    </div>}
  </div>;
}

function Verification({ back, next, onIssue }: { back: () => void; next: (issueCount: number) => void; onIssue: () => void }) {
  const items = [
    ["Kesesuaian Dokumen", "Packing list, invoice, dan dokumen sesuai dengan fisik barang."],
    ["Kondisi Visual Barang", "Tidak ada kerusakan pada kemasan dan barang."],
    ["Standar Maskapai", "Sesuai dengan ketentuan maskapai untuk pengiriman."],
    ["Dangerous Goods (Jika ada)", "Label, dokumen DG, dan penanganan sesuai standar."],
    ["Special Handling (Jika ada)", "Penanganan khusus (fragile, temperature, dll) sesuai."],
  ];
  const [checked, setChecked] = useState<("unset" | "ok" | "issue")[]>(() => items.map(() => "unset"));
  const checkedCount = checked.filter(value => value !== "unset").length;
  const issueCount = checked.filter(value => value === "issue").length;
  const ready = checkedCount === items.length;
  const setVerification = (index: number, value: "ok" | "issue") => {
    setChecked(current => current.map((item, i) => i === index ? value : item));
    if (value === "issue") onIssue();
  };

  return <div className="w-full rounded-2xl bg-[#f7fafc] p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[13px] font-extrabold uppercase text-blue-700">Tahap 3 dari 3</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">Verifikasi</h1>
        <p className="mt-1 text-[14px] text-slate-500">Pastikan seluruh checklist sesuai dengan kondisi barang dan dokumen.</p>
      </div>
      <span className={`rounded-xl border px-4 py-3 text-[12px] font-extrabold ${ready && !issueCount ? "border-emerald-200 bg-emerald-50 text-emerald-700" : issueCount ? "border-red-200 bg-red-50 text-red-600" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
        <Check size={16} className="mr-2 inline" />{checkedCount}/{items.length} Checklist Siap
      </span>
    </div>

    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold">Final Checklist</h2>
          <p className="mt-1 text-[12px] text-slate-500">Pilih status setiap item secara manual. Pilihan tidak sesuai akan membuka form issue.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-600">US-A3-0101</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(([title, sub], index) => <div className={`flex min-h-[126px] w-full items-center rounded-xl border px-5 py-4 text-left transition ${checked[index] === "ok" ? "border-emerald-400 bg-emerald-50/30" : checked[index] === "issue" ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white"} ${index === items.length - 1 ? "lg:col-span-2" : ""}`} key={title}>
          <span className={`mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 ${checked[index] === "ok" ? "border-emerald-500 bg-emerald-500 text-white" : checked[index] === "issue" ? "border-red-500 bg-red-500 text-white" : "border-slate-300 bg-white text-transparent"}`}>{checked[index] === "issue" ? <AlertTriangle size={21}/> : <Check size={22}/>}</span>
          <span className="min-w-0 flex-1">
            <b className="block text-[16px]">{title}</b>
            <small className="mt-2 block text-[13px] leading-5 text-slate-500">{sub}</small>
          </span>
          <span className="ml-4 grid shrink-0 gap-2">
            <button type="button" onClick={() => setVerification(index, "ok")} className={`rounded-lg border px-3 py-2 text-[12px] font-extrabold ${checked[index] === "ok" ? "border-emerald-500 bg-emerald-500 text-white" : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"}`}>Sesuai</button>
            <button type="button" onClick={() => setVerification(index, "issue")} className={`rounded-lg border px-3 py-2 text-[12px] font-extrabold ${checked[index] === "issue" ? "border-red-500 bg-red-500 text-white" : "border-red-200 bg-white text-red-600 hover:bg-red-50"}`}>Ada Issue</button>
          </span>
        </div>)}
      </div>
    </section>

    <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-3">
        {[["Dokumen", checked[0] === "ok" ? "Sesuai" : checked[0] === "issue" ? "Ada Issue" : "Belum Dicek", "Packing list & invoice tervalidasi"], ["Foto Lapangan", checked[1] === "ok" ? "Lengkap" : checked[1] === "issue" ? "Ada Issue" : "Belum Dicek", "4 foto wajib telah diperiksa"], ["Status Akhir", ready ? issueCount ? "Perlu Eskalasi" : "Siap Submit" : "Menunggu Checklist", "Lanjut untuk menyimpan verifikasi"]].map(([label, value, sub]) => <div key={label} className="rounded-xl border border-slate-100 bg-[#fbfdff] p-4">
          <p className="text-[12px] font-semibold text-slate-500">{label}</p>
          <b className="mt-2 block text-[18px]">{value}</b>
          <small className="mt-1 block text-[12px] text-slate-500">{sub}</small>
        </div>)}
      </div>
    </section>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <button onClick={onIssue} className="rounded-xl border border-red-400 bg-red-50 px-5 py-3 text-[13px] font-extrabold text-red-500 transition hover:bg-red-100"><AlertTriangle className="mr-2 inline" size={16}/>Laporkan Finding / Issue</button>
      {issueCount > 0 && <p className="text-[12px] font-bold text-red-500"><AlertTriangle size={15} className="mr-2 inline" />{issueCount} item bertanda issue dan perlu eskalasi.</p>}
      <div className="flex gap-3">
        <button onClick={back} className="secondary"><ArrowLeft size={16}/>Kembali</button>
        <button onClick={() => next(issueCount)} disabled={!ready} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgb(225_29_72_/_0.28)] transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none ${issueCount > 0 ? "bg-rose-600 hover:bg-rose-700" : "bg-[#2864e8] hover:bg-[#1e55cc]"}`}><Send size={16}/>{issueCount > 0 ? "Kirim Laporan (Has Issue)" : "Kirim Laporan"}</button>
      </div>
    </div>
  </div>;
}

function ReportConfirmModal({ job, issueCount, close, confirm, saving }: { job: Job | null; issueCount: number; close: () => void; confirm: () => void; saving: boolean }) {
  const hasIssue = issueCount > 0;

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-5">
    <div className="w-full max-w-[768px] overflow-hidden rounded-[26px] bg-white shadow-2xl">
      <div className={`flex items-center gap-5 border-b px-8 py-9 ${hasIssue ? "border-rose-100 bg-rose-50" : "border-blue-100 bg-blue-50"}`}>
        <span className={`grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[18px] text-white ${hasIssue ? "bg-rose-600" : "bg-blue-600"}`}>
          {hasIssue ? <AlertTriangle size={31} strokeWidth={3} /> : <Send size={31} strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-slate-500">Penyelesaian Task (US-A3-021 &amp; US-A3-022)</p>
          <h2 className="mt-2 text-[25px] font-extrabold tracking-tight text-slate-950">Konfirmasi Pengiriman Laporan{hasIssue ? " (Has Issue)" : ""}</h2>
        </div>
        <button onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/70 hover:text-slate-700" title="Tutup"><X size={26}/></button>
      </div>

      <div className="space-y-6 px-9 py-9">
        <div className={`rounded-[18px] border px-6 py-6 ${hasIssue ? "border-rose-200 bg-rose-50/70" : "border-blue-200 bg-blue-50/70"}`}>
          <div className="flex items-start gap-4">
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${hasIssue ? "border-rose-600 text-rose-700" : "border-blue-600 text-blue-700"}`}>{hasIssue ? <AlertTriangle size={18} strokeWidth={3}/> : <Info size={18} strokeWidth={3}/>}</span>
            <div>
              <h3 className={`text-[18px] font-extrabold ${hasIssue ? "text-rose-900" : "text-blue-950"}`}>Pemberitahuan Status {hasIssue ? "\"Has Issue\" (US-A3-025)" : "Laporan Final"}</h3>
              {hasIssue ? <div className="mt-3 text-[16px] leading-7 text-slate-600">
                <p>Terdapat <b className="text-slate-800">{issueCount} temuan issue</b> pada kargo ini. Setelah dikonfirmasi:</p>
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  <li>Status tugas berubah menjadi <b>Has Issue</b>.</li>
                  <li>Notifikasi darurat dan data finding otomatis masuk ke antrean <b>Need Backup Sales Executive (A2)</b>.</li>
                  <li>Seluruh data menjadi <i>read-only</i> dan tercatat di Audit Trail.</li>
                </ul>
              </div> : <p className="mt-3 text-[16px] leading-7 text-slate-600">Laporan job <b className="text-slate-800">{no(job)}</b> akan dikirim ke Sales Executive dan masuk ke Job History setelah diproses.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-6 py-5 text-[15px] leading-8 text-slate-600">
          <p className="mb-2 font-extrabold text-slate-800">Ringkasan Berkas yang Akan Dikirim:</p>
          <div className="flex justify-between gap-4"><span>Foto Dokumentasi Wajib:</span><b className="text-emerald-700">4 / 4 Slot Terisi</b></div>
          <div className="flex justify-between gap-4"><span>Dokumen Pengapalan (PL &amp; Invoice):</span><b className="text-emerald-700">Lengkap</b></div>
          <div className="flex justify-between gap-4"><span>Koordinat Lokasi Handover:</span><b className="text-slate-800">{job?.location?.includes(",") ? job.location : "-6.1252, 106.6562"}</b></div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-100 bg-slate-50 px-6 py-6">
        <button onClick={close} className="secondary h-[52px] min-w-[116px] justify-center text-[14px]">Kembali</button>
        <button onClick={confirm} disabled={saving} className="flex h-[54px] min-w-[294px] items-center justify-center gap-3 rounded-2xl bg-rose-600 px-6 text-[16px] font-extrabold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          <Send size={23}/>{saving ? "Mengirim..." : "Kirim & Selesaikan Task"}
        </button>
      </div>
    </div>
  </div>;
}

function ReportProcessingModal({ issueCount }: { issueCount: number }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-5">
    <div className="w-full max-w-[460px] rounded-[24px] bg-white px-8 py-9 text-center shadow-2xl">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <RefreshCw className="animate-spin" size={34} strokeWidth={3}/>
      </span>
      <h2 className="mt-5 text-[24px] font-extrabold tracking-tight text-slate-950">Processing Pengiriman</h2>
      <p className="mt-3 text-[14px] leading-6 text-slate-500">{issueCount > 0 ? "Mengunci laporan Has Issue, mengirim notifikasi Sales Executive, dan menyimpan Audit Trail." : "Mengirim laporan final, memperbarui status job, dan menyimpan Audit Trail."}</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-rose-600" />
      </div>
    </div>
  </div>;
}

function CompleteTaskModal({ job, issueCount, openHistory }: { job: Job | null; issueCount: number; openHistory: () => void }) {
  const timestamp = new Date().toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(" ", " ") + " WIB";
  const hasIssue = issueCount > 0;

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-5">
    <div className="w-full max-w-[768px] overflow-hidden rounded-[26px] bg-white shadow-2xl">
      <div className={`flex items-center gap-5 border-b px-8 py-9 ${hasIssue ? "border-rose-100 bg-rose-50" : "border-emerald-100 bg-emerald-50"}`}>
        <span className={`grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[18px] text-white ${hasIssue ? "bg-rose-600" : "bg-emerald-600"}`}>
          {hasIssue ? <AlertTriangle size={31} strokeWidth={3} /> : <Check size={31} strokeWidth={3} />}
        </span>
        <div>
          <p className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-slate-500">Penyelesaian Task (US-A3-021 &amp; US-A3-022)</p>
          <h2 className="mt-2 text-[25px] font-extrabold tracking-tight text-slate-950">{hasIssue ? "Laporan Has Issue Berhasil Terkirim!" : "Laporan Berhasil Terkirim!"}</h2>
        </div>
      </div>

      <div className="space-y-6 px-9 py-9">
        <div className={`rounded-[18px] border px-6 py-6 ${hasIssue ? "border-rose-200 bg-rose-50/70" : "border-emerald-200 bg-emerald-50/70"}`}>
          <div className="flex items-start gap-4">
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${hasIssue ? "border-rose-600 text-rose-700" : "border-emerald-600 text-emerald-700"}`}>{hasIssue ? <AlertTriangle size={18} strokeWidth={3}/> : <Check size={18} strokeWidth={3}/>}</span>
            <div>
              <h3 className={`text-[22px] font-extrabold ${hasIssue ? "text-rose-950" : "text-emerald-950"}`}>Status Job Berhasil Diperbarui</h3>
              <p className="mt-3 text-[16px] leading-7 text-slate-600">Job <b className="text-slate-800">{no(job)}</b> kini berstatus <b className={hasIssue ? "text-rose-700" : "text-emerald-700"}>{hasIssue ? "Has Issue" : "Completed"}</b>. {hasIssue ? "Finding sudah dikirim ke Sales Executive dan masuk antrean tindak lanjut." : "Berita acara serah terima dan 4 foto wajib telah diarsipkan secara permanen dan dikirimkan ke Sales Executive."}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-6 py-5 font-mono text-[15px] leading-7 text-slate-600">
          <p>Nomor Job: <span className="ml-2">{no(job)}</span></p>
          <p>MAWB: <span className="ml-8">{mawb(job || sampleJobs[0])}</span></p>
          <p>Actual Koli: 25 Pcs | Gross: 375 Kg</p>
          <p>GPS: {job?.location?.includes(",") ? job.location : "-6.1253, 106.6560"}</p>
          <p>Timestamp: {timestamp}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-6">
        <button onClick={openHistory} className="flex h-[54px] w-full items-center justify-center gap-3 rounded-2xl bg-[#10182d] text-[16px] font-extrabold text-white shadow-sm transition hover:bg-[#17213b]">
          Buka Rekapitulasi &amp; Job History <ChevronRight size={24}/>
        </button>
      </div>
    </div>
  </div>;
}

function HistoryList({ jobs, filter, query, setFilter, setQuery, openJob }: { jobs: Job[]; filter: string; query: string; setFilter: (v: string) => void; setQuery: (v: string) => void; openJob: (job: Job) => void }) { return <div className="min-h-[calc(100vh-112px)] w-full rounded-2xl bg-[#f7fafc] px-7 pb-8 pt-6"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[24px] font-extrabold">Job History</h1><p className="mt-1 text-[13px] text-slate-500">Lihat daftar pekerjaan yang sudah diselesaikan.</p></div><span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-[12px] font-bold text-blue-600">Rekapitulasi Field Agent</span></div><Tabs filter={filter === "In Progress" || filter === "Assigned" ? "All" : filter} counts={{ All: 20, Assigned: 0, "In Progress": 0, Completed: 15, "Has Issue": 3 }} setFilter={setFilter} /><div className="max-w-[760px]"><Searchbar query={query} setQuery={setQuery} /></div><JobsTable jobs={jobs.filter(j => j.status === "Completed" || j.status === "Has Issue")} action={openJob} history /></div>; }

function IssueModal({ category, description, setCategory, setDescription, close, save, saving }: { category: string; description: string; setCategory: (x: string) => void; setDescription: (x: string) => void; close: () => void; save: () => void; saving: boolean }) {
  const [classification, setClassification] = useState("Non-Urgent");
  const [evidence, setEvidence] = useState("");

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><b className="block">Report Issue / Finding</b><span className="text-[11px] text-slate-500">Temuan akan dicatat untuk eskalasi Sales Executive.</span></div>
        <button onClick={close}><X size={17}/></button>
      </div>
      <div className="space-y-4 p-5">
        <label className="block text-xs font-bold">Issue Category *<select value={category} onChange={e => setCategory(e.target.value)} className="mt-2 w-full rounded border border-slate-200 p-2 text-sm font-normal"><option>Damaged Package</option><option>Missing Package</option><option>Document Discrepancy</option><option>DG / Special Handling</option><option>Other</option></select></label>
        <label className="block text-xs font-bold">Classification *<select value={classification} onChange={e => setClassification(e.target.value)} className="mt-2 w-full rounded border border-slate-200 p-2 text-sm font-normal"><option>Non-Urgent</option><option>Urgent</option></select></label>
        <label className="block text-xs font-bold">Description *<textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-2 min-h-24 w-full rounded border border-slate-200 p-2 text-sm font-normal" placeholder="Jelaskan issue yang ditemukan..." /></label>
        <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50"><Camera size={20}/>{evidence || "Tambah foto bukti (maks. 2 MB)"}<input className="sr-only" type="file" accept="image/*" onChange={event => setEvidence(event.target.files?.[0]?.name || "")} /></label>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">Status job dapat menjadi Has Issue jika temuan disimpan.</div>
        <div className="flex gap-3"><button onClick={close} className="secondary flex-1">Batal</button><button disabled={saving || !description.trim()} onClick={save} className="primary flex-1 justify-center disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none">{saving ? "Menyimpan..." : "Simpan Issue"}</button></div>
      </div>
    </div>
  </div>;
}
