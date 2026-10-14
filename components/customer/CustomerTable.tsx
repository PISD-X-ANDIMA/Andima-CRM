"use client";

import Link from "next/link";
import { AlertCircle, BriefcaseBusiness, CalendarDays, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { CustomerListItem } from "@/types/customer";

interface Props {
  customers: CustomerListItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  searchKeyword: string;
  onResetSearch: () => void;
  onEdit: (customer: CustomerListItem) => void;
  onDetails: (customer: CustomerListItem) => void;
  onViewTasks: (customer: CustomerListItem) => void;
  onDelete: (customer: CustomerListItem) => void;
}

export function CustomerTable({
  customers,
  isLoading,
  error,
  onRetry,
  searchKeyword,
  onResetSearch,
  onEdit,
  onDetails,
  onViewTasks,
  onDelete
}: Props) {
  if (error) {
    return (
      <div role="alert" className="p-8 text-center bg-red-50 text-red-800">
        <AlertCircle className="mx-auto h-6 w-6 text-red-600 mb-2" />
        <p className="font-semibold text-sm">Failed to load company data</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] table-fixed text-left border-collapse">
        <thead className="bg-[#F5F7FF] border-b border-slate-200/80 text-slate-800">
          <tr>
            <th className="w-[19%] py-4 px-4 text-sm font-bold text-slate-800 first:rounded-tl-2xl">Company</th>
            <th className="w-[21%] py-4 px-4 text-sm font-bold text-slate-800">Address</th>
            <th className="w-[12%] py-4 px-4 text-sm font-bold text-slate-800">PIC</th>
            <th className="w-[14%] py-4 px-4 text-sm font-bold text-slate-800">PIC Number</th>
            <th className="w-[16%] py-4 px-4 text-sm font-bold text-slate-800 leading-tight">
              Meeting<br />Schedule
            </th>
            <th className="w-[9%] py-4 px-3 text-sm font-bold text-slate-800">Task</th>
            <th className="w-[9%] py-4 px-3 text-sm font-bold text-slate-800 last:rounded-tr-2xl">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            Array.from({ length: 5 }, (_, i) => (
              <tr key={`loading-${i}`} className="animate-pulse border-b border-slate-100">
                <td className="py-4.5 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-36" /></td>
                <td className="py-4.5 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-48" /></td>
                <td className="py-4.5 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-24" /></td>
                <td className="py-4.5 px-4"><div className="h-4 bg-slate-200/70 rounded-md w-28" /></td>
                <td className="py-4.5 px-4"><div className="h-6 bg-slate-200/70 rounded-full w-28" /></td>
                <td className="py-4.5 px-3"><div className="h-6 bg-slate-200/70 rounded-full w-16" /></td>
                <td className="py-4.5 px-3"><div className="h-4 bg-slate-200/70 rounded-md w-16" /></td>
              </tr>
            ))
          ) : customers.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-14 text-center">
                <p className="font-semibold text-slate-700 text-sm">
                  {searchKeyword ? `No companies found for "${searchKeyword}"` : "No company data yet."}
                </p>
                {searchKeyword && (
                  <button
                    onClick={onResetSearch}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-blue-50/20 transition-colors text-sm text-slate-700"
              >
                <td className="break-words px-4 py-3.5 font-medium leading-tight text-slate-900">
                  {customer.companyName}
                </td>
                <td className="px-4 py-3.5">
                  <span className="line-clamp-2 text-xs text-slate-600 font-normal">
                    {customer.address || "—"}
                  </span>
                </td>
                <td className="break-words px-4 py-3.5 text-xs text-slate-800 font-medium">
                  {customer.primaryPic?.fullName || "—"}
                </td>
                <td className="break-words px-4 py-3.5 text-xs text-slate-700 font-mono">
                  {customer.primaryPic?.phoneNumber || "—"}
                </td>
                <td className="px-4 py-3.5">
                  {customer.meetings?.length ? (
                    <Link
                      href="/dashboard/meeting-schedule"
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {customer.meetings.length === 1
                          ? customer.meetings[0].formattedSchedule
                          : `${customer.meetings.length} meetings`}
                      </span>
                    </Link>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 font-medium">
                      Unscheduled
                    </span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  <button
                    type="button"
                    onClick={() => onViewTasks(customer)}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <BriefcaseBusiness className="h-3.5 w-3.5 text-blue-600" />
                    <span>Tasks</span>
                  </button>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDetails(customer)}
                      aria-label={`View details for ${customer.companyName}`}
                      title="View details"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(customer)}
                      aria-label={`Edit ${customer.companyName}`}
                      title="Edit company"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(customer)}
                      aria-label={`Delete ${customer.companyName}`}
                      title="Delete company"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
