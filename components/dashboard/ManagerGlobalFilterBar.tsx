"use client";

import React, { useEffect, useState } from "react";
import { useManagerFilter } from "@/lib/hooks/useManagerFilter";
import { ChevronDown } from "lucide-react";

interface Props {
  isCompanyListPage?: boolean;
  salesExecutives?: { id: string; name: string }[];
}

export function ManagerGlobalFilterBar({
  isCompanyListPage = false,
  salesExecutives: initialExecs,
}: Props) {
  const { selectedExecutive, setSelectedExecutive } = useManagerFilter();
  const [executives, setExecutives] = useState<{ id: string; name: string }[]>(
    initialExecs || [{ id: "all", name: "All Sales Executives" }]
  );

  useEffect(() => {
    if (initialExecs && initialExecs.length > 1) {
      setExecutives(initialExecs);
      return;
    }

    let active = true;
    fetch("/api/v1/manager/roles", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && Array.isArray(json.data)) {
          const seen = new Set<string>();
          const list: { id: string; name: string }[] = [];
          for (const u of json.data) {
            if (u.crm_role === "sales_executive" && u.is_active !== false && u.name) {
              const trimmed = String(u.name).trim();
              if (trimmed && !seen.has(trimmed.toLowerCase())) {
                seen.add(trimmed.toLowerCase());
                list.push({ id: trimmed, name: trimmed });
              }
            }
          }

          setExecutives([
            { id: "all", name: "All Sales Executives" },
            ...list,
          ]);
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [initialExecs]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs">
      <div className="flex items-center gap-2">
        <label htmlFor="manager-sales-exec-filter" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
          Viewing Sales Executive:
        </label>
        <div className="relative">
          <select
            id="manager-sales-exec-filter"
            value={selectedExecutive}
            onChange={(e) => setSelectedExecutive(e.target.value)}
            className="h-9 min-w-[210px] appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm font-medium text-slate-800 shadow-xs transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Sales Executives</option>
            {executives.filter((se) => se.id !== "all").map((se) => (
              <option key={se.id} value={se.id}>
                {se.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {isCompanyListPage
          ? "Set here. This selection also applies to Meeting Schedule, Record Conversation, Task Field Agent, and Need Backup."
          : "Selected in Company List and shared across pages. You can change it here."}
      </p>
    </div>
  );
}
