"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  BriefcaseBusiness, CalendarDays, Download, FileText, Search, UsersRound, X,
} from "lucide-react";
import type { ApiResponse, CustomerDetailItem, CustomerListItem, MeetingDay } from "@/types/customer";
import type { SalesExecutiveMetrics } from "@/lib/services/sales-executive-metrics";

interface Props {
  initialCustomers: CustomerListItem[];
  metrics: SalesExecutiveMetrics;
}

interface WeeklyMeeting { customer: CustomerListItem; date: Date; time: string }
const meetingDayNumbers: Record<MeetingDay, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
};
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
    if (schedule.status === "cancelled" || schedule.status === "completed" || dayFromMonday < 0 || dayFromMonday > 6 || (effectiveStart && date < effectiveStart)) return [];
    return [{ customer, date, time: schedule.startTime?.slice(0, 5) || "09:00" }];
  })).sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
}

function downloadExport(customers: CustomerListItem[], format: "xlsx" | "pdf") {
  const headers = ["Transaction ID", "Job Number", "Company", "PIC", "PIC Phone Number"];
  const values = customers.map((customer) => [
    customer.transactionNo || "", customer.jobNumber || "", customer.companyName,
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
  return (
    <section className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
      <h3 className="mb-3 text-xs font-bold text-slate-800">{title}</h3>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-right font-semibold text-slate-800">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function SalesExecutiveDashboard({ initialCustomers, metrics }: Props) {
  const router = useRouter();
  const initialTransactions = initialCustomers.filter((customer) => Boolean(customer.transactionNo));
  const [customers, setCustomers] = useState(initialTransactions);
  const [scheduleCustomers, setScheduleCustomers] = useState<CustomerListItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleLoadError, setScheduleLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTransactions.length);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(initialTransactions.length / 5)));
  const [displayName, setDisplayName] = useState("User");
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

  const refreshSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "100", page: "1", context: "weeklySchedule" });
      const response = await fetch(`/api/v1/customers?${params}`, { cache: "no-store" });
      const result: ApiResponse<CustomerListItem[]> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Could not refresh the meeting schedule." : result.message);
      const latestCustomers = [...result.data];
      const totalPages = result.meta?.totalPages || 1;
      for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
        params.set("page", String(pageNumber));
        const nextResponse = await fetch(`/api/v1/customers?${params}`, { cache: "no-store" });
        const nextResult: ApiResponse<CustomerListItem[]> = await nextResponse.json();
        if (!nextResponse.ok || !nextResult.success) throw new Error(nextResult.success ? "Could not refresh the complete meeting schedule." : nextResult.message);
        latestCustomers.push(...nextResult.data);
      }
      setScheduleCustomers(latestCustomers);
      setScheduleLoadError("");
    } catch (error) {
      setScheduleCustomers([]);
      setScheduleLoadError(error instanceof Error ? error.message : "Could not refresh the meeting schedule.");
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSchedule();
    window.addEventListener("focus", refreshSchedule);
    return () => window.removeEventListener("focus", refreshSchedule);
  }, [refreshSchedule]);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("andima_user") || "null") as { name?: string } | null;
      if (value?.name?.trim()) setDisplayName(value.name.trim());
    } catch { /* Keep the neutral loading name. */ }
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({ search: keyword, page: String(page), limit: "5" });
        const response = await fetch(`/api/v1/transactions/summary?${params}`, { signal: controller.signal });
        const result: ApiResponse<CustomerListItem[]> = await response.json();
        if (!response.ok && !result.success && result.code === "SRCH_001") {
          setCustomers([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
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

  const weeklyMeetings = useMemo(() => getWeeklyMeetings(scheduleCustomers).slice(0, 2), [scheduleCustomers]);
  const firstRow = total === 0 ? 0 : (page - 1) * 5 + 1;
  const lastRow = Math.min(page * 5, total);
  const statisticsUnavailable = metrics.totalCustomers === null || metrics.meetingsThisWeek === null;

  return <div className="mx-auto w-full max-w-[1280px]">
    <h1 className="mb-0 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back, {displayName}</h1>
    <p className="mb-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Here’s your CRM Overview today!</p>

    <section aria-label="Key performance indicators" className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {[
        { label: "Total Customer", value: metrics.totalCustomers, hint: "Company records", icon: UsersRound, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
        { label: "Meeting this week", value: metrics.meetingsThisWeek, hint: "Scheduled meetings", icon: CalendarDays, color: "bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400" },
        { label: "Total Job", value: 0, hint: "Tasks", icon: BriefcaseBusiness, color: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      ].map(({ label, value, hint, icon: Icon, color }) => <article key={label} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</h2>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value ?? "—"}</p>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{hint}</span>
        </div>
      </article>)}
    </section>
    {statisticsUnavailable && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800"><span>Statistical data unavailable.</span><button type="button" onClick={() => router.refresh()} className="font-semibold underline">Try again later</button></div>}

    <section aria-labelledby="weekly-schedule-title" className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="weekly-schedule-title" className="text-sm font-bold text-slate-800 dark:text-slate-200">Schedule this week</h2>
        <Link href="/dashboard/meeting-schedule" aria-label="Open Meeting Schedule" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <CalendarDays className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-2">
        {scheduleLoadError ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
            {scheduleLoadError}<button type="button" onClick={() => void refreshSchedule()} className="ml-2 font-medium underline">Retry</button>
          </div>
        ) : scheduleLoading ? (
          <div role="status" className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4 text-xs text-slate-500">
            Refreshing this week’s schedule...
          </div>
        ) : weeklyMeetings.length ? (
          weeklyMeetings.map(({ customer, date, time }) => (
            <Link key={`${customer.id}-${date.toISOString()}`} href={`/dashboard/company-list/${customer.id}`} className="flex min-h-[46px] items-center justify-between gap-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-2xs transition-colors hover:border-blue-400">
              <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{customer.companyName}</span>
              <span className="shrink-0 text-slate-500">{date.toLocaleDateString("en-GB", { weekday: "long" })}, {time}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-4 text-xs text-slate-500 text-center">
            No meeting scheduled this week.
          </div>
        )}
      </div>
    </section>

    <div className="mb-3 flex items-center justify-between gap-3">
      <label className="relative block w-full max-w-[480px]">
        <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Search Company or PIC"
          aria-label="Search company or PIC"
          className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </label>
      <button
        type="button"
        onClick={() => { setExportError(""); setExportOpen(true); }}
        disabled={!customers.length}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        <Download className="h-3.5 w-3.5 text-slate-500" />
        <span>Export</span>
      </button>
    </div>

    <section aria-label="Company records" className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="w-full min-w-[850px] table-fixed text-left text-xs">
        <thead className="bg-[#edf4fb] dark:bg-slate-800 border-b border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
          <tr>
            <th className="w-[18%] px-4 py-3 text-center">Transaction ID</th>
            <th className="w-[18%] px-4 py-3 text-center">Job Number</th>
            <th className="w-[24%] px-4 py-3 text-left">Company</th>
            <th className="w-[14%] px-4 py-3 text-center">PIC</th>
            <th className="w-[14%] px-4 py-3 text-center">PIC Number</th>
            <th className="w-[12%] px-4 py-3 text-center">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td className="break-words px-4 py-3 text-center font-medium text-slate-800 dark:text-slate-200">{customer.transactionNo || "—"}</td>
              <td className="break-words px-4 py-3 text-center font-medium text-blue-600 dark:text-blue-400">{customer.jobNumber || "—"}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{customer.companyName}</td>
              <td className="px-4 py-3 text-center">{customer.primaryPic?.fullName || "—"}</td>
              <td className="break-words px-4 py-3 text-center">{customer.primaryPic?.phoneNumber || "—"}</td>
              <td className="px-4 py-3 text-center">
                <button type="button" onClick={() => void openCustomerDetail(customer.id)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  See more...
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {searchError ? (
        <div role="alert" className="border-t border-slate-200 p-4 text-center text-xs text-red-600">{searchError}</div>
      ) : customers.length === 0 ? (
        <div className="border-t border-slate-200 p-8 text-center text-xs text-slate-400">
          <FileText className="mx-auto mb-2 h-4 w-4" />
          {search ? "No customer or transaction found." : "No transaction data available."}
        </div>
      ) : null}
      {isSearching && <p className="sr-only" role="status">Searching customers</p>}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 px-3 pt-1 text-xs text-slate-500"><span>Showing {firstRow}-{lastRow} of {total} customers</span><nav className="flex items-center gap-1" aria-label="Dashboard pages"><button type="button" aria-label="Previous page" disabled={page <= 1 || isSearching} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">‹</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, index) => { const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + index; return <button type="button" key={pageNumber} aria-current={page === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-md px-2 ${page === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`}>{pageNumber}</button>; })}{totalPages > 5 && <><span className="px-1">...</span><button type="button" onClick={() => setPage(totalPages)} className="h-8 min-w-8 rounded-md px-2 text-slate-600">{totalPages}</button></>}<button type="button" aria-label="Next page" disabled={page >= totalPages || isSearching} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">›</button></nav></div>

    {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 id="export-title" className="text-base sm:text-lg font-bold text-slate-900">Export Company Records</h2>
        <button type="button" aria-label="Close" onClick={() => setExportOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Select a creation date range to export company records</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-700">File Format</legend>
          <div className="flex flex-col justify-center gap-2.5 rounded-xl border border-slate-200/80 p-3 text-xs text-slate-600 bg-slate-50/50">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="export-format" checked={exportFormat === "xlsx"} onChange={() => setExportFormat("xlsx")} className="h-4 w-4 accent-blue-600" />
              <span className="font-semibold text-emerald-600">Excel (.xlsx)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="export-format" checked={exportFormat === "pdf"} onChange={() => setExportFormat("pdf")} className="h-4 w-4 accent-blue-600" />
              <span className="font-semibold text-rose-500">PDF (.pdf)</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-700">Date Range</legend>
          <div className="rounded-xl border border-slate-200/80 p-3 space-y-2 bg-slate-50/50">
            <label className="block text-[11px] font-medium text-slate-500">From<input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none" /></label>
            <label className="block text-[11px] font-medium text-slate-500">To<input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none" /></label>
          </div>
        </fieldset>
      </div>
      {exportError && <p role="alert" className="mt-3 text-xs text-rose-600">{exportError}</p>}
      <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-100 pt-3.5">
        <button type="button" onClick={() => setExportOpen(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button type="button" disabled={exporting} onClick={() => void runExport()} className="h-9 px-5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs">{exporting ? "Preparing..." : "Export"}</button>
      </div>
    </section></div>}

    {detailOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" className="my-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <h2 id="transaction-detail-title" className="text-base sm:text-lg font-bold text-slate-900">Company Details</h2>
        <button type="button" aria-label="Close" onClick={() => setDetailOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      {detailLoading ? (
        <div role="status" className="grid min-h-48 place-items-center text-xs text-slate-400">Loading company details...</div>
      ) : detailError ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{detailError}</p>
      ) : detailCustomer && (
        <>
          <div className="my-4 grid grid-cols-2 gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:grid-cols-4">
            {[
              ["Transaction ID", detailCustomer.transactionNo],
              ["Job Number", detailCustomer.jobNumber],
              ["Company", detailCustomer.companyName],
              ["PIC", detailCustomer.primaryPic?.fullName]
            ].map(([label, value]) => (
              <div key={label}>
                <h3 className="text-[11px] font-medium text-slate-400">{label}</h3>
                <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{value || "—"}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <DetailInfoCard
              title="Company Information"
              rows={[
                ["Address", detailCustomer.address],
                ["Transaction ID", detailCustomer.transactionNo],
                ["Job Number", detailCustomer.jobNumber],
                ["PIC", detailCustomer.primaryPic?.fullName],
                ["PIC Phone Number", detailCustomer.primaryPic?.phoneNumber],
                ["Created By", detailCustomer.createdBy],
                ["Created Date", detailCustomer.createdAt]
              ]}
            />
            <DetailInfoCard
              title="Meeting Schedule"
              rows={detailCustomer.meetings.length ? detailCustomer.meetings.map((meeting) => [meeting.formattedSchedule, [meeting.agenda, meeting.status].filter(Boolean).join(" · ")]) : [["No meeting scheduled", ""]]}
            />
          </div>
        </>
      )}
      <div className="mt-5 flex justify-end border-t border-slate-100 pt-3.5">
        <button
          type="button"
          onClick={() => setDetailOpen(false)}
          className="h-9 px-5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          Close
        </button>
      </div>
    </section></div>}

  </div>;
}
