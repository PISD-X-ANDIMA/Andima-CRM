"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import type { ApiResponse, CustomerListItem } from "@/types/customer";
import { CustomerTable } from "@/components/customer/CustomerTable";
import { CustomerFormModal } from "@/components/customer/CustomerFormModal";
import { DeleteConfirmDialog } from "@/components/customer/DeleteConfirmDialog";
import { CompanyActionModal } from "@/components/customer/CompanyActionModals";

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
  const [exportError, setExportError] = useState("");
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
    setIsModalOpen(false);
    setModalCustomer(null);
    setSearchKeyword("");
    setDebouncedSearch("");
    setPage(1);
    setRefreshVersion((version) => version + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/customers/${deleteTarget.id}`, { method: "DELETE" });
      const result: ApiResponse<{ customerId: string }> = await response.json();
      if (!response.ok || !result.success) throw new Error(result.success ? "Failed to delete the company." : result.message);
      setDeleteTarget(null);
      if (customers.length === 1 && page > 1) setPage((current) => current - 1);
      else await fetchCustomers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete the company.");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportExcel = async () => {
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
      const rows = allCustomers.map((customer) => ({
        Company: customer.companyName,
        Address: customer.address || "",
        PIC: customer.primaryPic?.fullName || "",
        "Meeting Schedule": customer.meetingSchedule?.formattedSchedule || "Unscheduled",
        "Customer Code": customer.customerCode || "",
        "PIC Phone Number": customer.primaryPic?.phoneNumber || "",
        "Meeting Schedules": (customer.meetings || []).map((meeting) => meeting.formattedSchedule).join("; "),
        "Job Number": customer.jobNumber || "",
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Company List");
      XLSX.writeFile(workbook, "company-list.xlsx");
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
      <button type="button" onClick={() => { setModalCustomer(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Add Company</button>
    </div>
    <div className="flex items-center justify-between gap-4 pt-1">
      <label className="relative block w-full max-w-[425px]"><Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input type="search" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Search Company, PIC or Phone Number" className="h-[52px] w-full rounded-full border border-slate-300 bg-white pl-14 pr-5 text-base font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
      <button type="button" onClick={() => void exportExcel()} disabled={!total || isExporting} className="inline-flex h-[52px] items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Download className="h-5 w-5" />{isExporting ? "Exporting..." : "Export"}</button>
    </div>
    {exportError && <p role="alert" className="-mt-4 text-sm text-red-600">{exportError}</p>}
    <CustomerTable customers={customers} isLoading={isLoading} error={error} onRetry={() => void fetchCustomers()} searchKeyword={debouncedSearch} onResetSearch={() => setSearchKeyword("")} onEdit={(customer) => { setModalCustomer(customer); setIsModalOpen(true); }} onDetails={(customer) => { setActionCustomer(customer); setActionMode("details"); }} onViewTasks={(customer) => { setActionCustomer(customer); setActionMode("tasks"); }} onDelete={setDeleteTarget} />
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
  </div>;
}
