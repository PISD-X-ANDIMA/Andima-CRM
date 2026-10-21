"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, X, Eye } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";

interface ConversationRecord {
  rawId?: string;
  id: string;
  company: string;
  salesExecutive: string;
  source: "WhatsApp" | "Meeting" | "Phone" | "Email";
  date: string;
  summary: string;
  time: string;
  attachmentName?: string;
}

import { supabase } from "@/lib/supabaseClient";

export default function RecordConversationPage() {
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState(true);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/navigation/sidebar", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.success && json.data) {
          setIsManager(Boolean(json.data.isManager));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadConversations() {
      try {
        const [{ data, error }, { data: companies }, { data: users }] = await Promise.all([
          (supabase as any)
            .from("a2_record_conversations")
            .select("*")
            .order("created_at", { ascending: false }),
          (supabase as any)
            .from("a1_company_list")
            .select("company_list_id, company_name, customer_code"),
          (supabase as any)
            .from("b2_register")
            .select("id, full_name"),
        ]);

        if (active && !error && data && data.length > 0) {
          const compById = new Map((companies || []).map((c: any) => [c.company_list_id, c.company_name]));
          const compByCode = new Map((companies || []).map((c: any) => [c.customer_code, c.company_name]));
          const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name]));

          setConversations(
            data.map((c: any, index: number) => {
              const displayCode = c.conversation_id || (c.id ? `CONV-${String(c.id).slice(-8).toUpperCase()}` : `CONV-${String(index + 1).padStart(4, "0")}`);
              return {
                rawId: String(c.id || index),
                id: displayCode,
                company: compById.get(c.customer_id) || compByCode.get(c.customer_code) || c.company_name || c.customer_code || "Perusahaan",
                salesExecutive: userMap.get(c.sales_pic_id) || userMap.get(c.created_by) || c.sales_executive || c.created_by || "Sales Executive",
                source: (c.channel_type || c.channel || c.source || "WhatsApp") as "WhatsApp" | "Meeting" | "Phone" | "Email",
                date: c.conversation_date || (c.created_at ? c.created_at.slice(0, 10) : "-"),
                time: c.conversation_time || (c.created_at ? c.created_at.slice(11, 16) : "-"),
                summary: c.summary || "-",
                attachmentName: Array.isArray(c.document_urls) && c.document_urls.length > 0 ? c.document_urls[0].split("/").pop() : c.attachment_name,
              };
            })
          );
        } else if (active) {
          setConversations([]);
        }
      } catch {
        if (active) setConversations([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConversations();
    return () => { active = false; };
  }, []);

  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);

  // Filter conversations
  const filteredRecords = useMemo(() => {
    return conversations.filter((rec) => {
      if (selectedExecutive !== "all" && rec.salesExecutive.toLowerCase() !== selectedExecutive.toLowerCase()) {
        return false;
      }
      if (channelFilter !== "All" && rec.source !== channelFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return rec.company.toLowerCase().includes(q) || rec.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [conversations, selectedExecutive, channelFilter, search]);

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Conversation Records
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record conversations of the selected Sales Executive. Read only for Manager.
        </p>
      </div>

      {/* Global Filter Bar */}
      {isManager && <ManagerGlobalFilterBar />}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All ▾</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Meeting">Meeting</option>
              <option value="Phone">Phone</option>
              <option value="Email">Email</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company..."
              className="h-9 w-60 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={() => alert("Exporting conversation records...")}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-4">Conversation ID</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Sales Executive</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }, (_, row) => (
                <tr key={row} className="border-t border-slate-100">
                  <td className="py-3 px-4"><div className="h-4 w-28 animate-pulse rounded bg-slate-200/70" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-36 animate-pulse rounded bg-slate-200/70" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-200/70" /></td>
                  <td className="py-3 px-4"><div className="h-5 w-20 animate-pulse rounded-full bg-slate-200/70" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-200/70" /></td>
                  <td className="py-3 px-4 text-right"><div className="ml-auto h-6 w-16 animate-pulse rounded-lg bg-slate-200/70" /></td>
                </tr>
              ))
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  Belum terdapat data record conversation.
                </td>
              </tr>
            ) : (
              filteredRecords.map((item, index) => (
                <tr key={item.rawId || `${item.id}-${index}`} className="transition-colors hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-800">{item.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.company}</td>
                  <td className="py-3 px-4 text-slate-700">{item.salesExecutive}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.source === "WhatsApp"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.date}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(item)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
                    >
                      See more..
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
          {filteredRecords.length > 0
            ? `Showing 1-${filteredRecords.length} of ${conversations.length} records`
            : "Showing 0-0 of 0 records"}
        </span>
        <div className="flex gap-1">
          <span className="rounded bg-blue-600 px-2 py-1 font-semibold text-white">1</span>
        </div>
      </div>

      {/* Modal Detail Conversation (Page 5 in PDF) */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Detail Conversation</h2>
                <p className="text-xs text-slate-400">{selectedRecord.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer & Creator */}
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Customer / Company</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{selectedRecord.company}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {selectedRecord.source}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3">
                <div>
                  <p className="text-slate-400">Created by</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.salesExecutive} (Sales Executive)</p>
                </div>
                <div>
                  <p className="text-slate-400">Date and time</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.date}, {selectedRecord.time}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Summary</p>
                <p className="mt-1 text-sm text-slate-700">{selectedRecord.summary}</p>
              </div>

              {selectedRecord.attachmentName && (
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400">Attachment (1) - Max 5 MB</p>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="text-slate-700 font-medium">{selectedRecord.attachmentName}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${selectedRecord.attachmentName}`)}
                      className="rounded border border-slate-300 bg-white px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Audit History</p>
                <p className="mt-1 text-slate-500">No updates yet.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => alert("Summary exported")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export Summary
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
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
