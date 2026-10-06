"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";
import {
  Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronRight, Download,
  FileText, LogOut, Search, Settings, Sun, UserRound, UsersRound, X,
} from "lucide-react";
import { MOCK_SALES_USER } from "@/lib/supabase/mock-data";
import type { ApiResponse, CustomerDetailItem, CustomerListItem, MeetingDay } from "@/types/customer";
import type { SalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

interface Props {
  initialCustomers: CustomerListItem[];
  metrics: SalesExecutiveMetrics;
}

interface WeeklyMeeting { customer: CustomerListItem; date: Date; time: string }
interface StoredUser { name?: string; role?: string; email?: string }

const meetingDayNumbers: Record<MeetingDay, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
};
// Squad A2 owns the authoritative Field Agent list; do not seed A1-side names.
const fieldAgents: string[] = [];

function dateFromDatabase(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getWeeklyMeetings(customers: CustomerListItem[]): WeeklyMeeting[] {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return customers.flatMap((customer) => (customer.meetings || []).flatMap((schedule) => {
    let date: Date;
    if (schedule.scheduleType === "one_day") {
      if (!schedule.meetingDate) return [];
      date = dateFromDatabase(schedule.meetingDate);
    } else {
      const offset = (meetingDayNumbers[schedule.meetingDay] + 6) % 7;
      date = new Date(monday);
      date.setDate(monday.getDate() + offset);
    }
    const dayFromMonday = Math.round((date.getTime() - monday.getTime()) / 86_400_000);
    const effectiveStart = schedule.effectiveStartDate ? dateFromDatabase(schedule.effectiveStartDate) : null;
    if (schedule.status === "cancelled" || dayFromMonday < 0 || dayFromMonday > 6 || (effectiveStart && date < effectiveStart)) return [];
    return [{ customer, date, time: schedule.startTime?.slice(0, 5) || "09:00" }];
  })).sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
}

function downloadExport(customers: CustomerListItem[], format: "xlsx" | "pdf") {
  const headers = ["Customer Code", "Job Number", "Company", "PIC", "PIC Phone Number"];
  const values = customers.map((customer) => [
    customer.customerCode || "", customer.jobNumber || "", customer.companyName,
    customer.primaryPic?.fullName || "", customer.primaryPic?.phoneNumber || "",
  ]);
  if (format === "xlsx") {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...values]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Company Records");
    XLSX.writeFile(workbook, "sales-executive-company-records.xlsx");
    return;
  }
  const escapePdf = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const commands = ["BT", "/F1 9 Tf", "40 800 Td", "12 TL", `(${escapePdf(headers.join(" | "))}) Tj`, "T*"];
  for (const row of values) commands.push(`(${escapePdf(row.join(" | ").slice(0, 150))}) Tj`, "T*");
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sales-executive-company-records.pdf";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DetailInfoCard({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  return <section className="min-h-64 rounded-lg border border-slate-200 p-5 sm:p-6"><h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3><dl className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 text-sm"><dt className="text-slate-400">{label}</dt><dd className="text-right font-semibold text-[#1e3158]">{value || "—"}</dd></div>)}</dl></section>;
}

