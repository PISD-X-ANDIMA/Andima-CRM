"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadXlsx, openPdfPrintWindow, printTableAsPdf } from "@/lib/export-utils";
import type { ApiResponse, CustomerListItem } from "@/types/customer";
import { CustomerTable } from "@/components/customer/CustomerTable";
import { CustomerFormModal } from "@/components/customer/CustomerFormModal";
import { DeleteConfirmDialog } from "@/components/customer/DeleteConfirmDialog";
import { CompanyActionModal } from "@/components/customer/CompanyActionModals";

type ExportFormat = "xlsx" | "pdf";

export default function CompanyListPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalCustomer, setModalCustomer] = useState<CustomerListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null);
  const [actionCustomer, setActionCustomer] = useState<CustomerListItem | null>(null);
  const [actionMode, setActionMode] = useState<"details" | "tasks" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportError, setExportError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const perPage = 5;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchKeyword), 350);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const fetchCustomers = useCallback(async (keyword = debouncedSearch, pageNumber = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ perPage: String(perPage), page: String(pageNumber) });
      if (keyword.trim()) params.set("search", keyword.trim());
      const res = await fetch(`/api/v1/customers?${params}`);
      const json: ApiResponse<CustomerListItem[]> = await res.json();
      if (!res.ok || !json.success) throw new Error(!json.success ? json.message : "Failed to load company data");
      setCustomers(json.data);
      setTotal(json.meta?.total ?? json.data.length);
      setTotalPages(json.meta?.totalPages ?? 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A connection error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { void fetchCustomers(); }, [fetchCustomers, refreshVersion]);

  const handleSaved = () => {
    setSuccessMessage(modalCustomer ? "Company updated successfully." : "Company added successfully.");
    setIsModalOpen(false);
    setModalCustomer(null);
    setSearchKeyword("");
    setDebouncedSearch("");
    setPage(1);
    setRefreshVersion((version) => version + 1);
    window.setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/customers/${deleteTarget.id}`, { method: "DELETE" });
      const result: ApiResponse<{ customerId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to delete the company." : result.message);
      setDeleteTarget(null);
      setError(null);
      setSuccessMessage("Company deleted successfully");
      window.setTimeout(() => setSuccessMessage(""), 5000);
      if (customers.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshVersion((version) => version + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete the company.");
    } finally {
      setIsDeleting(false);
    }
  };

  const runExport = async () => {
    if (exportStart && exportEnd && exportStart > exportEnd) {
      setExportError("The start date must be on or before the end date.");
      return;
    }
    setIsExporting(true);
    setExportError("");
    const pdfWindow = exportFormat === "pdf" ? openPdfPrintWindow() : null;
    if (exportFormat === "pdf" && !pdfWindow) {
      setExportError("Allow pop-ups to create the PDF export.");
      setIsExporting(false);
      return;
    }
    try {
      const params = new URLSearchParams({ format: exportFormat, search: debouncedSearch.trim() });
      const firstResponse = await fetch(`/api/v1/customers/export?${params}`);
      const firstResult: ApiResponse<{ company_name: string; address: string; pic_name: string; pic_number: string; meeting_schedule: string; created_at: string }[]> = await firstResponse.json();
      if (!firstResponse.ok || !firstResult.success) throw new Error(firstResult.success ? "Failed to load companies for export." : firstResult.message);
      const filteredCustomers = firstResult.data.filter((customer) => {
        const createdDate = customer.created_at?.slice(0, 10) || "";
        return (!exportStart || (createdDate && createdDate >= exportStart)) && (!exportEnd || (createdDate && createdDate <= exportEnd));
      });
      if (!filteredCustomers.length) throw new Error("No companies were found for the selected date range and search.");
      const rows = filteredCustomers.map((customer) => ({
        Company: customer.company_name,
        Address: customer.address,
        PIC: customer.pic_name,
        "PIC Number": customer.pic_number,
        "Meeting Schedule": customer.meeting_schedule,
      }));
      if (exportFormat === "pdf") {
        const headers = ["Company Name", "Address", "PIC", "PIC Number", "Meeting Schedule"];
        const values = rows.map((row) => [row.Company, row.Address, row.PIC, row["PIC Number"], row["Meeting Schedule"]]);
        printTableAsPdf("Company List", "Company records and meeting schedules", headers, values, pdfWindow);
        setExportOpen(false);
        return;
      }
      const headers = ["Company Name", "Address", "PIC", "PIC Number", "Meeting Schedule"];
      const values = rows.map((row) => [row.Company, row.Address, row.PIC, row["PIC Number"], row["Meeting Schedule"]]);
      downloadXlsx("company-list.xlsx", "Company List", headers, values, [34, 42, 24, 22, 40]);
      setExportOpen(false);
    } catch (cause) {
      pdfWindow?.close();
      setExportError(cause instanceof Error ? cause.message : "Failed to export company data.");
    } finally {
      setIsExporting(false);
    }
  };

  const firstRow = total === 0 ? 0 : (page - 1) * perPage + 1;
  const lastRow = Math.min(page * perPage, total);

  return <div className="space-y-7">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-4xl font-bold tracking-tight text-black">Company List</h1></div>
      <button type="button" onClick={() => { setSuccessMessage(""); setModalCustomer(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Add Company</button>
    </div>
    {successMessage && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</p>}
    <div className="flex items-center justify-between gap-4 pt-1">
      <label className="relative block w-full max-w-[425px]"><Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input type="search" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Search Company, PIC or Phone Number" className="h-[52px] w-full rounded-full border border-slate-300 bg-white pl-14 pr-5 text-base font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
      <button type="button" onClick={() => { setExportError(""); setExportOpen(true); }} disabled={!total || isExporting} className="inline-flex h-[52px] items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Download className="h-5 w-5" />Export</button>
    </div>
    {exportError && <p role="alert" className="-mt-4 text-sm text-red-600">{exportError}</p>}
    <CustomerTable customers={customers} isLoading={isLoading} error={error} onRetry={() => void fetchCustomers()} searchKeyword={debouncedSearch} onResetSearch={() => setSearchKeyword("")} onEdit={(customer) => { setSuccessMessage(""); setModalCustomer(customer); setIsModalOpen(true); }} onDetails={(customer) => { setActionCustomer(customer); setActionMode("details"); }} onViewTasks={(customer) => { window.location.assign(`/dashboard/task-of-field-agent?company_id=${encodeURIComponent(customer.id)}`); }} onDelete={setDeleteTarget} />
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 pt-2 text-xs text-slate-500"><span>Showing {firstRow}-{lastRow} of {total} customers</span><nav className="flex items-center gap-1" aria-label="Company list pages">
      <button type="button" aria-label="Previous page" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
        const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + index;
        return <button type="button" key={pageNumber} aria-current={page === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-md px-2 ${page === pageNumber ? "bg-blue-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100"}`}>{pageNumber}</button>;
      })}
      {totalPages > 5 && <><span className="px-1">...</span><button type="button" onClick={() => setPage(totalPages)} className="h-8 min-w-8 rounded-md px-2 text-slate-600">{totalPages}</button></>}
      <button type="button" aria-label="Next page" disabled={page >= totalPages || isLoading} onClick={() => setPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </nav></div>
    <CustomerFormModal isOpen={isModalOpen} customer={modalCustomer} onClose={() => { setIsModalOpen(false); setModalCustomer(null); }} onSuccess={handleSaved} />
    <CompanyActionModal customer={actionCustomer} mode={actionMode} onClose={() => { setActionCustomer(null); setActionMode(null); }} />
    <DeleteConfirmDialog isOpen={Boolean(deleteTarget)} isDeleting={isDeleting} companyName={deleteTarget?.companyName || ""} onConfirm={() => void handleDelete()} onCancel={() => setDeleteTarget(null)} />
    {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isExporting) setExportOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="company-export-title" className="w-full max-w-5xl rounded-xl bg-white px-6 py-8 shadow-2xl sm:px-11 sm:py-10">
      <h2 id="company-export-title" className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Export Company List</h2><p className="mt-1 text-base text-[#747474] sm:text-xl">Select a file format and optional company creation date range</p>
      <div className="mt-5 grid gap-7 md:grid-cols-2"><fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">File Format</legend><div className="flex min-h-[165px] flex-col justify-center gap-4 rounded-lg border border-[#ccc] px-5 py-4 text-lg text-[#777]"><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="company-export-format" checked={exportFormat === "xlsx"} onChange={() => setExportFormat("xlsx")} className="h-5 w-5 accent-blue-600" /><span className="text-emerald-600">▦</span><span>Excel (.xlsx)</span></label><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="company-export-format" checked={exportFormat === "pdf"} onChange={() => setExportFormat("pdf")} className="h-5 w-5 accent-blue-600" /><span className="text-rose-500">▣</span><span>PDF (.pdf)</span></label>{exportFormat === "pdf" && <p className="pl-9 text-xs text-slate-500">The browser print dialog will open. Choose “Save as PDF”.</p>}</div></fieldset>
        <fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">Date Range</legend><div className="min-h-[165px] rounded-lg border border-[#ccc] p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-500">From<input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label><label className="text-xs font-medium text-slate-500">To<input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label></div><p className="mt-3 text-xs text-slate-400">Leave both dates blank to export all matching companies.</p></div></fieldset>
      </div>
      {exportError && <p role="alert" className="mt-3 text-sm text-rose-600">{exportError}</p>}
      <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-5"><button type="button" disabled={isExporting} onClick={() => setExportOpen(false)} className="h-14 rounded-lg border border-[#888] px-10 text-lg font-semibold text-[#505050] hover:bg-slate-50 disabled:opacity-60 sm:w-[220px]">Cancel</button><button type="button" disabled={isExporting} onClick={() => void runExport()} className="h-14 rounded-lg bg-[#3e6df5] px-10 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-[320px]">{isExporting ? "Preparing..." : "Export"}</button></div>
    </section></div>}
  </div>;
}
