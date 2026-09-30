"use client";

import Link from "next/link";
import { AlertCircle, Briefcase, ExternalLink, RefreshCw } from "lucide-react";
import type { CustomerListItem } from "@/types/customer";

interface Props {
  customers: CustomerListItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  searchKeyword: string;
  onResetSearch: () => void;
}

export function CustomerTable({ customers, isLoading, error, onRetry, searchKeyword, onResetSearch }: Props) {
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto h-6 w-6 text-red-600" /><p className="mt-2 font-semibold text-red-800">Failed to load company data</p><p className="mt-1 text-sm text-red-700">{error}</p><button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 text-sm text-blue-700"><RefreshCw className="h-4 w-4" />Try again</button></div>;
  if (isLoading) return <div aria-label="Loading company list" className="overflow-hidden rounded-xl border border-slate-200">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-16 animate-pulse border-b bg-slate-50" />)}</div>;
  if (!customers.length) return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><p className="font-semibold text-slate-700">{searchKeyword ? `No companies found for “${searchKeyword}”` : "No company data yet."}</p>{searchKeyword && <button onClick={onResetSearch} className="mt-3 text-sm text-blue-600">Clear search</button>}</div>;

  return <div className="overflow-x-auto rounded-md border border-slate-300 bg-white"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#edf4f8] text-slate-700"><tr>{["Transaction ID", "Company", "PIC", "PIC Number", "Action"].map((label) => <th key={label} className="px-5 py-5 text-base font-semibold">{label}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-slate-300 text-base text-slate-700"><td className="px-5 py-5">{customer.transactionNo || customer.id.slice(0, 12)}</td><td className="px-5 py-5 font-medium">{customer.companyName}</td><td className="px-5 py-5">{customer.primaryPic?.fullName || "—"}</td><td className="px-5 py-5">{customer.primaryPic?.phoneNumber || "—"}</td><td className="px-5 py-5"><div className="flex items-center gap-3"><Link aria-label={`View details for ${customer.companyName}`} href={`/dashboard/company-list/${customer.id}`} className="text-slate-500 hover:text-blue-600"><ExternalLink className="h-5 w-5" /></Link><Link aria-label={`View jobs for ${customer.companyName}`} href={`/dashboard/company-list/${customer.id}/jobs`} className="text-slate-500 hover:text-blue-600"><Briefcase className="h-5 w-5" /></Link></div></td></tr>)}</tbody></table></div>;
}
