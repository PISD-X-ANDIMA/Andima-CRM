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
  return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{value || "Not provided"}</p></div></div>;
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
    <section role="dialog" aria-modal="true" aria-labelledby="company-action-modal-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="company-action-modal-title" className="text-base sm:text-lg font-bold text-slate-900">{title}</h2><p className="mt-0.5 text-xs font-medium text-blue-600">{customer.companyName}</p></div><button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><X className="h-4 w-4" /></button></header>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        {loading ? <div role="status" className="grid min-h-36 place-items-center text-xs text-slate-500">Loading company information...</div> : error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">{error}</div> : mode === "details" && detail ? <>
          <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-xl border border-slate-200/80 p-4"><h3 className="mb-3 text-xs font-semibold text-slate-700">Company Information</h3><div className="space-y-3"><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="Company" value={detail.companyName} /><InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={detail.address} /><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="PIC" value={detail.primaryPic?.fullName} /><InfoRow icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label="PIC Phone Number" value={detail.primaryPic?.phoneNumber} /></div></section>
            <section className="rounded-xl border border-slate-200/80 p-4"><h3 className="mb-3 text-xs font-semibold text-slate-700">Meeting Schedules ({detail.meetings.length})</h3><div className="space-y-2.5">{detail.meetings.length ? detail.meetings.map((meeting) => <article key={meeting.id} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100"><p className="text-xs font-semibold text-slate-800">{meeting.formattedSchedule}</p><p className="mt-0.5 text-[11px] text-slate-500">{meeting.agenda || "No agenda"}</p><div className="mt-1.5 flex justify-between gap-2 text-[11px] text-slate-400"><span>{meeting.representativeName || "Representative not provided"}</span><span className="capitalize">{meeting.status || "scheduled"}</span></div></article>) : <p className="text-xs text-slate-400">No meeting scheduled</p>}</div><div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><p>Customer Code: {detail.transactionNo || "Not available"}</p><p className="mt-0.5">Job Number: {detail.jobNumber || "Not assigned"}</p></div></section></div>
        </> : mode === "tasks" ? <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"><p className="text-xs font-semibold text-slate-800">{customer.companyName}</p><p className="mt-1 text-xs leading-5 text-slate-600">Field Agent tasks are managed by Squad A2. This A1 view is read-only and will display their task data once Squad A2 provides the integration endpoint and access rules.</p></div> : null}
      </div>
      <footer className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-3"><button type="button" onClick={onClose} className="h-9 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs">Close</button></footer>
    </section>
  </div>;
}
