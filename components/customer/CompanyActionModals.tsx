"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, MapPin, X } from "lucide-react";
import type { ApiResponse, CustomerDetailItem, CustomerListItem } from "@/types/customer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ModalMode = "details" | "tasks";

interface Props {
  customer: CustomerListItem | null;
  mode: ModalMode | null;
  onClose: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}

export function CompanyActionModal({ customer, mode, onClose }: Props) {
  const { t } = useLanguage();
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
  const title = mode === "details" ? t("companyList.companyDetails", "Company Details") : t("companyList.fieldAgentTasks", "Task Of Field Agent");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="company-action-modal-title" className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <h2 id="company-action-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm font-medium text-blue-600">{customer.companyName}{customer.customerCode ? ` (${customer.customerCode})` : ""}</p>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <div role="status" className="grid min-h-48 place-items-center text-sm text-slate-500">
              {t("common.loading", "Loading company information...")}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : mode === "details" && detail ? (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-5 text-sm font-semibold text-slate-700">{t("companyList.companyInformation", "Company Information")}</h3>
                <div className="space-y-4">
                  <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label={t("customer.companyCode", "Company Code")} value={detail.customerCode} />
                  <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label={t("customer.companyName", "Company")} value={detail.companyName} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label={t("customer.address", "Address")} value={detail.address} />
                  <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label={t("customer.pic", "PIC")} value={detail.primaryPic?.fullName} />
                  <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label={t("customer.picNumber", "PIC Phone Number")} value={detail.primaryPic?.phoneNumber} />
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-5 text-sm font-semibold text-slate-700">{t("companyList.meetingSchedules", "Meeting Schedules")} ({detail.meetings.length})</h3>
                <div className="space-y-3">
                  {detail.meetings.length ? (
                    detail.meetings.map((meeting) => (
                      <article key={meeting.id} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-800">{meeting.formattedSchedule}</p>
                        <p className="mt-1 text-xs text-slate-600">{meeting.agenda || "—"}</p>
                        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
                          <span>{meeting.representativeName || "—"}</span>
                          <span className="capitalize">{meeting.status || "scheduled"}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">{t("companyList.noMeetingScheduled", "No meeting scheduled")}</p>
                  )}
                </div>
              </section>
            </div>
          ) : mode === "tasks" ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6">
              <p className="font-semibold text-slate-800">{customer.companyName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("companyList.noTasksYet", "No field agent tasks recorded for this company yet.")}</p>
            </div>
          ) : null}
        </div>
        <footer className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {t("common.close", "Close")}
          </button>
        </footer>
      </section>
    </div>
  );
}
