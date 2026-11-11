"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Download } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import TaskOfFieldAgent from "@/components/TaskOfFieldAgent";
import { supabase } from "@/lib/supabaseClient";

interface TaskItem {
  jobNumber: string;
  company: string;
  salesExecutive: string;
  fieldAgent: string;
  status: "Assigned" | "In Progress" | "Completed";
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
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

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
        const [{ data, error }, { data: companies }, { data: users }] = await Promise.all([
          (supabase as any)
            .from("a2_worksheets")
            .select("*")
            .order("create_date", { ascending: false }),
          (supabase as any)
            .from("a1_company_list")
            .select("company_list_id, company_name"),
          (supabase as any)
            .from("b2_register")
            .select("id, full_name"),
        ]);

        if (active && !error && data && data.length > 0) {
          const compMap = new Map((companies || []).map((c: any) => [c.company_list_id, c.company_name]));
          const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name]));

          setTasks(
            data.map((t: any) => ({
              jobNumber: t.job_no || t.job_number || "#AENAT/0000/0000",
              company: compMap.get(t.customer_id) || t.company_name || t.shipper || t.consignee || "-",
              salesExecutive: userMap.get(t.sales_pic_id) || t.sales_executive || t.created_by || "-",
              fieldAgent: userMap.get(t.field_agent_id) || t.field_agent || t.agent_name || "Field Agent",
              status: t.has_issue ? "In Progress" : (t.status || "Completed"),
              hasIssue: Boolean(t.has_issue),
              issueDetails: t.issue_note || t.issue_details,
              resultSummary: t.issue_note || (t.has_issue ? "Kendala terdeteksi" : "Inspeksi normal"),
              createdAt: t.create_date || t.created_at || "-",
              trxNo: t.transaction_no || t.trx_no || "-",
              mawb: t.mawb || "-",
              assignedAt: t.handover_datetime || t.create_date || "-",
              taskArea: t.handover_location || t.task_area || "-",
              convId: t.conversation_id || "-",
              taskId: String(t.worksheet_id || "-"),
              pieces: t.pieces || 0,
              grossWeight: t.gross_weight || "0 Kg",
              photoName: t.photo_name || "",
            }))
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
  }, [tasks, selectedExecutive, search]);

  if (isManager === null) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Loading...
      </div>
    );
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
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Field Agent Tasks
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Task progress and inspection results of the selected Sales Executive. Read only for Manager.
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
          placeholder="Search by job number, customer, or field agent..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Job Number</th>
              <th className="px-4 py-3.5">Company</th>
              <th className="px-4 py-3.5">Sales Executive</th>
              <th className="px-4 py-3.5">Field Agent</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Issue / Result</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Loading field agent tasks...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No field agent tasks found for this selection.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t, idx) => (
                <tr key={`${t.jobNumber}-${idx}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-blue-600">{t.jobNumber}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">{t.company}</td>
                  <td className="px-4 py-3.5">{t.salesExecutive}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{t.fieldAgent}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${t.hasIssue ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {t.hasIssue ? (
                      <span className="font-medium text-rose-600">{t.resultSummary}</span>
                    ) : (
                      <span className="text-slate-500">{t.resultSummary}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(t)}
                      className="rounded-md border border-slate-200 px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {filteredTasks.length > 0
            ? `Showing 1-${filteredTasks.length} of ${tasks.length} tasks`
            : "Showing 0-0 of 0 tasks"}
        </span>
      </div>

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
                <h2 className="text-lg font-bold text-slate-900">Job Detail Summary</h2>
                <p className="text-xs text-blue-600 font-semibold">{selectedTask.jobNumber}</p>
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
                <p className="text-slate-500 mt-1">Sales Executive: <strong>{selectedTask.salesExecutive}</strong></p>
                <p className="text-slate-500">Field Agent: <strong>{selectedTask.fieldAgent}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Task Area</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedTask.taskArea}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Status</p>
                  <p className={`mt-1 font-bold ${selectedTask.hasIssue ? "text-rose-600" : "text-emerald-600"}`}>
                    {selectedTask.status}
                  </p>
                </div>
              </div>

              {selectedTask.hasIssue && selectedTask.issueDetails && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3">
                  <p className="font-semibold text-rose-800">Issue Details:</p>
                  <p className="mt-1 text-rose-700 leading-relaxed">{selectedTask.issueDetails}</p>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
                Edit Info and Reassign Agent are hidden for Manager (Read-Only).
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
