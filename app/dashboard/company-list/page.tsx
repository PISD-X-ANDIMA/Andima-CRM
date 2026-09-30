"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Download, ChevronDown, RefreshCw } from "lucide-react";
import { CustomerListItem, ApiResponse } from "@/types/customer";
import { CustomerTable } from "@/components/customer/CustomerTable";
import { CustomerFormModal } from "@/components/customer/CustomerFormModal";

export default function CompanyListPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const fetchCustomers = useCallback(async (keyword = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ perPage: "50" });
      if (keyword.trim()) params.set("search", keyword.trim());

      const res = await fetch(`/api/v1/customers?${params.toString()}`);
      const json: ApiResponse<CustomerListItem[]> = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          (!json.success && json.message) || "Failed to load customer data"
        );
      }

      setCustomers(json.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "A connection error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchCustomers(debouncedSearch); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchCustomers, debouncedSearch]);

  const handleResetSearch = () => {
    setSearchKeyword("");
    setDebouncedSearch("");
  };

  const handleAddSuccess = (companyId: string) => {
    setIsModalOpen(false);
    // Refresh the list and navigate to the customer details.
    fetchCustomers(debouncedSearch);
    router.push(`/dashboard/company-list/${companyId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-950 tracking-tight">
            Company List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customers and contact information.
          </p>
        </div>

        {/* Add Customer */}
        <button
          id="btn-add-customer"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-customer"
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search company or PIC..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Status Filter placeholder */}
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-400 cursor-not-allowed"
        >
          <span>Status</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Meeting Schedule Filter placeholder */}
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-400 cursor-not-allowed"
        >
          <span>Meeting Schedule</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Refresh */}
        <button
          type="button"
          onClick={() => fetchCustomers(debouncedSearch)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        {/* Export placeholder */}
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-400 cursor-not-allowed"
          title="Export (Coming Soon)"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        error={error}
        onRetry={() => fetchCustomers(debouncedSearch)}
        searchKeyword={debouncedSearch}
        onResetSearch={handleResetSearch}
      />

      {/* Add Customer Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
