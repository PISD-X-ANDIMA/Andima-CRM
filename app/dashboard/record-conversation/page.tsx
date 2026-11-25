"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  X,
  Eye,
  ChevronDown,
  Video,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import InteractionTab from "@/components/InteractionTab";
import { DashboardSkeleton, PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { FigmaPagination } from "@/components/ui/FigmaPagination";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type BackupStatus = "Pending" | "In Progress" | "Reviewed";

interface ConversationRecord {
  rawId?: string;
  id: string;
  company: string;
  salesExecutive: string;
  source: "WhatsApp" | "Meeting" | "Phone" | "Email";
  date: string;
  summary: string;
  time: string;
  attachmentUrl?: string;
  attachmentName?: string;
  alertId?: string;
  backupStatus?: BackupStatus;
}

function renderSourceBadge(source: ConversationRecord["source"]) {
  const normalized = source.toLowerCase();
  if (normalized === "meeting") {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#e9d5ff] bg-[#f4e8ff] px-3 py-1 text-xs font-semibold text-[#9333ea]">
        <Video size={14} className="text-[#9333ea]" />
        <span>Meeting</span>
      </span>
    );
  }
  if (normalized === "phone") {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
        <Phone size={14} className="text-sky-600" />
        <span>Phone</span>
      </span>
    );
  }
  if (normalized === "email") {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Mail size={14} className="text-amber-600" />
        <span>Email</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#bbf7d0] bg-[#e6f9ed] px-3 py-1 text-xs font-semibold text-[#16a34a]">
      <MessageCircle size={14} className="text-[#16a34a]" />
      <span>{source || "WhatsApp"}</span>
    </span>
  );
}

