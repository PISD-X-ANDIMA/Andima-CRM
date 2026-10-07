"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import type { ApiResponse, CustomerListItem } from "@/types/customer";
import { CustomerTable } from "@/components/customer/CustomerTable";
import { CustomerFormModal } from "@/components/customer/CustomerFormModal";
import { DeleteConfirmDialog } from "@/components/customer/DeleteConfirmDialog";
import { CompanyActionModal } from "@/components/customer/CompanyActionModals";

type ExportFormat = "xlsx" | "pdf";

function downloadCompanyPdf(customers: CustomerListItem[]) {
  const clean = (value: string) => value
    .replace(/[–—]/g, "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
  const lines = customers.flatMap((customer) => [
    `Company: ${customer.companyName}`,
    `Address: ${customer.address || "-"}`,
    `PIC: ${customer.primaryPic?.fullName || "-"} | Phone: ${customer.primaryPic?.phoneNumber || "-"}`,
    `Meeting schedule: ${(customer.meetings || []).map((meeting) => meeting.formattedSchedule).join("; ") || "Unscheduled"}`,
    `Customer code: ${customer.customerCode || "-"} | Job number: ${customer.jobNumber || "-"}`,
    "",
  ]);
  const pageLines = 54;
  const chunks = Array.from({ length: Math.ceil(lines.length / pageLines) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageRefs: number[] = [];
  chunks.forEach((chunk, index) => {
    const pageObjectId = objects.length + 1;
    const streamObjectId = pageObjectId + 1;
    pageRefs.push(pageObjectId);
    const textCommands = ["BT", "/F1 9 Tf", "40 760 Td", "12 TL", `(Company List Export - Page ${index + 1}) Tj`, "T*"];
    for (const line of chunk) textCommands.push(`(${clean(line).slice(0, 150)}) Tj`, "T*");
    textCommands.push("ET");
    const stream = textCommands.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamObjectId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "company-list.pdf";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
    try {
      const perExportPage = 100;
      const params = new URLSearchParams({ perPage: String(perExportPage), page: "1" });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const firstResponse = await fetch(`/api/v1/customers?${params}`);
      const firstResult: ApiResponse<CustomerListItem[]> = await firstResponse.json();
      if (!firstResponse.ok || !firstResult.success) throw new Error(firstResult.success ? "Failed to load companies for export." : firstResult.message);
      const allCustomers = [...firstResult.data];
      const pageCount = firstResult.meta?.totalPages || 1;
      for (let exportPage = 2; exportPage <= pageCount; exportPage += 1) {
        params.set("page", String(exportPage));
        const response = await fetch(`/api/v1/customers?${params}`);
        const result: ApiResponse<CustomerListItem[]> = await response.json();
        if (!response.ok || !result.success) throw new Error(result.success ? "Failed to load all companies for export." : result.message);
        allCustomers.push(...result.data);
      }
      const filteredCustomers = allCustomers.filter((customer) => {
        const createdDate = customer.createdAt?.slice(0, 10) || "";
        return (!exportStart || (createdDate && createdDate >= exportStart)) && (!exportEnd || (createdDate && createdDate <= exportEnd));
      });
      if (!filteredCustomers.length) throw new Error("No companies were found for the selected date range and search.");
      const rows = filteredCustomers.map((customer) => ({
        Company: customer.companyName,
        Address: customer.address || "",
        PIC: customer.primaryPic?.fullName || "",
        "PIC Phone Number": customer.primaryPic?.phoneNumber || "",
        "Meeting Schedule": (customer.meetings || []).map((meeting) => meeting.formattedSchedule).join("; ") || "Unscheduled",
        "Customer Code": customer.customerCode || "",
        "Job Number": customer.jobNumber || "",
      }));
      if (exportFormat === "pdf") {
        downloadCompanyPdf(filteredCustomers);
        setExportOpen(false);
        return;
      }
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Company List");
      XLSX.writeFile(workbook, "company-list.xlsx");
      setExportOpen(false);
    } catch (cause) {
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
    <CustomerTable customers={customers} isLoading={isLoading} error={error} onRetry={() => void fetchCustomers()} searchKeyword={debouncedSearch} onResetSearch={() => setSearchKeyword("")} onEdit={(customer) => { setSuccessMessage(""); setModalCustomer(customer); setIsModalOpen(true); }} onDetails={(customer) => { setActionCustomer(customer); setActionMode("details"); }} onViewTasks={(customer) => { setActionCustomer(customer); setActionMode("tasks"); }} onDelete={setDeleteTarget} />
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
      <div className="mt-5 grid gap-7 md:grid-cols-2"><fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">File Format</legend><div className="flex min-h-[165px] flex-col justify-center gap-4 rounded-lg border border-[#ccc] px-5 py-4 text-lg text-[#777]"><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="company-export-format" checked={exportFormat === "xlsx"} onChange={() => setExportFormat("xlsx")} className="h-5 w-5 accent-blue-600" /><span className="text-emerald-600">▦</span><span>Excel (.xlsx)</span></label><label className="flex cursor-pointer items-center gap-4"><input type="radio" name="company-export-format" checked={exportFormat === "pdf"} onChange={() => setExportFormat("pdf")} className="h-5 w-5 accent-blue-600" /><span className="text-rose-500">▣</span><span>PDF (.pdf)</span></label></div></fieldset>
        <fieldset><legend className="mb-1 text-lg font-medium text-[#444] sm:text-xl">Date Range</legend><div className="min-h-[165px] rounded-lg border border-[#ccc] p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-slate-500">From<input type="date" value={exportStart} onChange={(event) => setExportStart(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label><label className="text-xs font-medium text-slate-500">To<input type="date" value={exportEnd} onChange={(event) => setExportEnd(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700" /></label></div><p className="mt-3 text-xs text-slate-400">Leave both dates blank to export all matching companies.</p></div></fieldset>
      </div>
      {exportError && <p role="alert" className="mt-3 text-sm text-rose-600">{exportError}</p>}
      <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-5"><button type="button" disabled={isExporting} onClick={() => setExportOpen(false)} className="h-14 rounded-lg border border-[#888] px-10 text-lg font-semibold text-[#505050] hover:bg-slate-50 disabled:opacity-60 sm:w-[220px]">Cancel</button><button type="button" disabled={isExporting} onClick={() => void runExport()} className="h-14 rounded-lg bg-[#3e6df5] px-10 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-[320px]">{isExporting ? "Preparing..." : "Export"}</button></div>
    </section></div>}
  </div>;
}
