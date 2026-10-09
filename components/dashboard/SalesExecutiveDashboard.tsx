"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  BriefcaseBusiness, CalendarDays, ChevronDown, Download, FileText, RotateCcw, Search, UsersRound, X,
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

function formatDateDisplay(val: string) {
  if (!val) return "";
  const [y, m, d] = val.split("-").map(Number);
  if (!y || !m || !d) return val;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-4 py-1.5 text-xs sm:text-sm'>
      <span className='text-slate-500 dark:text-slate-400 font-normal'>{label}</span>
      <span className='text-right font-bold text-slate-900 dark:text-white'>{value}</span>
    </div>
  )
}

function formatCreatedDateTime(val?: string | null): string {
  if (!val) return '5 Jun 2026 14:32'
  try {
    const dt = new Date(val)
    if (isNaN(dt.getTime())) return val
    const datePart = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const timePart = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${datePart} ${timePart}`
  } catch {
    return val
  }
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

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [datePickerExpanded, setDatePickerExpanded] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCompany, setFilterCompany] = useState("All Company");
  const [filterPic, setFilterPic] = useState("All PIC");
  const [filterJobNumber, setFilterJobNumber] = useState("");

  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedCompany, setAppliedCompany] = useState("All Company");
  const [appliedPic, setAppliedPic] = useState("All PIC");
  const [appliedJobNumber, setAppliedJobNumber] = useState("");
  const [dateFilterError, setDateFilterError] = useState("");

  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of initialCustomers) {
      if (c.companyName?.trim()) set.add(c.companyName.trim());
    }
    return Array.from(set).sort();
  }, [initialCustomers]);

  const picOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of initialCustomers) {
      if (c.primaryPic?.fullName?.trim()) set.add(c.primaryPic.fullName.trim());
    }
    return Array.from(set).sort();
  }, [initialCustomers]);

  const isFilterActive = Boolean(
    appliedStartDate ||
    appliedEndDate ||
    (appliedCompany && appliedCompany !== "All Company") ||
    (appliedPic && appliedPic !== "All PIC") ||
    (appliedJobNumber && appliedJobNumber.trim() !== "")
  );

  const dateRangeDisplay = useMemo(() => {
    if (filterStartDate && filterEndDate) {
      return `${formatDateDisplay(filterStartDate)} - ${formatDateDisplay(filterEndDate)}`;
    }
    if (filterStartDate) return `From ${formatDateDisplay(filterStartDate)}`;
    if (filterEndDate) return `To ${formatDateDisplay(filterEndDate)}`;
    return "";
  }, [filterStartDate, filterEndDate]);

  const appliedDateRangeDisplay = useMemo(() => {
    if (appliedStartDate && appliedEndDate) {
      return `${formatDateDisplay(appliedStartDate)} - ${formatDateDisplay(appliedEndDate)}`;
    }
    if (appliedStartDate) return `From ${formatDateDisplay(appliedStartDate)}`;
    if (appliedEndDate) return `To ${formatDateDisplay(appliedEndDate)}`;
    return "";
  }, [appliedStartDate, appliedEndDate]);

  const applyDatePreset = (preset: "today" | "last7" | "last30" | "thisMonth") => {
    const now = new Date();
    const todayStr = localDateValue(now);
    let startStr = todayStr;
    if (preset === "last7") {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      startStr = localDateValue(past);
    } else if (preset === "last30") {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      startStr = localDateValue(past);
    } else if (preset === "thisMonth") {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startStr = localDateValue(firstOfMonth);
    }
    setFilterStartDate(startStr);
    setFilterEndDate(todayStr);
    setDateFilterError("");
  };

  const handleApplyFilters = () => {
    if (filterStartDate && filterEndDate && filterStartDate > filterEndDate) {
      setDateFilterError("Start date cannot be after end date.");
      return;
    }
    setDateFilterError("");
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setAppliedCompany(filterCompany);
    setAppliedPic(filterPic);
    setAppliedJobNumber(filterJobNumber.trim());
    setPage(1);
    setFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCompany("All Company");
    setFilterPic("All PIC");
    setFilterJobNumber("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedCompany("All Company");
    setAppliedPic("All PIC");
    setAppliedJobNumber("");
    setDateFilterError("");
    setPage(1);
    setFilterModalOpen(false);
  };

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
        if (appliedStartDate) params.set("from", appliedStartDate);
        if (appliedEndDate) params.set("to", appliedEndDate);
        if (appliedCompany && appliedCompany !== "All Company") params.set("company", appliedCompany);
        if (appliedPic && appliedPic !== "All PIC") params.set("pic", appliedPic);
        if (appliedJobNumber) params.set("jobNumber", appliedJobNumber);
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
  }, [search, page, appliedStartDate, appliedEndDate, appliedCompany, appliedPic, appliedJobNumber]);

  const openCustomerDetail = async (customer: CustomerListItem) => {
    setDetailCustomer({
      id: customer.id,
      companyName: customer.companyName,
      customerCode: customer.customerCode,
      transactionNo: customer.transactionNo,
      jobNumber: customer.jobNumber,
      createdBy: customer.createdBy,
      address: customer.address || '',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt || customer.createdAt,
      primaryPic: customer.primaryPic,
      activeMeeting: null,
      meetings: [],
      jobs: [],
    })
    setDetailError('')
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const response = await fetch(`/api/v1/customers/${customer.id}`)
      const result: ApiResponse<CustomerDetailItem> = await response.json()
      if (!response.ok || !result.success) throw new Error(result.success ? 'Could not load company details.' : result.message)
      setDetailCustomer({
        ...result.data,
        transactionNo: result.data.transactionNo || customer.transactionNo,
        jobNumber: result.data.jobNumber || customer.jobNumber,
        companyName: result.data.companyName || customer.companyName,
        primaryPic: result.data.primaryPic || customer.primaryPic,
      })
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Could not load company details.')
    } finally {
      setDetailLoading(false)
    }
  }

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
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          aria-label="Filter Transaction"
          title="Filter Transaction"
          className={`relative grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
            isFilterActive
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-400"
              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          {isFilterActive && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
          )}
        </button>
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          title="Filter Transaction"
          aria-label="Filter Transaction"
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-2xs transition-colors ${
            isFilterActive
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>Filter</span>
        </button>
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
    </div>

    {isFilterActive && (
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-150">
        <span className="text-slate-500 dark:text-slate-400">Filter Aktif:</span>
        {(appliedStartDate || appliedEndDate) && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{appliedDateRangeDisplay}</span>
          </span>
        )}
        {appliedCompany && appliedCompany !== "All Company" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <span>Company: {appliedCompany}</span>
          </span>
        )}
        {appliedPic && appliedPic !== "All PIC" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <span>PIC: {appliedPic}</span>
          </span>
        )}
        {appliedJobNumber && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <span>Job: {appliedJobNumber}</span>
          </span>
        )}
        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3 w-3" />
          <span>Reset Semua</span>
        </button>
      </div>
    )}

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
                <button type="button" onClick={() => void openCustomerDetail(customer)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  See more...
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {searchError ? (
        <div role="alert" className="border-t border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-red-600">{searchError}</div>
      ) : customers.length === 0 ? (
        <div className="border-t border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
          <FileText className="mx-auto mb-2 h-4 w-4" />
          <p>{isFilterActive ? "Tidak ada riwayat transaksi ditemukan pada rentang kriteria filter yang dipilih." : search ? "No customer or transaction found." : "No transaction data available."}</p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </button>
          )}
        </div>
      ) : null}
      {isSearching && <p className="sr-only" role="status">Searching customers</p>}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 px-3 pt-1 text-xs text-slate-500"><span>Showing {firstRow}-{lastRow} of {total} customers</span><nav className="flex items-center gap-1" aria-label="Dashboard pages"><button type="button" aria-label="Previous page" disabled={page <= 1 || isSearching} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">‹</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, index) => { const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + index; return <button type="button" key={pageNumber} aria-current={page === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-md px-2 ${page === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`}>{pageNumber}</button>; })}{totalPages > 5 && <><span className="px-1">...</span><button type="button" onClick={() => setPage(totalPages)} className="h-8 min-w-8 rounded-md px-2 text-slate-600">{totalPages}</button></>}<button type="button" aria-label="Next page" disabled={page >= totalPages || isSearching} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40">›</button></nav></div>

    {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-2xl sm:p-6 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 id="export-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Export Company Records</h2>
        <button type="button" aria-label="Close" onClick={() => setExportOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Select a creation date range to export company records</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">File Format</legend>
          <div className="flex flex-col justify-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/40">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="export-format" checked={exportFormat === "xlsx"} onChange={() => setExportFormat("xlsx")} className="h-4 w-4 accent-blue-600" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Excel (.xlsx)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="export-format" checked={exportFormat === "pdf"} onChange={() => setExportFormat("pdf")} className="h-4 w-4 accent-blue-600" />
              <span className="font-semibold text-rose-500 dark:text-rose-400">PDF (.pdf)</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">Date Range</legend>
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">From<input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} className="mt-1 h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none" /></label>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">To<input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} className="mt-1 h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none" /></label>
          </div>
        </fieldset>
      </div>
      {exportError && <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">{exportError}</p>}
      <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3.5">
        <button type="button" onClick={() => setExportOpen(false)} className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button type="button" disabled={exporting} onClick={() => void runExport()} className="h-9 px-5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs">{exporting ? "Preparing..." : "Export"}</button>
      </div>
    </section></div>}

    {detailOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-[1px] animate-in fade-in duration-150"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailOpen(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
          className="relative my-auto w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        >
          <h2
            id="transaction-detail-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5"
          >
            Detail Transaction
          </h2>

          {detailLoading && !detailCustomer ? (
            <div role="status" className="grid min-h-64 place-items-center text-sm text-slate-400">
              Loading transaction details...
            </div>
          ) : detailError && !detailCustomer ? (
            <p role="alert" className="my-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300">
              {detailError}
            </p>
          ) : detailCustomer && (
            <>
              {/* Top 5-Column Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 mb-5">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Transaction ID
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                    {detailCustomer.transactionNo || "TRX-0526-03382"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Job Number
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                    {detailCustomer.jobNumber || "DSVEXP/2605/2551"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Company
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                    {detailCustomer.companyName || "PT. DSV Transport Indonesia"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    PIC
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                    {detailCustomer.primaryPic?.fullName || "Aida"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    PIC Number
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                    {detailCustomer.primaryPic?.phoneNumber || "081245678765"}
                  </p>
                </div>
              </div>

              {/* Two Side-by-Side Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6">
                {/* Left Card: Transaction Details */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900/40 shadow-xs">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3.5">
                    Transaction Details
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <DetailRow
                      label="Transaction Type"
                      value={detailCustomer.worksheet?.transactionType || "Export - Air Freight"}
                    />
                    <DetailRow
                      label="Status"
                      value={
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          Completed
                        </span>
                      }
                    />
                    <DetailRow
                      label="MAWB Number"
                      value={detailCustomer.worksheet?.mawb || "123-45678901"}
                    />
                    <DetailRow
                      label="HAWB Number"
                      value={detailCustomer.worksheet?.hawb || "DSV-2506-001"}
                    />
                    <DetailRow
                      label="Origin"
                      value={detailCustomer.worksheet?.origin || "Jakarta (CGK)"}
                    />
                    <DetailRow
                      label="Destination"
                      value={detailCustomer.worksheet?.destination || "Singapore (SIN)"}
                    />
                    <DetailRow
                      label="ETD"
                      value={detailCustomer.worksheet?.etd || "12 Jun 2026"}
                    />
                    <DetailRow
                      label="ETA"
                      value={detailCustomer.worksheet?.eta || "14 Jun 2026"}
                    />
                  </div>
                </div>

                {/* Right Card: Additional Information */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900/40 shadow-xs">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3.5">
                    Additional Information
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <DetailRow
                      label="Cargo Description"
                      value={detailCustomer.worksheet?.cargoDescription || "Electronics Goods"}
                    />
                    <DetailRow
                      label="Total Koli"
                      value={detailCustomer.worksheet?.totalKoli ? String(detailCustomer.worksheet.totalKoli) : "10"}
                    />
                    <DetailRow
                      label="Gross Weight"
                      value={detailCustomer.worksheet?.grossWeight || "250 kg"}
                    />
                    <DetailRow
                      label="Volume"
                      value={detailCustomer.worksheet?.volume || "1.8 m³"}
                    />
                    <DetailRow
                      label="Created Date"
                      value={formatCreatedDateTime(detailCustomer.createdAt)}
                    />
                    <DetailRow
                      label="Created By"
                      value={detailCustomer.createdBy || "Yuliana"}
                    />
                    <DetailRow
                      label="Notes"
                      value={detailCustomer.worksheet?.issueNote || "-"}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Action */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="h-10 sm:h-11 px-12 sm:px-14 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-sm sm:text-base font-bold text-white transition-colors shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </section>
      </div>
    )}

    {filterModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setFilterModalOpen(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-transaction-title"
          className="w-full max-w-[420px] rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        >
          <div className="mb-5">
            <h2
              id="filter-transaction-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Filter Transaction
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select format and date range to export transaction
            </p>
          </div>

          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date Range
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDatePickerExpanded((prev) => !prev)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
                >
                  <span className={dateRangeDisplay ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-400"}>
                    {dateRangeDisplay || "07 Oct 2026 - 12 Oct 2026"}
                  </span>
                  <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                {datePickerExpanded && (
                  <div className="mt-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 p-3 space-y-2 animate-in fade-in duration-100">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        From
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => {
                            setFilterStartDate(e.target.value);
                            setDateFilterError("");
                          }}
                          className="mt-1 h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        To
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            setDateFilterError("");
                          }}
                          className="mt-1 h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => applyDatePreset("today")}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset("last7")}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset("last30")}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        Last 30 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset("thisMonth")}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        This Month
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Company
              </label>
              <div className="relative">
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-9 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All Company">All Company</option>
                  {companyOptions.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* PIC */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                PIC
              </label>
              <div className="relative">
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 pr-9 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All PIC">All PIC</option>
                  {picOptions.map((pic) => (
                    <option key={pic} value={pic}>
                      {pic}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Job Number */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Number
              </label>
              <input
                type="text"
                value={filterJobNumber}
                onChange={(e) => setFilterJobNumber(e.target.value)}
                placeholder="All Job Number"
                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>
          </div>

          {dateFilterError && (
            <p className="mt-2 text-xs text-rose-500">{dateFilterError}</p>
          )}

          {/* Action buttons */}
          <div className="mt-7 grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Apply
            </button>
          </div>
        </section>
      </div>
    )}

  </div>;
}
