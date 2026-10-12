"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";

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

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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
        let rows: any[] = [];
        const { data: backupData, error: backupErr } = await (supabase as any)
          .from("a2_need_backup")
          .select("*");

        if (!backupErr && backupData && backupData.length > 0) {
          rows = backupData;
        } else {
          const { data: convData, error: convErr } = await (supabase as any)
            .from("a2_record_conversations")
            .select("*")
            .eq("need_backup", true);
          if (!convErr && convData) {
            rows = convData;
          }
        }

        if (active && rows.length > 0) {
          setTickets(
            rows.map((t: any) => ({
              ticketId: t.ticket_id || t.id || "BCK-000",
              jobNumber: t.job_no || t.job_number || "-",
              company: t.company_name || t.company || "-",
              salesExecutive: t.sales_executive || t.created_by || "-",
              category: t.category || "General",
              priority: t.priority || "Medium",
              status: t.status || "Open",
              reporter: t.reporter || t.created_by || "-",
              dateTime: t.created_at || "-",
              problemDescription: t.problem_description || t.description || t.need_backup_reason || "-",
              followUpLog: t.follow_up_log || "-",
            }))
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
      if (selectedExecutive !== "all" && t.salesExecutive.toLowerCase() !== selectedExecutive.toLowerCase()) {
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
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Need Backup Monitoring
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Escalation tickets of the selected Sales Executive. Read only for Manager.
        </p>
      </div>

      {/* Global Filter Bar */}
      <ManagerGlobalFilterBar />

      {/* 4 Counter Cards */}
      <section aria-label="Ticket status counters" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Tickets</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{totalCount}</p>
          <p className="mt-2 text-xs text-slate-400">Selected Sales Executive</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Waiting Response</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{waitingCount}</p>
          <p className="mt-2 text-xs text-slate-400">Needs escalation</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{inProgressCount}</p>
          <p className="mt-2 text-xs text-slate-400">Field team assigned</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Resolved</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{resolvedCount}</p>
          <p className="mt-2 text-xs text-slate-400">Verified</p>
        </div>
      </section>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Customer / Job Number..."
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Job Number</th>
              <th className="py-3 px-4">Sales Executive</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {isLoading ? "Loading backup tickets..." : "Belum terdapat tiket need backup (Tabel Squad A2)."}
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.ticketId} className="transition-colors hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-800">{ticket.ticketId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{ticket.jobNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{ticket.salesExecutive}</td>
                  <td className="py-3 px-4 text-slate-700">{ticket.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        ticket.priority === "High"
                          ? "bg-rose-50 text-rose-600"
                          : ticket.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        ticket.status === "Open"
                          ? "bg-amber-50 text-amber-700"
                          : ticket.status === "In progress"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
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
          {filteredTickets.length > 0
            ? `Showing 1-${filteredTickets.length} of ${tickets.length} tickets`
            : "Showing 0-0 of 0 tickets"}
        </span>
        <div className="flex gap-1">
          <span className="rounded bg-blue-600 px-2 py-1 font-semibold text-white">1</span>
        </div>
      </div>

      {/* Modal Need Backup Ticket Detail (Page 9 in PDF) */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
              {/* Status and Priority pills */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Ticket status</p>
                  <p className="mt-1 font-bold text-amber-700">Open / Waiting Response</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-2.5">
                  <p className="text-slate-400">Priority</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedTicket.priority} / Normal</p>
                </div>
              </div>

              {/* Customer and Reporter */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <h3 className="text-sm font-bold text-slate-900">{selectedTicket.company}</h3>
                <p className="text-blue-600 font-semibold">{selectedTicket.jobNumber}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Reporter:</span> {selectedTicket.reporter}
                  </div>
                  <div>
                    <span className="text-slate-400">Date and time:</span> {selectedTicket.dateTime}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Category</p>
                <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {selectedTicket.category}
                </span>
              </div>

              {/* Problem Description */}
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Problem Description</p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                  {selectedTicket.problemDescription}
                </p>
              </div>

              {/* Follow-up history */}
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Follow-up History (1 Log)</p>
                <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-700">
                  {selectedTicket.followUpLog}
                </p>
              </div>

              {/* Read only note */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
                Reply box and status buttons (Open, In progress, Resolved) are hidden for Manager.
              </div>
            </div>

            {/* Footer */}
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
