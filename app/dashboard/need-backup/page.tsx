"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";

interface BackupTicket {
  alertId: string;
  ticketId: string;
  company: string;
  salesExecutive: string;
  status: "Open" | "Resolved";
  reporter: string;
  dateTime: string;
  problemDescription: string;
}

export default function NeedBackupPage() {
  const { selectedExecutive } = useManagerFilter();
  const [tickets, setTickets] = useState<BackupTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<BackupTicket | null>(null);

  const loadTickets = async () => {
    try {
      const response = await fetch("/api/record-conversation/alerts?status=all", { cache: "no-store" });
      const result = await response.json();
      if (!result?.success) {
        setTickets([]);
        return;
      }
      setTickets(
        (result.items || []).map((item: {
          id: string;
          status: string;
          company_name: string;
          sales_name: string;
          conversation_date: string | null;
          summary: string;
        }) => ({
          alertId: item.id,
          ticketId: `TKT-${String(item.id).slice(0, 8).toUpperCase()}`,
          company: item.company_name,
          salesExecutive: item.sales_name,
          status: item.status === "Reviewed" ? ("Resolved" as const) : ("Open" as const),
          reporter: item.sales_name,
          dateTime: item.conversation_date || "-",
          problemDescription: item.summary || "-",
        }))
      );
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadTickets().finally(() => { if (!active) return; });
    return () => { active = false; };
  }, []);

  const handleResolve = async () => {
    if (!selectedTicket || isResolving) return;
    setIsResolving(true);
    try {
      const response = await fetch("/api/record-conversation/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTicket.alertId }),
      });
      const result = await response.json();
      if (result?.success) {
        setSelectedTicket(null);
        await loadTickets();
      } else {
        alert(`Gagal menyelesaikan need backup: ${result?.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Gagal menyelesaikan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedExecutive !== "all" && !t.salesExecutive.toLowerCase().includes(selectedExecutive.toLowerCase())) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.ticketId.toLowerCase().includes(q) ||
          t.company.toLowerCase().includes(q) ||
          t.salesExecutive.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, selectedExecutive, search]);

  const totalCount = filteredTickets.length;
  const waitingCount = filteredTickets.filter((t) => t.status === "Open").length;
  const resolvedCount = filteredTickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Need Backup Monitoring
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Need-assist tickets raised by sales. Manager resolves them here.
        </p>
      </div>

      {/* Global Filter Bar */}
      <ManagerGlobalFilterBar />

      {/* Status Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Waiting Response</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{waitingCount}</p>
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
          placeholder="Search ticket ID, company, or sales..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Ticket ID</th>
              <th className="px-4 py-3.5">Company</th>
              <th className="px-4 py-3.5">Sales Executive</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Loading backup tickets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No backup tickets found for this selection.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.ticketId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{t.ticketId}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">{t.company}</td>
                  <td className="px-4 py-3.5">{t.salesExecutive}</td>
                  <td className="px-4 py-3.5">{t.dateTime}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${t.status === "Resolved" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
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
              <div className="rounded-lg border border-slate-100 p-2.5">
                <p className="text-slate-500">Ticket Status</p>
                <p className={`mt-1 font-bold ${selectedTicket.status === "Resolved" ? "text-emerald-700" : "text-amber-700"}`}>
                  {selectedTicket.status}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <h3 className="text-sm font-bold text-slate-900">{selectedTicket.company}</h3>
                <p className="text-slate-600 mt-1">Reporter: <strong>{selectedTicket.reporter}</strong></p>
                <p className="text-slate-500">Date: {selectedTicket.dateTime}</p>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-500">Problem Description</p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed bg-rose-50/60 border border-rose-100 rounded-lg p-3">
                  {selectedTicket.problemDescription}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg border border-slate-200 px-6 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {selectedTicket.status === "Open" && (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isResolving ? "Menyimpan..." : "Selesaikan Need Backup"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

