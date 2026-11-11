"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, X, AlertTriangle } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import { supabase } from "@/lib/supabaseClient";

interface BackupTicket {
  ticketId: string;
  jobNumber: string;
  company: string;
  salesExecutive: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved";
  reporter: string;
  dateTime: string;
  problemDescription: string;
  followUpLog: string;
}

export default function NeedBackupPage() {
  const { selectedExecutive } = useManagerFilter();
  const [tickets, setTickets] = useState<BackupTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<BackupTicket | null>(null);

  useEffect(() => {
    let active = true;
    async function loadTickets() {
      try {
        const [{ data: convData, error: convErr }, { data: companies }, { data: users }] = await Promise.all([
          (supabase as any)
            .from("a2_record_conversations")
            .select("*")
            .eq("need_assistance", true)
            .order("created_at", { ascending: false }),
          (supabase as any)
            .from("a1_company_list")
            .select("company_list_id, company_name, customer_code"),
          (supabase as any)
            .from("b2_register")
            .select("id, full_name"),
        ]);

        if (active && !convErr && convData && convData.length > 0) {
          const compById = new Map((companies || []).map((c: any) => [c.company_list_id, c.company_name]));
          const compByCode = new Map((companies || []).map((c: any) => [c.customer_code, c.company_name]));
          const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name]));

          setTickets(
            convData.map((t: any) => {
              const compName = compById.get(t.customer_id) || compByCode.get(t.customer_code) || t.company_name || t.company || "Perusahaan";
              const salesName = userMap.get(t.sales_pic_id) || userMap.get(t.created_by) || t.sales_executive || t.created_by || "Sales Executive";
              const priority = t.urgency_level === "high_priority" || t.urgency_level === "High" ? "High" : t.urgency_level === "low_priority" ? "Low" : "Medium";

              return {
                ticketId: t.ticket_id || (t.id ? `TKT-${String(t.id).slice(0, 8).toUpperCase()}` : "BCK-001"),
                jobNumber: t.job_number || t.job_no || t.customer_code || "-",
                company: compName,
                salesExecutive: salesName,
                category: t.channel_type || t.category || "Operasional",
                priority: priority as "High" | "Medium" | "Low",
                status: (t.status === "active" ? "Open" : t.status || "Open") as "Open" | "In progress" | "Resolved",
                reporter: salesName,
                dateTime: t.conversation_date || (t.created_at ? t.created_at.slice(0, 10) : "-"),
                problemDescription: t.summary || t.problem_description || t.description || "-",
                followUpLog: t.follow_up_log || "Menunggu penanganan lebih lanjut dari tim terkait.",
              };
            })
          );
        } else if (active) {
          setTickets([]);
        }
      } catch {
        if (active) setTickets([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadTickets();
    return () => { active = false; };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedExecutive !== "all" && !t.salesExecutive.toLowerCase().includes(selectedExecutive.toLowerCase())) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.ticketId.toLowerCase().includes(q) ||
          t.jobNumber.toLowerCase().includes(q) ||
          t.company.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, selectedExecutive, search]);

  const totalCount = filteredTickets.length;
  const waitingCount = filteredTickets.filter((t) => t.status === "Open").length;
  const inProgressCount = filteredTickets.filter((t) => t.status === "In progress").length;
  const resolvedCount = filteredTickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Need Backup Monitoring
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Escalated obstacle and emergency backup tickets. Read only for Manager.
        </p>
      </div>

      {/* Global Filter Bar */}
      <ManagerGlobalFilterBar />

      {/* 4 Status Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Waiting Response</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{waitingCount}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{resolvedCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticket ID, job number, or customer..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Ticket ID</th>
              <th className="px-4 py-3.5">Job Number</th>
              <th className="px-4 py-3.5">Company</th>
              <th className="px-4 py-3.5">Sales Executive</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Loading backup tickets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No backup tickets found for this selection.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.ticketId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{t.ticketId}</td>
                  <td className="px-4 py-3.5 font-medium text-blue-600">{t.jobNumber}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">{t.company}</td>
                  <td className="px-4 py-3.5">{t.salesExecutive}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${t.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-800">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(t)}
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
          {filteredTickets.length > 0
            ? `Showing 1-${filteredTickets.length} of ${tickets.length} tickets`
            : "Showing 0-0 of 0 tickets"}
        </span>
      </div>

      {/* Modal Detail Ticket */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Need Backup Ticket Detail</h2>
                <p className="text-xs text-slate-400">{selectedTicket.ticketId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Ticket Status</p>
                  <p className="mt-1 font-bold text-amber-700">{selectedTicket.status}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Priority</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedTicket.priority}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <h3 className="text-sm font-bold text-slate-900">{selectedTicket.company}</h3>
                <p className="text-blue-600 font-semibold">{selectedTicket.jobNumber}</p>
                <p className="text-slate-500 mt-1">Reporter: <strong>{selectedTicket.reporter}</strong></p>
                <p className="text-slate-400">Date: {selectedTicket.dateTime}</p>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Problem Description</p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed bg-rose-50/60 border border-rose-100 rounded-lg p-3">
                  {selectedTicket.problemDescription}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
                Reply box and status buttons are hidden for Manager (Read-Only).
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
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