export default function RecordConversationPage() {
  const { t } = useLanguage();
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [backupFilter, setBackupFilter] = useState<"all" | "need">("all");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/navigation/sidebar", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.success && json.data) {
          setIsManager(Boolean(json.data.isManager));
        } else if (active) {
          setIsManager(false);
        }
      })
      .catch(() => {
        if (active) setIsManager(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const openConvId = urlParams.get("open_conv_id") || urlParams.get("conversation_id") || urlParams.get("id");
      const needBackupParam = urlParams.get("need_backup") || urlParams.get("need_assist");
      if (needBackupParam === "yes" || needBackupParam === "true") {
        setBackupFilter("need");
      }
      if (openConvId) {
        const found = conversations.find(
          (c) => c.rawId === openConvId || c.id.toLowerCase() === openConvId.toLowerCase()
        );
        if (found) {
          setSelectedRecord(found);
        }
      }
    } catch {
      // Ignore URL parse errors
    }
  }, [conversations]);

  useEffect(() => {
    if (isManager !== true) return;
    let active = true;
    async function loadConversations() {
      try {
        const [convRes, alertsRes] = await Promise.all([
          fetch("/api/record-conversation/conversations?limit=500", { cache: "no-store" })
            .then((res) => res.json())
            .catch(() => ({ success: false, data: [] })),
          fetch("/api/record-conversation/alerts", { cache: "no-store" })
            .then((res) => res.json())
            .catch(() => ({ items: [] })),
        ]);

        if (!active) return;

        const rows = Array.isArray(convRes?.data) ? convRes.data : [];
        const backupByConversation = new Map<string, { id: string; status: BackupStatus }>(
          (alertsRes?.items || []).map((item: any) => [
            String(item.conversation_id),
            { id: String(item.id), status: item.status as BackupStatus },
          ])
        );

        setConversations(
          rows.map((c: any, index: number) => {
            const rawId = String(c.id || index);
            const displayCode = `CONV-${rawId.slice(-8).toUpperCase()}`;
            const firstUrl = Array.isArray(c.document_urls) && c.document_urls.length > 0 ? String(c.document_urls[0]) : undefined;
            const attachmentName = firstUrl ? decodeURIComponent(firstUrl.split("?")[0].split("/").pop() || "attachment") : undefined;
            const alertInfo = backupByConversation.get(rawId);
            const alertStatus = alertInfo?.status || (c.alert_status as BackupStatus | undefined) || (c.need_assistance ? "Pending" : undefined);
            return {
              rawId,
              id: displayCode,
              company: c.company_name || "Perusahaan",
              salesExecutive: c.sales_pic_name || "Sales Executive",
              source: (c.channel_type || "WhatsApp") as "WhatsApp" | "Meeting" | "Phone" | "Email",
              date: c.conversation_date || (c.created_at ? String(c.created_at).slice(0, 10) : "-"),
              time: c.created_at ? String(c.created_at).slice(11, 16) : "-",
              summary: c.summary || "-",
              attachmentUrl: firstUrl,
              attachmentName,
              alertId: alertInfo?.id,
              backupStatus: alertStatus,
            };
          })
        );
      } catch {
        if (active) setConversations([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConversations();
    return () => { active = false; };
  }, [isManager]);

  const filteredRecords = useMemo(() => {
    return conversations.filter((rec) => {
      if (selectedExecutive !== "all" && !rec.salesExecutive.toLowerCase().includes(selectedExecutive.toLowerCase())) {
        return false;
      }
      if (channelFilter !== "All" && rec.source !== channelFilter) {
        return false;
      }
      if (backupFilter === "need" && (!rec.backupStatus || rec.backupStatus === "Reviewed")) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          rec.company.toLowerCase().includes(q) ||
          rec.salesExecutive.toLowerCase().includes(q) ||
          rec.summary.toLowerCase().includes(q) ||
          rec.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, selectedExecutive, channelFilter, backupFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [selectedExecutive, channelFilter, backupFilter, search]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRecords.slice(start, start + perPage);
  }, [filteredRecords, page, perPage]);

  const updateBackupStatus = async (record: ConversationRecord, status: BackupStatus) => {
    if (!record.alertId || updatingAlertId) return;
    setUpdatingAlertId(record.alertId);
    try {
      const response = await fetch("/api/record-conversation/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.alertId, status }),
      });
      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || "Failed to update status");
      setConversations((prev) =>
        prev.map((item) => (item.alertId === record.alertId ? { ...item, backupStatus: status } : item))
      );
      setSelectedRecord((prev) => (prev && prev.alertId === record.alertId ? { ...prev, backupStatus: status } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingAlertId(null);
    }
  };

  if (isManager === null) {
    return <DashboardSkeleton rows={5} />;
  }

  if (!isManager) {
    return (
      <div className="py-2">
        <InteractionTab />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 text-sm">
      {isLoading ? (
        <>
          <PageHeaderSkeleton titleWidth="w-72" subtitleWidth="w-96 max-w-full" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-600">
              <tbody className="divide-y divide-slate-100">
                <TableSkeleton rows={5} columns={7} />
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t("manager.conversationRecords", "Conversation Records")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("manager.conversationSubtitle", "Record conversations of the selected Sales Executive. Read only for Manager.")}
            </p>
          </div>

          <ManagerGlobalFilterBar />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  aria-label={t("manager.allChannels", "All Channels")}
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 shadow-2xs hover:border-slate-300 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="All">{t("manager.allChannels", "All Channels")}</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative">
                <select
                  aria-label={t("manager.allRecords", "All Records")}
                  value={backupFilter}
                  onChange={(e) => setBackupFilter(e.target.value as "all" | "need")}
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 shadow-2xs hover:border-slate-300 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="all">{t("manager.allRecords", "All Records")}</option>
                  <option value="need">{t("manager.needBackup", "Need Backup")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                maxLength={100}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("manager.searchCompanyPlaceholder", "Search company...")}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200/80 bg-[#F5F7FF] text-sm font-bold text-slate-800">
                <tr>
                  <th className="px-5 py-4">{t("dashboard.company", "Company")}</th>
                  <th className="px-5 py-4">{t("nav.salesExecutive", "Sales Executive")}</th>
                  <th className="px-5 py-4 text-center">{t("common.source", "Source")}</th>
                  <th className="px-5 py-4">{t("common.date", "Date")}</th>
                  <th className="px-5 py-4">{t("manager.summary", "Summary")}</th>
                  <th className="px-5 py-4">{t("manager.status", "Status")}</th>
                  <th className="px-5 py-4 text-center">{t("common.action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                      {t("manager.noConversationsFound", "No conversation records found for this selection.")}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={
                        r.backupStatus && r.backupStatus !== "Reviewed"
                          ? "bg-amber-50/50 transition-colors hover:bg-amber-50"
                          : "transition-colors hover:bg-blue-50/20"
                      }
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">{r.company}</td>
                      <td className="px-5 py-4 font-medium text-slate-700">{r.salesExecutive}</td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">{renderSourceBadge(r.source)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                        {r.date} <span className="text-xs text-slate-400">{r.time}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="line-clamp-2 max-w-[280px] break-words text-sm text-slate-600">{r.summary}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.backupStatus === "Pending" ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {t("manager.needBackup", "Need Backup")}
                          </span>
                        ) : r.backupStatus === "In Progress" ? (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {t("manager.onProgress", "On Progress")}
                          </span>
                        ) : r.backupStatus === "Reviewed" ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {t("manager.reviewed", "Reviewed")}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">{t("manager.normal", "Normal")}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#2563eb] transition-colors hover:bg-blue-50/60"
                        >
                          <Eye className="h-4 w-4" /> {t("common.seeMore", "See more")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <FigmaPagination
            total={filteredRecords.length}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            itemLabel={t("common.records", "records")}
          />
        </>
      )}

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("manager.detailConversation", "Detail Conversation")}
                </h2>
                <p className="text-sm text-slate-400">{selectedRecord.company}</p>
              </div>
              <button
                type="button"
                aria-label={t("common.close", "Close")}
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("manager.customerCompany", "Customer / Company")}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-slate-900">{selectedRecord.company}</span>
                  {renderSourceBadge(selectedRecord.source)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3">
                <div>
                  <p className="text-xs text-slate-400">{t("manager.createdBy", "Created by")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.salesExecutive}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t("manager.dateTime", "Date and time")}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.date}, {selectedRecord.time}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("manager.summary", "Summary")}
                </p>
                <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {selectedRecord.summary}
                </p>
              </div>

              {selectedRecord.alertId && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t("manager.backupStatus", "Backup Status")}
                  </p>
                  <p className="mt-1">
                    {selectedRecord.backupStatus === "Pending" ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {t("manager.needBackup", "Need Backup")}
                      </span>
                    ) : selectedRecord.backupStatus === "In Progress" ? (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        {t("manager.onProgress", "On Progress")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {t("manager.reviewed", "Reviewed")}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {selectedRecord.attachmentName && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t("common.attachment", "Attachment")}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="max-w-[280px] truncate font-medium text-slate-700">
                      {selectedRecord.attachmentName}
                    </span>
                    {selectedRecord.attachmentUrl && (
                      <a
                        href={`/api/record-conversation/download?url=${encodeURIComponent(selectedRecord.attachmentUrl)}&filename=${encodeURIComponent(selectedRecord.attachmentName)}`}
                        download={selectedRecord.attachmentName}
                        className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("common.download", "Download")}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              {selectedRecord.backupStatus === "Pending" && (
                <button
                  type="button"
                  onClick={() => updateBackupStatus(selectedRecord, "In Progress")}
                  disabled={updatingAlertId === selectedRecord.alertId}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  {updatingAlertId === selectedRecord.alertId
                    ? t("common.saving", "Saving...")
                    : t("manager.markOnProgress", "Mark On Progress")}
                </button>
              )}
              {selectedRecord.backupStatus && selectedRecord.backupStatus !== "Reviewed" && (
                <button
                  type="button"
                  onClick={() => updateBackupStatus(selectedRecord, "Reviewed")}
                  disabled={updatingAlertId === selectedRecord.alertId}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {t("manager.resolveBackup", "Resolve")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
