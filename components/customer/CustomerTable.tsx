"use client";

import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Eye,
  Pencil,
  RefreshCw,
  Trash2,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import type { CustomerListItem } from "@/types/customer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { t } = useLanguage();

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-amber-600" />
        <p className="mt-2 font-semibold text-amber-800">{t("common.noData", "Failed to load company data")}</p>
        <p className="mt-1 text-sm text-amber-700">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          {t("common.retry", "Try again")}
        </button>
      </div>
    );
  }

  if (isLoading) {
    const colCount = isManager ? 9 : 8;
    const widths = ["w-4/5", "w-2/5", "w-3/5", "w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-1/3", "w-1/2"];
    return (
      <div>
        {/* Mobile Skeleton Cards */}
        <div className="space-y-3 md:hidden" aria-busy="true" aria-label="Loading companies">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                <div className="h-8 flex-1 animate-pulse rounded bg-slate-100" />
                <div className="h-8 flex-1 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Skeleton Table */}
        <div aria-label="Loading company list" aria-busy="true" className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full min-w-[1120px] table-fixed text-left">
            <thead className="bg-[#edf4f8] text-slate-700">
              <tr>
                {(isManager
                  ? [
                      t("dashboard.company", "Company"),
                      t("customer.companyCode", "Company Code"),
                      t("nav.salesExecutive", "Sales Executive"),
                      t("common.address", "Address"),
                      t("dashboard.pic", "PIC"),
                      t("dashboard.picNumber", "PIC Number"),
                      t("common.meetingSchedule", "Meeting Schedule"),
                      t("dashboard.tasks", "Task"),
                      t("common.details", "Details"),
                    ]
                  : [
                      t("dashboard.company", "Company"),
                      t("customer.companyCode", "Company Code"),
                      t("common.address", "Address"),
                      t("dashboard.pic", "PIC"),
                      t("dashboard.picNumber", "PIC Number"),
                      t("common.meetingSchedule", "Meeting Schedule"),
                      t("common.viewTask", "View Task"),
                      t("common.action", "Action"),
                    ]
                ).map((heading) => (
                  <th key={heading} className="px-4 py-4 text-sm font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, row) => (
                <tr key={row} className="border-t border-slate-100">
                  {Array.from({ length: colCount }, (_, cell) => (
                    <td key={cell} className="px-4 py-4">
                      <div
                        className={`h-4 animate-pulse rounded-md bg-slate-200/70 ${widths[cell % widths.length]}`}
                        style={{ animationDelay: `${row * 80 + cell * 40}ms` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-10 text-center">
        <p className="font-semibold text-slate-700">
          {searchKeyword
            ? t("companyList.noCompaniesFound", `No companies found for “${searchKeyword}”`, { search: searchKeyword })
            : t("companyList.noCompanyData", "No company data yet.")}
        </p>
        {searchKeyword && (
          <button onClick={onResetSearch} className="mt-3 text-sm font-semibold text-blue-600 hover:underline cursor-pointer">
            {t("companyList.clearSearch", "Clear search")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* ======================================================== */}
      {/* 1. MOBILE RESPONSIVE CARD VIEW (Screens < 768px)          */}
      {/* ======================================================== */}
      <div className="space-y-3.5 md:hidden" role="list" aria-label="Company Cards">
        {customers.map((customer) => {
          const execName = customer.createdBy || (customer as any).salesExecutive || "—";
          const scheduleText = customer.meetingSchedule?.formattedSchedule || t("common.unscheduled", "Unscheduled");

          return (
            <article
              key={customer.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-shadow active:shadow-md"
            >
              {/* Header: Company Name & Code */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight break-words">
                      {customer.companyName}
                    </h3>
                    {customer.customerCode && (
                      <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 border border-blue-200/70">
                        {customer.customerCode}
                      </span>
                    )}
                  </div>
                  {isManager && (
                    <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{execName}</span>
                    </p>
                  )}
                </div>

                {/* Meeting badge */}
                {customer.meetingSchedule ? (
                  <Link
                    href={`/dashboard/meeting-schedule?date=${customer.meetingSchedule.occurrenceDate || ""}`}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    <CalendarDays className="h-3 w-3" />
                    <span>{customer.meetingSchedule.formattedSchedule}</span>
                  </Link>
                ) : (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {t("common.unscheduled", "Unscheduled")}
                  </span>
                )}
              </div>

              {/* Body: PIC & Address */}
              <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                {/* PIC Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">
                      {customer.primaryPic?.fullName || "—"}
                    </span>
                  </div>
                  {customer.primaryPic?.phoneNumber && (
                    <a
                      href={`tel:${customer.primaryPic.phoneNumber}`}
                      className="inline-flex items-center gap-1 text-blue-600 font-mono text-[11px] font-semibold hover:underline bg-blue-50/70 px-2 py-0.5 rounded"
                      title="Call PIC"
                    >
                      <Phone className="h-3 w-3 text-blue-600" />
                      <span>{customer.primaryPic.phoneNumber}</span>
                    </a>
                  )}
                </div>

                {/* Address */}
                {customer.address && (
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Footer: Quick Actions */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewTasks(customer)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>{t("common.viewTask", "Task")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDetails(customer)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t("common.details", "Details")}</span>
                </button>

                {!isManager && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(customer)}
                      aria-label={`Edit ${customer.companyName}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(customer)}
                      aria-label={`Delete ${customer.companyName}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP FULL TABLE VIEW (Screens >= 768px)             */}
      {/* ======================================================== */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-slate-300 bg-white shadow-2xs">
        <table className="w-full min-w-[1120px] table-fixed text-left">
          <thead className="bg-[#edf4f8] text-slate-700">
            <tr>
              <th className={isManager ? "w-[15%] px-4 py-4 text-sm font-semibold" : "w-[17%] px-4 py-4 text-sm font-semibold"}>
                {t("dashboard.company", "Company")}
              </th>
              <th className="w-[11%] px-3 py-4 text-sm font-semibold">
                {t("customer.companyCode", "Company Code")}
              </th>
              {isManager && (
                <th className="w-[12%] px-4 py-4 text-sm font-semibold">{t("nav.salesExecutive", "Sales Executive")}</th>
              )}
              <th className={isManager ? "w-[14%] px-4 py-4 text-sm font-semibold" : "w-[18%] px-4 py-4 text-sm font-semibold"}>
                {t("common.address", "Address")}
              </th>
              <th className="w-[12%] px-4 py-4 text-sm font-semibold">{t("dashboard.pic", "PIC")}</th>
              <th className="w-[12%] px-4 py-4 text-sm font-semibold">{t("dashboard.picNumber", "PIC Number")}</th>
              <th className="w-[13%] px-3 py-4 text-sm font-semibold leading-tight">{t("common.meetingSchedule", "Meeting Schedule")}</th>
              <th className="w-[7%] px-2 py-4 text-center text-sm font-semibold">{isManager ? t("dashboard.tasks", "Task") : t("common.viewTask", "View Task")}</th>
              <th className="w-[7%] px-2 py-4 text-center text-sm font-semibold">{isManager ? t("common.details", "Details") : t("common.action", "Action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
            {customers.map((customer) => {
              const execName = customer.createdBy || (customer as any).salesExecutive || "—";
              const scheduleText = customer.meetingSchedule?.formattedSchedule || t("common.unscheduled", "Unscheduled");

              return (
                <tr key={customer.id} className="min-h-[70px] transition-colors hover:bg-slate-50/70">
                  <td className="break-words px-4 py-3.5 font-medium text-slate-900 leading-tight">
                    <span className="font-semibold text-slate-900">{customer.companyName}</span>
                  </td>

                  <td className="px-3 py-3.5">
                    {customer.customerCode ? (
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-mono font-semibold text-blue-700 border border-blue-200/80">
                        {customer.customerCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
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
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.meetingSchedule.formattedSchedule}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {t("common.unscheduled", "Unscheduled")}
                      </span>
                    )}
                  </td>

                  {/* Task column */}
                  <td className="px-2 py-3.5 text-center">
                    {isManager ? (
                      <button
                        type="button"
                        onClick={() => onViewTasks(customer)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                      >
                        {t("dashboard.tasks", "Tasks")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewTasks(customer)}
                        aria-label={`View tasks for ${customer.companyName}`}
                        title={t("common.viewTask", "View tasks")}
                        className="mx-auto grid rounded p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
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
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                      >
                        {t("common.details", "View")}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onDetails(customer)}
                          aria-label={`View details for ${customer.companyName}`}
                          title={t("common.details", "View details")}
                          className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          aria-label={`Edit ${customer.companyName}`}
                          title={t("common.edit", "Edit company")}
                          className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(customer)}
                          aria-label={`Delete ${customer.companyName}`}
                          title={t("common.delete", "Delete company")}
                          className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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
    </div>
  );
}
