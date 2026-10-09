"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, MapPin, X } from "lucide-react";
import type { ApiResponse, CustomerDetailItem, CustomerListItem } from "@/types/customer";

type ModalMode = "details" | "tasks";

interface Props {
  customer: CustomerListItem | null;
  mode: ModalMode | null;
  onClose: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-400 dark:text-slate-500">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "Not provided"}</p></div></div>;
}

export function CompanyActionModal({ customer, mode, onClose }: Props) {
  const [detail, setDetail] = useState<CustomerDetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer || !mode || mode === "tasks") {
      setDetail(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setError("");
    setLoading(true);
    fetch(`/api/v1/customers/${customer.id}`, { signal: controller.signal })
      .then(async (response) => {
        const result: ApiResponse<CustomerDetailItem> = await response.json();
        if (!response.ok || !result.success) throw new Error(result.success ? "Failed to load company details." : result.message);
        setDetail(result.data);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Failed to load company details."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [customer, mode]);

  if (!customer || !mode) return null;
  const title = mode === "details" ? "Company Details" : "Task Of Field Agent";

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="company-action-modal-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <header className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4"><div><h2 id="company-action-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">{customer.companyName}</p></div><button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"><X className="h-4 w-4" /></button></header>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        {loading ? <div role="status" className="grid min-h-36 place-items-center text-xs text-slate-500 dark:text-slate-400">Loading company information...</div> : error ? <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-red-300">{error}</div> : mode === "details" && detail ? <>
          <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-4"><h3 className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Company Information</h3><div className="space-y-3"><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="Company" value={detail.companyName} /><InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={detail.address} /><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="PIC" value={detail.primaryPic?.fullName} /><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="PIC Phone Number" value={detail.primaryPic?.phoneNumber} /></div></section>
            <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-4"><h3 className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Meeting Schedules ({detail.meetings.length})</h3><div className="space-y-2.5">{detail.meetings.length ? detail.meetings.map((meeting) => <article key={meeting.id} className="rounded-lg bg-white dark:bg-slate-800 p-2.5 border border-slate-200/70 dark:border-slate-700 shadow-2xs"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{meeting.formattedSchedule}</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{meeting.agenda || "No agenda"}</p><div className="mt-1.5 flex justify-between gap-2 text-[11px] text-slate-400"><span>{meeting.representativeName || "Representative not provided"}</span><span className="capitalize">{meeting.status || "scheduled"}</span></div></article>) : <p className="text-xs text-slate-400">No meeting scheduled</p>}</div><div className="mt-3 border-t border-slate-200/70 dark:border-slate-700 pt-3 text-[11px] text-slate-500 dark:text-slate-400"><p>Customer Code: {detail.transactionNo || "Not available"}</p><p className="mt-0.5">Job Number: {detail.jobNumber || "Not assigned"}</p></div></section></div>
        </> : mode === "tasks" ? <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-4"><p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{customer.companyName}</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Field Agent tasks are managed by Squad A2. This A1 view is read-only and will display their task data once Squad A2 provides the integration endpoint and access rules.</p></div> : null}
      </div>
      <footer className="flex justify-end border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1324] px-5 py-3"><button type="button" onClick={onClose} className="h-9 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer">Close</button></footer>
    </section>
  </div>;
}
