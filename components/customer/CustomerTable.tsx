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

export function CustomerTable({ customers, isLoading, error, onRetry, searchKeyword, onResetSearch, onEdit, onDetails, onViewTasks, onDelete }: Props) {
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto h-6 w-6 text-red-600" /><p className="mt-2 font-semibold text-red-800">Failed to load company data</p><p className="mt-1 text-sm text-red-700">{error}</p><button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 text-sm text-blue-700"><RefreshCw className="h-4 w-4" />Try again</button></div>;
  if (isLoading) return <div aria-label="Loading company list" aria-busy="true" className="overflow-x-auto rounded-md border border-slate-300 bg-white"><table className="w-full min-w-[1120px] table-fixed text-left"><thead className="bg-[#edf4f8] text-slate-700"><tr>{["Company", "Address", "PIC", "PIC Number", "Meeting Schedule", "Task", "Details"].map((heading, index) => <th key={heading} className={`px-4 py-5 text-base font-semibold ${["w-[19%]", "w-[21%]", "w-[12%]", "w-[14%]", "w-[16%]", "w-[9%]", "w-[9%]"][index]}`}>{heading}</th>)}</tr></thead><tbody>{Array.from({ length: 5 }, (_, row) => <tr key={row} className="border-t border-slate-200">{Array.from({ length: 7 }, (_, cell) => <td key={cell} className="px-4 py-5"><div className={`h-4 animate-pulse rounded bg-slate-200 ${cell === 0 ? "w-3/4" : cell === 4 || cell === 5 || cell === 6 ? "w-2/3" : "w-full"}`} /></td>)}</tr>)}</tbody></table></div>;
  if (!customers.length) return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><p className="font-semibold text-slate-700">{searchKeyword ? `No companies found for “${searchKeyword}”` : "No company data yet."}</p>{searchKeyword && <button onClick={onResetSearch} className="mt-3 text-sm text-blue-600">Clear search</button>}</div>;

  return <div className="overflow-x-auto rounded-md border border-slate-300 bg-white"><table className="w-full min-w-[1120px] table-fixed text-left"><thead className="bg-[#edf4f8] text-slate-700"><tr>
    <th className="w-[19%] px-4 py-5 text-base font-semibold">Company</th>
    <th className="w-[21%] px-4 py-5 text-base font-semibold">Address</th>
    <th className="w-[12%] px-4 py-5 text-base font-semibold">PIC</th>
    <th className="w-[14%] px-4 py-5 text-base font-semibold">PIC Number</th>
    <th className="w-[16%] px-4 py-4 text-base font-semibold leading-tight">Meeting<br />Schedule</th>
    <th className="w-[9%] px-3 py-5 text-base font-semibold">Task</th>
    <th className="w-[9%] px-3 py-5 text-base font-semibold">Details</th>
  </tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="min-h-[76px] border-t border-slate-300 text-sm text-slate-700">
    <td className="break-words px-4 py-3 font-medium leading-tight">{customer.companyName}</td>
    <td className="px-4 py-3"><span className="line-clamp-2 text-sm text-slate-600">{customer.address || "—"}</span></td>
    <td className="break-words px-4 py-3">{customer.primaryPic?.fullName || "—"}</td>
    <td className="break-words px-4 py-3 text-sm">{customer.primaryPic?.phoneNumber || "—"}</td>
    <td className="px-3 py-3">{customer.meetings?.length ? <Link href="/dashboard/meeting-schedule" className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium leading-tight text-blue-800"><CalendarDays className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{customer.meetings.length === 1 ? customer.meetings[0].formattedSchedule : `${customer.meetings.length} meetings`}</span></Link> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">Unscheduled</span>}</td>
    <td className="px-2 py-3"><button type="button" onClick={() => onViewTasks(customer)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-100 px-2 py-2 text-[11px] font-medium text-blue-900 hover:bg-blue-200"><BriefcaseBusiness className="h-3.5 w-3.5 text-blue-700" />Tasks</button></td>
    <td className="px-2 py-3"><div className="flex items-center gap-0.5"><button type="button" onClick={() => onDetails(customer)} aria-label={`View details for ${customer.companyName}`} title="View details" className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => onEdit(customer)} aria-label={`Edit ${customer.companyName}`} title="Edit company" className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => onDelete(customer)} aria-label={`Delete ${customer.companyName}`} title="Delete company" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td>
  </tr>)}</tbody></table></div>;
}
