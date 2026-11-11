"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, X, Eye } from "lucide-react";
import { ManagerGlobalFilterBar } from "@/components/dashboard/ManagerGlobalFilterBar";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import InteractionTab from "@/components/InteractionTab";
import { supabase } from "@/lib/supabaseClient";

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

export default function RecordConversationPage() {
  const { selectedExecutive } = useManagerFilter();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);

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
  }, [isManager]);

  const filteredRecords = useMemo(() => {
    return conversations.filter((rec) => {
      if (selectedExecutive !== "all" && !rec.salesExecutive.toLowerCase().includes(selectedExecutive.toLowerCase())) {
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

  // Jika masih loading role check, render loading skeleton ringan
  if (isManager === null) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  // Jika pengguna adalah Sales Executive, render antarmuka form/tabel operasional A2
  if (!isManager) {
    return (
      <div className="py-2">
        <InteractionTab />
      </div>
    );
  }

  // Jika pengguna adalah Manager of Customer Success, render antarmuka supervisi Manager (Tiket 3 MCS)
  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Conversation Records
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record conversations of the selected Sales Executive. Read only for Manager.
        </p>
      </div>

      {/* Global Filter Bar */}
      <ManagerGlobalFilterBar />

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300"
            >
              <option value="All">All Channels</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Meeting">Meeting</option>
              <option value="Phone">Phone</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or ID..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Conversation ID</th>
              <th className="px-4 py-3.5">Company</th>
              <th className="px-4 py-3.5">Sales Executive</th>
              <th className="px-4 py-3.5">Source</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Summary</th>
              <th className="px-4 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Loading conversations...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No conversation records found for this selection.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{r.id}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">{r.company}</td>
                  <td className="px-4 py-3.5">{r.salesExecutive}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                      {r.source}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {r.date} <span className="text-slate-400">{r.time}</span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3.5">{r.summary}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(r)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> See more..
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
      </div>

      {/* Modal Detail Conversation */}
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
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.salesExecutive}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date and time</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{selectedRecord.date}, {selectedRecord.time}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold uppercase tracking-wider text-slate-400">Summary</p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">{selectedRecord.summary}</p>
              </div>

              {selectedRecord.attachmentName && (
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-400">Attachment (1) - Max 5 MB</p>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <span className="text-slate-700 font-medium truncate max-w-[280px]">{selectedRecord.attachmentName}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${selectedRecord.attachmentName}`)}
                      className="rounded border border-slate-300 bg-white px-3 py-1 font-semibold text-blue-600 hover:bg-slate-50 shrink-0"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
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
