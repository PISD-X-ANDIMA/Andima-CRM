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
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto h-5 w-5 text-red-600" /><p className="mt-2 text-xs font-semibold text-red-800">Failed to load company data</p><p className="mt-1 text-xs text-red-700">{error}</p><button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"><RefreshCw className="h-3.5 w-3.5" />Try again</button></div>
  if (isLoading) return <div aria-label="Loading company list" className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-12 animate-pulse border-b border-slate-100 bg-slate-50/60" />)}</div>
  if (!customers.length) return <div className="rounded-xl border border-slate-200/90 bg-white p-8 text-center"><p className="text-xs font-medium text-slate-600">{searchKeyword ? `No companies found for “${searchKeyword}”` : 'No company data yet.'}</p>{searchKeyword && <button onClick={onResetSearch} className="mt-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700">Clear search</button>}</div>

  return <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs"><table className="w-full min-w-[1020px] table-fixed text-left"><thead className="border-b border-slate-100 bg-slate-50/80 text-slate-600"><tr>
    <th className="w-[20%] px-4 py-3 text-xs font-semibold">Company</th>
    <th className="w-[22%] px-4 py-3 text-xs font-semibold">Address</th>
    <th className="w-[12%] px-4 py-3 text-xs font-semibold">PIC</th>
    <th className="w-[13%] px-4 py-3 text-xs font-semibold">PIC Number</th>
    <th className="w-[15%] px-4 py-3 text-xs font-semibold">Meeting Schedule</th>
    <th className="w-[9%] px-3 py-3 text-xs font-semibold text-center">Task</th>
    <th className="w-[9%] px-3 py-3 text-xs font-semibold text-center">Actions</th>
  </tr></thead><tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.id} className="text-xs text-slate-700 hover:bg-slate-50/60 transition-colors">
    <td className="break-words px-4 py-3 font-medium text-slate-900 leading-snug">{customer.companyName}</td>
    <td className="px-4 py-3"><span className="line-clamp-2 text-xs text-slate-500">{customer.address || '—'}</span></td>
    <td className="break-words px-4 py-3 font-medium text-slate-800">{customer.primaryPic?.fullName || '—'}</td>
    <td className="break-words px-4 py-3 text-slate-600">{customer.primaryPic?.phoneNumber || '—'}</td>
    <td className="px-4 py-3">{customer.meetings?.length ? <Link href="/dashboard/meeting-schedule" className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"><CalendarDays className="h-3 w-3 shrink-0" /><span className="truncate">{customer.meetings.length === 1 ? customer.meetings[0].formattedSchedule : `${customer.meetings.length} meetings`}</span></Link> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">Unscheduled</span>}</td>
    <td className="px-3 py-3 text-center"><button type="button" onClick={() => onViewTasks(customer)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"><BriefcaseBusiness className="h-3 w-3 text-blue-600" />Tasks</button></td>
    <td className="px-3 py-3 text-center"><div className="flex items-center justify-center gap-1"><button type="button" onClick={() => onDetails(customer)} aria-label={`View details for ${customer.companyName}`} title="View details" className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"><Eye className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onEdit(customer)} aria-label={`Edit ${customer.companyName}`} title="Edit company" className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onDelete(customer)} aria-label={`Delete ${customer.companyName}`} title="Delete company" className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
  </tr>)}</tbody></table></div>
}
