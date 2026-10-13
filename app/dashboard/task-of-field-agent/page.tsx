"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Download, Clock } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";

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

import { supabase } from "@/lib/supabaseClient";

export default function TaskOfFieldAgentPage() {
  const { selectedExecutive } = useManagerFilter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  useEffect(() => {
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
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedExecutive !== "all" && t.salesExecutive.toLowerCase() !== selectedExecutive.toLowerCase()) {
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

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      {/* Title Header */}
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
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-4">Job Number</th>
              <th className="py-3 px-4">Sales Executive</th>
              <th className="py-3 px-4">Field Agent</th>
              <th className="py-3 px-4">Progress Status</th>
              <th className="py-3 px-4">Issue / Obstacle</th>
              <th className="py-3 px-4">Result</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading field agent tasks..." : "Belum terdapat data task field agent."}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.jobNumber} className="transition-colors hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{task.jobNumber}</p>
                    <p className="text-xs text-slate-500">{task.company}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{task.salesExecutive}</td>
                  <td className="py-3.5 px-4 text-slate-700">{task.fieldAgent}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {task.hasIssue ? (
                      <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                        Issue
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{task.resultSummary}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
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
        <div className="flex gap-1">
          <span className="rounded bg-blue-600 px-2 py-1 font-semibold text-white">1</span>
        </div>
      </div>

      {/* Modal Job / Transaction Detail Summary (Page 7 in PDF) */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Job / Transaction Detail Summary</h2>
                <p className="text-xs text-slate-400">{selectedTask.jobNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold uppercase text-slate-900">{selectedTask.company}</h3>
                  <p className="mt-0.5 text-slate-400">Created at {selectedTask.createdAt}</p>
                  <p className="text-slate-600">Sales Executive <strong className="text-slate-900">{selectedTask.salesExecutive}</strong></p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {selectedTask.status} / In Progress
                </span>
              </div>

              {/* Connected Transaction */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold uppercase tracking-wider text-slate-400">Connected Transaction and HAWB</p>
                <div className="mt-1 flex items-center gap-3 font-semibold text-slate-800">
                  <span className="text-blue-600">{selectedTask.trxNo}</span>
                  <span>{selectedTask.mawb}</span>
                </div>
              </div>

              {/* Field Agent Assignment */}
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="font-semibold uppercase tracking-wider text-slate-400">Field Agent Assignment</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400">Field Agent:</span> <strong>{selectedTask.fieldAgent}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned at:</span> {selectedTask.assignedAt}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Task area:</span> {selectedTask.taskArea}
                  </div>
                </div>
              </div>

              {/* Data Relationships */}
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50/40 p-3 text-center">
                <div>
                  <p className="text-slate-400">Conversation</p>
                  <p className="font-semibold text-slate-800">{selectedTask.convId}</p>
                </div>
                <div>
                  <p className="text-slate-400">Field Task</p>
                  <p className="font-semibold text-slate-800">{selectedTask.taskId}</p>
                </div>
                <div>
                  <p className="text-slate-400">Issue Status</p>
                  <p className="font-semibold text-slate-800">Normal / Resolved</p>
                </div>
              </div>

              {/* Field Inspection Result */}
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Field Inspection Result (A3)</p>
                <div className="mt-1.5 flex flex-wrap gap-4">
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                    Actual pieces: <strong>{selectedTask.pieces}</strong> <span className="text-emerald-600 font-semibold">Matched</span>
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                    Gross weight: <strong>{selectedTask.grossWeight}</strong> <span className="text-emerald-600 font-semibold">Matched</span>
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
                  <span className="text-slate-700 font-medium">{selectedTask.photoName}</span>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading ${selectedTask.photoName}`)}
                    className="rounded border border-slate-300 px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* Read Only notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
                Edit Info and Reassign Agent are hidden for Manager.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert("Timeline feature")}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                View Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
