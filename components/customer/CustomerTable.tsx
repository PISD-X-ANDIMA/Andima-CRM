"use client";

import Link from "next/link";
import { AlertCircle, CalendarDays, ClipboardList, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
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
  isManager?: boolean;
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
  onDelete,
  isManager = false,
}: Props) {
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-amber-600" />
        <p className="mt-2 font-semibold text-amber-800">Gagal memuat data perusahaan</p>
        <p className="mt-1 text-sm text-amber-700">{error}</p>
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" />Coba lagi
        </button>
      </div>
    );
  }

  if (isLoading) {
    const colCount = isManager ? 8 : 7;
    const widths = ["w-4/5", "w-3/5", "w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-1/3", "w-1/2"];
    return (
      <div aria-label="Loading company list" aria-busy="true" className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full min-w-[1120px] table-fixed text-left">
          <thead className="bg-[#edf4f8] text-slate-700">
            <tr>
              {(isManager
                ? ["Company", "Sales Executive", "Address", "PIC", "PIC Number", "Meeting Schedule", "Task", "Details"]
                : ["Company", "Address", "PIC", "PIC Number", "Meeting Schedule", "View Task", "Action"]
              ).map((heading) => (
                <th key={heading} className="px-4 py-4 text-sm font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, row) => (
              <tr key={row} className="border-t border-slate-100">
                {Array.from({ length: colCount }, (_, cell) => (
                  <td key={cell} className="px-4 py-4">
                    <div className={`h-4 animate-pulse rounded-md bg-slate-200/70 ${widths[cell % widths.length]}`} style={{ animationDelay: `${row * 80 + cell * 40}ms` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="font-semibold text-slate-700">
          {searchKeyword ? `No companies found for “${searchKeyword}”` : "No company data yet."}
        </p>
        {searchKeyword && (
          <button onClick={onResetSearch} className="mt-3 text-sm text-blue-600">
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-300 bg-white shadow-2xs">
      <table className="w-full min-w-[1120px] table-fixed text-left">
        <thead className="bg-[#edf4f8] text-slate-700">
          <tr>
            <th className="w-[18%] px-4 py-4 text-sm font-semibold">Company</th>
            {isManager && (
              <th className="w-[13%] px-4 py-4 text-sm font-semibold">Sales Executive</th>
            )}
            <th className={isManager ? "w-[15%] px-4 py-4 text-sm font-semibold" : "w-[21%] px-4 py-4 text-sm font-semibold"}>
              Address
            </th>
            <th className="w-[13%] px-4 py-4 text-sm font-semibold">PIC</th>
            <th className="w-[13%] px-4 py-4 text-sm font-semibold">PIC Number</th>
            <th className="w-[14%] px-3 py-4 text-sm font-semibold leading-tight">Meeting Schedule</th>
            <th className="w-[7%] px-2 py-4 text-center text-sm font-semibold">{isManager ? "Task" : "View Task"}</th>
            <th className="w-[7%] px-2 py-4 text-center text-sm font-semibold">{isManager ? "Details" : "Action"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
          {customers.map((customer) => {
            const execName = customer.createdBy || (customer as any).salesExecutive || "—";
            const scheduleText = customer.meetingSchedule?.formattedSchedule || "Unscheduled";

            return (
              <tr key={customer.id} className="min-h-[70px] transition-colors hover:bg-slate-50/70">
                <td className="break-words px-4 py-3.5 font-medium text-slate-900 leading-tight">
                  {customer.companyName}
                </td>

                {isManager && (
                  <td className="break-words px-4 py-3.5 text-slate-700">
                    {execName}
                  </td>
                )}

                <td className="px-4 py-3.5">
                  <span className="line-clamp-2 text-slate-600">{customer.address || "—"}</span>
                </td>
                <td className="break-words px-4 py-3.5 text-slate-800">
                  {customer.primaryPic?.fullName || "—"}
                </td>
                <td className="break-words px-4 py-3.5 text-slate-700">
                  {customer.primaryPic?.phoneNumber || "—"}
                </td>

                <td className="px-3 py-3.5">
                  {customer.meetingSchedule ? (
                    <Link
                      href={`/dashboard/meeting-schedule?date=${customer.meetingSchedule.occurrenceDate || ""}`}
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span className="truncate">{scheduleText}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-medium">
                      Unscheduled
                    </span>
                  )}
                </td>

                {/* Task column */}
                <td className="px-2 py-3.5 text-center">
                  {isManager ? (
                    <button
                      type="button"
                      onClick={() => onViewTasks(customer)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
                    >
                      Tasks
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onViewTasks(customer)}
                      aria-label={`View tasks for ${customer.companyName}`}
                      title="View tasks"
                      className="mx-auto grid rounded p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </button>
                  )}
                </td>

                {/* Details / Action column */}
                <td className="px-2 py-3.5 text-center">
                  {isManager ? (
                    <button
                      type="button"
                      onClick={() => onDetails(customer)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
                    >
                      View
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onDetails(customer)}
                        aria-label={`View details for ${customer.companyName}`}
                        title="View details"
                        className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        aria-label={`Edit ${customer.companyName}`}
                        title="Edit company"
                        className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(customer)}
                        aria-label={`Delete ${customer.companyName}`}
                        title="Delete company"
                        className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
