"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Briefcase,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { CustomerListItem } from "@/types/customer";
import { CustomerEmptyState } from "./CustomerEmptyState";

interface CustomerTableProps {
  customers: CustomerListItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  searchKeyword: string;
  onResetSearch: () => void;
}

const TABLE_HEADERS = [
  "NO",
  "COMPANY NAME",
  "TRANSACTION NO",
  "PIC",
  "JOB NO",
  "CREATED BY / DATE",
  "STATUS",
  "",
];

export function CustomerTable({
  customers,
  isLoading,
  error,
  onRetry,
  searchKeyword,
  onResetSearch,
}: CustomerTableProps) {
  // Error State
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          Gagal Memuat Data Customer
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Loading State (Skeleton)
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {TABLE_HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="py-3.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-6" /></td>
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-48" /></td>
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                <td className="py-4 px-5"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                <td className="py-4 px-5"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
                <td className="py-4 px-5"><div className="h-7 bg-slate-100 rounded w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty State
  if (customers.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CustomerEmptyState
          isSearch={Boolean(searchKeyword.trim())}
          searchKeyword={searchKeyword}
          onResetSearch={onResetSearch}
        />
      </div>
    );
  }

  // Data Table
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {TABLE_HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="py-3.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {customers.map((customer, idx) => (
              <tr
                key={customer.id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* NO */}
                <td className="py-4 px-5 text-sm text-slate-500 font-medium">
                  {idx + 1}
                </td>

                {/* COMPANY NAME */}
                <td className="py-4 px-5">
                  <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {customer.companyName}
                  </span>
                </td>

                {/* TRANSACTION NO */}
                <td className="py-4 px-5">
                  {customer.transactionNo ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                      {customer.transactionNo}
                    </span>
                  ) : (
                    <p className="text-slate-500 text-[13px] leading-relaxed truncate max-w-[200px]">
                      {customer.address}
                    </p>
                  )}
                </td>

                {/* PIC */}
                <td className="py-4 px-5">
                  {customer.primaryPic ? (
                    <span className="text-slate-700 text-[13px] font-medium">
                      {customer.primaryPic.fullName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">—</span>
                  )}
                </td>

                {/* JOB NO */}
                <td className="py-4 px-5">
                  {customer.jobNumber ? (
                    <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                      {customer.jobNumber}
                    </span>
                  ) : customer.primaryPic?.phoneNumber ? (
                    <span className="text-slate-600 text-[13px] font-mono">
                      {customer.primaryPic.phoneNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                {/* CREATED BY / DATE */}
                <td className="py-4 px-5">
                  {customer.createdBy ? (
                    <div className="flex flex-col">
                      <span className="text-slate-800 text-[13px] font-medium">
                        {customer.createdBy}
                      </span>
                      <span className="text-slate-400 text-[11px] mt-0.5">
                        {customer.createdDate || "02/06/26"}
                      </span>
                    </div>
                  ) : customer.meetingSchedule ? (
                    <span className="text-slate-600 text-[13px]">
                      {customer.meetingSchedule.formattedSchedule}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                {/* STATUS */}
                <td className="py-4 px-5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Active
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/company-list/${customer.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-md transition-colors"
                      title="Detail Customer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Detail</span>
                    </Link>
                    <Link
                      href={`/dashboard/company-list/${customer.id}/jobs`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      title="Lihat Job"
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>Job</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
