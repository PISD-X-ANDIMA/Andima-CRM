"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Download } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import TaskOfFieldAgent from "@/components/TaskOfFieldAgent";
import { supabase } from "@/lib/supabaseClient";
import { DashboardSkeleton, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { FigmaPagination } from "@/components/ui/FigmaPagination";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface TaskItem {
  jobNumber: string;
  customerId: string;
  company: string;
  salesExecutive: string;
  fieldAgent: string;
  status: "Assigned" | "In Progress" | "Completed" | "Has Issue";
  reviewStatus: "Review" | "Completed" | "Archived";
  hasIssue: boolean;
  issueDetails?: string;
  resultSummary: string;
  createdAt: string;
  trxNo: string;
  mawb: string;
  assignedAt: string;
  taskArea: string;
  convId: string;
  taskId: string;
  pieces: number;
  grossWeight: string;
  photoName: string;
}

export default function TaskOfFieldAgentPage() {
  const { t } = useLanguage();
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [detailDocs, setDetailDocs] = useState<Array<{ id: string; doc_type: string; file_url: string }>>([]);
  const [detailPhotos, setDetailPhotos] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const openDetail = (task: TaskItem) => {
    setSelectedTask(task);
    setDetailDocs([]);
    setDetailPhotos([]);
    if (!task.taskId || task.taskId === "-") return;
    setDetailLoading(true);
    fetch(`/api/record-conversation/worksheets/${encodeURIComponent(task.taskId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        const detail = json?.data;
        if (!detail) return;
        setDetailDocs(Array.isArray(detail.documents) ? detail.documents : []);
        setDetailPhotos(
          Array.isArray(detail.photos)
            ? detail.photos.map((photo: { photo_url?: string }) => photo.photo_url).filter((url: string | undefined): url is string => Boolean(url))
            : []
        );
      })
      .catch(() => undefined)
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("company_id");
    if (id) setCompanyFilter(id);
  }, []);

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
    if (isManager !== true) return;
    let active = true;
    async function loadTasks() {
      try {
        const [{ data, error }, { data: companies }, { data: users }, { data: jobs }] = await Promise.all([
          (supabase as any)
            .from("a3_tasks")
            .select("*")
            .order("created_at", { ascending: false }),          (supabase as any)
            .from("a1_customers")
            .select("id, company_name, created_by_name"),
          (supabase as any)
            .from("b2_register")
            .select("id, full_name"),
          (supabase as any)
            .from("corp_jobs")
            .select("id, job_number, customer_id"),
        ]);

        if (active && !error && data && data.length > 0) {
          const compMap = new Map((companies || []).map((c: any) => [c.id, c.company_name]));
          const ownerMap = new Map((companies || []).map((c: any) => [c.id, c.created_by_name]));
          const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name]));
          const jobMap = new Map((jobs || []).map((j: any) => [j.id, j]));

          setTasks(
            data.map((t: any) => {
              const job = jobMap.get(t.job_id) as { customer_id?: string; job_number?: string } | undefined;
              const custId = job?.customer_id;
              const hasIssue = Boolean(t.issue_description) || t.status === "has_issue";
              return {
                jobNumber: job?.job_number || t.job_no || t.job_number || "#AENAT/0000/0000",
                customerId: custId || "",
                company: (custId ? compMap.get(custId) : null) || t.company_name || "-",
                salesExecutive: (custId ? ownerMap.get(custId) : null) || "-",
                fieldAgent: userMap.get(t.field_agent_id) || "Field Agent",
                status: hasIssue ? "In Progress" : (t.status || "Completed"),
                reviewStatus: (t.review_status || "Review") as "Review" | "Completed" | "Archived",
                hasIssue,
                issueDetails: t.issue_description || t.issue_details,
                resultSummary: t.issue_description || (hasIssue ? "Kendala terdeteksi" : "Inspeksi normal"),
                createdAt: t.created_at || "-",
                trxNo: "-",
                mawb: "-",
                assignedAt: t.created_at || "-",
                taskArea: "-",
                convId: "-",
                taskId: String(t.id || "-"),
                pieces: 0,
                grossWeight: "0 Kg",
                photoName: "",
              };
            })
          );
        } else if (active) {
          setTasks([]);
        }
      } catch {
        if (active) setTasks([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTasks();
    return () => { active = false; };
  }, [isManager]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (companyFilter && t.customerId !== companyFilter) {
        return false;
      }
      if (selectedExecutive !== "all" && !t.salesExecutive.toLowerCase().includes(selectedExecutive.toLowerCase())) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.jobNumber.toLowerCase().includes(q) ||
          t.company.toLowerCase().includes(q) ||
          t.fieldAgent.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, selectedExecutive, search, companyFilter]);

  useEffect(() => {
    setPage(1);
  }, [selectedExecutive, search]);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredTasks.slice(start, start + perPage);
  }, [filteredTasks, page, perPage]);

  if (isManager === null) {
    return <DashboardSkeleton rows={4} />;
  }

  // Jika Sales Executive, tampilkan antarmuka operasional TaskOfFieldAgent A2
  if (!isManager) {
    return (
      <div className="py-2">
        <TaskOfFieldAgent />
      </div>
    );
  }

  // Jika Manager of Customer Success, tampilkan antarmuka supervisi Field Agent Tasks (Tiket 6 MCS)
  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t("manager.fieldAgentTasks", "Field Agent Tasks")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("manager.fieldAgentTasksSubtitle", "Task progress and inspection results of the selected Sales Executive. Read only for Manager.")}
        </p>
      </div>

      {/* Global Filter Bar */}
      <ManagerGlobalFilterBar />

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("manager.searchFieldAgentPlaceholder", "Search by customer or field agent...")}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">{t("dashboard.company", "Company")}</th>
              <th className="px-4 py-3.5">{t("nav.salesExecutive", "Sales Executive")}</th>
              <th className="px-4 py-3.5">{t("nav.fieldAgent", "Field Agent")}</th>
              <th className="px-4 py-3.5">{t("manager.status", "Status")}</th>
              <th className="px-4 py-3.5">{t("manager.issueResult", "Issue / Result")}</th>
              <th className="px-4 py-3.5 text-center">{t("common.action", "Action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {t("manager.noFieldAgentTasksFound", "No field agent tasks found for this selection.")}
                </td>
              </tr>
            ) : (
              paginatedTasks.map((tItem, idx) => (
                <tr key={`${tItem.company}-${idx}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{tItem.company}</td>
                  <td className="px-4 py-3.5">{tItem.salesExecutive}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{tItem.fieldAgent}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${tItem.reviewStatus === "Completed" ? "bg-emerald-50 text-emerald-700" : tItem.reviewStatus === "Archived" ? "bg-slate-100 text-slate-600" : tItem.hasIssue ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                      {tItem.reviewStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {tItem.hasIssue ? (
                      <span className="font-medium text-rose-600">{tItem.resultSummary}</span>
                    ) : (
                      <span className="text-slate-500">{tItem.resultSummary}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => openDetail(tItem)}
                      className="rounded-md border border-slate-200 px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      {t("common.details", "Detail")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FigmaPagination
        total={filteredTasks.length}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
        itemLabel={t("common.tasks", "tasks")}
      />

      {/* Modal Detail Task (Read-Only for Manager) */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("manager.jobDetailSummary", "Job Detail Summary")}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <h3 className="text-sm font-bold text-slate-900">{selectedTask.company}</h3>
                <p className="text-slate-500 mt-1">{t("nav.salesExecutive", "Sales Executive")}: <strong>{selectedTask.salesExecutive}</strong></p>
                <p className="text-slate-500">{t("nav.fieldAgent", "Field Agent")}: <strong>{selectedTask.fieldAgent}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">{t("manager.taskArea", "Task Area")}</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedTask.taskArea}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">{t("manager.status", "Status")}</p>
                  <p className={`mt-1 font-bold ${selectedTask.hasIssue ? "text-rose-600" : "text-emerald-600"}`}>
                    {selectedTask.status}
                  </p>
                </div>
              </div>

              {selectedTask.hasIssue && selectedTask.issueDetails && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3">
                  <p className="font-semibold text-rose-800">{t("manager.issueResult", "Issue / Result")}:</p>
                  <p className="mt-1 text-rose-700 leading-relaxed">{selectedTask.issueDetails}</p>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-700 mb-1.5">{t("manager.documents", "Documents")}</p>
                {detailLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : detailDocs.length === 0 ? (
                  <p className="text-slate-400">{t("manager.noDocumentsYet", "No documents uploaded yet.")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailDocs.map((doc) => {
                      const fileName = decodeURIComponent(doc.file_url.split("?")[0].split("/").pop() || "document");
                      return (
                        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white p-2">
                          <span className="min-w-0 truncate font-medium text-slate-700">{fileName}</span>
                          <a
                            href={`/api/record-conversation/download?url=${encodeURIComponent(doc.file_url)}&filename=${encodeURIComponent(fileName)}`}
                            download={fileName}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-slate-50"
                          >
                            <Download className="h-3.5 w-3.5" /> {t("manager.downloadFile", "Download")}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {detailPhotos.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1.5">{t("manager.photos", "Photos")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {detailPhotos.slice(0, 4).map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
                {t("manager.readOnlyHiddenNotice", "Edit Info and Reassign Agent are hidden for Manager (Read-Only).")}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-700"
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