export function SalesExecutiveDashboard({ initialCustomers, metrics }: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(metrics.totalCustomers ?? initialCustomers.length);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil((metrics.totalCustomers ?? initialCustomers.length) / 5)));
  const [profileOpen, setProfileOpen] = useState(false);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const today = new Date();
  const initialEndDate = new Date(today);
  initialEndDate.setDate(today.getDate() + 5);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"xlsx" | "pdf">("xlsx");
  const [exportStart, setExportStart] = useState(localDateValue(today));
  const [exportEnd, setExportEnd] = useState(localDateValue(initialEndDate));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetailItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [appliedAgent, setAppliedAgent] = useState("all");
  const [profile, setProfile] = useState<StoredUser>({ name: MOCK_SALES_USER.name, role: MOCK_SALES_USER.role });

  useEffect(() => {
    try {
      const value = localStorage.getItem("andima_user");
      if (value) setProfile((current) => ({ ...current, ...JSON.parse(value) as StoredUser }));
    } catch { /* Keep the dashboard's default profile. */ }
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ search: keyword, page: String(page), perPage: "5" });
        const response = await fetch(`/api/v1/customers?${params}`, { signal: controller.signal });
        const result: ApiResponse<CustomerListItem[]> = await response.json();
        if (!response.ok || !result.success) throw new Error(result.success ? "Customer search failed." : result.message);
        setCustomers(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setTotalPages(result.meta?.totalPages ?? 1);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Customer search failed.");
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, keyword ? 300 : 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [search, page]);

  const openCustomerDetail = async (customerId: string) => {
    setDetailCustomer(null);
    setDetailError("");
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await fetch(`/api/v1/customers/${customerId}`);
      const result: ApiResponse<CustomerDetailItem> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Could not load company details." : result.message);
      setDetailCustomer(result.data);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Could not load company details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const runExport = async () => {
    if (exportStart > exportEnd) {
      setExportError("The start date must be on or before the end date.");
      return;
    }
    setExporting(true);
    setExportError("");
    try {
      const params = new URLSearchParams({ from: exportStart, to: exportEnd, search: search.trim() });
      const response = await fetch(`/api/v1/transactions/export?${params}`);
      const result: ApiResponse<CustomerListItem[]> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Could not load company records for export." : result.message);
      if (!result.data.length) {
        setExportError("No company records were created in the selected date range.");
        return;
      }
      downloadExport(result.data, exportFormat);
      setExportOpen(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const weeklyMeetings = useMemo(() => getWeeklyMeetings(initialCustomers).slice(0, 2), [initialCustomers]);
  const filteredAgents = fieldAgents.filter((agent) => agent.toLowerCase().includes(agentSearch.toLowerCase()));
  const firstRow = total === 0 ? 0 : (page - 1) * 5 + 1;
  const lastRow = Math.min(page * 5, total);
  const displayName = profile.name || MOCK_SALES_USER.name;

  const logout = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem("andima_user"); } catch { /* Ignore unavailable storage. */ }
    router.push("/login");
  };

  return <div className="mx-auto w-full max-w-[1280px]">
    <div className="mb-10 flex min-h-9 items-center justify-between gap-6">
      <p className="text-xs text-slate-500">CRM <span className="px-1 text-slate-300">/</span><span className="text-blue-600 underline underline-offset-2">SALES EXECUTIVE</span></p>
      <div className="relative flex items-center gap-4 text-slate-500">
        <button aria-label="Display settings" className="hidden sm:block"><Sun className="h-4 w-4" /></button>
        <button aria-label="Notifications" className="relative hidden sm:block"><Bell className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" /></button>
        <button type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-md p-1 text-left hover:bg-slate-50">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">{displayName.slice(0, 1).toUpperCase()}</span>
          <span className="hidden text-[11px] leading-tight sm:block"><span className="block font-semibold text-slate-800">{displayName}</span><span>{profile.role || MOCK_SALES_USER.role}</span></span>
          <ChevronDown aria-hidden="true" className="ml-1 h-3 w-3" />
        </button>
        {profileOpen && <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
          <div className="mb-1 flex items-center gap-2 border-b border-slate-100 px-2 pb-2">
            <Sun className="h-4 w-4 text-slate-400" /><Bell className="h-4 w-4 text-slate-400" /><span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">{displayName.slice(0, 1).toUpperCase()}</span><span className="min-w-0 text-xs"><b className="block truncate text-slate-800">{displayName}</b><span>{profile.role || MOCK_SALES_USER.role}</span></span><ChevronDown className="h-3 w-3" />
          </div>
          <button type="button" onClick={() => { setSelectedAgent(appliedAgent); setAgentPickerOpen(true); setProfileOpen(false); }} className="flex w-full items-center justify-between rounded-lg border border-blue-300 px-2 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><span className="flex items-center gap-2"><UsersRound className="h-4 w-4" />View Field Agent</span><ChevronRight className="h-4 w-4" /></button>
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600"><UserRound className="h-4 w-4 text-slate-400" />Profile</div>
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600"><Settings className="h-4 w-4 text-slate-400" />Settings</div>
          <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-rose-500 hover:bg-rose-50"><LogOut className="h-4 w-4" />Logout</button>
        </div>}
      </div>
    </div>

    <h1 className="mb-0 text-4xl font-bold tracking-tight text-black sm:text-5xl">Welcome Back, {displayName}</h1>
    <p className="mb-5 ml-2 text-lg text-[#858585] sm:text-2xl">Here’s your CRM Overview today!</p>

    <section aria-label="Key performance indicators" className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[
        { label: "Total Customer", value: metrics.totalCustomers, hint: "Company records", icon: UsersRound, color: "bg-blue-50 text-blue-500" },
        { label: "Upcoming Meeting", value: metrics.upcomingMeetings, hint: "Next scheduled meetings", icon: CalendarDays, color: "bg-emerald-50 text-emerald-500" },
        { label: "Meeting this week", value: metrics.meetingsThisWeek, hint: "Scheduled meetings", icon: CalendarDays, color: "bg-rose-100 text-rose-500" },
      ].map(({ label, value, hint, icon: Icon, color }) => <article key={label} className="min-h-[112px] rounded-xl border border-[#aaa] bg-white px-4 py-2">
        <h2 className="text-lg font-semibold text-[#505050] sm:text-xl">{label}</h2><div className="mt-2 flex items-center gap-3"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><p className="text-3xl font-bold text-[#202020]">{value ?? "—"}</p><span className="ml-auto text-right text-[10px] leading-tight text-slate-400">{hint}</span></div>
      </article>)}
    </section>

    <section aria-labelledby="weekly-schedule-title" className="mb-4">
      <div className="mb-4 flex items-center justify-between"><h2 id="weekly-schedule-title" className="text-xl font-bold text-[#505050] sm:text-2xl">Schedule this week</h2><Link href="/dashboard/meeting-schedule" aria-label="Open Meeting Schedule" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"><CalendarDays className="h-5 w-5" /></Link></div>
      <div className="space-y-2.5">{weeklyMeetings.length ? weeklyMeetings.map(({ customer, date, time }) => <Link key={`${customer.id}-${date.toISOString()}`} href={`/dashboard/company-list/${customer.id}`} className="flex min-h-[70px] items-center justify-between gap-5 rounded-2xl border border-[#d0d0d0] px-4 py-4 text-[#555] transition-colors hover:border-blue-300 sm:px-5"><span className="truncate text-lg font-semibold sm:text-2xl">{customer.companyName}</span><span className="shrink-0 text-sm sm:text-xl">{date.toLocaleDateString("en-GB", { weekday: "long" })}, {time}</span></Link>) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">No meeting scheduled this week.</div>}</div>
    </section>

    <div className="mb-2 flex items-center justify-between gap-4 px-1 sm:px-2">
      <label className="relative block w-full max-w-[720px]"><Search aria-hidden="true" className="absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search Company, PIC or Phone Number" aria-label="Search company, PIC, or phone number" className="h-[70px] w-full rounded-2xl border border-[#bdbdbd] bg-white pl-16 pr-5 text-base font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-lg" /></label>
      <button type="button" onClick={() => { setExportError(""); setExportOpen(true); }} disabled={!customers.length} className="inline-flex h-[52px] shrink-0 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Download className="h-5 w-5" />Export</button>
    </div>

    <section aria-label="Company records" className="overflow-x-auto rounded-lg border border-[#d0d0d0]">
      <table className="w-full min-w-[1000px] table-fixed text-left"><thead className="bg-[#edf4f8] text-[#333]"><tr>
        <th className="w-[21%] px-4 py-6 text-center text-lg font-semibold sm:text-xl">Customer Code</th><th className="w-[21%] px-4 py-6 text-center text-lg font-semibold sm:text-xl">Job Number</th><th className="w-[24%] px-4 py-6 text-center text-lg font-semibold sm:text-xl">Company</th><th className="w-[17%] px-4 py-6 text-center text-lg font-semibold sm:text-xl">PIC</th><th className="w-[17%] px-4 py-6 text-center text-lg font-semibold sm:text-xl">Detail</th>
      </tr></thead><tbody className="text-[#383838]">{customers.map((customer) => <tr key={customer.id} className="border-t border-[#d0d0d0]"><td className="px-4 py-5 text-center text-base sm:text-lg">{customer.transactionNo || "—"}</td><td className="break-words px-4 py-5 text-center text-base sm:text-lg">{customer.jobNumber || "—"}</td><td className="px-4 py-3 text-base leading-tight sm:text-lg">{customer.companyName}</td><td className="px-4 py-5 text-center text-base sm:text-lg">{customer.primaryPic?.fullName || "—"}</td><td className="px-4 py-5 text-center"><button type="button" onClick={() => void openCustomerDetail(customer.id)} className="text-base text-blue-600 underline underline-offset-2 hover:text-blue-800 sm:text-lg">See more...</button></td></tr>)}</tbody></table>
      {searchError ? <div role="alert" className="border-t border-slate-200 p-6 text-center text-sm text-red-700">{searchError}</div> : customers.length === 0 ? <div className="border-t border-slate-200 p-8 text-center text-slate-500"><FileText className="mx-auto mb-2 h-5 w-5" />{search ? "No customer or PIC found." : "No company records available."}</div> : null}
      {isSearching && <p className="sr-only" role="status">Searching customers</p>}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 px-3 pt-1 text-xs text-slate-500"><span>Showing {firstRow}-{lastRow} of {total} customers</span><nav className="flex items-center gap-1" aria-label="Dashboard pages"><button type="button" aria-label="Previous page" disabled={page <= 1 || isSearching} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">‹</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, index) => { const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + index; return <button type="button" key={pageNumber} aria-current={page === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-md px-2 ${page === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`}>{pageNumber}</button>; })}{totalPages > 5 && <><span className="px-1">...</span><button type="button" onClick={() => setPage(totalPages)} className="h-8 min-w-8 rounded-md px-2 text-slate-600">{totalPages}</button></>}<button type="button" aria-label="Next page" disabled={page >= totalPages || isSearching} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">›</button></nav></div>

    {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-5xl rounded-xl bg-white px-6 py-8 shadow-2xl sm:px-11 sm:py-10">
      <h2 id="export-title" className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Export Company Records</h2><p className="mt-1 text-base text-[#747474] sm:text-xl">Select a creation date range to export company records</p>
      <div className="mt-5 grid gap-7 md:grid-cols-2"><fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">File Format</legend><div className="flex min-h-[165px] flex-col justify-center gap-4 rounded-lg border border-[#ccc] px-5 py-4 text-lg text-[#777]"><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="export-format" checked={exportFormat === "xlsx"} onChange={() => setExportFormat("xlsx")} className="h-5 w-5 accent-blue-600" /><span className="text-emerald-600">▦</span><span>Excel (.xlsx)</span></label><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="export-format" checked={exportFormat === "pdf"} onChange={() => setExportFormat("pdf")} className="h-5 w-5 accent-blue-600" /><span className="text-rose-500">▣</span><span>PDF (.pdf)</span></label></div></fieldset>
        <fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">Date Range</legend><div className="min-h-[165px] rounded-lg border border-[#ccc] p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-500">From<input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label><label className="text-xs font-medium text-slate-500">To<input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label></div></div></fieldset>
      </div>
      {exportError && <p role="alert" className="mt-3 text-sm text-rose-600">{exportError}</p>}
      <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-5"><button type="button" onClick={() => setExportOpen(false)} className="h-14 rounded-lg border border-[#888] px-10 text-lg font-semibold text-[#505050] hover:bg-slate-50 sm:w-[220px]">Cancel</button><button type="button" disabled={exporting} onClick={() => void runExport()} className="h-14 rounded-lg bg-[#3e6df5] px-10 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-[320px]">{exporting ? "Preparing..." : "Export"}</button></div>
    </section></div>}

    {detailOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" className="my-auto w-full max-w-7xl rounded-xl bg-white p-6 shadow-2xl sm:px-12 sm:py-10">
      <div className="flex items-start justify-between gap-4"><h2 id="transaction-detail-title" className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Company Details</h2><button type="button" aria-label="Close" onClick={() => setDetailOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-6 w-6" /></button></div>
      {detailLoading ? <div role="status" className="grid min-h-72 place-items-center text-slate-500">Loading company details...</div> : detailError ? <p role="alert" className="mt-8 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{detailError}</p> : detailCustomer && <>
        <div className="mt-7 grid gap-5 border-b border-slate-100 pb-6 sm:grid-cols-2 lg:grid-cols-4">{[["Customer Code", detailCustomer.customerCode], ["Job Number", detailCustomer.jobNumber], ["Company", detailCustomer.companyName], ["PIC", detailCustomer.primaryPic?.fullName]].map(([label, value]) => <div key={label}><h3 className="text-base text-[#707070] sm:text-lg">{label}</h3><p className="mt-1 break-words text-sm font-medium text-[#303030] sm:text-base">{value || "—"}</p></div>)}</div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2"><DetailInfoCard title="Company Information" rows={[["Address", detailCustomer.address], ["Customer Code", detailCustomer.customerCode], ["Job Number", detailCustomer.jobNumber], ["PIC", detailCustomer.primaryPic?.fullName], ["PIC Phone Number", detailCustomer.primaryPic?.phoneNumber], ["Created By", detailCustomer.createdBy], ["Created Date", detailCustomer.createdAt]]} /><DetailInfoCard title="Meeting Schedule" rows={detailCustomer.meetings.length ? detailCustomer.meetings.map((meeting) => [meeting.formattedSchedule, [meeting.agenda, meeting.status].filter(Boolean).join(" · ")]) : [["No meeting scheduled", ""]]} /></div>
      </>}
      <div className="mt-7 flex justify-end"><button type="button" onClick={() => setDetailOpen(false)} className="h-14 w-full rounded-lg bg-[#3e6df5] text-lg font-semibold text-white hover:bg-blue-700 sm:w-[300px]">Close</button></div>
    </section></div>}

    {agentPickerOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAgentPickerOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="agent-picker-title" className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 id="agent-picker-title" className="text-sm font-semibold text-slate-800">Select Field Agent</h2><button type="button" aria-label="Close" onClick={() => setAgentPickerOpen(false)} className="text-slate-400 hover:text-slate-700">×</button></div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Field Agent records are owned by Squad A2. A1 will show the list and task details when their read-only integration is connected.</p>
      <label className="relative my-3 block"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={agentSearch} onChange={(event) => setAgentSearch(event.target.value)} placeholder="Search field agent..." className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-blue-400" /></label>
      <div className="max-h-56 space-y-1 overflow-y-auto">{[...(("All Field Agents".toLowerCase().includes(agentSearch.toLowerCase())) ? [{ id: "all", name: "All Field Agents" }] : []), ...filteredAgents.map((name) => ({ id: name, name }))].map((agent) => <label key={agent.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-xs text-slate-700 hover:bg-slate-50"><input type="radio" name="field-agent" value={agent.id} checked={selectedAgent === agent.id} onChange={() => setSelectedAgent(agent.id)} className="accent-blue-600" />{agent.name}</label>)}{filteredAgents.length === 0 && !"All Field Agents".toLowerCase().includes(agentSearch.toLowerCase()) && <p className="px-1 py-2 text-xs text-slate-400">No field agent found.</p>}</div>
      <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => setAgentPickerOpen(false)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Cancel</button><button type="button" onClick={() => { setAppliedAgent(selectedAgent); setAgentPickerOpen(false); router.push(selectedAgent === "all" ? "/dashboard/task-of-field-agent" : `/dashboard/task-of-field-agent?agent=${encodeURIComponent(selectedAgent)}`); }} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Apply</button></div>
    </section></div>}
    {appliedAgent !== "all" && <span className="sr-only">Selected field agent: {appliedAgent}</span>}
  </div>;
}
